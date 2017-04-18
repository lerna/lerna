import ChildProcessUtilities from "./ChildProcessUtilities";
import FileSystemUtilities from "./FileSystemUtilities";
import dedent from "dedent";
import logger from "./logger";
import semver from "semver";
import path from "path";

const CHANGELOG_NAME = "CHANGELOG.md";
const CHANGELOG_HEADER = dedent(`# Change Log

  All notable changes to this project will be documented in this file.
  See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.`);

// We call these resolved CLI files in the "path/to/node path/to/cli <..args>"
// pattern to avoid Windows hangups with shebangs (e.g., WSH can't handle it)
const RECOMMEND_CLI = require.resolve("conventional-recommended-bump/cli");
const CHANGELOG_CLI = require.resolve("conventional-changelog-cli/cli");

export default class ConventionalCommitUtilities {
  @logger.logifySync()
  static recommendVersion(pkg, opts) {
    const recommendedBump = ChildProcessUtilities.execSync(
      process.execPath,
      [
        RECOMMEND_CLI,
        "-l", pkg.name,
        "--commit-path", pkg.location,
        "-p", "angular",
      ],
      opts
    );

    return semver.inc(pkg.version, recommendedBump);
  }

  @logger.logifySync()
  static updateChangelog(pkg, opts) {
    const pkgJsonLocation = path.join(pkg.location, "package.json");
    const changelogLocation = ConventionalCommitUtilities.changelogLocation(pkg);

    let changelogContents = "";
    if (FileSystemUtilities.existsSync(changelogLocation)) {
      changelogContents = FileSystemUtilities.readFileSync(changelogLocation);
    }

    // run conventional-changelog-cli to generate the markdown
    // for the upcoming release.
    const newEntry = ChildProcessUtilities.execSync(
      process.execPath,
      [
        CHANGELOG_CLI,
        "-l", pkg.name,
        "--commit-path", pkg.location,
        "--pkg", pkgJsonLocation,
        "-p", "angular",
      ],
      opts
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
      dedent(
        `${CHANGELOG_HEADER}

        ${newEntry}

        ${changelogContents}`.replace(/\n+$/, "\n"))
    );
  }

  @logger.logifySync()
  static changelogLocation(pkg) {
    return path.join(pkg.location, CHANGELOG_NAME);
  }
}
