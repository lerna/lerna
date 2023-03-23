import { parseJson, writeJsonFile } from "@nrwl/devkit";
import { cosmiconfigSync, defaultLoaders } from "cosmiconfig";
import dedent from "dedent";
import fs from "fs";
import globParent from "glob-parent";
import globby from "globby";
import { load } from "js-yaml";
import loadJsonFile from "load-json-file";
import log from "npmlog";
import pMap from "p-map";
import path from "path";
import { Package } from "../package";
import { ValidationError } from "../validation-error";
import { applyExtends } from "./apply-extends";
import { deprecateConfig } from "./deprecate-config";
import { makeFileFinder, makeSyncFileFinder } from "./make-file-finder";

interface CommandConfigs {
  [command: string]: CommandConfigOptions;
}

export interface CommandConfigOptions {
  //Here we have all general options
  _?: string[];
  concurrency?: number;
  sort?: boolean;
  maxBuffer?: number;
  stream?: boolean;
  loglevel?: string;
  verbose?: boolean;
  progress?: boolean;
  npmClient?: string;
  useNx?: boolean;
  independent?: boolean;
  ci?: boolean;
  useWorkspaces?: boolean;
  since?: string;
}

interface ProjectConfig {
  packages: string[];
  useNx: boolean;
  useWorkspaces: boolean;
  version: string;
  npmClient: string;
  command?: CommandConfigs;
}

interface PnpmWorkspaceConfig {
  packages: string[];
}

/**
 * A representation of the entire project managed by Lerna.
 *
 * Wherever the lerna.json file is located, that is the project root.
 * All package globs are rooted from this location.
 */
export class Project {
  static PACKAGE_GLOB = "packages/*";
  static LICENSE_GLOB = "LICEN{S,C}E{,.*}";

  static getPackages(cwd: string) {
    return new Project(cwd).getPackages();
  }

  static getPackagesSync(cwd: string) {
    return new Project(cwd).getPackagesSync();
  }

  config: ProjectConfig;
  configNotFound: boolean;
  rootConfigLocation: string;
  rootPath: string;

  constructor(cwd?: string) {
    const explorer = cosmiconfigSync("lerna", {
      loaders: {
        ...defaultLoaders,
        ".json": (filepath, content) => {
          if (!filepath.endsWith("lerna.json")) {
            return defaultLoaders[".json"](filepath, content);
          }
          /**
           * This prevents lerna from blowing up on trailing commas and comments in lerna configs,
           * however it should be noted that we will not be able to respect those things whenever
           * we perform an automated config migration, e.g. via `lerna repair` and they will be lost.
           * (Although that will be easy enough for the user to see and updated in their `git diff`)
           */
          try {
            return parseJson(content);
          } catch (err: unknown) {
            if (err instanceof Error) {
              err.name = "JSONError";
              err.message = `Error in: ${filepath}\n${err.message}`;
            }
            throw err;
          }
        },
      },
      searchPlaces: ["lerna.json", "package.json"],
      transform(obj) {
        // cosmiconfig returns null when nothing is found
        if (!obj) {
          return {
            // No need to distinguish between missing and empty,
            // saves a lot of noisy guards elsewhere
            config: {},
            configNotFound: true,
            // path.resolve(".", ...) starts from process.cwd()
            filepath: path.resolve(cwd || ".", "lerna.json"),
          };
        }

        // rename deprecated durable config
        deprecateConfig(obj.config, obj.filepath);

        obj.config = applyExtends(obj.config, path.dirname(obj.filepath));

        return obj;
      },
    });

    let loaded;

    try {
      loaded = explorer.search(cwd);
    } catch (err) {
      // redecorate JSON syntax errors, avoid debug dump
      // TODO: refactor to address type issues
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      if (err.name === "JSONError") {
        // TODO: refactor to address type issues
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        throw new ValidationError(err.name, err.message);
      }

      // re-throw other errors, could be ours or third-party
      throw err;
    }

    // TODO: refactor to address type issues
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    this.config = loaded.config;
    // TODO: refactor to address type issues
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    this.configNotFound = loaded.configNotFound;
    // TODO: refactor to address type issues
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    this.rootConfigLocation = loaded.filepath;
    // TODO: refactor to address type issues
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    this.rootPath = path.dirname(loaded.filepath);

    log.verbose("rootPath", this.rootPath);
  }

  get version() {
    return this.config.version;
  }

  set version(val) {
    this.config.version = val;
  }

