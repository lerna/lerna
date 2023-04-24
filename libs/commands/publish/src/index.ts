import {
  CommandConfigOptions,
  Conf,
  createRunner,
  describeRef,
  getOneTimePassword,
  logPacked,
  npmConf,
  npmDistTag,
  npmPublish,
  output,
  Package,
  packDirectory,
  prereleaseIdFromVersion,
  promptConfirmation,
  pulseTillDone,
  throwIfUncommitted,
  ValidationError,
} from "@lerna/core";

import { collectUpdates, Command, PackageGraphNode, runTopologically } from "@lerna/legacy-core";
import crypto from "crypto";
import fs from "fs";
import os from "os";
import pMap from "p-map";
import pPipe from "p-pipe";
import path from "path";
import semver, { ReleaseType } from "semver";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const versionCommand = require("@lerna/commands/version");

import { createTempLicenses } from "./lib/create-temp-licenses";
import { getCurrentSHA } from "./lib/get-current-sha";
import { getCurrentTags } from "./lib/get-current-tags";
import { getNpmUsername } from "./lib/get-npm-username";
import { getPackagesWithoutLicense } from "./lib/get-packages-without-license";
import { getTaggedPackages } from "./lib/get-tagged-packages";
import { getTwoFactorAuthRequired } from "./lib/get-two-factor-auth-required";
import { getUnpublishedPackages } from "./lib/get-unpublished-packages";
import { gitCheckout } from "./lib/git-checkout";
import { removeTempLicenses } from "./lib/remove-temp-licenses";
import { verifyNpmPackageAccess } from "./lib/verify-npm-package-access";

module.exports = function factory(argv: NodeJS.Process["argv"]) {
  return new PublishCommand(argv);
};

export interface PublishCommandConfigOptions extends CommandConfigOptions {
  bump?: string;
  exact?: boolean;
  gitHead?: string;
  gitReset?: boolean;
  tagVersionPrefix?: string;
  verifyAccess?: boolean;
  lernaVersion?: string;
  graphType?: "allDependencies" | "dependencies";
  includePrivate?: string[];
  skipNpm?: boolean;
  buildMetadata?: string;
  canary?: boolean;
  requireScripts?: boolean;
  legacyAuth?: string;
  otp?: string;
  registry?: string;
  ignorePrepublish?: boolean;
  ignoreScripts?: boolean;
  preid?: string;
  ignoreChanges?: string[];
  forcePublish?: boolean | string | string[];
  includeMergedTags?: boolean;
  contents?: string;
  tempTag?: string;
  summaryFile?: string;
  yes?: boolean;
  granularPathspec?: boolean;
  rejectCycles?: boolean;
  distTag?: string;
  preDistTag?: string;
}

class PublishCommand extends Command {
  options: PublishCommandConfigOptions;

  savePrefix?: string;
  tagPrefix?: string;
  gitReset?: boolean;
  npmSession?: string;
  verifyAccess?: boolean;
  conf?: Conf;
  otpCache?: { otp: string };
  hasRootedLeaf?: boolean;
  runPackageLifecycle?: (pkg: unknown, script: string) => Promise<void>;
  runRootLifecycle?: (script: string) => Promise<void> | void;
  updates?: PackageGraphNode[];
  updatesVersions?: Map<string, string>;
  packagesToPublish?: Package[];
  publishedPackages?: Package[];
  privatePackagesToPublish?: Package[];
  packagesToBeLicensed?: Package[];
  twoFactorAuthRequired?: boolean;

  get otherCommandConfigs() {
    // back-compat
    return ["version"];
  }

  get requiresGit() {
    // `lerna publish from-package` doesn't _need_ git, per se
    return this.options.bump !== "from-package";
  }

