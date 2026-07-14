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
 * Returns the URL string (with .git suffix stripped) or null if not available.
 */
function getGitRemoteUrl(cwd: string): string | null {
  try {
    const url =
      execFileSync("git", ["config", "--get", "remote.origin.url"], { cwd, encoding: "utf8" }).trim() || null;
    return url ? url.replace(/\.git$/, "") : null;
  } catch {
    return null;
  }
}

/**
 * Parse a git remote URL into owner and project components for changelog links.
 *
 * The new ConventionalChangelog API uses parseHostedGitUrl which only recognizes
 * hosted providers (GitHub, GitLab, etc.) and returns null for local filesystem
 * paths. The old conventional-changelog-core used @hutson/parse-repository-url
 * which permissively parsed any path, extracting the last segment as project and
 * everything before it as owner. This function replicates that behavior so commit
 * links are generated for all valid git remote types including local bare repos.
 */
function parseRemoteUrl(remoteUrl: string): { owner: string; project: string } | null {
  let pathname: string;

  // Handle scp-style SSH URLs (git@host:owner/repo) by converting to a standard URL
  const scpMatch = remoteUrl.match(/^[\w-]+@([^:]+):(.+)$/);
  if (scpMatch) {
    pathname = "/" + scpMatch[2];
  } else {
    try {
      const parsed = new URL(remoteUrl);
      pathname = parsed.pathname;
    } catch {
      // Not a valid URL — treat the whole thing as a pathname (local filesystem path)
      pathname = remoteUrl;
    }
  }

  // Match: optional leading slash, then owner path segments, then /project
  const match = pathname.match(/^\/?(.+)\/([^/]+)\/?$/);
  if (match) {
    return { owner: match[1], project: match[2] };
  }
  return null;
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

  const generator = new ConventionalChangelog(pkg.location);

  // Set the preset config
  generator.config(config);

  // Set a fallback repository context from the git remote URL. This handles local
  // filesystem git remotes (bare repos on disk) which parseHostedGitUrl rejects.
  // The .repository() call with an object bypasses parseHostedGitUrl. Calling this
  // BEFORE readPackage() ensures that if readPackage() successfully parses a hosted
  // URL, it overrides these values. If it can't (local path → null), spreading null
  // is a no-op and our fallback values are preserved.
  const remoteUrl = getGitRemoteUrl(pkg.location);
  if (remoteUrl) {
    const parsed = parseRemoteUrl(remoteUrl);
    if (parsed) {
      generator.repository(parsed as any);
    }
  }

  // Read package.json to discover repository URL for commit links in changelog.
  // For hosted git URLs, this overrides the fallback set above.
  generator.readPackage(pkg.manifestLocation);

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
