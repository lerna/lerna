import { Command, ValidationError } from "@lerna/core";
import {
  createProjectGraphAsync,
  joinPathFragments,
  readNxJson,
  workspaceRoot,
  Workspaces,
} from "@nrwl/devkit";
import { flushChanges, FsTree } from "nx/src/generators/tree";
import { readProjectsConfigurationFromProjectGraph } from "nx/src/project-graph/project-graph";
import { handleErrors } from "nx/src/utils/params";
import { CreateGeneratorOptions, generatorFactory } from "./lib/generators/default/generator";
import npa from "npm-package-arg";
import path, { resolve } from "path";
import Config from "@npmcli/config";

const DEFAULT_DESCRIPTION = [
  "Now I’m the model of a modern major general",
  "The venerated Virginian veteran whose men are all",
  "Lining up, to put me up on a pedestal",
  "Writin’ letters to relatives",
  "Embellishin’ my elegance and eloquence",
  "But the elephant is in the room",
  "The truth is in ya face when ya hear the British cannons go",
  "BOOM",
].join(" / ");

module.exports = function factory(argv: NodeJS.Process["argv"]) {
  return new CreateCommand(argv);
};

class CreateCommand extends Command {
  generatorOptions: CreateGeneratorOptions;
  dirName: string;
  pkgName: string;

  async initialize() {
    const {
      bin,
      description = DEFAULT_DESCRIPTION,
      esModule,
      keywords,
      license,
      loc: pkgLocation,
      name: rawPkgName,
      yes,
    } = this.options;

    // npm-package-arg handles all the edge-cases with scopes
    const { name, scope } = npa(rawPkgName);

    if (!name && rawPkgName.includes("/")) {
      throw new ValidationError(
        "ENOPKGNAME",
        "Invalid package name. Use the <loc> positional to specify package directory.\nSee https://github.com/lerna/lerna/tree/main/commands/create#usage for details."
      );
    }

    // optional scope is _not_ included in the directory name
    const dirName = scope ? name.split("/").pop() : name;

    const pkgsDir = this._getPackagesDir(pkgLocation);
    // const camelName = camelCase(dirName);

    // when transpiling, src => dist; otherwise everything in lib
    const outDir = esModule ? "dist" : "lib";
    const targetDir = path.resolve(pkgsDir, dirName);

    const binDir = path.join(targetDir, "bin");
    const binFileName = bin === true ? dirName : bin;

    const libDir = path.join(targetDir, esModule ? "src" : "lib");
    const libFileName = `${dirName}.js`;

    const testDir = path.join(targetDir, "__tests__");
    const testFileName = `${dirName}.test.js`;

    // this.conf = npmConf({
    //   description,
    //   esModule,
    //   keywords,
    //   scope,
    //   yes,
    // });

    this.generatorOptions = {
      name,
      private: this.options.private,
      description,
      // override npm_config_init_license if --license provided
      license,
      binDir,
      binFileName,
    };

    // const conf = new Config({
    //   // path to the npm module being run
    //   npmPath: joinPathFragments(workspaceRoot, "package.json"),
    //   types: {},
    //   shorthands: {},
    //   defaults: {},
    //   definitions: {},
    //   // optional, defaults to process.argv
    //   argv: process.argv,
    //   // optional, defaults to process.env
    //   env: process.env,
    //   // optional, defaults to process.execPath
    //   execPath: process.execPath,
    //   // optional, defaults to process.platform
    //   platform: process.platform,
    //   // optional, defaults to process.cwd()
    //   cwd: process.cwd(),
    // });

    // await conf.load();

    // console.log("source", conf.data.get("project"));

    // console.log(this.options, this.argv);

    // // consume "builtin" npm config, if it exists (matches npm cli behaviour)
    // this.conf.addFile(builtinNpmrc(), "builtin");

    // // always set init-main, it's half of the whole point of this module
    // this.conf.set("init-main", `${this.outDir}/${this.libFileName}`);

    // if (esModule) {
    //   this.conf.set("init-es-module", `${this.outDir}/${this.dirName}.module.js`);
    // }

    // // allow default init-version when independent versioning enabled
    // if (!this.project.isIndependent()) {
    //   this.conf.set("init-version", this.project.version);
    // }

    // // default author metadata with git config
    // if (this.conf.get("init-author-name") === "") {
    //   this.conf.set("init-author-name", this.gitConfig("user.name"));
    // }

    // if (this.conf.get("init-author-email") === "") {
    //   this.conf.set("init-author-email", this.gitConfig("user.email"));
    // }

    // // silence output if logging is silenced
    // // istanbul ignore else
    // if (this.options.loglevel === "silent") {
    //   this.conf.set("silent", true);
    // }

    // // save read-package-json the trouble
    // if (this.binFileName) {
    //   this.conf.set("bin", {
    //     [this.binFileName]: `bin/${this.binFileName}`,
    //   });
    // }

    // // setting _both_ pkg.bin and pkg.directories.bin is an error
    // // https://docs.npmjs.com/files/package.json#directoriesbin
    // this.conf.set("directories", {
    //   lib: this.outDir,
    //   test: "__tests__",
    // });

    // this.setFiles();
    // this.setHomepage();
    // this.setPublishConfig();
    // this.setRepository();

    // return Promise.resolve(this.setDependencies());
  }

  async execute() {
    const isVerbose = this.argv["verbose"];
    const isDryRun = this.argv["dryRun"];

    return await handleErrors(isVerbose, async () => {
      const tree = new FsTree(workspaceRoot, isVerbose);
      const generatorImplementation = generatorFactory(this.logger);
      const task = await generatorImplementation(tree, this.generatorOptions);
      const changes = tree.listChanges();

      const chalk = require("chalk");

      function printChanges(fileChanges, indent = "") {
        fileChanges.forEach((f) => {
          if (f.type === "CREATE") {
            console.log(`${indent}${chalk.green("CREATE")} ${f.path}`);
          } else if (f.type === "UPDATE") {
            console.log(`${indent}${chalk.white("UPDATE")} ${f.path}`);
            console.log("\n");
          } else if (f.type === "DELETE") {
            console.log(`${indent}${chalk.yellow("DELETE")} ${f.path}`);
          }
        });
      }

      if (isDryRun) {
        this.logger.info("create", `The generator wants to make the following changes to the file system`);
      } else {
        this.logger.info("create", `The generator is making the following changes to the file system`);
      }

      printChanges(changes, "  ");

      if (!isDryRun) {
        flushChanges(workspaceRoot, changes);
        if (task) {
          await task();
        }
      } else {
        this.logger.warn("create", `The "dryRun" flag means no changes were made.`);
      }
    });
  }

  private _getPackagesDir(pkgLocation) {
    const packageParentDirs = this.project.packageParentDirs;

    if (!pkgLocation) {
      return packageParentDirs[0];
    }

    const normalizedPkgLocation = path
      .resolve(this.project.rootPath, path.normalize(pkgLocation))
      .toLowerCase();
    const packageParentDirsLower = packageParentDirs.map((p) => p.toLowerCase());

    // using indexOf over includes due to platform differences (/private/tmp should match /tmp on macOS)
    const matchingPathIndex = packageParentDirsLower.findIndex((p) => p.indexOf(normalizedPkgLocation) > -1);

    if (matchingPathIndex > -1) {
      return packageParentDirs[matchingPathIndex];
    }

    throw new ValidationError(
      "ENOPKGDIR",
      `Location "${pkgLocation}" is not configured as a workspace directory.`
    );
  }
}

module.exports.CreateCommand = CreateCommand;
