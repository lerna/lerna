import { workspaceRoot } from "@nx/devkit";
import fs from "fs";
import loadJsonFile from "load-json-file";
import npa from "npm-package-arg";
import path from "path";
import writePkg from "write-pkg";
import { Packed } from "./pack-directory";

// symbol used to "hide" internal state
const PKG = Symbol("pkg");

/* eslint-disable no-underscore-dangle */

// private fields
const _location = Symbol("location");
const _resolved = Symbol("resolved");
const _rootPath = Symbol("rootPath");
const _scripts = Symbol("scripts");
const _contents = Symbol("contents");

function binSafeName({ name, scope }: npa.Result) {
  // TODO: figure out if name not being set is actually possible, as suggested by the types
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return scope ? name.substring(scope.length + 1) : name;
}

// package.json files are not that complicated, so this is intentionally naïve
function shallowCopy(json: any) {
  return Object.keys(json).reduce((obj: any, key) => {
    const val = json[key];

    /* istanbul ignore if */
    if (Array.isArray(val)) {
      obj[key] = val.slice();
    } else if (val && typeof val === "object") {
      obj[key] = Object.assign({}, val);
    } else {
      obj[key] = val;
    }

    return obj;
  }, {});
}

export type AssetDefinition = string | { from: string; to: string };

// Only a small subset of lerna configuration can be specified on a package's own package.json
export interface RawManifestLernaConfig {
  command?: {
    publish?: {
      directory?: string;
      assets?: AssetDefinition[];
    };
  };
}

export interface RawManifest {
  name: string;
  version: string;
  description?: string;
  private?: boolean;
  bin?: Record<string, string> | string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  publishConfig?: Record<"directory" | "registry" | "tag", string>;
  workspaces?: string[];
  nx?: Record<string, unknown>;
  gitHead?: string;
  lerna?: RawManifestLernaConfig;
}

export type ExtendedNpaResult = npa.Result & {
  workspaceSpec?: string;
  workspaceAlias?: "*" | "^" | "~";
};

/**
 * Lerna's internal representation of a local package, with
 * many values resolved directly from the original JSON.
 */
export class Package {
  name: string;
  [PKG]: RawManifest;
  [_location]: string;
  [_resolved]: npa.Result;
  [_rootPath]: string;
  [_scripts]: Record<string, string>;
  [_contents]: string | undefined;
  licensePath?: string;
  packed?: Packed;

  /**
   * Create a Package instance from parameters, possibly reusing existing instance.
   * @param ref A path to a package.json file, Package instance, or JSON object
   * @param [dir] If `ref` is a JSON object, this is the location of the manifest
   */
  static lazy(ref: string | Package | RawManifest, dir = "."): Package {
    if (typeof ref === "string") {
      const location = path.resolve(path.basename(ref) === "package.json" ? path.dirname(ref) : ref);
      const manifest = loadJsonFile.sync<RawManifest>(path.join(location, "package.json"));

      return new Package(manifest, location);
    }

    // don't use instanceof because it fails across nested module boundaries
    if ("__isLernaPackage" in ref) {
      return ref;
    }

    // assume ref is a json object
    return new Package(ref, dir);
  }

  constructor(pkg: RawManifest, location: string, rootPath: string = location) {
    // npa will throw an error if the name is invalid
    const resolved = npa.resolve(pkg.name, `file:${path.relative(rootPath, location)}`, rootPath);

    this.name = pkg.name;
    this[PKG] = pkg;

    // omit raw pkg from default util.inspect() output, but preserve internal mutability
    Object.defineProperty(this, PKG, { enumerable: false, writable: true });

    this[_location] = location;
    this[_resolved] = resolved;
    this[_rootPath] = rootPath;
    this[_scripts] = { ...pkg.scripts };
  }

  // readonly getters
  get location() {
    return this[_location];
  }

  get private() {
    return Boolean(this[PKG].private);
  }

  set private(isPrivate) {
    this[PKG].private = isPrivate;
  }

  get resolved() {
    return this[_resolved];
  }

  get rootPath() {
    return this[_rootPath];
  }

  get scripts() {
    return this[_scripts];
  }

