import { Command, getFilteredPackages, listableFormat, output } from "@lerna/core";

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

  override initialize() {
    let chain = Promise.resolve();

    // TODO: refactor based on TS feedback
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    chain = chain.then(() => getFilteredPackages(this.packageGraph, this.execOpts, this.options));
    chain = chain.then((filteredPackages) => {
      // TODO: refactor based on TS feedback
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      this.result = listableFormat(filteredPackages, this.options);
    });

    return chain;
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
