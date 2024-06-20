import { log } from "@lerna/core";
import { Command } from "@lerna/legacy-core";
import {
  joinPathFragments,
  NxJsonConfiguration,
  readJsonFile,
  workspaceRoot,
  writeJsonFile,
} from "@nx/devkit";
import execa from "execa";
import { appendFile } from "fs-extra";
import inquirer from "inquirer";

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
    const nxJsonPath = joinPathFragments(workspaceRoot, "nx.json");
    let nxJson: NxJsonConfiguration = {};
    try {
      nxJson = readJsonFile(nxJsonPath);
      // eslint-disable-next-line no-empty
    } catch {}

    this.logger.info(
      "add-caching",
      "Please answer the following questions about the scripts found in your workspace in order to generate task runner configuration"
    );
    process.stdout.write("\n");

    log.pause();

    const existingTargetDefaults = this.uniqueScriptNames.filter(
      (scriptName) => nxJson.targetDefaults?.[scriptName]?.dependsOn?.length
    );
    const { targetDefaults } = await inquirer.prompt<{ targetDefaults: UserAnswers["targetDefaults"] }>([
      {
        type: "checkbox",
        name: "targetDefaults",
        message:
          "Which scripts need to be run in order? (e.g. before building a project, dependent projects must be built.)\n",
        choices: this.uniqueScriptNames,
        default: existingTargetDefaults,
      },
    ]);

    const existingCacheableOperations = this.uniqueScriptNames.filter(
      (scriptName) => nxJson.targetDefaults?.[scriptName]?.cache
    );
    const { cacheableOperations } = await inquirer.prompt<{
      cacheableOperations: UserAnswers["cacheableOperations"];
    }>([
      {
        type: "checkbox",
        name: "cacheableOperations",
        message:
          "Which scripts are cacheable? (Produce the same output given the same input, e.g. build, test and lint usually are, serve and start are not.)\n",
        choices: this.uniqueScriptNames,
        default: existingCacheableOperations,
      },
    ]);

    const scriptOutputs: UserAnswers["scriptOutputs"] = {};

    for (const scriptName of cacheableOperations) {
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

    this.convertAnswersToNxConfig({ cacheableOperations, targetDefaults, scriptOutputs }, nxJsonPath, nxJson);

    await this.configureGitIgnore();

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

  private convertAnswersToNxConfig(answers: UserAnswers, nxJsonPath: string, nxJson: NxJsonConfiguration) {
    if (nxJson.targetDefaults) {
      this.logger.warn(
        "add-caching",
        "The `targetDefaults` property already exists in `nx.json` and will be overwritten by your answers"
      );
    }

    nxJson.targetDefaults = nxJson.targetDefaults || {};

    for (const scriptName of this.uniqueScriptNames) {
      nxJson.targetDefaults[scriptName] = nxJson.targetDefaults[scriptName] || {};
      if (answers.cacheableOperations.includes(scriptName)) {
        nxJson.targetDefaults[scriptName].cache = true;
      } else {
        delete nxJson.targetDefaults[scriptName].cache;
      }
      // always set dependsOn, even if empty array, so that `lerna run` knows not to assume any dependencies
      nxJson.targetDefaults[scriptName].dependsOn = answers.targetDefaults.includes(scriptName)
        ? [`^${scriptName}`]
        : [];
    }

    for (const [scriptName, scriptAnswerData] of Object.entries(answers.scriptOutputs)) {
      if (!scriptAnswerData[scriptName]) {
        continue;
      }
      nxJson.targetDefaults[scriptName] = nxJson.targetDefaults[scriptName] || {};
      nxJson.targetDefaults[scriptName].outputs = [`{projectRoot}/${scriptAnswerData[scriptName]}`];
    }

    writeJsonFile(nxJsonPath, nxJson);
  }

  private async configureGitIgnore(): Promise<void> {
    try {
      await execa("git", ["check-ignore", ".nx/cache"]);
      // .nx/cache is already ignored - no need to update .gitignore
    } catch (e) {
      try {
        await appendFile(joinPathFragments(workspaceRoot, ".gitignore"), "\n.nx/cache\n");
      } catch (e) {
        this.logger.warn(
          "add-caching",
          "Failed to update `.gitignore` with `.nx/cache`. Please update manually."
        );
      }
    }
  }
}

module.exports.AddCachingCommand = AddCachingCommand;
