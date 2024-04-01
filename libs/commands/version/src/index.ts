import {
  Arguments,
  Command,
  CommandConfigOptions,
  Package,
  PreInitializedProjectData,
  ProjectGraphProjectNodeWithPackage,
  ValidationError,
  applyBuildMetadata,
  checkWorkingTree,
  collectProjectUpdates,
  collectProjects,
  createRunner,
  execPackageManager,
  execPackageManagerSync,
  formatJSON,
  getPackage,
  getPackagesForOption,
  output,
  prereleaseIdFromVersion,
  promptConfirmation,
  recommendVersion,
  runProjectsTopologically,
  throwIfUncommitted,
  updateChangelog,
} from "@lerna/core";
import chalk from "chalk";
import dedent from "dedent";
import execa from "execa";
import fs from "fs";
import minimatch from "minimatch";
import os from "os";
import pMap from "p-map";
import pPipe from "p-pipe";
import pReduce from "p-reduce";
import pWaterfall from "p-waterfall";
import path from "path";
import semver, { ReleaseType } from "semver";
import { createRelease, createReleaseClient } from "./lib/create-release";
import { getCurrentBranch } from "./lib/get-current-branch";
import { gitAdd } from "./lib/git-add";
import { gitCommit } from "./lib/git-commit";
import { gitPush } from "./lib/git-push";
import { gitTag } from "./lib/git-tag";
import { isAnythingCommitted } from "./lib/is-anything-committed";
import { isBehindUpstream } from "./lib/is-behind-upstream";
import { isBreakingChange } from "./lib/is-breaking-change";
import { makePromptVersion } from "./lib/prompt-version";
import { remoteBranchExists } from "./lib/remote-branch-exists";
import { updateLockfileVersion } from "./lib/update-lockfile-version";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const childProcess = require("@lerna/child-process");

module.exports = function factory(
  argv: Arguments<VersionCommandConfigOptions>,
  preInitializedProjectData?: PreInitializedProjectData
) {
  return new VersionCommand(argv, preInitializedProjectData);
};

interface VersionCommandConfigOptions extends CommandConfigOptions {
  allowBranch?: string | string[];
  conventionalCommits?: boolean;
  amend?: boolean;
  json?: boolean;
  commitHooks?: boolean;
  gitRemote?: string;
  gitTagVersion?: boolean;
  syncDistVersion?: boolean;
  granularPathspec?: boolean;
  push?: boolean;
  signGitCommit?: boolean;
  signoffGitCommit?: boolean;
  signGitTag?: boolean;
  forceGitTag?: boolean;
  tagVersionPrefix?: string;
  tagVersionSeparator?: string;
  createRelease?: "github" | "gitlab";
  changelog?: boolean;
  exact?: boolean;
  conventionalPrerelease?: string;
  conventionalGraduate?: string;
  forceConventionalGraduate?: boolean;
  private?: boolean;
  forcePublish?: boolean | string | string[];
  bump?: string;
  preid?: string;
  buildMetadata?: string;
  gitTagCommand?: string;
  message?: string;
  npmClientArgs?: string[];
  runScriptsOnLockfileUpdate?: boolean;
  changelogPreset?: string;
  changelogEntryAdditionalMarkdown?: string;
  conventionalBumpPrerelease?: boolean;
  yes?: boolean;
  rejectCycles?: boolean;
  premajorVersionBump?: "default" | "force-patch";
}

class VersionCommand extends Command {
  options: VersionCommandConfigOptions;

  commitAndTag?: boolean;
  pushToRemote?: boolean;
  allowBranch?: boolean;
  gitRemote?: string;
  tagPrefix?: string;
  releaseClient?: ReturnType<typeof createReleaseClient>;
  releaseNotes?: { name: string; notes: string }[];
  gitOpts?: {
    amend?: boolean;
    commitHooks?: boolean;
    granularPathspec?: boolean;
    signGitCommit?: boolean;
    signoffGitCommit?: boolean;
    signGitTag?: boolean;
    forceGitTag?: boolean;
  };
  savePrefix?: string;
  currentBranch?: string;
  updates: ProjectGraphProjectNodeWithPackage[] = [];
  tags?: string[];
  globalVersion?: string;
  hasRootedLeaf?: boolean;
  runPackageLifecycle?: (pkg: Package, script: string) => Promise<void>;
  runRootLifecycle?: (script: string) => Promise<void> | void;
  updatesVersions?: Map<string, string>;
  packagesToVersion?: Package[];
  projectsWithPackage: ProjectGraphProjectNodeWithPackage[] = [];
  premajorVersionBump?: "default" | "force-patch";

