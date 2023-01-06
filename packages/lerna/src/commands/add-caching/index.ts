import { Command } from "@lerna/core";
import {
  joinPathFragments,
  NxJsonConfiguration,
  readJsonFile,
  workspaceRoot,
  writeJsonFile,
} from "@nrwl/devkit";
import inquirer from "inquirer";
import log from "npmlog";

module.exports = function factory(argv: NodeJS.Process["argv"]) {
  return new AddCachingCommand(argv);
};

interface UserAnswers {
  cacheableOperations: string[];
  targetDefaults: string[];
  scriptOutputs: Record<string, Record<string, string>>;
}

class AddCachingCommand extends Command {
  uniqueScriptNames: string[] = [];

  constructor(argv: NodeJS.Process["argv"]) {
    super(argv, { skipValidations: true });
  }

  override initialize() {
    if (this.options.useNx === false) {
      this.logger.error(
        "add-caching",
        "The `add-caching` command is only available when using the Nx task runner (do not set `useNx` to `false` in `lerna.json`)"
      );
      // eslint-disable-next-line no-process-exit
      process.exit(1);
    }

    const packages = this.packageGraph?.rawPackageList || [];
    const uniqueScriptNames = new Set<string>();
    for (const pkg of packages) {
      for (const scriptName of Object.keys(pkg.scripts || {})) {
        uniqueScriptNames.add(scriptName);
      }
    }
    this.uniqueScriptNames = Array.from(uniqueScriptNames);
  }

  override async execute() {
    this.logger.info(
      "add-caching",
      "Please answer the following questions about the scripts found in your workspace in order to generate task runner configuration"
    );
    process.stdout.write("\n");

    log.pause();

    const { targetDefaults } = await inquirer.prompt<{ targetDefaults: UserAnswers["targetDefaults"] }>([
      {
        type: "checkbox",
        name: "targetDefaults",
        message:
          "Which scripts need to be run in order? (e.g. before building a project, dependent projects must be built.)\n",
        choices: this.uniqueScriptNames,
      },
    ]);

    const { cacheableOperations } = await inquirer.prompt<{
      cacheableOperations: UserAnswers["cacheableOperations"];
    }>([
      {
        type: "checkbox",
        name: "cacheableOperations",
        message:
          "Which scripts are cacheable? (Produce the same output given the same input, e.g. build, test and lint usually are, serve and start are not.)\n",
        choices: this.uniqueScriptNames,
      },
    ]);

    const scriptOutputs: UserAnswers["scriptOutputs"] = {};

    for (const scriptName of cacheableOperations) {
      // eslint-disable-next-line no-await-in-loop
      scriptOutputs[scriptName] = await inquirer.prompt<Record<string, string>>([
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

    this.logger["success"]("add-caching", "Successfully updated task runner configuration in `nx.json`");

    this.logger.info(
      "add-caching",
      "Learn more about task runner configuration here: https://lerna.js.org/docs/concepts/task-pipeline-configuration"
    );
    this.logger.info(
      "add-caching",
      "Note that the legacy task runner options of --sort, --no-sort and --parallel no longer apply. Learn more here: https://lerna.js.org/docs/lerna6-obsolete-options"
    );
  }

  convertAnswersToNxConfig(answers: UserAnswers) {
    const nxJsonPath = joinPathFragments(workspaceRoot, "nx.json");
    let nxJson: NxJsonConfiguration = {};
    try {
      nxJson = readJsonFile(nxJsonPath);
      // eslint-disable-next-line no-empty
    } catch {}

    nxJson.tasksRunnerOptions = nxJson.tasksRunnerOptions || {};
    nxJson.tasksRunnerOptions["default"] = nxJson.tasksRunnerOptions["default"] || {};
    nxJson.tasksRunnerOptions["default"].runner =
      nxJson.tasksRunnerOptions["default"].runner || "nx/tasks-runners/default";
    nxJson.tasksRunnerOptions["default"].options = nxJson.tasksRunnerOptions["default"].options || {};

    if (nxJson.tasksRunnerOptions["default"].options.cacheableOperations) {
      this.logger.warn(
        "add-caching",
        "The `tasksRunnerOptions.default.cacheableOperations` property already exists in `nx.json` and will be overwritten by your answers"
      );
    }

    nxJson.tasksRunnerOptions["default"].options.cacheableOperations = answers.cacheableOperations;

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
}

module.exports.AddCachingCommand = AddCachingCommand;
