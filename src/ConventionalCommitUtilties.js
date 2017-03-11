import ChildProcessUtilities from "./ChildProcessUtilities";
import FileSystemUtilities from "./FileSystemUtilities";
import logger from "./logger";
import semver from "semver";

const CHANGELOG_HEADER = `# Change Log

All notable changes to this project will be documented in this file.
See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.`;

export default class ConventionalCommitUtilties {
  @logger.logifySync()
  static recommendVersion(name, version) {
    try {
      const pkgPath = `./packages/${name}/`;
      const recommendedBump = ChildProcessUtilities.execSync(
        `${require.resolve("conventional-recommended-bump/cli.js")} -l ${name} --commit-path=${pkgPath} -p angular`
      );
      return semver.inc(version, recommendedBump);
    } catch (err) {
      return semver.inc(version, "patch");
    }
  }

  @logger.logifySync()
  static updateChangelog(name, changelogLocation) {
    try {
      const pkgPath = `./packages/${name}/`;
      let changelogContents = "";
      if (FileSystemUtilities.existsSync(changelogLocation)) {
        changelogContents = FileSystemUtilities.readFileSync(changelogLocation);
      }

      // run conventional-changelog-cli to generate the markdown
      // for the upcoming release.
      const newEntry = ChildProcessUtilities.execSync(
        `${require.resolve("conventional-changelog-cli/cli.js")} -l ${name} --commit-path=${pkgPath} --pkg=${pkgPath} -p angular`
      );

      // CHANGELOG entries start with <a name=, we remove
      // the header if it exists by starting at the first entry.
      if (changelogContents.indexOf("<a name=") !== -1) {
        changelogContents = changelogContents.substring(
          changelogContents.indexOf("<a name=")
        );
      }

      FileSystemUtilities.writeFileSync(
        changelogLocation,
         // only allow 1 \n at end of content.
        `${CHANGELOG_HEADER}

${newEntry}

${changelogContents}`.replace(/\n+$/, "\n")
      );
    } catch (err) {
      return;
    }
  }
}