  get otherCommandConfigs() {
    // back-compat
    return ["publish"];
  }

  get requiresGit() {
    return !!(
      this.commitAndTag ||
      this.pushToRemote ||
      this.options.allowBranch ||
      this.options.conventionalCommits
    );
  }

  /**
   * Due to lerna publish's legacy of being backwards compatible with running versioning and publishing
   * in a single step, we need to be able to receive any project data which might already exist from the
   * publish command (in the case that it invokes the version command from within its implementation details).
   */
  constructor(
    argv: Arguments<VersionCommandConfigOptions>,
    preInitializedProjectData?: PreInitializedProjectData
  ) {
    super(argv, { skipValidations: false, preInitializedProjectData });
  }

  configureProperties() {
    super.configureProperties();

    // Defaults are necessary here because yargs defaults
    // override durable options provided by a config file
    const {
      amend,
      commitHooks = true,
      gitRemote = "origin",
      gitTagVersion = true,
      granularPathspec = true,
      push = true,
      signGitCommit,
      signoffGitCommit,
      signGitTag,
      forceGitTag,
      tagVersionPrefix = "v",
      premajorVersionBump = "default",
    } = this.options;

    this.gitRemote = gitRemote;
    this.tagPrefix = tagVersionPrefix;
    this.commitAndTag = gitTagVersion;
    this.pushToRemote = gitTagVersion && amend !== true && push;
    this.premajorVersionBump = premajorVersionBump;
    // never automatically push to remote when amending a commit

    this.releaseClient =
      this.pushToRemote && this.options.createRelease && createReleaseClient(this.options.createRelease);
    this.releaseNotes = [];

    if (this.releaseClient && this.options.conventionalCommits !== true) {
      throw new ValidationError("ERELEASE", "To create a release, you must enable --conventional-commits");
    }

    if (this.releaseClient && this.options.changelog === false) {
      throw new ValidationError("ERELEASE", "To create a release, you cannot pass --no-changelog");
    }

    this.gitOpts = {
      amend,
      commitHooks,
      granularPathspec,
      signGitCommit,
      signoffGitCommit,
      signGitTag,
      forceGitTag,
    };

    // https://docs.npmjs.com/misc/config#save-prefix
    this.savePrefix = this.options.exact ? "" : "^";
  }

  async initialize() {
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

    this.projectsWithPackage = Object.values(this.projectGraph.nodes).filter((node) => !!node.package);

    this.updates = collectProjectUpdates(
      this.projectsWithPackage,
      this.projectGraph,
      this.execOpts,
      this.options
    ).filter((node) => {
      const pkg = getPackage(node);
      // --no-private completely removes private packages from consideration
      if (pkg.private && this.options.private === false) {
        // TODO: (major) make --no-private the default
        return false;
      }

      if (!pkg.version) {
        // a package may be unversioned only if it is private
        if (pkg.private) {
          this.logger.info("version", "Skipping unversioned private package %j", pkg.name);
        } else {
          throw new ValidationError(
            "ENOVERSION",
            dedent`
              A version field is required in ${pkg.name}'s package.json file.
              If you wish to keep the package unversioned, it must be made private.
            `
          );
        }
      }

      return !!pkg.version;
    });

    if (!this.updates.length) {
      this.logger.success("", `No changed packages to ${this.composed ? "publish" : "version"}`);

      // still exits zero, aka "ok"
      return false;
    }

    // a "rooted leaf" is the regrettable pattern of adding "." to the "packages" config in lerna.json
    this.hasRootedLeaf = !!this.projectGraph.nodes[this.project.manifest.name];

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

    // amending a commit probably means the working tree is dirty
    if (this.commitAndTag && this.gitOpts.amend !== true) {
      const { forcePublish, conventionalCommits, conventionalGraduate } = this.options;
      const checkUncommittedOnly = forcePublish || (conventionalCommits && conventionalGraduate);
      const check = checkUncommittedOnly ? throwIfUncommitted : checkWorkingTree;
      await check(this.execOpts);
    } else {
      this.logger.warn("version", "Skipping working tree validation, proceed at your own risk");
    }

    const versions = await this.getVersionsForUpdates();
    this.setUpdatesForVersions(versions);

    return this.confirmVersions();
  }