  configureProperties() {
    super.configureProperties();

    // For publish we want to enable topological sorting by default, but allow users to override with --no-sort
    this.toposort = this.options.sort !== false;

    // Defaults are necessary here because yargs defaults
    // override durable options provided by a config file
    const {
      // prettier-ignore
      exact,
      gitHead,
      gitReset,
      tagVersionPrefix = "v",
      verifyAccess,
    } = this.options;

    if (this.requiresGit && gitHead) {
      throw new ValidationError("EGITHEAD", "--git-head is only allowed with 'from-package' positional");
    }

    // https://docs.npmjs.com/misc/config#save-prefix
    this.savePrefix = exact ? "" : "^";

    // https://docs.npmjs.com/misc/config#tag-version-prefix
    this.tagPrefix = tagVersionPrefix;
    // TODO: properly inherit from npm-conf

    // inverted boolean options are only respected if prefixed with `--no-`, e.g. `--no-verify-access`
    this.gitReset = gitReset !== false;

    // consumed by npm-registry-fetch (via libnpmpublish)
    this.npmSession = crypto.randomBytes(8).toString("hex");

    this.verifyAccess = verifyAccess;
  }

  get userAgent() {
    // consumed by npm-registry-fetch (via libnpmpublish)
    return `lerna/${this.options.lernaVersion}/node@${process.version}+${process.arch} (${process.platform})`;
  }

  async initialize() {
    if (this.options.verifyAccess === false) {
      this.logger.warn(
        "verify-access",
        "--verify-access=false and --no-verify-access are no longer needed, because the legacy preemptive access verification is now disabled by default. Requests will fail with appropriate errors when not authorized correctly."
      );
    }

    if (this.options.graphType === "dependencies") {
      this.logger.warn(
        "graph-type",
        "--graph-type=dependencies is deprecated and will be removed in lerna v6. If you have a use-case you feel requires it please open an issue to discuss: https://github.com/lerna/lerna/issues/new/choose"
      );
    }

    if (this.options.includePrivate) {
      if (this.options.includePrivate.length === 0) {
        throw new ValidationError(
          "EINCLPRIV",
          "Must specify at least one private package to include with --include-private."
        );
      }
      this.logger.info("publish", `Including private packages %j`, this.options.includePrivate);
    }

    if (this.options.skipNpm) {
      // TODO: remove in next major release
      this.logger.warn("deprecated", "Instead of --skip-npm, call `lerna version` directly");

      return versionCommand(this.argv).then(() => false);
    }

    if (this.options.buildMetadata && this.options.canary) {
      throw new ValidationError(
        "ENOTSATISFIED",
        "Cannot use --build-metadata in conjunction with --canary option."
      );
    } else if (this.options.canary) {
      this.logger.info("canary", "enabled");
    }

    if (this.options.requireScripts) {
      this.logger.info("require-scripts", "enabled");
    }

    // npmSession and user-agent are consumed by npm-registry-fetch (via libnpmpublish)
    this.logger.verbose("session", this.npmSession);
    this.logger.verbose("user-agent", this.userAgent);

    this.conf = npmConf({
      lernaCommand: "publish",
      _auth: this.options.legacyAuth,
      npmSession: this.npmSession,
      npmVersion: this.userAgent,
      otp: this.options.otp,
      registry: this.options.registry,
      "ignore-prepublish": this.options.ignorePrepublish,
      "ignore-scripts": this.options.ignoreScripts,
    });

    // cache to hold a one-time-password across publishes
    this.otpCache = { otp: this.conf.get("otp") };

    this.conf.set("user-agent", this.userAgent, "cli");

    if (this.conf.get("registry") === "https://registry.yarnpkg.com") {
      this.logger.warn("", "Yarn's registry proxy is broken, replacing with public npm registry");
      this.logger.warn("", "If you don't have an npm token, you should exit and run `npm login`");

      this.conf.set("registry", "https://registry.npmjs.org/", "cli");
    }

    // inject --dist-tag into opts, if present
    const distTag = this.getDistTag();

    if (distTag) {
      this.conf.set("tag", distTag.trim(), "cli");
    }

    // a "rooted leaf" is the regrettable pattern of adding "." to the "packages" config in lerna.json
    this.hasRootedLeaf = this.packageGraph.has(this.project.manifest.name);

    if (this.hasRootedLeaf) {
      this.logger.info("publish", "rooted leaf detected, skipping synthetic root lifecycles");
    }

    this.runPackageLifecycle = createRunner(this.options);

    // don't execute recursively if run from a poorly-named script
    this.runRootLifecycle = /^(pre|post)?publish$/.test(process.env.npm_lifecycle_event)
      ? (stage) => {
          this.logger.warn("lifecycle", "Skipping root %j because it has already been called", stage);
        }
      : (stage) => this.runPackageLifecycle(this.project.manifest, stage);

    let result: {
      updates?: PackageGraphNode[];
      updatesVersions?: [string, string][];
      needsConfirmation: boolean;
    };
    if (this.options.bump === "from-git") {
      result = await this.detectFromGit();
    } else if (this.options.bump === "from-package") {
      result = await this.detectFromPackage();
    } else if (this.options.canary) {
      result = await this.detectCanaryVersions();
    } else {
      result = await versionCommand(this.argv);
    }

    if (!result) {
      // early return from nested VersionCommand
      return false;
    }

    if (!result.updates.length) {
      this.logger.success("No changed packages to publish");

      // still exits zero, aka "ok"
      return false;
    }

    // (occasionally) redundant private filtering necessary to handle nested VersionCommand
    this.updates = this.filterPrivatePkgUpdates(result.updates);
    this.updatesVersions = new Map(result.updatesVersions);

    this.packagesToPublish = this.updates.map((node) => node.pkg);

    if (this.options.contents) {
      // globally override directory to publish
      for (const pkg of this.packagesToPublish) {
        pkg.contents = this.options.contents;
      }
    }

    if (result.needsConfirmation) {
      // only confirm for --canary, bump === "from-git",
      // or bump === "from-package", as VersionCommand
      // has its own confirmation prompt
      return this.confirmPublish();
    }

    return true;
  }

