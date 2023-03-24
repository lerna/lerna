import { Command, filterProjects, listableFormatProjects, output } from "@lerna/core";

module.exports = function factory(argv: NodeJS.Process["argv"]) {
  return new ListCommand(argv);
};

class ListCommand extends Command {
  // TODO: refactor based on TS feedback
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  private result: { text: string; count: number };

  get requiresGit() {
    return false;
  }

  override async initialize() {
    const filteredProjects = await filterProjects(this.projectGraph, this.execOpts, this.options);

    this.logger.silly("AUSTIN", "TEST");

    this.result = listableFormatProjects(filteredProjects, this.projectGraph.dependencies, this.options);
  }

  override execute() {
    // piping to `wc -l` should not yield 1 when no packages matched
    if (this.result.text.length) {
      output(this.result.text);
    }

    this.logger.success(
      "found",
      "%d %s",
      this.result.count,
      this.result.count === 1 ? "package" : "packages"
    );
  }
}

module.exports.ListCommand = ListCommand;
