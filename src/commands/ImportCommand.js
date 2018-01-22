import async from "async";
import dedent from "dedent";
import path from "path";

import ChildProcessUtilities from "../ChildProcessUtilities";
import Command from "../Command";
import FileSystemUtilities from "../FileSystemUtilities";
import GitUtilities from "../GitUtilities";
import PromptUtilities from "../PromptUtilities";

export function handler(argv) {
  // eslint-disable-next-line no-use-before-define
  const cmd = new ImportCommand([argv.pathToRepo], argv, argv._cwd);
  return cmd.run().then(argv._onResolved, argv._onRejected);
}

export const command = "import <pathToRepo>";

export const describe = dedent`
  Import the package in <pathToRepo> into packages/<directory-name> with commit history.
`;

export const builder = {
  yes: {
    group: "Command Options:",
    describe: "Skip all confirmation prompts",
  },
  flatten: {
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
      cwd: externalRepoPath,
    });

    try {
      const stats = FileSystemUtilities.statSync(externalRepoPath);

      if (!stats.isDirectory()) {
        throw new Error(`Input path "${inputPath}" is not a directory`);
      }

      const packageJson = path.join(externalRepoPath, "package.json");
      // eslint-disable-next-line import/no-dynamic-require, global-require
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

    // Compute a target directory relative to the Lerna root
    const targetDir = path.join(targetBase, externalRepoBase);

    // Compute a target directory relative to the Git root
    const gitRepoRoot = GitUtilities.getWorkspaceRoot(this.execOpts);
    const lernaRootRelativeToGitRoot = path.relative(gitRepoRoot, this.repository.rootPath);
    this.targetDirRelativeToGitRoot = path.join(lernaRootRelativeToGitRoot, targetDir);

    if (FileSystemUtilities.existsSync(path.resolve(this.repository.rootPath, targetDir))) {
      return callback(new Error(`Target directory already exists "${targetDir}"`));
    }

    this.commits = this.externalExecSync("git", this.gitParamsForTargetCommits())
      .split("\n")
      .reverse();
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
      `About to import ${this.commits.length} commits from ${inputPath} into ${targetDir}`
    );

    if (this.options.yes) {
      callback(null, true);
    } else {
      const message = "Are you sure you want to import these commits onto the current branch?";

      PromptUtilities.confirm(message, confirmed => {
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
      const diff = this.externalExecSync("git", [
        "log",
        "--reverse",
        "--first-parent",
        "-p",
        "-m",
        "--pretty=email",
        "--stat",
        "--binary",
        "-1",
        sha,
      ]);
      const version = this.externalExecSync("git", ["--version"]).replace(/git version /g, "");
      patch = `${diff}\n--\n${version}`;
    } else {
      patch = this.externalExecSync("git", ["format-patch", "-1", sha, "--stdout"]);
    }

    const formattedTarget = this.targetDirRelativeToGitRoot.replace(/\\/g, "/");
    const replacement = `$1/${formattedTarget}`;
    // Create a patch file for this commit and prepend the target directory
    // to all affected files.  This moves the git history for the entire
    // external repository into the package subdirectory, commit by commit.
    return patch
      .replace(/^([-+]{3} [ab])/gm, replacement)
      .replace(/^(diff --git a)/gm, replacement)
      .replace(/^(diff --git \S+ b)/gm, replacement)
      .replace(/^(rename (from|to)) /gm, `$1 ${formattedTarget}/`);
  }

  execute(callback) {
    const tracker = this.logger.newItem("execute");

    tracker.addWork(this.commits.length);

    async.series(
      this.commits.map(sha => done => {
        tracker.info(sha);

        const patch = this.createPatchForCommit(sha);
        // Apply the modified patch to the current lerna repository, preserving
        // original commit date, author and message.
        //
        // Fall back to three-way merge, which can help with duplicate commits
        // due to merge history.
        ChildProcessUtilities.exec("git", ["am", "-3", "--keep-non-patch"], this.execOpts, err => {
          tracker.completeWork(1);

          if (err) {
            if (err.stdout.indexOf("Patch is empty.") === 0) {
              // Automatically skip empty commits
              ChildProcessUtilities.execSync("git", ["am", "--skip"], this.execOpts);
            } else {
              // Give some context for the error message.
              err.message = dedent`
                Failed to apply commit ${sha}.
                ${err.message}
                Rolling back to previous HEAD (commit ${this.preImportHead}).
                You may try with --flatten to import flat history.
              `;

              // Abort the failed `git am` and roll back to previous HEAD.
              ChildProcessUtilities.execSync("git", ["am", "--abort"], this.execOpts);
              ChildProcessUtilities.execSync("git", ["reset", "--hard", this.preImportHead], this.execOpts);

              return done(err);
            }
          }

          done();
        }).stdin.end(patch);
      }),
      err => {
        tracker.finish();

        if (!err) {
          this.logger.success("import", "finished");
        } else {
          this.logger.error("import", err);
        }

        callback(err, !err);
      }
    );
  }
}

function getTargetBase(packageConfigs) {
  const straightPackageDirectories = packageConfigs
    .filter(p => path.basename(p) === "*")
    .map(p => path.dirname(p));

  return straightPackageDirectories[0] || "packages";
}
