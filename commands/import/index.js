"use strict";

const dedent = require("dedent");
const fs = require("fs-extra");
const path = require("path");
const pMapSeries = require("p-map-series");

const ChildProcessUtilities = require("@lerna/child-process");
const Command = require("@lerna/command");
const GitUtilities = require("@lerna/git-utils");
const PromptUtilities = require("@lerna/prompt");
const ValidationError = require("@lerna/validation-error");
const getTargetBase = require("./lib/get-target-base");

class ImportCommand extends Command {
  gitParamsForTargetCommits() {
    const params = ["log", "--format=%h"];
    if (this.options.flatten) {
      params.push("--first-parent");
    }
    return params;
  }

  initialize() {
    const inputPath = this.options.dir;

    const externalRepoPath = path.resolve(inputPath);
    const externalRepoBase = path.basename(externalRepoPath);

    this.externalExecOpts = Object.assign({}, this.execOpts, {
      cwd: externalRepoPath,
    });

    let stats;

    try {
      stats = fs.statSync(externalRepoPath);
    } catch (e) {
      if (e.code === "ENOENT") {
        throw new Error(`No repository found at "${inputPath}"`);
      }

      throw e;
    }

    if (!stats.isDirectory()) {
      throw new Error(`Input path "${inputPath}" is not a directory`);
    }

    const packageJson = path.join(externalRepoPath, "package.json");
    // eslint-disable-next-line import/no-dynamic-require, global-require
    const packageName = require(packageJson).name;

    if (!packageName) {
      throw new Error(`No package name specified in "${packageJson}"`);
    }

    const targetBase = getTargetBase(this.project.packageConfigs);

    // Compute a target directory relative to the Lerna root
    const targetDir = path.join(targetBase, externalRepoBase);

    // Compute a target directory relative to the Git root
    const gitRepoRoot = GitUtilities.getWorkspaceRoot(this.execOpts);
    const lernaRootRelativeToGitRoot = path.relative(gitRepoRoot, this.project.rootPath);
    this.targetDirRelativeToGitRoot = path.join(lernaRootRelativeToGitRoot, targetDir);

    if (fs.existsSync(path.resolve(this.project.rootPath, targetDir))) {
      throw new Error(`Target directory already exists "${targetDir}"`);
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
      throw new Error(`No git commits to import at "${inputPath}"`);
    }

    // Stash the repo's pre-import head away in case something goes wrong.
    this.preImportHead = GitUtilities.getCurrentSHA(this.execOpts);

    if (ChildProcessUtilities.execSync("git", ["diff-index", "HEAD"], this.execOpts)) {
      throw new Error("Local repository has un-committed changes");
    }

    this.logger.info(
      "",
      `About to import ${this.commits.length} commits from ${inputPath} into ${targetDir}`
    );

    if (this.options.yes) {
      return true;
    }

    return PromptUtilities.confirm("Are you sure you want to import these commits onto the current branch?");
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

  execute() {
    const tracker = this.logger.newItem("execute");
    const mapper = sha => {
      tracker.info(sha);

      const patch = this.createPatchForCommit(sha);

      // Apply the modified patch to the current lerna repository, preserving
      // original commit date, author and message.
      //
      // Fall back to three-way merge, which can help with duplicate commits
      // due to merge history.
      const proc = ChildProcessUtilities.exec("git", ["am", "-3", "--keep-non-patch"], this.execOpts);

      proc.stdin.end(patch);

      return proc
        .then(() => {
          tracker.completeWork(1);
        })
        .catch(err => {
          if (err.stdout.indexOf("Patch is empty.") === 0) {
            tracker.completeWork(1);

            // Automatically skip empty commits
            return ChildProcessUtilities.exec("git", ["am", "--skip"], this.execOpts);
          }

          err.sha = sha;
          throw err;
        });
    };

    tracker.addWork(this.commits.length);

    return pMapSeries(this.commits, mapper)
      .then(() => {
        tracker.finish();

        this.logger.success("import", "finished");
      })
      .catch(err => {
        tracker.finish();

        this.logger.error("import", `Rolling back to previous HEAD (commit ${this.preImportHead})`);

        // Abort the failed `git am` and roll back to previous HEAD.
        ChildProcessUtilities.execSync("git", ["am", "--abort"], this.execOpts);
        ChildProcessUtilities.execSync("git", ["reset", "--hard", this.preImportHead], this.execOpts);

        throw new ValidationError(
          "EIMPORT",
          dedent`
            Failed to apply commit ${err.sha}.
            ${err.message}

            You may try again with --flatten to import flat history.
          `
        );
      });
  }
}

module.exports = ImportCommand;
