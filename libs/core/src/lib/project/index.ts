import { parseJson, writeJsonFile } from "@nx/devkit";
import { cosmiconfigSync, defaultLoaders } from "cosmiconfig";
import type { CosmiconfigResult } from "cosmiconfig/dist/types";
import dedent from "dedent";
import fs from "fs";
import globParent from "glob-parent";
import { globSync } from "tinyglobby";
import { load } from "js-yaml";
import loadJsonFile from "load-json-file";
import pMap from "p-map";
import path from "path";
import log from "../npmlog";
import { Package, RawManifest } from "../package";
import { ValidationError } from "../validation-error";
import { applyExtends } from "./apply-extends";
import { makeFileFinder, makeSyncFileFinder } from "./make-file-finder";

interface CosmiconfigNotFoundResult {
  config: Record<string, unknown>;
  configNotFound: true;
  filepath: string;
}

interface CommandConfigs {
  [command: string]: CommandConfigOptions;
}

export interface CommandConfigOptions {
  //Here we have all general options
  _?: (string | number)[];
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
  since?: string;
}

export interface LernaConfig {
  $schema: string;
  version: string;
  packages?: string[];
  useNx?: boolean;
  npmClient?: string;
  command?: CommandConfigs;
}

interface PnpmWorkspaceConfig {
  packages: string[];
}

const LICENSE_GLOB = "LICEN{S,C}E{,.*}";

/**
 * A representation of the entire project managed by Lerna.
 *
 * Wherever the lerna.json file is located, that is the project root.
 * All package globs are rooted from this location.
 */
export class Project {
  config: LernaConfig;
  configNotFound: boolean;
  rootConfigLocation: string;
  rootPath: string;
  packageConfigs: string[];
  manifest: Package;

  /**
   * @deprecated Only used in legacy core utilities
   * TODO: remove in v8
   */
  static getPackages(cwd: string) {
    return new Project(cwd).getPackages();
  }

  /**
   * @deprecated Only used in legacy core utilities
   * TODO: remove in v8
   */
  static getPackagesSync(cwd: string) {
    return new Project(cwd).getPackagesSync();
  }

  constructor(cwd?: string, options?: { skipLernaConfigValidations: boolean }) {
    const { config, configNotFound, filepath } = this.#resolveLernaConfig(cwd);

    this.config = config;
    this.configNotFound = configNotFound || false;
    this.rootConfigLocation = filepath;
    this.rootPath = path.dirname(filepath);

    this.manifest = this.#resolveRootPackageJson();

    if (this.configNotFound) {
      throw new ValidationError("ENOLERNA", "`lerna.json` does not exist, have you run `lerna init`?");
    }

    if (!options?.skipLernaConfigValidations) {
      this.#validateLernaConfig(config);
    }

    this.packageConfigs = this.#resolvePackageConfigs();

    log.verbose("rootPath", this.rootPath);
  }

  get version(): string {
    return this.config.version;
  }

  set version(val: string) {
    this.config.version = val;
  }

  get packageParentDirs(): string[] {
    return this.packageConfigs
      .map((packagePattern) => globParent(packagePattern))
      .map((parentDir: string) => path.resolve(this.rootPath, parentDir));
  }

