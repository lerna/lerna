import { Arguments, Command, CommandConfigOptions, log } from "@lerna/core";
import { repair } from "nx/src/command-line/repair/repair";
import { createRequire } from "node:module";
import migrationsJson from "../../../migrations.json" with { type: "json" };

const require = createRequire(import.meta.url);

export function factory(argv: Arguments<CommandConfigOptions>) {
  return new RepairCommand(argv);
}

export class RepairCommand extends Command {
  constructor(argv: Arguments<CommandConfigOptions>) {
    super(argv, { skipValidations: true });
  }

  override initialize() {}

  override async execute() {
    this.configureNxOutput();
    const verbose = this.options?.verbose ? true : log.level === "verbose";

    const lernaMigrations = Object.entries(migrationsJson.generators).map(
      ([name, migration]: [string, any]) => {
        return {
          package: "lerna",
          cli: "nx",
          name,
          description: migration.description,
          version: migration.version,
        } as const;
      }
    );

    await repair({ verbose }, lernaMigrations);
  }

  configureNxOutput() {
    try {
      const nxOutput = require("nx/src/utils/output");
      nxOutput.output.cliName = "Lerna";
      nxOutput.output.formatCommand = (taskId: number) => taskId;
      return nxOutput;
    } catch (err) {
      // TODO: refactor based on TS feedback
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      this.logger.error("There was a critical issue when trying to execute the repair command.");
      // Rethrow so that the lerna logger can automatically handle the unexpected error
      throw err;
    }
  }
}

const commonJsExport = Object.assign(factory, { RepairCommand });

export default commonJsExport;
export { commonJsExport as "module.exports" };
