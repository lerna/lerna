import {
  Arguments,
  collectProjectUpdates,
  Command,
  CommandConfigOptions,
  listableFormatProjects,
  output,
} from "@lerna/core";

export function factory(argv: Arguments<ChangedCommandOptions>) {
  return new ChangedCommand(argv);
}

interface ChangedCommandOptions extends CommandConfigOptions {
  conventionalCommits?: boolean;
  conventionalGraduate?: boolean | string;
  forceConventionalGraduate?: boolean;
  forcePublish?: boolean | string;
}

export class ChangedCommand extends Command<ChangedCommandOptions> {
  result?: ReturnType<typeof listableFormatProjects>;

  override get otherCommandConfigs() {
    // back-compat
    return ["version", "publish"];
  }

  override initialize() {
    if (this.options.conventionalGraduate) {
      // provide artificial --conventional-commits so --conventional-graduate works
      this.options.conventionalCommits = true;

      if (this.options.forcePublish) {
        this.logger.warn("option", "--force-publish superseded by --conventional-graduate");
      }
    }

    const projectsWithPackage = Object.values(this.projectGraph.nodes).filter((node) => !!node.package);
    const updates = collectProjectUpdates(
      projectsWithPackage,
      this.projectGraph,
      this.execOpts,
      this.options
    );

    this.result = listableFormatProjects(updates, this.projectGraph, this.options);

    if (this.result.count === 0) {
      this.logger.info("", "No changed packages found");

      process.exitCode = 1;

      // prevents execute()
      return false;
    }
    return true;
  }

  override execute() {
    output(this.result?.text);

    this.logger.success(
      "found",
      "%d %s ready to publish",
      this.result?.count,
      this.result?.count === 1 ? "package" : "packages"
    );
  }
}