  get lernaConfig(): RawManifestLernaConfig | undefined {
    return this[PKG].lerna;
  }

  set lernaConfig(config: RawManifestLernaConfig | undefined) {
    this[PKG].lerna = config;
  }

  get bin() {
    const pkg = this[PKG];
    return typeof pkg.bin === "string"
      ? {
        // See note on function implementation
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        [binSafeName(this.resolved)]: pkg.bin,
      }
      : Object.assign({}, pkg.bin);
  }

  get binLocation() {
    return path.join(this.location, "node_modules", ".bin");
  }

  get manifestLocation() {
    return path.join(this.location, "package.json");
  }

  get nodeModulesLocation() {
    return path.join(this.location, "node_modules");
  }

  // eslint-disable-next-line class-methods-use-this
  get __isLernaPackage() {
    // safer than instanceof across module boundaries
    return true;
  }

  // accessors
  get version() {
    return this[PKG].version;
  }

  set version(version) {
    this[PKG].version = version;
  }

  get contents(): string {
    // if modified with setter, use that value
    if (this[_contents]) {
      return this[_contents] as string;
    }

    // if provided by pkg.publishConfig.directory value
    const publishConfig = this[PKG].publishConfig;
    if (publishConfig && publishConfig.directory) {
      return path.join(this.location, publishConfig.directory);
    }

    // default to package root
    return this.location;
  }

  set contents(subDirectory: string) {
    // If absolute path starting with workspace root, set it directly, otherwise join with package location (historical behavior)
    const _workspaceRoot = process.env["NX_WORKSPACE_ROOT_PATH"] || workspaceRoot;
    if (subDirectory.startsWith(_workspaceRoot)) {
      this[_contents] = subDirectory;
      return;
    }
    this[_contents] = path.join(this.location, subDirectory);
  }

  // "live" collections
  get dependencies() {
    return this[PKG].dependencies;
  }

  get devDependencies() {
    return this[PKG].devDependencies;
  }

  get optionalDependencies() {
    return this[PKG].optionalDependencies;
  }

  get peerDependencies() {
    return this[PKG].peerDependencies;
  }

  /**
   * Map-like retrieval of arbitrary values
   */
  get(key: keyof RawManifest) {
    return this[PKG][key];
  }

  /**
   * Map-like storage of arbitrary values
   */
  set(key: keyof RawManifest, val: RawManifest[keyof RawManifest]): Package {
    (this[PKG] as any)[key] = val;

    return this;
  }

  /**
   * Provide shallow copy for munging elsewhere
   */
  toJSON() {
    return shallowCopy(this[PKG]);
  }

  /**
   * Refresh internal state from disk (e.g., changed by external lifecycles)
   */
  refresh() {
    return loadJsonFile<RawManifest>(this.manifestLocation).then((pkg) => {
      this[PKG] = pkg;

      return this;
    });
  }

  /**
   * Write manifest changes to disk
   * @returns {Promise} resolves when write finished
   */
  serialize() {
    return writePkg(this.manifestLocation, this[PKG] as any).then(() => this);
  }

  /**
   * Sync dist manifest version
   */
  async syncDistVersion(doSync: boolean) {
    if (doSync) {
      const distPkg = path.join(this.contents, "package.json");

      if (distPkg !== this.manifestLocation && fs.existsSync(distPkg)) {
        const pkg = await loadJsonFile<RawManifest>(distPkg);
        pkg.version = this[PKG].version;
        await writePkg(distPkg, pkg as any);
      }
    }

    return this;
  }

