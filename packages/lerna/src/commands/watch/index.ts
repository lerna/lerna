import {
  Command,
  CommandConfigOptions,
  filterProjects,
  ProjectGraphProjectNodeWithPackage,
  ValidationError,
} from "@lerna/core";
import { watch } from "nx/src/command-line/watch/watch";

module.exports = function factory(argv: NodeJS.Process["argv"]) {
  return new WatchCommand(argv);
};

interface WatchCommandOptions extends CommandConfigOptions {
  command: string;
}

class WatchCommand extends Command<WatchCommandOptions> {
  private filteredProjects: ProjectGraphProjectNodeWithPackage[] = [];
  private count = 0;
  private packagePlural = "packages";

  override get requiresGit() {
    return false;
  }

  override async initialize() {
    if (!this.options.command) {
      throw new ValidationError("ENOCOMMAND", "A command to execute is required");
    }

    // catch allows missing file to pass without breaking chain
    this.filteredProjects = filterProjects(this.projectGraph, this.execOpts, this.options);

    this.count = this.filteredProjects.length;
    this.packagePlural = this.count === 1 ? "package" : "packages";
  }

  override async execute() {
    this.logger.info(
      "watch",
      "Executing command %j on changes in %d %s.",
      this.options.command,
      this.count,
      this.packagePlural
    );

    const projectNames = this.filteredProjects.map((p) => p.name);

    await watch({
      command: this.options.command,
      projectNameEnvName: "LERNA_PACKAGE_NAME",
      fileChangesEnvName: "LERNA_FILE_CHANGES",
      includeDependentProjects: false, // dependent projects are accounted for via lerna filter options
      projects: projectNames,
      verbose: this.options.verbose,
    });
  }
}

module.exports.WatchCommand = WatchCommand;
