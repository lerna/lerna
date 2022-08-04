// @ts-check

"use strict";

const { collectUpdates, getPackagesForOption, collectPackages } = require("@lerna/collect-updates");
const { Command } = require("@lerna/command");
const { prereleaseIdFromVersion } = require("@lerna/prerelease-id-from-version");
const { createRunner } = require("@lerna/run-lifecycle");
const { ValidationError } = require("@lerna/validation-error");
const { Workspaces, workspaceRoot, readNxJson, createProjectGraphAsync } = require("@nrwl/devkit");
const dedent = require("dedent");
const semver = require("semver");
const pReduce = require("p-reduce");
const os = require("os");
const pWaterfall = require("p-waterfall");
const { recommendVersion } = require("@lerna/conventional-commits");
const { output } = require("@lerna/output");
const { promptConfirmation } = require("@lerna/prompt");
const chalk = require("chalk");
const { printChanges, FsTree, flushChanges } = require("nx/src/generators/tree");
const { readProjectsConfigurationFromProjectGraph } = require("nx/src/project-graph/project-graph");
const { handleErrors } = require("nx/src/utils/params");
const { getCurrentBranch } = require("./lib/get-current-branch");
const { isAnythingCommitted } = require("./lib/is-anything-committed");
const { isBehindUpstream } = require("./lib/is-behind-upstream");
const { makePromptVersion } = require("./lib/prompt-version");
const { remoteBranchExists } = require("./lib/remote-branch-exists");
const { isBreakingChange } = require("./lib/is-breaking-change");
const { generatorFactory } = require("./generator");

class NeoVersionCommand extends Command {
  initialize() {
    if (!this.project.isIndependent()) {
      this.logger.info("current version", this.project.version);
    }

    if (this.requiresGit) {
      // git validation, if enabled, should happen before updates are calculated and versions picked
      if (!isAnythingCommitted(this.execOpts)) {
        throw new ValidationError(
          "ENOCOMMIT",
          "No commits in this repository. Please commit something before using version."
        );
      }

      this.currentBranch = getCurrentBranch(this.execOpts);

      if (this.currentBranch === "HEAD") {
        throw new ValidationError(
          "ENOGIT",
          "Detached git HEAD, please checkout a branch to choose versions."
        );
      }

      if (this.pushToRemote && !remoteBranchExists(this.gitRemote, this.currentBranch, this.execOpts)) {
        throw new ValidationError(
          "ENOREMOTEBRANCH",
          dedent`
                Branch '${this.currentBranch}' doesn't exist in remote '${this.gitRemote}'.
                If this is a new branch, please make sure you push it to the remote first.
              `
        );
      }

      if (
        this.options.allowBranch &&
        ![].concat(this.options.allowBranch).some((x) => minimatch(this.currentBranch, x))
      ) {
        throw new ValidationError(
          "ENOTALLOWED",
          dedent`
                Branch '${this.currentBranch}' is restricted from versioning due to allowBranch config.
                Please consider the reasons for this restriction before overriding the option.
              `
        );
      }

      if (
        this.commitAndTag &&
        this.pushToRemote &&
        isBehindUpstream(this.gitRemote, this.currentBranch, this.execOpts)
      ) {
        // eslint-disable-next-line max-len
        const message = `Local branch '${this.currentBranch}' is behind remote upstream ${this.gitRemote}/${this.currentBranch}`;

        if (!this.options.ci) {
          // interrupt interactive execution
          throw new ValidationError(
            "EBEHIND",
            dedent`
                  ${message}
                  Please merge remote changes into '${this.currentBranch}' with 'git pull'
                `
          );
        }

        // CI execution should not error, but warn & exit
        this.logger.warn("EBEHIND", `${message}, exiting`);

        // still exits zero, aka "ok"
        return false;
      }
    } else {
      this.logger.notice(
        "FYI",
        "git repository validation has been skipped, please ensure your version bumps are correct"
      );
    }

    if (this.options.conventionalPrerelease && this.options.conventionalGraduate) {
      throw new ValidationError(
        "ENOTALLOWED",
        dedent`
              --conventional-prerelease cannot be combined with --conventional-graduate.
            `
      );
    }

    this.updates = collectUpdates(
      this.packageGraph.rawPackageList,
      this.packageGraph,
      this.execOpts,
      this.options
    ).filter((node) => {
      // --no-private completely removes private packages from consideration
      if (node.pkg.private && this.options.private === false) {
        // TODO: (major) make --no-private the default
        return false;
      }

      if (!node.version) {
        // a package may be unversioned only if it is private
        if (node.pkg.private) {
          this.logger.info("version", "Skipping unversioned private package %j", node.name);
        } else {
          throw new ValidationError(
            "ENOVERSION",
            dedent`
                  A version field is required in ${node.name}'s package.json file.
                  If you wish to keep the package unversioned, it must be made private.
                `
          );
        }
      }

      return !!node.version;
    });

    if (!this.updates.length) {
      this.logger.success(`No changed packages to ${this.composed ? "publish" : "version"}`);

      // still exits zero, aka "ok"
      return false;
    }

    // a "rooted leaf" is the regrettable pattern of adding "." to the "packages" config in lerna.json
    this.hasRootedLeaf = this.packageGraph.has(this.project.manifest.name);

    if (this.hasRootedLeaf && !this.composed) {
      this.logger.info("version", "rooted leaf detected, skipping synthetic root lifecycles");
    }

    this.runPackageLifecycle = createRunner({ ...this.options, stdio: "inherit" });

    // don't execute recursively if run from a poorly-named script
    this.runRootLifecycle = /^(pre|post)?version$/.test(process.env.npm_lifecycle_event)
      ? (stage) => {
          this.logger.warn("lifecycle", "Skipping root %j because it has already been called", stage);
        }
      : (stage) => this.runPackageLifecycle(this.project.manifest, stage);

    const tasks = [
      () => this.getVersionsForUpdates(),
      (versions) => this.setUpdatesForVersions(versions),
      () => this.confirmVersions(),
    ];

    // amending a commit probably means the working tree is dirty
    if (this.commitAndTag && this.gitOpts.amend !== true) {
      const { forcePublish, conventionalCommits, conventionalGraduate } = this.options;
      const checkUncommittedOnly = forcePublish || (conventionalCommits && conventionalGraduate);
      const check = checkUncommittedOnly ? throwIfUncommitted : checkWorkingTree;
      tasks.unshift(() => check(this.execOpts));
    } else {
      this.logger.warn("version", "Skipping working tree validation, proceed at your own risk");
    }

    return pWaterfall(tasks);
  }

