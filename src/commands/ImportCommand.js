import path from "path";
import async from "async";
import Command from "../Command";
import PromptUtilities from "../PromptUtilities";
import ChildProcessUtilities from "../ChildProcessUtilities";
import FileSystemUtilities from "../FileSystemUtilities";
import GitUtilities from "../GitUtilities";

export function handler(argv) {
  return new ImportCommand(argv._, argv).run();
}

export const command = "import";

export const describe = "Import the package at <path-to-external-repository>, with commit history, into packages/<directory-name>.";

export const builder = {
  "yes": {
    describe: "Skip all confirmation prompts"
  }
};

export default class ImportCommand extends Command {
  initialize(callback) {
    const inputPath = this.input[0];

    if (!inputPath) {
      return callback(new Error("Missing argument: Path to external repository"));
    }

    const externalRepoPath = path.resolve(inputPath);
    const externalRepoBase = path.basename(externalRepoPath);

    try {
      const stats = FileSystemUtilities.statSync(externalRepoPath);
      if (!stats.isDirectory()) {
        throw new Error(`Input path "${inputPath}" is not a directory`);
      }
      const packageJson = path.join(externalRepoPath, "package.json");
      const packageName = require(packageJson).name;
      if (!packageName) {
        throw new Error(`No package name specified in "${packageJson}"`);
      }
    } catch (e) {
      if (e.code === "ENOENT") {
        return callback(new Error(`No repository found at "${inputPath}"`));
      }
      return callback(e);
    }

    const targetBase = getTargetBase(this.repository.packageConfigs);
    this.targetDir = path.join(targetBase, externalRepoBase);

    if (FileSystemUtilities.existsSync(path.resolve(this.repository.rootPath, this.targetDir))) {
      return callback(new Error(`Target directory already exists "${this.targetDir}"`));
    }

    this.externalExecOpts = {
      encoding: "utf8",
      cwd: externalRepoPath
    };

    this.commits = this.externalExecSync("git log --format=\"%h\"").split("\n").reverse();

    if (!this.commits.length) {
      return callback(new Error(`No git commits to import at "${inputPath}"`));
    }

    // Stash the repo's pre-import head away in case something goes wrong.
    this.preImportHead = GitUtilities.getCurrentSHA(this.execOpts);

    if (ChildProcessUtilities.execSync("git diff-index HEAD", this.execOpts)) {
      return callback(new Error("Local repository has un-committed changes"));
    }

    this.logger.info(
      `About to import ${this.commits.length} commits from ${inputPath} into ${this.targetDir}`
    );

    if (this.flags.yes) {
      callback(null, true);
    } else {
      const message = "Are you sure you want to import these commits onto the current branch?";
      PromptUtilities.confirm(message, (confirmed) => {
        if (confirmed) {
          callback(null, true);
        } else {
          this.logger.info("Okay bye!");
          callback(null, false);
        }
      });
    }
  }

  externalExecSync(command) {
    return ChildProcessUtilities.execSync(command, this.externalExecOpts).trim();
  }

  execute(callback) {
    const replacement = "$1/" + this.targetDir;

    this.progressBar.init(this.commits.length);

    async.series(this.commits.map((sha) => (done) => {
      this.progressBar.tick(sha);

      // Create a patch file for this commit and prepend the target directory
      // to all affected files.  This moves the git history for the entire
      // external repository into the package subdirectory, commit by commit.
      const patch = this.externalExecSync(`git format-patch -1 ${sha} --stdout`)
        .replace(/^([-+]{3} [ab])/mg,     replacement)
        .replace(/^(diff --git a)/mg,     replacement)
        .replace(/^(diff --git \S+ b)/mg, replacement)
        .replace(/^(rename (from|to)) /mg, `\$1 ${this.targetDir}/`);

      // Apply the modified patch to the current lerna repository, preserving
      // original commit date, author and message.
      //
      // Fall back to three-way merge, which can help with duplicate commits
      // due to merge history.
      ChildProcessUtilities.exec("git am -3", this.execOpts, (err) => {
        if (err) {

          // Give some context for the error message.
          err = `Failed to apply commit ${sha}.\n${err}\n` +
                `Rolling back to previous HEAD (commit ${this.preImportHead}).`;

          // Abort the failed `git am` and roll back to previous HEAD.
          ChildProcessUtilities.execSync("git am --abort", this.execOpts);
          ChildProcessUtilities.execSync(`git reset --hard ${this.preImportHead}`, this.execOpts);
        }
        done(err);
      }).stdin.end(patch);
    }), (err) => {
      this.progressBar.terminate();

      if (!err) {
        this.logger.info("Import complete!");
      }
      callback(err, !err);
    });
  }
}

function getTargetBase(packageConfigs) {
  const straightPackageDirectories = packageConfigs
    .filter((p) => path.basename(p) === "*")
    .map((p) => path.dirname(p));
  return straightPackageDirectories[0] || "packages";
}