  execute() {
    const tasks: (() => Promise<unknown>)[] = [() => this.updatePackageVersions()];

    if (this.commitAndTag) {
      tasks.push(() => this.commitAndTagUpdates());
    } else {
      this.logger.info("execute", "Skipping git tag/commit");
    }

    if (this.pushToRemote) {
      tasks.push(() => this.gitPushToRemote());
    } else {
      this.logger.info("execute", "Skipping git push");
    }

    if (this.releaseClient) {
      this.logger.info("execute", "Creating releases...");
      tasks.push(() =>
        createRelease(
          this.releaseClient,
          {
            tags: this.tags,
            tagVersionSeparator: this.options.tagVersionSeparator || "@",
            releaseNotes: this.releaseNotes,
          },
          { gitRemote: this.options.gitRemote, execOpts: this.execOpts }
        )
      );
    } else {
      this.logger.info("execute", "Skipping releases");
    }

    return pWaterfall(tasks).then(() => {
      if (!this.composed) {
        this.logger.success("version", "finished");
      }
      return {
        updates: this.updates,
        updatesVersions: this.updatesVersions,
      };
    });
  }

  /**
   * Gets a mapping of project names to their package's new version.
   * @returns {Promise<Record<string, string>>} A map of project names to their package's new versions
   */
  getVersionsForUpdates() {
    const independentVersions = this.project.isIndependent();
    const { bump, conventionalCommits, preid } = this.options;
    const repoVersion = bump ? semver.clean(bump) : "";
    const increment = bump && !semver.valid(bump) ? bump : "";

    const resolvePrereleaseId = (existingPreid: string) => preid || existingPreid || "alpha";

    const makeGlobalVersionPredicate = (nextVersion: string) => {
      this.globalVersion = nextVersion;

      return () => nextVersion;
    };

    // decide the predicate in the conditionals below
    let predicate:
      | ((node?: { version: string; name?: string; prereleaseId?: string }) => string | Promise<string>)
      | Promise<() => string>;

    if (repoVersion) {
      predicate = makeGlobalVersionPredicate(applyBuildMetadata(repoVersion, this.options.buildMetadata));
    } else if (increment && independentVersions) {
      // compute potential prerelease ID for each independent update
      predicate = (node) =>
        applyBuildMetadata(
          semver.inc(node.version, increment as ReleaseType, resolvePrereleaseId(node.prereleaseId)),
          this.options.buildMetadata
        );
    } else if (increment) {
      const baseVersion = this.project.version;

      // compute potential prerelease ID once for all fixed updates
      const prereleaseId = prereleaseIdFromVersion(baseVersion);
      const nextVersion = applyBuildMetadata(
        semver.inc(baseVersion, increment as ReleaseType, resolvePrereleaseId(prereleaseId)),
        this.options.buildMetadata
      );

      predicate = makeGlobalVersionPredicate(nextVersion);
    } else if (conventionalCommits) {
      // it's a bit weird to have a return here, true
      return this.recommendVersions(resolvePrereleaseId);
    } else if (independentVersions) {
      // prompt for each independent update with potential prerelease ID
      predicate = makePromptVersion(resolvePrereleaseId, this.options.buildMetadata);
    } else {
      const baseVersion = this.project.version;

      // prompt once with potential prerelease ID
      const prereleaseId = prereleaseIdFromVersion(baseVersion);
      const node = { version: baseVersion, prereleaseId };

      const prompt = makePromptVersion(resolvePrereleaseId, this.options.buildMetadata);
      predicate = prompt(node).then(makeGlobalVersionPredicate);
    }

    return Promise.resolve(predicate).then((getVersion) =>
      this.reduceVersions((node: ProjectGraphProjectNodeWithPackage) => {
        const pkg = getPackage(node);
        return getVersion({
          version: pkg.version,
          name: pkg.name,
          prereleaseId: prereleaseIdFromVersion(pkg.version),
        });
      })
    );
  }

  reduceVersions(getVersion: (node: ProjectGraphProjectNodeWithPackage) => string | Promise<string>) {
    const iterator = (versionMap: Map<string, string>, node: ProjectGraphProjectNodeWithPackage) =>
      Promise.resolve(getVersion(node)).then((version) => versionMap.set(node.name, version));

    return pReduce(this.updates, iterator, new Map<string, string>());
  }

  getPrereleasePackageNames() {
    const prereleasePackageNames = getPackagesForOption(this.options.conventionalPrerelease);
    const isCandidate = prereleasePackageNames.has("*")
      ? () => true
      : (node: unknown, name: string) => prereleasePackageNames.has(name);

    return collectProjects(this.projectsWithPackage, this.projectGraph, { isCandidate }).map(
      (pkg) => pkg.name
    );
  }

