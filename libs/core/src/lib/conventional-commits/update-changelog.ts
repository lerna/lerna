// @ts-expect-error ESM package with exports field not resolved by moduleResolution: "node"
import { ConventionalChangelog, packagePrefix } from "conventional-changelog";
import fs from "fs-extra";
import log from "../npmlog";
import { Package } from "../package";
import { BLANK_LINE, BaseChangelogOptions, CHANGELOG_HEADER, ChangelogType, EOL } from "./constants";
import { getChangelogConfig } from "./get-changelog-config";
import { makeBumpOnlyFilter } from "./make-bump-only-filter";
import { readExistingChangelog } from "./read-existing-changelog";

export function updateChangelog(
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

  return getChangelogConfig(changelogPreset, rootPath).then((config) => {
    const generator = new ConventionalChangelog();

    // Set the preset config
    generator.config(config);

    if (type === "root") {
      generator.context({ version, currentTag: `${tagPrefix}${version}` } as any);
      generator.tags({ prefix: tagPrefix });
    } else {
      // "fixed" or "independent"
      generator.commits({ path: pkg.location });
      generator.readPackage(pkg.manifestLocation);

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

    return Promise.all([
      streamToString(changelogStream).then(makeBumpOnlyFilter(pkg)),
      readExistingChangelog(pkg),
    ]).then(([newEntry, [changelogFileLoc, changelogContents]]) => {
      // Append any additional markdown to the new entry, if provided
      if (changelogEntryAdditionalMarkdown) {
        // capture trailing whitespace on the newEntry and apply the additional markdown before it and reapply it
        const trailingWhitespace = newEntry.match(/\s*$/);
        newEntry = newEntry.replace(
          /\s*$/,
          BLANK_LINE + changelogEntryAdditionalMarkdown + trailingWhitespace
        );
      }

      log.silly(type, "writing new entry: %j", newEntry);

      const content = [CHANGELOG_HEADER, newEntry, changelogContents].join(BLANK_LINE);

      return fs.writeFile(changelogFileLoc, content.trim() + EOL).then(() => {
        log.verbose(type, "wrote", changelogFileLoc);

        return {
          logPath: changelogFileLoc,
          newEntry,
        };
      });
    });
  });
}

async function streamToString(stream: NodeJS.ReadableStream): Promise<string> {
  const chunks: string[] = [];
  for await (const chunk of stream) {
    chunks.push(String(chunk));
  }
  return chunks.join("");
}