  get packageConfigs() {
    if (this.config.npmClient === "pnpm") {
      log.verbose(
        "packageConfigs",
        "Package manager 'pnpm' detected. Resolving packages using 'pnpm-workspace.yaml'."
      );

      // TODO: refactor to address type issues
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const workspaces = this.pnpmWorkspaceConfig.packages;

      if (!workspaces) {
        throw new ValidationError(
          "EWORKSPACES",
          "No 'packages' property found in pnpm-workspace.yaml. See https://pnpm.io/workspaces for help configuring workspaces in pnpm."
        );
      }

      return workspaces;
    }

    if (this.config.useWorkspaces) {
      // TODO: refactor to address type issues
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const workspaces = this.manifest.get("workspaces");

      if (!workspaces) {
        throw new ValidationError(
          "EWORKSPACES",
          dedent`
            Workspaces need to be defined in the root package.json.
            See: https://github.com/lerna/lerna/blob/master/commands/bootstrap/README.md#--use-workspaces
          `
        );
      }

      // TODO: refactor to address type issues
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      return workspaces.packages || workspaces;
    }

    // TODO: refactor to address type issues
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if (this.manifest.get("workspaces")) {
      log.warn(
        "EWORKSPACES",
        dedent`
          Workspaces exist in the root package.json, but Lerna is not configured to use them.
          To fix this and have Lerna use workspaces to resolve packages, set \`useWorkspaces: true\` in lerna.json.
        `
      );
    }

    if (this.config.packages) {
      return this.config.packages;
    }

    log.warn(
      "EPACKAGES",
      `No packages defined in lerna.json. Defaulting to packages in ${Project.PACKAGE_GLOB}`
    );
    return [Project.PACKAGE_GLOB];
  }

  get packageParentDirs() {
    return this.packageConfigs
      .map(globParent)
      .map((parentDir: string) => path.resolve(this.rootPath, parentDir));
  }

  get manifest() {
    let manifest;

    try {
      const manifestLocation = path.join(this.rootPath, "package.json");
      const packageJson = loadJsonFile.sync(manifestLocation);

      // TODO: refactor to address type issues
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      if (!packageJson.name) {
        // npm-lifecycle chokes if this is missing, so default like npm init does
        // TODO: refactor to address type issues
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        packageJson.name = path.basename(path.dirname(manifestLocation));
      }

      // Encapsulate raw JSON in Package instance
      // TODO: refactor to address type issues
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      manifest = new Package(packageJson, this.rootPath);

      // redefine getter to lazy-loaded value
      Object.defineProperty(this, "manifest", {
        value: manifest,
      });
    } catch (err) {
      // redecorate JSON syntax errors, avoid debug dump
      // TODO: refactor to address type issues
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      if (err.name === "JSONError") {
        // TODO: refactor to address type issues
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        throw new ValidationError(err.name, err.message);
      }

      // try again next time
    }

    return manifest;
  }

  /** @type {PnpmWorkspaceConfig} */
  get pnpmWorkspaceConfig() {
    let config;

    try {
      const configLocation = path.join(this.rootPath, "pnpm-workspace.yaml");
      const configContent = fs.readFileSync(configLocation);
      // TODO: refactor to address type issues
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      config = load(configContent);

      Object.defineProperty(this, "pnpmWorkspaceConfig", {
        value: config,
      });
    } catch (err) {
      // TODO: refactor to address type issues
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      if (err.message.includes("ENOENT: no such file or directory")) {
        throw new ValidationError(
          "ENOENT",
          "No pnpm-workspace.yaml found. See https://pnpm.io/workspaces for help configuring workspaces in pnpm."
        );
      }

      // TODO: refactor to address type issues
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      throw new ValidationError(err.name, err.message);
    }

    return config;
  }

  get licensePath() {
    let licensePath;

    try {
      const search = globby.sync(Project.LICENSE_GLOB, {
        cwd: this.rootPath,
        absolute: true,
        caseSensitiveMatch: false,
        // Project license is always a sibling of the root manifest
        deep: 0,
      });

      licensePath = search.shift();

      if (licensePath) {
        // POSIX results always need to be normalized
        licensePath = path.normalize(licensePath);

        // redefine getter to lazy-loaded value
        Object.defineProperty(this, "licensePath", {
          value: licensePath,
        });
      }
    } catch (err) {
      /* istanbul ignore next */
      // TODO: refactor to address type issues
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      throw new ValidationError(err.name, err.message);
    }

    return licensePath;
  }

  get fileFinder() {
    const finder = makeFileFinder(this.rootPath, this.packageConfigs);

    // redefine getter to lazy-loaded value
    Object.defineProperty(this, "fileFinder", {
      value: finder,
    });

    return finder;
  }

  /**
   * A promise resolving to a list of Package instances
   */
  getPackages(): Promise<Package[]> {
    const mapper = (packageConfigPath: string) =>
      loadJsonFile(packageConfigPath).then(
        (packageJson: any) => new Package(packageJson, path.dirname(packageConfigPath), this.rootPath)
      );

    // TODO: refactor to address type issues
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return this.fileFinder("package.json", (filePaths) => pMap(filePaths, mapper, { concurrency: 50 }));
  }

  /**
   * A list of Package instances
   */
  getPackagesSync(): Package[] {
    // TODO: refactor to address type issues
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return makeSyncFileFinder(this.rootPath, this.packageConfigs)("package.json", (packageConfigPath) => {
      return new Package(
        loadJsonFile.sync(packageConfigPath),
        path.dirname(packageConfigPath),
        this.rootPath
      );
    });
  }

  getPackageLicensePaths() {
    return this.fileFinder(Project.LICENSE_GLOB, null, { caseSensitiveMatch: false });
  }

  isIndependent() {
    return this.version === "independent";
  }

  serializeConfig(): string {
    // TODO: might be package.json prop
    writeJsonFile(this.rootConfigLocation, this.config, { spaces: 2 });
    return this.rootConfigLocation;
  }
}

// TODO: are these extra exports necessary?
export const getPackages = Project.getPackages;
export const getPackagesSync = Project.getPackagesSync;