  async recommendVersions(resolvePrereleaseId: (existingPreid: string) => string) {
    const independentVersions = this.project.isIndependent();
    const { buildMetadata, changelogPreset, conventionalGraduate, conventionalBumpPrerelease } = this.options;
    const rootPath = this.project.manifest.location;
    const type = independentVersions ? "independent" : "fixed";
    const prereleasePackageNames = this.getPrereleasePackageNames();
    const graduatePackageNames = Array.from(getPackagesForOption(conventionalGraduate));
    const shouldPrerelease = (name: string) =>
      prereleasePackageNames && prereleasePackageNames.includes(name);
    const shouldGraduate = (name: string) =>
      graduatePackageNames.includes("*") || graduatePackageNames.includes(name);
    const getPrereleaseId = (node: { name: string; prereleaseId: string }) => {
      if (!shouldGraduate(node.name) && (shouldPrerelease(node.name) || node.prereleaseId)) {
        return resolvePrereleaseId(node.prereleaseId);
      }
    };

    if (type === "fixed") {
      this.setGlobalVersionFloor();
    }

    const versions = await this.reduceVersions((node) => {
      const pkg = getPackage(node);
      return recommendVersion(
        pkg,
        type,
        {
          changelogPreset,
          rootPath,
          tagPrefix: this.tagPrefix,
          prereleaseId: getPrereleaseId({
            name: node.name,
            prereleaseId: prereleaseIdFromVersion(pkg.version),
          }),
          conventionalBumpPrerelease,
          buildMetadata,
        },
        this.premajorVersionBump
      );
    });

    if (type === "fixed") {
      this.globalVersion = await this.setGlobalVersionCeiling(versions);
    }

    return versions;
  }

  setGlobalVersionFloor() {
    const globalVersion = this.project.version;

    for (const node of this.updates) {
      const pkg = getPackage(node);
      if (semver.lt(pkg.version, globalVersion)) {
        this.logger.verbose(
          "version",
          `Overriding version of ${pkg.name} from ${pkg.version} to ${globalVersion}`
        );

        pkg.set("version", globalVersion);
      }
    }
  }

  setGlobalVersionCeiling(versions: Map<string, string>) {
    let highestVersion = this.project.version;

    versions.forEach((bump) => {
      if (bump && semver.gt(bump, highestVersion)) {
        highestVersion = bump;
      }
    });

    versions.forEach((_, name) => versions.set(name, highestVersion));

    return highestVersion;
  }

  setUpdatesForVersions(versions: Map<string, string>) {
    if (this.project.isIndependent() || versions.size === this.projectsWithPackage.length) {
      // only partial fixed versions need to be checked
      this.updatesVersions = versions;
    } else {
      let hasBreakingChange: boolean;

      for (const [name, bump] of versions) {
        const pkg = getPackage(this.projectGraph.nodes[name]);
        hasBreakingChange = hasBreakingChange || isBreakingChange(pkg.version, bump);
      }

      if (hasBreakingChange) {
        // _all_ packages need a major version bump whenever _any_ package does
        this.updates = this.projectsWithPackage;

        // --no-private completely removes private packages from consideration
        if (this.options.private === false) {
          // TODO: (major) make --no-private the default
          this.updates = this.updates.filter((node) => !getPackage(node).private);
        }

        this.updatesVersions = new Map(this.updates.map((node) => [node.name, this.globalVersion]));
      } else {
        this.updatesVersions = versions;
      }
    }

    this.packagesToVersion = this.updates.map((node) => getPackage(node));
  }

  confirmVersions() {
    if (this.options.json) {
      const updatedProjectsJson = formatJSON(this.updates, ({ name }) => ({
        newVersion: this.updatesVersions.get(name),
      }));
      output(updatedProjectsJson);
    } else {
      const changes = this.updates.map((node) => {
        const pkg = getPackage(node);
        let line = ` - ${pkg.name}: ${pkg.version} => ${this.updatesVersions.get(node.name)}`;
        if (pkg.private) {
          line += ` (${chalk.red("private")})`;
        }
        return line;
      });

      output("");
      output("Changes:");
      output(changes.join(os.EOL));
      output("");
    }

    if (this.options.yes) {
      this.logger.info("auto-confirmed", "");
      return true;
    }

    // When composed from `lerna publish`, use this opportunity to confirm publishing
    const message = this.composed
      ? "Are you sure you want to publish these packages?"
      : "Are you sure you want to create these versions?";

    return promptConfirmation(message);
  }

