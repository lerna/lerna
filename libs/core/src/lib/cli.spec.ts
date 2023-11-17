/* eslint-disable @nx/enforce-module-boundaries */
// nx-ignore-next-line
import { initFixtureFactory, loggingOutput } from "@lerna/test-helpers";
import { lernaCLI } from "./cli";
import { ValidationError } from "./validation-error";

const initFixture = initFixtureFactory(__dirname);

function prepare(cwd: any) {
  // DRY setup for yargs instance
  return lernaCLI([], cwd).exitProcess(false).detectLocale(false).showHelpOnFail(false).wrap(null);
}

async function parse(
  instance: {
    parse: (arg0: any, context: any) => void;
  },
  args: string[]
): Promise<any> {
  return instance.parse(args, {});
}

describe("core-cli", () => {
  let cwd: any;

  beforeAll(async () => {
    cwd = await initFixture("toposort");
  });

  it("provides global options", async () => {
    const cli = prepare(cwd);

    cli.command("test-cmd", "will pass");

    await parse(cli, [
      "test-cmd",
      "--loglevel=warn",
      "--concurrency=10",
      "--no-progress",
      "--no-sort",
      "--max-buffer=1024",
    ]);

    expect(cli.argv).toMatchObject({
      loglevel: "warn",
      concurrency: 10,
      progress: false,
      sort: false,
      maxBuffer: 1024,
    });
  });

  it("demands a command", async () => {
    const cli = prepare(cwd);
    await parse(cli, ["--loglevel", "silent"]);

    expect(loggingOutput("error")).toEqual([
      "A command is required. Pass --help to see all available commands and options.",
    ]);
  });

  it("recommends commands", async () => {
    const cli = prepare(cwd);

    cli.command("you", "shall not pass");

    await parse(cli, ["yooou"]);
    //await expect(cmd).rejects.toThrow("Unknown argument: yooou");

    const [unknownCmd, didYouMean, unkownArgument] = loggingOutput("error");

    expect(unknownCmd).toBe('Unknown command "yooou"');
    expect(didYouMean).toBe("Did you mean you?");
    expect(unkownArgument).toBe("Unknown argument: yooou");
  });

  it("does not re-log ValidationError messages", async () => {
    const cli = prepare(cwd);

    cli.command("boom", "explodey", {}, () => {
      throw new ValidationError("test", "go boom");
    });

    const cmd = parse(cli, ["boom"]);
    await expect(cmd).rejects.toThrow("go boom");

    expect(loggingOutput("error")).toEqual(["go boom"]);
  });

  it("does not re-log ValidationError messages (async)", async () => {
    const cli = prepare(cwd);

    cli.command("boom", "explodey", {}, async () => {
      throw new ValidationError("test", "...boom");
    });

    const cmd = parse(cli, ["boom"]);
    await expect(cmd).rejects.toThrow("...boom");

    expect(loggingOutput("error")).toEqual(["...boom"]);
  });

  it("does not log errors with a pkg property", async () => {
    const cli = prepare(cwd);

    cli.command("run", "a package error", {}, async () => {
      const err = new Error("oops") as any;
      err.pkg = {}; // actual content doesn't matter here
      throw err;
    });

    const cmd = parse(cli, ["run"]);
    await expect(cmd).rejects.toThrow("oops");

    expect(loggingOutput("error")).toEqual([]);
  });

  it("logs generic command errors with fallback exit code", async () => {
    const cli = prepare(cwd);
    const spy = jest.spyOn(cli, "exit");

    cli.command("handler", "a generic error", {}, async () => {
      const err = new Error("yikes");
      throw err;
    });

    const cmd = parse(cli, ["handler"]);
    await expect(cmd).rejects.toThrow("yikes");

    expect(loggingOutput("error")).toEqual(["yikes"]);
    expect(spy).toHaveBeenLastCalledWith(
      1,
      expect.objectContaining({
        message: "yikes",
      })
    );
  });

  it("preserves explicit exit codes", async () => {
    const cli = prepare(cwd);
    const spy = jest.spyOn(cli, "exit");

    cli.command("explicit", "exit code", {}, async () => {
      const err = new Error("fancy fancy") as any;
      err.exitCode = 127;
      throw err;
    });

    const cmd = parse(cli, ["explicit"]);
    await expect(cmd).rejects.toThrow("fancy fancy");

    expect(spy).toHaveBeenLastCalledWith(
      127,
      expect.objectContaining({
        message: "fancy fancy",
      })
    );
  });
});