  updatePackageVersions() {}

  async execute() {
    const ws = new Workspaces(workspaceRoot);
    const nxJson = readNxJson();
    const projectGraph = await createProjectGraphAsync();
    const projectsConfiguration = readProjectsConfigurationFromProjectGraph(projectGraph);
    const workspaceConfiguration = {
      ...nxJson,
      ...projectsConfiguration,
    };
    const isVerbose = this.argv["verbose"];

    return handleErrors(isVerbose, async () => {
      this.logger.info(`lerna doing schtuff...`);

      const cwd = process.cwd();

      const host = new FsTree(workspaceRoot, isVerbose);

      const generatorImplementation = generatorFactory(this.logger);

      const task = await generatorImplementation(host, {
        cwd,
        relativeCwd: ws.relativeCwd(cwd),
        workspaceConfiguration,
        // updates: this.updates,
        packagesToVersion: this.packagesToVersion,
        commitAndTag: this.commitAndTag,
        pushToRemote: this.pushToRemote,
        releaseClient: this.releaseClient,
        composed: this.composed,
        hasRootedLeaf: this.hasRootedLeaf,
        project: this.project,
      });
      const changes = host.listChanges();

      printChanges(changes);
      if (!this.argv.dryRun) {
        flushChanges(workspaceRoot, changes);
        if (task) {
          await task();
        }
      } else {
        this.logger.warn("version", `The "dryRun" flag means no changes were made.`);
      }
    });
  }

  getVersionsForUpdates() {
    const independentVersions = this.project.isIndependent();
    const { bump, conventionalCommits, preid } = this.options;
    const repoVersion = bump ? semver.clean(bump) : "";
    const increment = bump && !semver.valid(bump) ? bump : "";

    const resolvePrereleaseId = (existingPreid) => preid || existingPreid || "alpha";

    const makeGlobalVersionPredicate = (nextVersion) => {
      this.globalVersion = nextVersion;

      return () => nextVersion;
    };

    // decide the predicate in the conditionals below
    let predicate;

    if (repoVersion) {
      predicate = makeGlobalVersionPredicate(repoVersion);
    } else if (increment && independentVersions) {
      // compute potential prerelease ID for each independent update
      predicate = (node) => semver.inc(node.version, increment, resolvePrereleaseId(node.prereleaseId));
    } else if (increment) {
      // compute potential prerelease ID once for all fixed updates
      const prereleaseId = prereleaseIdFromVersion(this.project.version);
      const nextVersion = semver.inc(this.project.version, increment, resolvePrereleaseId(prereleaseId));

      predicate = makeGlobalVersionPredicate(nextVersion);
    } else if (conventionalCommits) {
      // it's a bit weird to have a return here, true
      return this.recommendVersions(resolvePrereleaseId);
    } else if (independentVersions) {
      // prompt for each independent update with potential prerelease ID
      predicate = makePromptVersion(resolvePrereleaseId);
    } else {
      // prompt once with potential prerelease ID
      const prereleaseId = prereleaseIdFromVersion(this.project.version);
      const node = { version: this.project.version, prereleaseId };

      predicate = makePromptVersion(resolvePrereleaseId);
      predicate = predicate(node).then(makeGlobalVersionPredicate);
    }

    return Promise.resolve(predicate).then((getVersion) => this.reduceVersions(getVersion));
  }

