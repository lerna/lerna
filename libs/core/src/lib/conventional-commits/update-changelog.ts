import { execFileSync } from "node:child_process";
import fs from "fs-extra";
import log from "../npmlog";
import { Package } from "../package";
import { BLANK_LINE, BaseChangelogOptions, CHANGELOG_HEADER, ChangelogType, EOL } from "./constants";
import { getChangelogConfig } from "./get-changelog-config";
import { makeBumpOnlyFilter } from "./make-bump-only-filter";
import { readExistingChangelog } from "./read-existing-changelog";

/**
 * Read the git remote origin URL for a given directory.
 * Returns the URL string or null if not available.
 */
function getGitRemoteUrl(cwd: string): string | null {
  try {
    return (
      execFileSync("git", ["config", "--get", "remote.origin.url"], { cwd, encoding: "utf8" }).trim() || null
    );
  } catch {
    return null;
  }
}

export async function updateChangelog(
  pkg: Package,
  type: ChangelogType,
  {
    changelogPreset,
    changelogEntryAdditionalMarkdown,
    rootPath,
    tagPrefix = "v",
    version,
  }: BaseChangelogOptions & { version?: string }
) {
  log.silly(type, "for %s at %s", pkg.name, pkg.location);

  const [config, { ConventionalChangelog, packagePrefix }] = await Promise.all([
    getChangelogConfig(changelogPreset, rootPath),
    // @ts-expect-error ESM package with exports field not resolved by moduleResolution: "node"
    import("conventional-changelog") as Promise<typeof import("conventional-changelog")>,
  ]);

  const generator = new ConventionalChangelog();

  // Set the preset config
  generator.config(config);

  // Read package.json to discover repository URL for commit links in changelog.
  // This must be called for all changelog types — the new ConventionalChangelog API
  // does not auto-discover repository context like the old conventional-changelog-core.
  generator.readPackage(pkg.manifestLocation);

  // The new ConventionalChangelog class uses parseHostedGitUrl which rejects local
  // filesystem paths (e.g. /tmp/lerna-e2e/.../origin). The old conventional-changelog-core
  // passed these through directly as repoUrl. To preserve this behavior, we read the
  // git remote URL and set it as repoUrl in the context as a fallback.
  const remoteUrl = getGitRemoteUrl(pkg.location);
  if (remoteUrl) {
    generator.context({ repoUrl: remoteUrl } as any);
  }

  if (type === "root") {
    generator.context({ version, currentTag: `${tagPrefix}${version}` } as any);
    generator.tags({ prefix: tagPrefix });
  } else {
    // "fixed" or "independent"
    generator.commits({ path: pkg.location });

    if (type === "independent") {
      generator.tags({ prefix: packagePrefix(pkg.name) });
    } else {
      // only fixed mode can have a custom tag prefix
      generator.tags({ prefix: tagPrefix });
      generator.context({ currentTag: `${tagPrefix}${pkg.version}` } as any);
    }
  }

  // generate the markdown for the upcoming release.
  const changelogStream = generator.writeStream();

  const [newEntryRaw, [changelogFileLoc, changelogContents]] = await Promise.all([
    streamToString(changelogStream).then(makeBumpOnlyFilter(pkg)),
    readExistingChangelog(pkg),
  ]);

  let newEntry = newEntryRaw;

  // Append any additional markdown to the new entry, if provided
  if (changelogEntryAdditionalMarkdown) {
    // capture trailing whitespace on the newEntry and apply the additional markdown before it and reapply it
    const trailingWhitespace = newEntry.match(/\s*$/);
    newEntry = newEntry.replace(/\s*$/, BLANK_LINE + changelogEntryAdditionalMarkdown + trailingWhitespace);
  }

  log.silly(type, "writing new entry: %j", newEntry);

  const content = [CHANGELOG_HEADER, newEntry, changelogContents].join(BLANK_LINE);

  await fs.writeFile(changelogFileLoc, content.trim() + EOL);
  log.verbose(type, "wrote", changelogFileLoc);

  return {
    logPath: changelogFileLoc,
    newEntry,
  };
}

async function streamToString(stream: NodeJS.ReadableStream): Promise<string> {
  const chunks: string[] = [];
  for await (const chunk of stream) {
    chunks.push(String(chunk));
  }
  return chunks.join("");
}
