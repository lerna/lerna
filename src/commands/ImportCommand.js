import fs from "fs";
import path from "path";
import async from "async";
import Command from "../Command";
import progressBar from "../progressBar";
import PromptUtilities from "../PromptUtilities";
import {execSync, exec} from "../ChildProcessUtilities";

export default class ImportCommand extends Command {
  initialize(callback) {
    const inputPath = this.input[0];

    if (!inputPath) {
      return callback(new Error("Missing argument: Path to external repository"));
    }

    const externalRepoPath = path.resolve(inputPath);
    const externalRepoBase = path.basename(externalRepoPath);

    try {
      const stats = fs.statSync(externalRepoPath);
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

    this.targetDir = "packages/" + externalRepoBase;

    try {
      if (fs.statSync(this.targetDir)) {
        return callback(new Error(`Target directory already exists "${this.targetDir}"`));
      }
    } catch (e) { /* Pass */ }

    this.externalExecOpts = {
      encoding: "utf8",
      cwd: externalRepoPath
    };

    this.commits = this.externalExecSync("git log --format=\"%h\"").split("\n").reverse();

    if (!this.commits.length) {
      return callback(new Error(`No git commits to import at "${inputPath}"`));
    }

    // Stash the repo's pre-import head away in case something goes wrong.
    this.preImportHead = execSync("git log --format=\"%h\" -1").split("\n")[0];

    if (execSync("git diff " + this.preImportHead)) {
      return callback(new Error("Local repository has un-committed changes"));
    }

    this.logger.info(`About to import ${this.commits.length} commits into from ${inputPath} into ${this.targetDir}`);

    if (this.flags.yes) {
      callback(null, true);
    } else {
      PromptUtilities.confirm("Are you sure you want to import these commits onto the current branch?", (confirmed) => {
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
    return execSync(command, this.externalExecOpts).trim();
  }

  execute(callback) {
    const replacement = "$1/" + this.targetDir;

    progressBar.init(this.commits.length);

    async.series(this.commits.map((sha) => (done) => {
      progressBar.tick(sha);

      // Create a patch file for this commit and prepend the target directory
      // to all affected files.  This moves the git history for the entire
      // external repository into the package subdirectory, commit by commit.
      const patch = this.externalExecSync(`git format-patch -1 ${sha} --stdout`)
        .replace(/^([-+]{3} [ab])/mg,     replacement)
        .replace(/^(diff --git a)/mg,     replacement)
        .replace(/^(diff --git \S+ b)/mg, replacement);

      // Apply the modified patch to the current lerna repository, preserving
      // original commit date, author and message.
      //
      // Fall back to three-way merge, which can help with duplicate commits
      // due to merge history.
      exec("git am -3", {}, (err) => {
        if (err) {

          // Give some context for the error message.
          err = `Failed to apply commit ${sha}.\n${err}\n` +
                `Rolling back to previous HEAD (commit ${this.preImportHead}).`;

          // Abort the failed `git am` and roll back to previous HEAD.
          execSync("git am --abort");
          execSync("git reset --hard " + this.preImportHead);
        }
        done(err);
      }).stdin.end(patch);
    }), (err) => {
      progressBar.terminate();

      if (!err) {
        this.logger.info("Import complete!");
      }
      callback(err, !err);
    });
  }
}
