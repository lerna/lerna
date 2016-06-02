import fs from "fs";
import path from "path";
import child from "child_process";
import Command from "../Command";
import progressBar from "../progressBar";
import PromptUtilities from "../PromptUtilities";

export default class ImportCommand extends Command {
  initialize(callback) {
    const inputPath = this.input[0];

    if (!inputPath) {
      callback(new Error("Missing argument: Path to foreign repository"));
    }

    const foreignRepoPath = path.resolve(inputPath);

    try {
      const stats = fs.statSync(foreignRepoPath);
      if (!stats.isDirectory()) {
        throw new Error(`Input path "${inputPath}" is not a directory`);
      }
      const packageJson = path.join(foreignRepoPath, "package.json");
      const packageName = require(packageJson).name;
      if (!packageName) {
        throw new Error(`No package name specified in "${packageJson}"`);
      }
      this.targetDir = "packages/"+packageName;
    } catch (e) {
      callback(e);
    }

    this.foreignExecOpts = {
      encoding: "utf8",
      cwd: foreignRepoPath
    };

    this.commits = this.foreignExecSync("git log --format=\"%h\"").split("\n").reverse();

    if (!this.commits.length) {
      callback(new Error(`No git commits to import at "${inputPath}"`));
    }

    this.logger.info(`About to import ${this.commits.length} commits into from ${inputPath} into ${this.targetDir}`);
    PromptUtilities.confirm("Are you sure you want to import these commits onto the current branch?", confirmed => {
      if (confirmed) {
        callback(null, true);
      } else {
        this.logger.info("Okay bye!");
        callback(null, false);
      }
    });
  }

  foreignExecSync(command) {
    return child.execSync(command, this.foreignExecOpts).trim();
  }

  execute(callback) {
    const replacement = "$1/"+this.targetDir;

    progressBar.init(this.commits.length);

    this.commits.forEach(sha => {
      progressBar.tick(sha);
      const patch = this.foreignExecSync(`git format-patch -1 ${sha} --stdout`)
        .replace(/^([-+]{3} [ab])/mg,     replacement)
        .replace(/^(diff --git a)/mg,     replacement)
        .replace(/^(diff --git \S+ b)/mg, replacement);
      child.execSync("git am", {input: patch});
    });
    progressBar.terminate();
    this.logger.info("Import complete!");
    callback(null, true);
  }
}
