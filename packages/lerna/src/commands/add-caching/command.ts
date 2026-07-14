import type { CommandModule } from "yargs";

/**
 * @see https://github.com/yargs/yargs/blob/main/docs/advanced.md#providing-a-command-module
 */
const command: CommandModule = {
  command: "add-caching",
  describe: "Interactive prompt to generate task runner configuration",
  builder(yargs) {
    return yargs;
  },
  async handler(argv) {
    return (await import(".")).factory(argv);
  },
};

export default command;
export { command as "module.exports" };
