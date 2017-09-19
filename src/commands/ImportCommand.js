import async from "async";
import dedent from "dedent";
import path from "path";

import ChildProcessUtilities from "../ChildProcessUtilities";
import Command from "../Command";
import FileSystemUtilities from "../FileSystemUtilities";
import GitUtilities from "../GitUtilities";
import PromptUtilities from "../PromptUtilities";

export function handler(argv) {
  new ImportCommand([argv.pathToRepo], argv, argv._cwd).run()
    .then(argv._onFinish, argv._onFinish);
}

export const command = "import <pathToRepo>";

export const describe = dedent`
  Import the package in <pathToRepo> into packages/<directory-name> with commit history.
`;

export const builder = {
  "yes": {
    group: "Command Options:",
    describe: "Skip all confirmation prompts",
  },
  "flatten": {
    group: "Command Options:",
    describe: "Import each merge commit as a single change the merge introduced",
  },
};

export default class ImportCommand extends Command {
  gitParamsForTargetCommits() {
    const params = ["log", "--format=%h"];
    if (this.options.flatten) {
      params.push("--first-parent");
    }
    return params;
  }

  initialize(callback) {
    const inputPath = this.input[0];

    const externalRepoPath = path.resolve(inputPath);
    const externalRepoBase = path.basename(externalRepoPath);

    this.externalExecOpts = Object.assign({}, this.execOpts, {
      cwd: externalRepoPath
    });

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

    this.commits = this.externalExecSync("git", this.gitParamsForTargetCommits()).split("\n").reverse();
    // this.commits = this.externalExecSync("git", [
    //   "rev-list",
    //   "--no-merges",
    //   "--topo-order",
    //   "--reverse",
    //   "HEAD",
    // ]).split("\n");

    if (!this.commits.length) {
      return callback(new Error(`No git commits to import at "${inputPath}"`));
    }

    // Stash the repo's pre-import head away in case something goes wrong.
    this.preImportHead = GitUtilities.getCurrentSHA(this.execOpts);

    if (ChildProcessUtilities.execSync("git", ["diff-index", "HEAD"], this.execOpts)) {
      return callback(new Error("Local repository has un-committed changes"));
    }

    this.logger.info(
      "",
      `About to import ${this.commits.length} commits from ${inputPath} into ${this.targetDir}`
    );

    if (this.options.yes) {
      callback(null, true);
    } else {
      const message = "Are you sure you want to import these commits onto the current branch?";

      PromptUtilities.confirm(message, (confirmed) => {
        callback(null, confirmed);
      });
    }
  }

  externalExecSync(cmd, args) {
    return ChildProcessUtilities.execSync(cmd, args, this.externalExecOpts);
  }

  createPatchForCommit(sha) {
    let patch = null;
    if (this.options.flatten) {
      const diff = this.externalExecSync("git", ["log", "--reverse", "--first-parent", "-p",
        "-m", "--pretty=email", "--stat", "--binary", "-1", sha]);
      const version = this.externalExecSync("git", ["--version"]).replace(/git version /g, '');
      patch = `${diff}\n--\n${version}`;
    } else {
      patch = this.externalExecSync("git", ["format-patch", "-1", sha, "--stdout"]);
    }

    const replacement = "$1/" + this.targetDir;
    // Create a patch file for this commit and prepend the target directory
    // to all affected files.  This moves the git history for the entire
    // external repository into the package subdirectory, commit by commit.
    return (
      patch
        .replace(/^([-+]{3} [ab])/mg,     replacement)
        .replace(/^(diff --git a)/mg,     replacement)
        .replace(/^(diff --git \S+ b)/mg, replacement)
        .replace(/^(rename (from|to)) /mg, `$1 ${this.targetDir}/`)
    );
  }

  execute(callback) {
    const tracker = this.logger.newItem("execute");

    tracker.addWork(this.commits.length);

    async.series(this.commits.map((sha) => (done) => {
      tracker.info(sha);

      const patch = this.createPatchForCommit(sha);
      // Apply the modified patch to the current lerna repository, preserving
      // original commit date, author and message.
      //
      // Fall back to three-way merge, which can help with duplicate commits
      // due to merge history.
      ChildProcessUtilities.exec("git", ["am", "-3"], this.execOpts, (err) => {
        if (err) {
          // Give some context for the error message.
          err = `Failed to apply commit ${sha}.\n${err}\n` +
                `Rolling back to previous HEAD (commit ${this.preImportHead}).\n` +
                `You may try with --flatten to import flat history.`;

          // Abort the failed `git am` and roll back to previous HEAD.
          ChildProcessUtilities.execSync("git", ["am", "--abort"], this.execOpts);
          ChildProcessUtilities.execSync("git", ["reset", "--hard", this.preImportHead], this.execOpts);
        }

        tracker.completeWork(1);

        done(err);
      }).stdin.end(patch);
    }), (err) => {
      tracker.finish();

      if (!err) {
        this.logger.success("import", "finished");
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