  async execute() {
    this.enableProgressBar();
    this.logger.info("publish", "Publishing packages to npm...");

    await this.prepareRegistryActions();
    await this.prepareLicenseActions();
    this.preparePrivatePackages();

    if (this.options.canary) {
      await this.updateCanaryVersions();
    }

    await this.resolveLocalDependencyLinks();
    await this.resolveWorkspaceDependencyLinks();
    this.annotateGitHead();
    await this.serializeChanges();
    await this.packUpdated();
    await this.publishPacked();

    // restore private: true to published private packages
    this.restorePrivatePackages();
    await this.serializeChanges();

    if (this.gitReset) {
      await this.resetChanges();
    }

    if (this.options.tempTag) {
      await this.npmUpdateAsLatest();
    }

    const count = this.publishedPackages.length;
    const publishedPackagesSorted = this.publishedPackages.sort((a, b) => a.name.localeCompare(b.name));

    if (!count) {
      this.logger.success("All packages have already been published.");
      return;
    }

    output("Successfully published:");

    if (this.options.summaryFile !== undefined) {
      // create a json object and output it to a file location.
      const filePath = this.options.summaryFile
        ? `${this.options.summaryFile}/lerna-publish-summary.json`
        : "./lerna-publish-summary.json";
      const jsonObject = publishedPackagesSorted.map((pkg) => {
        return {
          packageName: pkg.name,
          version: pkg.version,
        };
      });
      output(jsonObject);
      try {
        fs.writeFileSync(filePath, JSON.stringify(jsonObject));
        output("Publish summary created: ", filePath);
      } catch (error) {
        output("Failed to create the summary report", error);
      }
    } else {
      const message = publishedPackagesSorted.map((pkg) => ` - ${pkg.name}@${pkg.version}`);
      output(message.join(os.EOL));
    }

    this.logger.success("published", "%d %s", count, count === 1 ? "package" : "packages");
  }

  private verifyWorkingTreeClean() {
    return describeRef(this.execOpts).then(throwIfUncommitted);
  }