  async updatePackageVersions() {
    const {
      conventionalCommits,
      changelogPreset,
      changelogEntryAdditionalMarkdown,
      changelog = true,
      runScriptsOnLockfileUpdate = false,
      syncDistVersion = false,
    } = this.options;
    const independentVersions = this.project.isIndependent();
    const rootPath = this.project.manifest.location;
    const changedFiles = new Set<string>();

    // preversion:  Run BEFORE bumping the package version.
    // version:     Run AFTER bumping the package version, but BEFORE commit.
    // postversion: Run AFTER bumping the package version, and AFTER commit.
    // @see https://docs.npmjs.com/misc/scripts

    if (!this.hasRootedLeaf) {
      // exec preversion lifecycle in root (before all updates)
      await this.runRootLifecycle("preversion");
    }

    const actions: ((pkg: ProjectGraphProjectNodeWithPackage) => Promise<unknown>)[] = [
      (node) => this.runPackageLifecycle(getPackage(node), "preversion").then(() => node),
      // manifest may be mutated by any previous lifecycle
      (node) =>
        getPackage(node)
          .refresh()
          .then(() => node),
      (node) => {
        const pkg = getPackage(node);
        // set new version
        pkg.version = this.updatesVersions.get(node.name);

        // update dependencies
        this.updateDependencies(node);

        return Promise.all([
          updateLockfileVersion(pkg),
          pkg.serialize(),
          pkg.syncDistVersion(syncDistVersion),
        ]).then(([lockfilePath]) => {
          // commit the updated manifest
          changedFiles.add(pkg.manifestLocation);

          if (lockfilePath) {
            changedFiles.add(lockfilePath);
          }

          return node;
        });
      },
      (node) => this.runPackageLifecycle(getPackage(node), "version").then(() => node),
    ];

    if (conventionalCommits && changelog) {
      // we can now generate the Changelog, based on the
      // the updated version that we're about to release.
      const type = independentVersions ? "independent" : "fixed";

      actions.push((node) =>
        updateChangelog(getPackage(node), type, {
          changelogPreset,
          changelogEntryAdditionalMarkdown,
          rootPath,
          tagPrefix: this.tagPrefix,
        }).then(({ logPath, newEntry }) => {
          // commit the updated changelog
          changedFiles.add(logPath);

          // add release notes
          if (independentVersions) {
            this.releaseNotes.push({
              name: getPackage(node).name,
              notes: newEntry,
            });
          }

          return node;
        })
      );
    }

    const mapUpdate = pPipe(...actions);

    await runProjectsTopologically(this.updates, this.projectGraph, mapUpdate, {
      concurrency: this.concurrency,
      rejectCycles: this.options.rejectCycles,
    });

    if (!independentVersions) {
      this.project.version = this.globalVersion;

      if (conventionalCommits && changelog) {
        const { logPath, newEntry } = await updateChangelog(this.project.manifest, "root", {
          changelogPreset,
          changelogEntryAdditionalMarkdown,
          rootPath,
          tagPrefix: this.tagPrefix,
          version: this.globalVersion,
        });

        // commit the updated changelog
        changedFiles.add(logPath);

        // add release notes
        this.releaseNotes.push({
          name: "fixed",
          notes: newEntry,
        });
      }

      const lernaConfigLocation = await Promise.resolve(this.project.serializeConfig());
      // commit the version update
      changedFiles.add(lernaConfigLocation);
    }

    const npmClientArgsRaw = this.options.npmClientArgs || [];
    const npmClientArgs = npmClientArgsRaw.reduce((args, arg) => args.concat(arg.split(/\s|,/)), []);

    if (!this.hasRootedLeaf) {
      // exec version lifecycle in root (after all updates)
      await this.runRootLifecycle("version");
    }

    if (this.options.npmClient === "pnpm") {
      this.logger.verbose("version", "Updating root pnpm-lock.yaml");
      await execPackageManager(
        "pnpm",
        [
          "install",
          "--lockfile-only",
          !runScriptsOnLockfileUpdate ? "--ignore-scripts" : "",
          ...npmClientArgs,
        ].filter(Boolean),
        this.execOpts
      );

      const lockfilePath = path.join(this.project.rootPath, "pnpm-lock.yaml");
      changedFiles.add(lockfilePath);
    }

    if (this.options.npmClient === "yarn") {
      const yarnVersion = execPackageManagerSync("yarn", ["--version"], this.execOpts);
      this.logger.verbose("version", `Detected yarn version ${yarnVersion}`);

      if (semver.gte(yarnVersion, "2.0.0")) {
        this.logger.verbose("version", "Updating root yarn.lock");
        await execPackageManager("yarn", ["install", "--mode", "update-lockfile", ...npmClientArgs], {
          ...this.execOpts,
          env: {
            ...process.env,
            YARN_ENABLE_SCRIPTS: "false",
          },
        });

        const lockfilePath = path.join(this.project.rootPath, "yarn.lock");
        changedFiles.add(lockfilePath);
      }
    }

    if (this.options.npmClient === "npm" || !this.options.npmClient) {
      const lockfilePath = path.join(this.project.rootPath, "package-lock.json");
      if (fs.existsSync(lockfilePath)) {
        this.logger.verbose("version", "Updating root package-lock.json");
        await childProcess.exec(
          "npm",
          [
            "install",
            "--package-lock-only",
            !runScriptsOnLockfileUpdate ? "--ignore-scripts" : "",
            ...npmClientArgs,
          ].filter(Boolean),
          this.execOpts
        );
        changedFiles.add(lockfilePath);
      }
    }

    if (this.commitAndTag) {
      await gitAdd(Array.from(changedFiles), this.gitOpts, this.execOpts);
    }
  }

