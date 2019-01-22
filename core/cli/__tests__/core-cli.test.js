"use strict";

const ValidationError = require("@lerna/validation-error");
const loggingOutput = require("@lerna-test/logging-output");
const initFixture = require("@lerna-test/init-fixture")(__dirname);
const coreCLI = require("..");

function prepare(cwd) {
  // DRY setup for yargs instance
  return coreCLI([], cwd)
    .exitProcess(false)
    .detectLocale(false)
    .showHelpOnFail(false)
    .wrap(null);
}

async function parse(instance, args) {
  return new Promise((resolve, reject) => {
    instance.parse(args, (exitError, argv, output) => {
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
  let cwd;

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

    try {
      await parse(cli, ["--loglevel", "silent"]);
    } catch (exitError) {
      expect(exitError.message).toMatch("A command is required.");
    }

    expect.hasAssertions();
  });

  it("recommends commands", async () => {
    const cli = prepare(cwd);

    cli.command("you", "shall not pass");

    try {
      await parse(cli, ["yooou"]);
    } catch (exitError) {
      const [unknownCmd, didYouMean] = loggingOutput("error");

      expect(unknownCmd).toBe('Unknown command "yooou"');
      expect(didYouMean).toBe("Did you mean you?");
      expect(exitError.message).toBe("Unknown argument: yooou");
    }

    expect.hasAssertions();
  });

  it("does not re-log ValidationError messages", async () => {
    const cli = prepare(cwd);

    cli.command("boom", "explodey", {}, () => {
      throw new ValidationError("test", "go boom");
    });

    try {
      await parse(cli, ["boom"]);
    } catch (exitError) {
      expect(exitError.name).toBe("ValidationError");
      expect(exitError.message).toBe("go boom");
      expect(loggingOutput("error")).toEqual(["go boom"]);
    }

    expect.hasAssertions();
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
      const err = new Error("oops");
      err.pkg = {}; // actual content doesn't matter here
      throw err;
    });

    try {
      await parse(cli, ["run"]);
    } catch (exitError) {
      expect(exitError.message).toBe("oops");
      expect(loggingOutput("error")).toEqual([]);
    }

    expect.hasAssertions();
  });

  it("logs generic command errors", async () => {
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

  it("preserves exotic exit codes", async () => {
    const cli = prepare(cwd);
    const spy = jest.spyOn(cli, "exit");

    cli.command("exotic", "exit code", {}, async () => {
      const err = new Error("fancy fancy");
      err.code = 127;
      throw err;
    });

    // paradoxically, this does NOT reject...
    await parse(cli, ["exotic"]);

    expect(spy).toHaveBeenLastCalledWith(
      127,
      expect.objectContaining({
        message: "fancy fancy",
      })
    );
  });
});