  private async detectFromGit() {
    const matchingPattern = this.project.isIndependent() ? "*@*" : `${this.tagPrefix}*.*.*`;

    // attempting to publish a tagged release with local changes is not allowed
    try {
      await this.verifyWorkingTreeClean();
    } catch (err) {
      // an execa error is thrown when git suffers a fatal error (such as no git repository present)
      if (err.failed && /git describe/.test(err.command)) {
        // (we tried)
        this.logger.silly("EWORKINGTREE", err.message);
        this.logger.notice("FYI", "Unable to verify working tree, proceed at your own risk");
      } else {
        // validation errors should be preserved
        throw err;
      }
    }

    const taggedPackageNames = await getCurrentTags(this.execOpts, matchingPattern);

    let updates: PackageGraphNode[];
    if (!taggedPackageNames.length) {
      this.logger.notice("from-git", "No tagged release found");

      updates = [];
    } else if (this.project.isIndependent()) {
      updates = taggedPackageNames.map((name) => this.packageGraph.get(name));
    } else {
      updates = await getTaggedPackages(this.packageGraph, this.project.rootPath, this.execOpts);
    }

    updates = this.filterPrivatePkgUpdates(updates);

    const updatesVersions: [string, string][] = updates.map((node) => [node.name, node.version]);

    return {
      updates,
      updatesVersions,
      needsConfirmation: true,
    };
  }

  private async detectFromPackage() {
    // attempting to publish a release with local changes is not allowed
    try {
      await this.verifyWorkingTreeClean();
    } catch (err) {
      // an execa error is thrown when git suffers a fatal error (such as no git repository present)
      if (err.failed && /git describe/.test(err.command)) {
        // (we tried)
        this.logger.silly("EWORKINGTREE", err.message);
        this.logger.notice("FYI", "Unable to verify working tree, proceed at your own risk");
        process.exitCode = 0;
      } else {
        // validation errors should be preserved
        throw err;
      }
    }

    let updates: PackageGraphNode[];
    updates = await getUnpublishedPackages(this.packageGraph, this.conf.snapshot);
    updates = this.filterPrivatePkgUpdates(updates);
    if (!updates.length) {
      this.logger.notice("from-package", "No unpublished release found");
    }

    const updatesVersions: [string, string][] = updates.map((node) => [node.name, node.version]);

    return {
      updates,
      updatesVersions,
      needsConfirmation: true,
    };
  }

  private async detectCanaryVersions() {
    const { cwd } = this.execOpts;
    const {
      bump = "prepatch",
      preid = "alpha",
      ignoreChanges,
      forcePublish,
      includeMergedTags,
    } = this.options;
    // "prerelease" and "prepatch" are identical, for our purposes
    const release = bump.startsWith("pre") ? bump.replace("release", "patch") : `pre${bump}`;

    // attempting to publish a canary release with local changes is not allowed
    try {
      await this.verifyWorkingTreeClean();
    } catch (err) {
      // an execa error is thrown when git suffers a fatal error (such as no git repository present)
      if (err.failed && /git describe/.test(err.command)) {
        // (we tried)
        this.logger.silly("EWORKINGTREE", err.message);
        this.logger.notice("FYI", "Unable to verify working tree, proceed at your own risk");
      } else {
        // validation errors should be preserved
        throw err;
      }
    }

    // find changed packages since last release, if any
    const updates: PackageGraphNode[] = await this.filterPrivatePkgUpdates(
      collectUpdates(this.packageGraph.rawPackageList, this.packageGraph, this.execOpts, {
        bump: "prerelease",
        canary: true,
        ignoreChanges,
        forcePublish,
        includeMergedTags,
      })
    );

    const makeVersion =
      (fallback: string) =>
      ({ lastVersion = fallback, refCount, sha }) => {
        // the next version is bumped without concern for preid or current index
        const nextVersion = semver.inc(
          lastVersion.replace(this.tagPrefix, ""),
          release.replace("pre", "") as ReleaseType
        );

        // semver.inc() starts a new prerelease at .0, git describe starts at .1
        // and build metadata is always ignored when comparing dependency ranges
        return `${nextVersion}-${preid}.${Math.max(0, refCount - 1)}+${sha}`;
      };

    let updatesVersions: [string, string][];
    if (this.project.isIndependent()) {
      // each package is described against its tags only
      updatesVersions = await pMap(updates, (node) =>
        describeRef(
          {
            match: `${node.name}@*`,
            cwd,
          },
          includeMergedTags
        )
          // an unpublished package will have no reachable git tag
          .then(makeVersion(node.version))
          .then((version) => [node.name, version])
      );
    } else {
      // all packages are described against the last tag
      updatesVersions = await describeRef(
        {
          match: `${this.tagPrefix}*.*.*`,
          cwd,
        },
        includeMergedTags
      )
        // a repo with no tags should default to whatever lerna.json claims
        .then(makeVersion(this.project.version))
        .then((version) => updates.map((node) => [node.name, version]));
    }

    return {
      updates,
      updatesVersions,
      needsConfirmation: true,
    };
  }