  private updateDependencies(node: ProjectGraphProjectNodeWithPackage) {
    const dependencies = this.projectGraph.localPackageDependencies[node.name] || [];
    const pkg = getPackage(node);

    dependencies.forEach((dep) => {
      const depVersion = this.updatesVersions.get(dep.target);
      if (
        // only update if the dependency version is being changed
        depVersion &&
        // don't overwrite local file: specifiers, they only change during publish
        dep.targetResolvedNpaResult.type !== "directory"
      ) {
        pkg.updateLocalDependency(dep.targetResolvedNpaResult, depVersion, this.savePrefix);
      }
    });
  }

  async commitAndTagUpdates() {
    let tags: string[] = [];

    if (this.project.isIndependent()) {
      tags = await this.gitCommitAndTagVersionForUpdates();
    } else {
      tags = await this.gitCommitAndTagVersion();
    }

    this.tags = tags;

    // run the postversion script for each update
    await pMap(this.packagesToVersion, (pkg) => this.runPackageLifecycle(pkg, "postversion"));

    if (!this.hasRootedLeaf) {
      // run postversion, if set, in the root directory
      await this.runRootLifecycle("postversion");
    }
  }

  async gitCommitAndTagVersionForUpdates() {
    const tagVersionSeparator = this.options.tagVersionSeparator || "@";
    const tags = this.updates.map((node) => {
      const pkg = getPackage(node);
      return `${pkg.name}${tagVersionSeparator}${this.updatesVersions.get(node.name)}`;
    });
    const subject = this.options.message || "Publish";
    const message = tags.reduce((msg, tag) => `${msg}${os.EOL} - ${tag}`, `${subject}${os.EOL}`);

    if (await this.hasChanges()) {
      await gitCommit(message, this.gitOpts, this.execOpts);
    }
    if (this.gitOpts.signGitTag) {
      for (const tag of tags) await gitTag(tag, this.gitOpts, this.execOpts, this.options.gitTagCommand);
    } else {
      await Promise.all(
        tags.map((tag) => gitTag(tag, this.gitOpts, this.execOpts, this.options.gitTagCommand))
      );
    }

    return tags;
  }

  async gitCommitAndTagVersion() {
    const version = this.globalVersion;
    const tag = `${this.tagPrefix}${version}`;
    const message = this.options.message
      ? this.options.message.replace(/%s/g, tag).replace(/%v/g, version)
      : tag;

    if (await this.hasChanges()) {
      await gitCommit(message, this.gitOpts, this.execOpts);
    }

    await gitTag(tag, this.gitOpts, this.execOpts, this.options.gitTagCommand);

    return [tag];
  }

  gitPushToRemote() {
    this.logger.info("git", "Pushing tags...");

    return gitPush(this.gitRemote, this.currentBranch, this.execOpts);
  }

  private async hasChanges() {
    try {
      await execa("git", ["diff", "--staged", "--quiet"], {
        stdio: "pipe",
        ...this.execOpts,
        cwd: this.execOpts.cwd as string, // force it to a string
      });
    } catch (e) {
      // git diff exited with a non-zero exit code, so we assume changes were found
      return true;
    }
  }
}

module.exports.VersionCommand = VersionCommand;