  get licensePath() {
    let licensePath;

    try {
      const search = globSync(LICENSE_GLOB, {
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
    const syncFileFinder = makeSyncFileFinder(this.rootPath, this.packageConfigs);
    return syncFileFinder<Package>("package.json", (packageConfigPath) => {
      return new Package(
        loadJsonFile.sync(packageConfigPath),
        path.dirname(packageConfigPath),
        this.rootPath
      );
    });
  }

  getPackageLicensePaths(): Promise<string[]> {
    return this.fileFinder(LICENSE_GLOB, null, { caseSensitiveMatch: false });
  }

  isIndependent(): boolean {
    return this.version === "independent";
  }

  serializeConfig(): string {
    // TODO: might be package.json prop
    writeJsonFile(this.rootConfigLocation, this.config, { spaces: 2 });
    return this.rootConfigLocation;
  }

  #resolveRootPackageJson(): Package {
    try {
      const manifestLocation = path.join(this.rootPath, "package.json");
      const packageJson = loadJsonFile.sync<RawManifest>(manifestLocation);

      if (!packageJson.name) {
        // npm-lifecycle chokes if this is missing, so default like npm init does
        packageJson.name = path.basename(path.dirname(manifestLocation));
      }

      return new Package(packageJson, this.rootPath);
    } catch (err: unknown) {
      // redecorate JSON syntax errors, avoid debug dump
      if (err instanceof Error && err?.name === "JSONError") {
        throw new ValidationError(err.name, err.message);
      }
      throw new ValidationError("ENOPKG", "`package.json` does not exist, have you run `lerna init`?");
    }
  }

  #resolveLernaConfig(cwd?: string) {
    try {
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
            const configNotFoundResult: CosmiconfigNotFoundResult = {
              // No need to distinguish between missing and empty,
              // saves a lot of noisy guards elsewhere
              config: {},
              configNotFound: true,
              // path.resolve(".", ...) starts from process.cwd()
              filepath: path.resolve(cwd || ".", "lerna.json"),
            };
            return configNotFoundResult;
          }

          obj.config = applyExtends(obj.config, path.dirname(obj.filepath));

          return obj;
        },
      });

      /**
       * We explicitly handle the missing config case in the transform function above,
       * so we can remove null from the types and replace it with the custom ConfigNotFoundResult.
       */
      type ExplorerResult = Exclude<CosmiconfigResult, null> & CosmiconfigNotFoundResult;
      return explorer.search(cwd) as ExplorerResult;
    } catch (err: any) {
      // redecorate JSON syntax errors, avoid debug dump
      if (err.name === "JSONError") {
        throw new ValidationError(err.name, err.message);
      }
      // re-throw other errors, could be ours or third-party
      throw err;
    }
  }

  #validateLernaConfig(config: LernaConfig): void {
    if (!this.version) {
      throw new ValidationError("ENOVERSION", "Required property version does not exist in `lerna.json`");
    }

    // Intentionally checking for non-existent property on the type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((config as any).useWorkspaces !== undefined) {
      throw new ValidationError(
        "ECONFIGWORKSPACES",
        `The "useWorkspaces" option has been removed. By default lerna will resolve your packages using your package manager's workspaces configuration. Alternatively, you can manually provide a list of package globs to be used instead via the "packages" option in lerna.json.`
      );
    }
  }

  #resolvePnpmWorkspaceConfig(): PnpmWorkspaceConfig {
    let config: PnpmWorkspaceConfig;

    try {
      const configLocation = path.join(this.rootPath, "pnpm-workspace.yaml");
      const configContent = fs.readFileSync(configLocation, { encoding: "utf8" });
      config = load(configContent) as PnpmWorkspaceConfig;
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

  /**
   * By default, the user's package manager workspaces configuration will be used to resolve packages.
   * However, they can optionally specify an explicit set of package globs to be used instead.
   *
   * NOTE: This does not impact the project graph creation process, which will still ultimately use
   * the package manager workspaces configuration to construct a full graph, it will only impact which
   * of the packages in that graph will be considered when running commands.
   */
  #resolvePackageConfigs(): string[] {
    if (this.config.packages) {
      log.verbose(
        "packageConfigs",
        `Explicit "packages" configuration found in lerna.json. Resolving packages using the configured glob(s): ${JSON.stringify(
          this.config.packages
        )}`
      );
      return this.config.packages;
    }

    // pnpm is a special case as it has a separate file in which it specifies workspaces configuration
    if (this.config.npmClient === "pnpm") {
      log.verbose(
        "packageConfigs",
        'Package manager "pnpm" detected. Resolving packages using `pnpm-workspace.yaml`.'
      );
      const workspaces = this.#resolvePnpmWorkspaceConfig().packages;
      if (!workspaces) {
        throw new ValidationError(
          "EWORKSPACES",
          'No "packages" property found in `pnpm-workspace.yaml`. See https://pnpm.io/workspaces for help configuring workspaces in pnpm.'
        );
      }
      return workspaces;
    }

    const workspaces = this.manifest?.get("workspaces");
    const isYarnClassicWorkspacesObjectConfig = Boolean(
      workspaces && typeof workspaces === "object" && Array.isArray((workspaces as any).packages)
    );
    const isValidWorkspacesConfig = Array.isArray(workspaces) || isYarnClassicWorkspacesObjectConfig;

    if (!workspaces || !isValidWorkspacesConfig) {
      throw new ValidationError(
        "EWORKSPACES",
        dedent`
          Lerna is expecting to able to resolve the "workspaces" configuration from your package manager in order to determine what packages to work on, but no "workspaces" config was found.
          (A) Did you mean to specify a "packages" config manually in lerna.json instead of using your workspaces config?
          (B) Alternatively, if you are using pnpm as your package manager, make sure you set "npmClient": "pnpm" in your lerna.json so that lerna knows to read from the "pnpm-workspace.yaml" file instead of package.json.
          See: https://lerna.js.org/docs/getting-started
        `
      );
    }

    log.verbose("packageConfigs", `Resolving packages based on package.json "workspaces" configuration.`);

    if (isYarnClassicWorkspacesObjectConfig) {
      return (workspaces as any).packages;
    }

    // TS isn't picking up that this must be an array at this point
    return workspaces as string[];
  }
}

/**
 * @deprecated Only used in legacy core utilities
 * TODO: remove in v8
 */
export const getPackages = Project.getPackages;
/**
 * @deprecated Only used in legacy core utilities
 * TODO: remove in v8
 */
export const getPackagesSync = Project.getPackagesSync;
