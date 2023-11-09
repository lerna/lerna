import {
  Arguments,
  Command,
  CommandConfigOptions,
  LernaLogger,
  LernaConfig,
  isGitInitialized,
} from "@lerna/core";
import {
  PackageManager,
  addDependenciesToPackageJson,
  getPackageManagerCommand,
  joinPathFragments,
  readJson,
  writeJson,
} from "@nx/devkit";
import { existsSync } from "fs";
import { readFileSync } from "fs-extra";
import log from "npmlog";
import { FsTree, Tree, flushChanges } from "nx/src/generators/tree";
import yargs from "yargs";

const LARGE_BUFFER = 1024 * 1000000;

interface InitCommandOptions extends CommandConfigOptions {
  lernaVersion?: string;
  packages?: string[];
  exact?: boolean;
  loglevel?: string;
  independent?: boolean;
  dryRun?: boolean;
  skipInstall?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-var-requires
const childProcess = require("@lerna/child-process");

const PACKAGE_GLOB = "packages/*";

export function factory(args: Arguments<InitCommandOptions>) {
  return new InitCommand(args);
}

export class InitCommand {
  name = "init";
  logger: LernaLogger;
  cwd = process.cwd();
  packageManager: PackageManager;
  runner: Promise<void>;

  constructor(private args: Arguments<InitCommandOptions>) {
    log.heading = "lerna";
    this.logger = Command.createLogger(this.name, args.loglevel);
    this.logger.notice("cli", `v${this.args.lernaVersion}`);
    this.packageManager = this.detectPackageManager() || this.detectInvokedPackageManager() || "npm";
    this.runner = this.execute();
  }

  async execute(): Promise<void> {
    const tree = new FsTree(this.cwd, false);
    const task = await this.generate(tree);
    const changes = tree.listChanges();

    // There must have been an error in the generator, skip all further logs
    if (!changes.length) {
      return;
    }

    const isDryRun = this.args.dryRun;

    const { default: chalk } = await import("chalk");
    const { diff } = await import("jest-diff");

    function printDiff(before: string, after: string) {
      console.error(
        diff(before, after, {
          omitAnnotationLines: true,
          contextLines: 1,
          expand: false,
          aColor: chalk.red,
          bColor: chalk.green,
          patchColor: (s) => "",
        })
      );
    }

    if (isDryRun) {
      this.logger.info("", "The following file system updates will be made:");
    } else {
      this.logger.info("", "Applying the following file system updates:");
    }

    // Print the changes
    const indent = "";
    changes.forEach((f) => {
      if (f.type === "CREATE") {
        console.error(
          `${indent}${chalk.green("CREATE")} ${f.path}${isDryRun ? chalk.yellow(" [preview]") : ""}`
        );
        if (isDryRun) {
          printDiff("", f.content?.toString() || "");
        }
      } else if (f.type === "UPDATE") {
        console.error(
          `${indent}${chalk.white("UPDATE")} ${f.path}${isDryRun ? chalk.yellow(" [preview]") : ""}`
        );
        if (isDryRun) {
          const currentContentsOnDisk = readFileSync(joinPathFragments(tree.root, f.path)).toString();
          printDiff(currentContentsOnDisk, f.content?.toString() || "");
        }
      } else if (f.type === "DELETE") {
        console.error(`${indent}${chalk.yellow("DELETE")} ${f.path}`);
      }
    });

    if (!isDryRun) {
      flushChanges(this.cwd, changes);
      if (task) {
        await task();
      }
      this.logger.success("", "Initialized Lerna files");
      this.logger.info("", "New to Lerna? Check out the docs: https://lerna.js.org/docs/getting-started");
    } else {
      this.logger.warn("", `The "dryRun" flag means no changes were made.`);
    }
  }

  // proxy "Promise" methods to "private" instance
  then(onResolved: () => void, onRejected: (err: string | Error) => void) {
    return this.runner.then(onResolved, onRejected);
  }

  /* istanbul ignore next */
  catch(onRejected: (err: string | Error) => void) {
    return this.runner.catch(onRejected);
  }