  private confirmPublish() {
    const count = this.packagesToPublish.length;
    const message = this.packagesToPublish.map(
      (pkg) => ` - ${pkg.name} => ${this.updatesVersions.get(pkg.name)}${pkg.private ? " (private!)" : ""}`
    );

    output("");
    output(`Found ${count} ${count === 1 ? "package" : "packages"} to publish:`);
    output(message.join(os.EOL));
    output("");

    if (this.options.yes) {
      this.logger.info("auto-confirmed", "");
      return true;
    }

    return promptConfirmation("Are you sure you want to publish these packages?");
  }

  private preparePrivatePackages() {
    this.privatePackagesToPublish = [];
    this.packagesToPublish.forEach((pkg) => {
      if (pkg.private) {
        pkg.removePrivate();
        this.privatePackagesToPublish.push(pkg);
      }
    });
  }

  private restorePrivatePackages() {
    this.privatePackagesToPublish.forEach((pkg) => {
      pkg.private = true;
    });
  }

  private async prepareLicenseActions() {
    const packagesWithoutLicense = await getPackagesWithoutLicense(this.project, this.packagesToPublish);

    if (packagesWithoutLicense.length && !this.project.licensePath) {
      this.packagesToBeLicensed = [];

      const names = packagesWithoutLicense.map((pkg) => pkg.name);
      const noun = names.length > 1 ? "Packages" : "Package";
      const verb = names.length > 1 ? "are" : "is";
      const list =
        names.length > 1
          ? `${names.slice(0, -1).join(", ")}${names.length > 2 ? "," : ""} and ${
              names[names.length - 1] /* oxford commas _are_ that important */
            }`
          : names[0];

      this.logger.warn(
        "ENOLICENSE",
        "%s %s %s missing a license.\n%s\n%s",
        noun,
        list,
        verb,
        "One way to fix this is to add a LICENSE.md file to the root of this repository.",
        "See https://choosealicense.com for additional guidance."
      );
    } else {
      this.packagesToBeLicensed = packagesWithoutLicense;
    }
  }

  private async prepareRegistryActions() {
    if (this.conf.get("registry") !== "https://registry.npmjs.org/") {
      this.logger.notice("", "Skipping all user and access validation due to third-party registry");
      this.logger.notice("", "Make sure you're authenticated properly ¯\\_(ツ)_/¯");

      return;
    }

    /* istanbul ignore if */
    if (process.env.LERNA_INTEGRATION) {
      return;
    }

    if (this.verifyAccess) {
      // validate user has valid npm credentials first,
      // by far the most common form of failed execution
      const username = await getNpmUsername(this.conf.snapshot);
      // if no username was retrieved, don't bother validating
      if (username) {
        await verifyNpmPackageAccess(this.packagesToPublish, username, this.conf.snapshot);
      }
    }

    // read profile metadata to determine if account-level 2FA is enabled
    // notably, this still doesn't handle package-level 2FA requirements
    this.twoFactorAuthRequired = await getTwoFactorAuthRequired(this.conf.snapshot);
  }