  getLocalDependency(depName: string): {
    collection: "dependencies" | "devDependencies" | "optionalDependencies" | "peerDependencies";
    spec: string;
  } | null {
    if (this.dependencies && this.dependencies[depName]) {
      return {
        collection: "dependencies",
        spec: this.dependencies[depName],
      };
    }
    if (this.devDependencies && this.devDependencies[depName]) {
      return {
        collection: "devDependencies",
        spec: this.devDependencies[depName],
      };
    }
    if (this.optionalDependencies && this.optionalDependencies[depName]) {
      return {
        collection: "optionalDependencies",
        spec: this.optionalDependencies[depName],
      };
    }
    if (this.peerDependencies && this.peerDependencies[depName]) {
      const spec = this.peerDependencies[depName];
      const collection = "peerDependencies";
      const WORKSPACE_PROTOCOL = "workspace:";
      // by returning null (below) instead of the collection and spec we are saying that we don't support the particular use case.
      if (spec.startsWith(WORKSPACE_PROTOCOL)) {
        const token = spec.substring(WORKSPACE_PROTOCOL.length);
        switch (token) {
          case "*": {
            return { collection, spec };
          }
          case "^": {
            return { collection, spec };
          }
          case "~": {
            return { collection, spec };
          }
          default: {
            // token is a semantic version range
            return { collection, spec };
          }
        }
      }
      if (spec.startsWith("file:")) {
        // return { collection, spec };
        return null;
      }
    }
    return null;
  }

  /**
   * Mutate local dependency spec according to type
   * @param resolved npa metadata
   * @param depVersion semver
   * @param savePrefix npm_config_save_prefix
   * @param options
   */
  updateLocalDependency(
    resolved: ExtendedNpaResult,
    depVersion: string,
    savePrefix: string,
    options: { eraseWorkspacePrefix: boolean } = { eraseWorkspacePrefix: false }
  ) {
    const depName = resolved.name as string;

    // determine which dependency collection the resolved name came from.
    let depCollection = this.dependencies;

    if (!depCollection || !depCollection[depName]) {
      depCollection = this.optionalDependencies;
    }

    if (!depCollection || !depCollection[depName]) {
      depCollection = this.devDependencies;
    }

    if (!depCollection || !depCollection[depName]) {
      depCollection = this.peerDependencies;
    }

    if (!depCollection) {
      throw new Error(`${JSON.stringify(depName)} SHOULD exist in some dependency collection.`);
    }

    const workspaceSpec = resolved.workspaceSpec;
    const workspaceAlias = resolved.workspaceAlias;
    const gitCommittish = resolved.gitCommittish;
    if (workspaceSpec) {
      if (options.eraseWorkspacePrefix) {
        if (workspaceAlias) {
          const prefix = workspaceAlias === "*" ? "" : workspaceAlias;
          depCollection[depName] = `${prefix}${depVersion}`;
        } else {
          const semverRange = workspaceSpec.substring("workspace:".length);
          depCollection[depName] = semverRange;
        }
      } else {
        if (!workspaceAlias) {
          // retain "workspace:[*~^]" prefix but replace the version with the workspace version.
          const matches = workspaceSpec.match(/^(workspace:[*~^]?)/) as RegExpMatchArray;
          const workspacePrefix = matches[0];
          depCollection[depName] = `${workspacePrefix}${depVersion}`;
        }
      }
    } else if (resolved.registry || resolved.type === "directory") {
      // a version (1.2.3) OR range (^1.2.3) OR directory (file:../foo-pkg)
      depCollection[depName] = `${savePrefix}${depVersion}`;
    } else if (gitCommittish) {
      // a git url with matching committish (#v1.2.3 or #1.2.3)
      const [tagPrefix] = /^\D*/.exec(gitCommittish) as RegExpExecArray;

      // update committish
      const { hosted } = resolved; // take that, lint!
      // TODO: refactor based on TS feedback
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      hosted.committish = `${tagPrefix}${depVersion}`;

      // always serialize the full url (identical to previous resolved.saveSpec)
      // TODO: refactor based on TS feedback
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      depCollection[depName] = hosted.toString({ noGitPlus: false, noCommittish: false });
    } else if (resolved.gitRange) {
      // a git url with matching gitRange (#semver:^1.2.3)
      const { hosted } = resolved; // take that, lint!
      // TODO: refactor based on TS feedback
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      hosted.committish = `semver:${savePrefix}${depVersion}`;

      // always serialize the full url (identical to previous resolved.saveSpec)
      // TODO: refactor based on TS feedback
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      depCollection[depName] = hosted.toString({ noGitPlus: false, noCommittish: false });
    }
  }

  /**
   * Remove the private property, effectively making the package public.
   */
  removePrivate() {
    delete this[PKG].private;
  }
}