  async generate(tree: Tree): Promise<void | (() => Promise<void>)> {
    const defaultLernaJson: LernaConfig = {
      $schema: "node_modules/lerna/schemas/lerna-schema.json",
      version: this.args.independent === true ? "independent" : "0.0.0",
    };

    if (tree.exists("lerna.json")) {
      // Invalid: we will not attempt to modify an existing lerna setup
      this.logger.error("", "Lerna has already been initialized for this repo.");
      this.logger.error(
        "",
        "If you are looking to ensure that your config is up to date with the latest and greatest, run `lerna repair` instead"
      );
      return;
    }

    const lernaJson = defaultLernaJson;
    // The user has explicitly provided one or more packages globs
    if (this.args.packages) {
      lernaJson.packages = this.args.packages;
    }

    if (this.packageManager !== "npm") {
      lernaJson.npmClient = this.packageManager;
    }

    // Neither a lerna.json nor package.json exists, create a recommended setup
    if (!tree.exists("package.json")) {
      // lerna.json
      writeJson(tree, "lerna.json", lernaJson);

      const basePackageJson = {
        name: "root",
        private: true,
      };

      // package.json
      if (this.packageManager === "pnpm") {
        writeJson(tree, "package.json", basePackageJson);
        if (!tree.exists("pnpm-workspace.yaml")) {
          tree.write("pnpm-workspace.yaml", `packages:\n  - '${PACKAGE_GLOB}'\n`);
        }
      } else {
        writeJson(tree, "package.json", {
          ...basePackageJson,
          workspaces: [PACKAGE_GLOB],
        });
      }
    } else {
      /**
       * package.json already exists.
       * We need to ensure package manager workspaces are being used, or that --packages is specified.
       */
      if (this.args.packages || this.#hasWorkspacesConfigured(tree)) {
        writeJson(tree, "lerna.json", lernaJson);
      } else {
        // Invalid: no package manager workspaces, and --packages not specified
        this.logger.error(
          "",
          "Cannot initialize lerna because your package manager has not been configured to use `workspaces`, and you have not explicitly specified any packages to operate on"
        );
        this.logger.error(
          "",
          "See https://lerna.js.org/docs/getting-started#adding-lerna-to-an-existing-repo for how to resolve this"
        );
        return;
      }
    }

    // Add lerna as a devDependency and queue install task
    addDependenciesToPackageJson(
      tree,
      {},
      { lerna: this.args.exact ? (this.args.lernaVersion as string) : `^${this.args.lernaVersion}` }
    );

    // Ensure minimal .gitignore exists
    if (!tree.exists(".gitignore")) {
      tree.write(".gitignore", "node_modules/");
    }

    return async () => {
      if (isGitInitialized(this.cwd)) {
        this.logger.info("", "Git is already initialized");
      } else {
        this.logger.info("", "Initializing Git repository");
        await childProcess.exec("git", ["init"], {
          cwd: this.cwd,
          maxBuffer: 1024,
        });
      }

      if (this.args.skipInstall === undefined) {
        this.logger.info("", `Using ${this.packageManager} to install packages`);

        const packageManagerCommand = getPackageManagerCommand(this.packageManager);
        const [command, ...args] = packageManagerCommand.install.split(" ");

        await childProcess.exec(command, args, {
          cwd: this.cwd,
          maxBuffer: LARGE_BUFFER,
        });
      }
    };
  }

  #hasWorkspacesConfigured(tree: Tree): boolean {
    const packageJson = readJson(tree, "package.json");
    return Array.isArray(packageJson.workspaces) || tree.exists("pnpm-workspace.yaml");
  }

  private detectPackageManager(): PackageManager | null {
    const packageManager = existsSync("yarn.lock")
      ? "yarn"
      : existsSync("pnpm-lock.yaml")
      ? "pnpm"
      : existsSync("package-lock.json")
      ? "npm"
      : null;
    if (packageManager) {
      this.logger.verbose("", `Detected lock file for ${packageManager}`);
    }
    return packageManager;
  }

  /**
   * Detects which package manager was used to invoke lerna init command
   * based on the main Module process that invokes the command
   * - npx returns 'npm'
   * - pnpx returns 'pnpm'
   * - yarn create returns 'yarn'
   */
  private detectInvokedPackageManager(): PackageManager | null {
    let detectedPackageManager: PackageManager | null = null;
    // mainModule is deprecated since Node 14, fallback for older versions
    const invoker = require.main || process["mainModule"];

    if (!invoker) {
      this.logger.verbose("", "Could not detect package manager from process");
      return detectedPackageManager;
    }
    for (const pkgManager of ["pnpm", "yarn", "npm"] as const) {
      if (invoker.path.includes(pkgManager)) {
        this.logger.verbose("", `Detected package manager ${pkgManager} from process`);
        detectedPackageManager = pkgManager;
        break;
      }
    }

    return detectedPackageManager;
  }
}