  private async updateCanaryVersions() {
    await pMap(this.updates, (node) => {
      node.pkg.set("version", this.updatesVersions.get(node.name));

      for (const [depName, resolved] of node.localDependencies) {
        // other canary versions need to be updated, non-canary is a no-op
        const depVersion = this.updatesVersions.get(depName) || this.packageGraph.get(depName).pkg.version;

        // it no longer matters if we mutate the shared Package instance
        node.pkg.updateLocalDependency(resolved, depVersion, this.savePrefix);
      }

      // writing changes to disk handled in serializeChanges()
    });
  }

  private async resolveLocalDependencyLinks() {
    // resolve relative file: links to their actual version range
    const updatesWithLocalLinks = this.updates.filter((node) =>
      Array.from(node.localDependencies.values()).some((resolved) => resolved.type === "directory")
    );

    await pMap(updatesWithLocalLinks, (node) => {
      for (const [depName, resolved] of node.localDependencies) {
        // regardless of where the version comes from, we can't publish "file:../sibling-pkg" specs
        const depVersion = this.updatesVersions.get(depName) || this.packageGraph.get(depName).pkg.version;

        // it no longer matters if we mutate the shared Package instance
        node.pkg.updateLocalDependency(resolved, depVersion, this.savePrefix);
      }

      // writing changes to disk handled in serializeChanges()
    });
  }

  private async resolveWorkspaceDependencyLinks() {
    // resolve relative workspace: links to their actual version range
    const updatesWithWorkspaceLinks = this.updates.filter((node) =>
      Array.from(node.localDependencies.values()).some((resolved) => !!resolved.workspaceSpec)
    );

    await pMap(updatesWithWorkspaceLinks, (node) => {
      for (const [depName, resolved] of node.localDependencies) {
        // only update local dependencies with workspace: links
        if (resolved.workspaceSpec) {
          let depVersion: string;
          let savePrefix: string;
          if (resolved.workspaceAlias) {
            depVersion = this.updatesVersions.get(depName) || this.packageGraph.get(depName).pkg.version;
            savePrefix = resolved.workspaceAlias === "*" ? "" : resolved.workspaceAlias;
          } else {
            const specMatch = resolved.workspaceSpec.match(/^workspace:([~^]?)(.*)/);
            savePrefix = specMatch[1];
            depVersion = this.updatesVersions.get(depName) || this.packageGraph.get(depName).pkg.version;
          }

          // it no longer matters if we mutate the shared Package instance
          node.pkg.updateLocalDependency(resolved, depVersion, savePrefix, { retainWorkspacePrefix: false });
        }
      }

      // writing changes to disk handled in serializeChanges()
    });
  }

  private annotateGitHead() {
    try {
      const gitHead = this.options.gitHead || getCurrentSHA(this.execOpts);

      for (const pkg of this.packagesToPublish) {
        // provide gitHead property that is normally added during npm publish
        pkg.set("gitHead", gitHead);
      }
    } catch (err) {
      // from-package should be _able_ to run without git, but at least we tried
      this.logger.silly("EGITHEAD", err.message);
      this.logger.notice(
        "FYI",
        "Unable to set temporary gitHead property, it will be missing from registry metadata"
      );
    }

    // writing changes to disk handled in serializeChanges()
  }

  private async serializeChanges() {
    await pMap(this.packagesToPublish, (pkg) => pkg.serialize());
  }

  private async resetChanges() {
    // the package.json files are changed (by gitHead if not --canary)
    // and we should always __attempt_ to leave the working tree clean
    const { cwd } = this.execOpts;
    const gitOpts = {
      granularPathspec: this.options.granularPathspec !== false,
    };
    const dirtyManifests = [this.project.manifest]
      .concat(this.packagesToPublish)
      .map((pkg) => path.relative(cwd, pkg.manifestLocation));

    await gitCheckout(dirtyManifests, gitOpts, this.execOpts).catch((err) => {
      this.logger.silly("EGITCHECKOUT", err.message);
      this.logger.notice("FYI", "Unable to reset working tree changes, this probably isn't a git repo.");
    });
  }

