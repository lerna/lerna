// @ts-check

"use strict";

const { Command } = require("@lerna/command");
const { Workspaces, workspaceRoot, readNxJson, createProjectGraphAsync, logger } = require("@nrwl/devkit");
const { printChanges, FsTree, flushChanges } = require("nx/src/generators/tree");
const { readProjectsConfigurationFromProjectGraph } = require("nx/src/project-graph/project-graph");
const { handleErrors } = require("nx/src/utils/params");

async function generatorImplementation(tree, schema) {
  console.log("Hello from generator!", { schema });

  tree.write('hello.txt', 'Hello world!');
}

class NeoVersionCommand extends Command {
  initialize() {
    return true;
  }

  async execute() {
    const ws = new Workspaces(workspaceRoot);
    const nxJson = readNxJson();
    const projectGraph = await createProjectGraphAsync();
    const projectsConfiguration = readProjectsConfigurationFromProjectGraph(projectGraph);
    const workspaceConfiguration = {
      ...nxJson,
      ...projectsConfiguration,
    };
    const isVerbose = this.argv["verbose"];

    return handleErrors(isVerbose, async () => {
      logger.info(`lerna doing schtuff...`);

      const cwd = process.cwd();

      const host = new FsTree(workspaceRoot, isVerbose);

      const task = await generatorImplementation(host, {
        cwd,
        relativeCwd: ws.relativeCwd(cwd),
        workspaceConfiguration,
      });
      const changes = host.listChanges();

      printChanges(changes);
      if (!this.argv.dryRun) {
        flushChanges(workspaceRoot, changes);
        if (task) {
          await task();
        }
      } else {
        logger.warn(`\nNOTE: The "dryRun" flag means no changes were made.`);
      }
    });
  }
}

module.exports = (argv) => new NeoVersionCommand(argv);
