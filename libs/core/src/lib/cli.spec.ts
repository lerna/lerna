/* eslint-disable @nrwl/nx/enforce-module-boundaries */
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
  instance: { parse: (arg0: any, arg1: (exitError: any, argv: any, output: any) => void) => void },
  args: string[]
): Promise<any> {
  return new Promise((resolve, reject) => {
    instance.parse(args, (exitError: any, argv: any, output: any) => {
      if (exitError) {
        // parity with synchronous errors
        Object.assign(exitError, { argv, output });
        reject(exitError);
      } else {
        resolve({ exitError, argv, output });
      }
    });
  });
}

describe("core-cli", () => {
  let cwd: any;

  beforeAll(async () => {
    cwd = await initFixture("toposort");
  });

  it("provides global options", async () => {
    const cli = prepare(cwd);

    cli.command("test-cmd", "will pass");

    const { argv } = await parse(cli, [
      "test-cmd",
      "--loglevel=warn",
      "--concurrency=10",
      "--no-progress",
      "--no-sort",
      "--max-buffer=1024",
    ]);

    expect(argv).toMatchObject({
      loglevel: "warn",
      concurrency: 10,
      progress: false,
      sort: false,
      maxBuffer: 1024,
    });
  });

  it("demands a command", async () => {
    const cli = prepare(cwd);
    const cmd = parse(cli, ["--loglevel", "silent"]);

    await expect(cmd).rejects.toThrow("A command is required.");
  });

  it("recommends commands", async () => {
    const cli = prepare(cwd);

    cli.command("you", "shall not pass");

    const cmd = parse(cli, ["yooou"]);
    await expect(cmd).rejects.toThrow("Unknown argument: yooou");

    const [unknownCmd, didYouMean] = loggingOutput("error");

    expect(unknownCmd).toBe('Unknown command "yooou"');
    expect(didYouMean).toBe("Did you mean you?");
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

    // paradoxically, this does NOT reject...
    await parse(cli, ["boom"]);

    expect(loggingOutput("error")).toEqual(["...boom"]);
  });

  it("does not log errors with a pkg property", async () => {
    const cli = prepare(cwd);

    cli.command("run", "a package error", {}, () => {
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

    // paradoxically, this does NOT reject...
    await parse(cli, ["handler"]);

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

    // paradoxically, this does NOT reject...
    await parse(cli, ["explicit"]);

    expect(spy).toHaveBeenLastCalledWith(
      127,
      expect.objectContaining({
        message: "fancy fancy",
      })
    );
  });
});