  private execScript(pkg: Package, script: string) {
    const scriptLocation = path.join(pkg.location, "scripts", script);

    try {
      // eslint-disable-next-line import/no-dynamic-require, global-require
      require(scriptLocation);
    } catch (ex) {
      this.logger.silly("execScript", `No ${script} script found at ${scriptLocation}`);
    }

    return pkg;
  }

  private async removeTempLicensesOnError() {
    await removeTempLicenses(this.packagesToBeLicensed).catch((removeError) => {
      this.logger.error(
        "licenses",
        "error removing temporary license files",
        removeError.stack || removeError
      );
    });
  }

  private async requestOneTimePassword() {
    // if OTP has already been provided, skip prompt
    if (this.otpCache.otp) {
      return;
    }

    const otp = await getOneTimePassword("Enter OTP:");
    this.otpCache.otp = otp;
  }

  topoMapPackages(mapper: (pkg: Package) => Promise<unknown>) {
    return runTopologically(this.packagesToPublish, mapper, {
      concurrency: this.concurrency,
      rejectCycles: this.options.rejectCycles,
      /**
       * Previously `publish` had unique default behavior for graph creation vs other commands: it would only consider dependencies when finding
       * edges by default (i.e. relationships between packages specified via devDependencies would be ignored). It was documented to be the case
       * in order to try and reduce the chance of dependency cycles.
       *
       * We are removing this behavior altogether in v6 because we do not want to have different ways of constructing the graph,
       * only different ways of utilizing it (e.g. --no-sort vs topological sort).
       *
       * Therefore until we remove graphType altogether in v6, we provide a way for users to opt into the old default behavior
       * by setting the `graphType` option to `dependencies`.
       */
      graphType: this.options.graphType === "dependencies" ? "dependencies" : "allDependencies",
    });
  }

  private async packUpdated() {
    const tracker = this.logger.newItem("npm pack");

    tracker.addWork(this.packagesToPublish.length);

    try {
      await createTempLicenses(this.project.licensePath, this.packagesToBeLicensed);

      if (!this.hasRootedLeaf) {
        // despite being deprecated for years...
        await this.runRootLifecycle("prepublish");

        // these lifecycles _should_ never be employed to run `lerna publish`...
        await this.runPackageLifecycle(this.project.manifest, "prepare");
        await this.runPackageLifecycle(this.project.manifest, "prepublishOnly");
        await this.runPackageLifecycle(this.project.manifest, "prepack");
      }

      const opts = this.conf.snapshot;
      const mapper = pPipe(
        ...[
          this.options.requireScripts && ((pkg: Package) => this.execScript(pkg, "prepublish")),

          (pkg: Package) =>
            pulseTillDone(packDirectory(pkg, pkg.location, opts)).then((packed) => {
              tracker.verbose("packed", path.relative(this.project.rootPath, pkg.contents));
              tracker.completeWork(1);

              // store metadata for use in this.publishPacked()
              pkg.packed = packed;

              // manifest may be mutated by any previous lifecycle
              return pkg.refresh();
            }),
        ].filter(Boolean)
      );

      if (this.toposort) {
        await this.topoMapPackages(mapper);
      }
      await pMap(this.packagesToPublish, mapper, { concurrency: this.concurrency });

      await removeTempLicenses(this.packagesToBeLicensed);
    } catch (err) {
      // remove temporary license files if _any_ error occurs _anywhere_
      this.removeTempLicensesOnError();
      throw err;
    }

    if (!this.hasRootedLeaf) {
      await this.runPackageLifecycle(this.project.manifest, "postpack");
    }

    tracker.finish();
  }