  reduceVersions(getVersion) {
    const iterator = (versionMap, node) =>
      Promise.resolve(getVersion(node)).then((version) => versionMap.set(node.name, version));

    return pReduce(this.updates, iterator, new Map());
  }

  recommendVersions(resolvePrereleaseId) {
    const independentVersions = this.project.isIndependent();
    const { changelogPreset, conventionalGraduate } = this.options;
    const rootPath = this.project.manifest.location;
    const type = independentVersions ? "independent" : "fixed";
    const prereleasePackageNames = this.getPrereleasePackageNames();
    const graduatePackageNames = Array.from(getPackagesForOption(conventionalGraduate));
    const shouldPrerelease = (name) => prereleasePackageNames && prereleasePackageNames.includes(name);
    const shouldGraduate = (name) =>
      graduatePackageNames.includes("*") || graduatePackageNames.includes(name);
    const getPrereleaseId = (node) => {
      if (!shouldGraduate(node.name) && (shouldPrerelease(node.name) || node.prereleaseId)) {
        return resolvePrereleaseId(node.prereleaseId);
      }
    };

    let chain = Promise.resolve();

    if (type === "fixed") {
      chain = chain.then(() => this.setGlobalVersionFloor());
    }

    chain = chain.then(() =>
      this.reduceVersions((node) =>
        recommendVersion(node, type, {
          changelogPreset,
          rootPath,
          tagPrefix: this.tagPrefix,
          prereleaseId: getPrereleaseId(node),
        })
      )
    );

    if (type === "fixed") {
      chain = chain.then((versions) => {
        this.globalVersion = this.setGlobalVersionCeiling(versions);

        return versions;
      });
    }

    return chain;
  }

  setGlobalVersionFloor() {
    const globalVersion = this.project.version;

    for (const node of this.updates) {
      if (semver.lt(node.version, globalVersion)) {
        this.logger.verbose(
          "version",
          `Overriding version of ${node.name} from ${node.version} to ${globalVersion}`
        );

        node.pkg.set("version", globalVersion);
      }
    }
  }

  setGlobalVersionCeiling(versions) {
    let highestVersion = this.project.version;

    versions.forEach((bump) => {
      if (bump && semver.gt(bump, highestVersion)) {
        highestVersion = bump;
      }
    });

    versions.forEach((_, name) => versions.set(name, highestVersion));

    return highestVersion;
  }

  getPrereleasePackageNames() {
    const prereleasePackageNames = getPackagesForOption(this.options.conventionalPrerelease);
    const isCandidate = prereleasePackageNames.has("*")
      ? () => true
      : (node, name) => prereleasePackageNames.has(name);

    return collectPackages(this.packageGraph, { isCandidate }).map((pkg) => pkg.name);
  }

  setUpdatesForVersions(versions) {
    if (this.project.isIndependent() || versions.size === this.packageGraph.size) {
      // only partial fixed versions need to be checked
      this.updatesVersions = versions;
    } else {
      let hasBreakingChange;

      for (const [name, bump] of versions) {
        hasBreakingChange = hasBreakingChange || isBreakingChange(this.packageGraph.get(name).version, bump);
      }

      if (hasBreakingChange) {
        // _all_ packages need a major version bump whenever _any_ package does
        this.updates = Array.from(this.packageGraph.values());

        // --no-private completely removes private packages from consideration
        if (this.options.private === false) {
          // TODO: (major) make --no-private the default
          this.updates = this.updates.filter((node) => !node.pkg.private);
        }

        this.updatesVersions = new Map(this.updates.map((node) => [node.name, this.globalVersion]));
      } else {
        this.updatesVersions = versions;
      }
    }

    this.packagesToVersion = this.updates.map((node) => node.pkg);
  }

  confirmVersions() {
    const changes = this.packagesToVersion.map((pkg) => {
      let line = ` - ${pkg.name}: ${pkg.version} => ${this.updatesVersions.get(pkg.name)}`;
      if (pkg.private) {
        line += ` (${chalk.red("private")})`;
      }
      return line;
    });

    output("");
    output("Changes:");
    output(changes.join(os.EOL));
    output("");

    if (this.options.yes) {
      this.logger.info("auto-confirmed");
      return true;
    }

    // When composed from `lerna publish`, use this opportunity to confirm publishing
    const message = this.composed
      ? "Are you sure you want to publish these packages?"
      : "Are you sure you want to create these versions?";

    return promptConfirmation(message);
  }
}

module.exports = (argv) => new NeoVersionCommand(argv);
