import {
  Arguments,
  Command,
  CommandConfigOptions,
  filterProjects,
  getPackage,
  promptConfirmation,
  pulseTillDone,
  rimrafDir,
} from "@lerna/core";
import pMap from "p-map";
import path from "path";

interface CleanCommandConfigOptions extends CommandConfigOptions {
  yes?: boolean;
}

export function factory(argv: Arguments<CleanCommandConfigOptions>) {
  return new CleanCommand(argv);
}

export class CleanCommand extends Command<CleanCommandConfigOptions> {
  directoriesToDelete: string[] = [];

  override get requiresGit() {
    return false;
  }

  override initialize() {
    const filteredProjects = filterProjects(this.projectGraph, this.execOpts, this.options);
    this.directoriesToDelete = filteredProjects.map((p) => getPackage(p).nodeModulesLocation);

    if (this.options.yes) {
      return true;
    }

    this.logger.info("", "Removing the following directories:");
    this.logger.info(
      "clean",
      this.directoriesToDelete.map((dir: string) => path.relative(this.project.rootPath, dir)).join("\n")
    );

    return promptConfirmation("Proceed?");
  }

  override execute() {
    this.enableProgressBar();

    const tracker = this.logger["newItem"]("clean");
    const mapper = (dirPath: string) => {
      tracker.info("clean", "removing", dirPath);

      return pulseTillDone(rimrafDir(dirPath)).then(() => {
        tracker.completeWork(1);
      });
    };

    tracker.addWork(this.directoriesToDelete.length);

    return pMap(this.directoriesToDelete, mapper, { concurrency: this.concurrency }).then(() => {
      tracker.finish();
      this.logger.success("clean", "finished");
    });
  }
}

// The public shape of this module is a callable factory with the command class
// attached (module.exports = factory; module.exports.CleanCommand = CleanCommand),
// preserved for consumers of the lerna/commands/clean deep import.
const commonJsExport = Object.assign(factory, { CleanCommand });

export default commonJsExport;
export { commonJsExport as "module.exports" };