  private async publishPacked() {
    this.publishedPackages = [];

    const tracker = this.logger.newItem("publish");

    tracker.addWork(this.packagesToPublish.length);

    // if account-level 2FA is enabled, prime the OTP cache
    if (this.twoFactorAuthRequired) {
      await this.requestOneTimePassword();
    }

    const opts = Object.assign(this.conf.snapshot, {
      // distTag defaults to "latest" OR whatever is in pkg.publishConfig.tag
      // if we skip temp tags we should tag with the proper value immediately
      tag: this.options.tempTag ? "lerna-temp" : this.conf.get("tag"),
    });

    const mapper = pPipe(
      ...[
        (pkg: Package) => {
          const preDistTag = this.getPreDistTag(pkg);
          const tag = !this.options.tempTag && preDistTag ? preDistTag : opts.tag;
          const pkgOpts = Object.assign({}, opts, { tag });

          return pulseTillDone(npmPublish(pkg, pkg.packed.tarFilePath, pkgOpts, this.otpCache))
            .then(() => {
              this.publishedPackages.push(pkg);

              tracker.success("published", pkg.name, pkg.version);
              tracker.completeWork(1);

              logPacked(pkg.packed);

              return pkg;
            })
            .catch((err) => {
              if (err.code === "EPUBLISHCONFLICT") {
                tracker.warn("publish", `Package is already published: ${pkg.name}@${pkg.version}`);
                tracker.completeWork(1);

                return pkg;
              }

              this.logger.silly("", err);
              this.logger.error(err.code, (err.body && err.body.error) || err.message);

              // avoid dumping logs, this isn't a lerna problem
              err.name = "ValidationError";
              // ensure process exits non-zero
              process.exitCode = "errno" in err ? err.errno : 1;

              throw err;
            });
        },

        this.options.requireScripts && ((pkg) => this.execScript(pkg, "postpublish")),
      ].filter(Boolean)
    );

    if (this.toposort) {
      await this.topoMapPackages(mapper);
    }
    await pMap(this.packagesToPublish, mapper, { concurrency: this.concurrency });

    if (!this.hasRootedLeaf) {
      // cyclical "publish" lifecycles are automatically skipped
      await this.runRootLifecycle("publish");
      await this.runRootLifecycle("postpublish");
    }

    tracker.finish();
  }

  private async npmUpdateAsLatest() {
    const tracker = this.logger.newItem("npmUpdateAsLatest");

    tracker.addWork(this.packagesToPublish.length);
    tracker.showProgress();

    const opts = this.conf.snapshot;
    const getDistTag = (publishConfig) => {
      if (opts.tag === "latest" && publishConfig && publishConfig.tag) {
        return publishConfig.tag;
      }

      return opts.tag;
    };
    const mapper = (pkg: Package) => {
      const spec = `${pkg.name}@${pkg.version}`;
      const preDistTag = this.getPreDistTag(pkg);
      const distTag = preDistTag || getDistTag(pkg.get("publishConfig"));

      return Promise.resolve()
        .then(() => pulseTillDone(npmDistTag.remove(spec, "lerna-temp", opts, this.otpCache)))
        .then(() => pulseTillDone(npmDistTag.add(spec, distTag, opts, this.otpCache)))
        .then(() => {
          tracker.success("dist-tag", "%s@%s => %j", pkg.name, pkg.version, distTag);
          tracker.completeWork(1);

          return pkg;
        });
    };

    if (this.toposort) {
      await this.topoMapPackages(mapper);
    }
    await pMap(this.packagesToPublish, mapper, { concurrency: this.concurrency });

    tracker.finish();
  }

  private getDistTag(): string | undefined {
    if (this.options.distTag) {
      return this.options.distTag;
    }

    if (this.options.canary) {
      return "canary";
    }

    // undefined defaults to "latest" OR whatever is in pkg.publishConfig.tag
    return undefined;
  }

  private getPreDistTag(pkg: Package): string | undefined {
    if (!this.options.preDistTag) {
      return;
    }
    const isPrerelease = prereleaseIdFromVersion(pkg.version);
    if (isPrerelease) {
      return this.options.preDistTag;
    }
  }

  // filter out private packages, respecting the --include-private option
  private filterPrivatePkgUpdates(updates: PackageGraphNode[]) {
    const privatePackagesToInclude = new Set(this.options.includePrivate || []);
    return updates.filter(
      (node) =>
        !node.pkg.private || privatePackagesToInclude.has("*") || privatePackagesToInclude.has(node.pkg.name)
    );
  }
}

module.exports.PublishCommand = PublishCommand;
