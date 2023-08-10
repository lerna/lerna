import { Command, LernaConfig, isGitInitialized } from "@lerna/core";
import {
  addDependenciesToPackageJson,
  detectPackageManager,
  getPackageManagerCommand,
  joinPathFragments,
  readJson,
  writeJson,
} from "@nx/devkit";
import { readFileSync } from "fs-extra";
import log from "npmlog";
import { FsTree, Tree, flushChanges } from "nx/src/generators/tree";
import yargs from "yargs";

interface InitCommandOptions {
  lernaVersion: string;
  packages?: string[];
  exact?: boolean;
  loglevel?: string;
  independent?: boolean;
  dryRun?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-var-requires
const childProcess = require("@lerna/child-process");

const PACKAGE_GLOB = "packages/*";

module.exports = function factory(args: yargs.ArgumentsCamelCase<InitCommandOptions>) {
  return new InitCommand(args);
};

class InitCommand {
  name = "init";
  logger: log.Logger;
  cwd = process.cwd();
  packageManager = detectPackageManager();
  packageManagerCommand = getPackageManagerCommand(this.packageManager);

  constructor(private args: yargs.ArgumentsCamelCase<InitCommandOptions>) {
    log.heading = "lerna";
    this.logger = Command.createLogger(this.name, args.loglevel);
    this.execute();
  }

  async execute(): Promise<void> {
    this.logger.notice("cli", `v${this.args.lernaVersion}`);

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
      // package.json
      writeJson(tree, "package.json", {
        name: "root",
        private: true,
        workspaces: [PACKAGE_GLOB],
      });
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
      { lerna: this.args.exact ? this.args.lernaVersion : `^${this.args.lernaVersion}` }
    );

    // Ensure minimal .gitignore exists
    if (!tree.exists(".gitignore")) {
      tree.write(".gitignore", "node_modules/");
    }

    return async () => {
      if (isGitInitialized(this.cwd)) {
        this.logger.info("", "Git is already initialized");
        return;
      }

      this.logger.info("", "Initializing Git repository");
      await childProcess.exec("git", ["init"], {
        cwd: this.cwd,
        maxBuffer: 1024,
      });

      this.logger.verbose("", `Using ${this.packageManager} to install packages`);

      const [command, ...args] = this.packageManagerCommand.install.split(" ");

      await childProcess.exec(command, args, {
        cwd: this.cwd,
        maxBuffer: 1024 * 10000,
      });
    };
  }

  #hasWorkspacesConfigured(tree: Tree): boolean {
    const packageJson = readJson(tree, "package.json");
    return Array.isArray(packageJson.workspaces) || tree.exists("pnpm-workspace.yaml");
  }
}

module.exports.InitCommand = InitCommand;
