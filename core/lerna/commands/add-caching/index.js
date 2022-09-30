// @ts-check

"use strict";

const { Command } = require("@lerna/command");
const { writeJsonFile, readJsonFile, workspaceRoot, joinPathFragments } = require("@nrwl/devkit");
const inquirer = require("inquirer");
const log = require("npmlog");

module.exports = factory;

function factory(argv) {
  return new AddCachingCommand(argv);
}

class AddCachingCommand extends Command {
  constructor(argv) {
    super(argv, { skipValidations: true });
  }

  initialize() {
    if (this.options.useNx === false) {
      this.logger.error(
        "add-caching",
        "The `add-caching` command is only available when using the Nx task runner (do not set `useNx` to `false` in `lerna.json`)"
      );
      // eslint-disable-next-line no-process-exit
      process.exit(1);
    } // TODO: remove auto-setting useNx: true in v6
    else if (!this.options.useNx) {
      const lernaJsonPath = joinPathFragments(workspaceRoot, "lerna.json");
      try {
        const lernaJson = readJsonFile(lernaJsonPath);
        lernaJson.useNx = true;
        writeJsonFile(lernaJsonPath, lernaJson);
      } catch {
        this.logger.error(
          "add-caching",
          "The `add-caching` command is only available when using the Nx task runner (set `useNx` to `true` in `lerna.json`)"
        );
        // eslint-disable-next-line no-process-exit
        process.exit(1);
      }
    }

    const packages = this.packageGraph?.rawPackageList || [];
    const uniqueScriptNames = new Set();
    for (const pkg of packages) {
      for (const scriptName of Object.keys(pkg.scripts || {})) {
        uniqueScriptNames.add(scriptName);
      }
    }
    this.uniqueScriptNames = Array.from(uniqueScriptNames);
  }

  async execute() {
    this.logger.info(
      "add-caching",
      "Please answer the following questions about the scripts found in your workspace in order to generate task runner configuration"
    );
    process.stdout.write("\n");

    log.pause();

    const { targetDefaults } = await inquirer.prompt([
      {
        type: "checkbox",
        name: "targetDefaults",
        message: "Which of the following scripts need to be run in deterministic/topoglogical order?\n",
        choices: this.uniqueScriptNames,
      },
    ]);

    const { cacheableOperations } = await inquirer.prompt([
      {
        type: "checkbox",
        name: "cacheableOperations",
        message:
          "Which of the following scripts are cacheable? (Produce the same output given the same input, e.g. build, test and lint usually are, serve and start are not)\n",
        choices: this.uniqueScriptNames,
      },
    ]);

    const scriptOutputs = {};

    for (const scriptName of cacheableOperations) {
      // eslint-disable-next-line no-await-in-loop
      scriptOutputs[scriptName] = await inquirer.prompt([
        {
          type: "input",
          name: scriptName,
          message: `Does the "${scriptName}" script create any outputs? If not, leave blank, otherwise provide a path relative to a project root (e.g. dist, lib, build, coverage)\n`,
        },
      ]);
    }

    log.resume();

    process.stdout.write("\n");

    this.convertAnswersToNxConfig({ cacheableOperations, targetDefaults, scriptOutputs });

    this.logger.success("add-caching", "Successfully updated task runner configuration in `nx.json`");

    this.logger.info(
      "add-caching",
      "Learn more about task runner configuration here: https://lerna.js.org/docs/concepts/task-pipeline-configuration"
    );
    this.logger.info(
      "add-caching",
      "Note that the legacy task runner options of --sort, --no-sort and --parallel no longer apply. Learn more here: https://lerna.js.org/docs/recipes/using-lerna-powered-by-nx-to-run-tasks"
    );
  }

  convertAnswersToNxConfig(answers) {
    const nxJsonPath = joinPathFragments(workspaceRoot, "nx.json");
    let nxJson = {};
    try {
      nxJson = readJsonFile(nxJsonPath);
      // eslint-disable-next-line no-empty
    } catch {}

    nxJson.tasksRunnerOptions = nxJson.tasksRunnerOptions || {};
    nxJson.tasksRunnerOptions.default = nxJson.tasksRunnerOptions.default || {};
    nxJson.tasksRunnerOptions.default.runner =
      nxJson.tasksRunnerOptions.default.runner || "nx/tasks-runners/default";
    nxJson.tasksRunnerOptions.default.options = nxJson.tasksRunnerOptions.default.options || {};

    if (nxJson.tasksRunnerOptions.default.options.cacheableOperations) {
      this.logger.warn(
        "add-caching",
        "The `tasksRunnerOptions.default.cacheableOperations` property already exists in `nx.json` and will be overwritten by your answers"
      );
    }

    nxJson.tasksRunnerOptions.default.options.cacheableOperations = answers.cacheableOperations;

    if (nxJson.targetDefaults) {
      this.logger.warn(
        "add-caching",
        "The `targetDefaults` property already exists in `nx.json` and will be overwritten by your answers"
      );
    }

    nxJson.targetDefaults = nxJson.targetDefaults || {};

    for (const scriptName of answers.targetDefaults) {
      nxJson.targetDefaults[scriptName] = nxJson.targetDefaults[scriptName] || {};
      nxJson.targetDefaults[scriptName] = { dependsOn: [`^${scriptName}`] };
    }

    for (const [scriptName, scriptAnswerData] of Object.entries(answers.scriptOutputs)) {
      if (!scriptAnswerData[scriptName]) {
        // eslint-disable-next-line no-continue
        continue;
      }
      nxJson.targetDefaults[scriptName] = nxJson.targetDefaults[scriptName] || {};
      nxJson.targetDefaults[scriptName].outputs = [`{projectRoot}/${scriptAnswerData[scriptName]}`];
    }

    writeJsonFile(nxJsonPath, nxJson);
  }

  // eslint-disable-next-line class-methods-use-this
  normalizePathInput(pathInput) {
    if (pathInput.startsWith("/")) {
      return pathInput.substring(1);
    }
    return pathInput;
  }
}

module.exports.AddCachingCommand = AddCachingCommand;
