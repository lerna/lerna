"use strict";

jest.mock("npm-lifecycle", () => jest.fn(() => Promise.resolve()));

const log = require("npmlog");
const loggingOutput = require("@lerna-test/logging-output");
const runScript = require("npm-lifecycle");
const npmConf = require("@lerna/npm-conf");
const Package = require("@lerna/package");
const runLifecycle = require("../run-lifecycle");

describe("runLifecycle()", () => {
  it("skips packages without scripts", async () => {
    const pkg = {
      name: "no-scripts",
    };

    await runLifecycle(pkg, "foo", new Map());

    expect(runScript).not.toHaveBeenCalled();
  });

  it("skips packages without matching script", async () => {
    const pkg = {
      name: "missing-script",
      scripts: {
        test: "foo",
      },
    };

    await runLifecycle(pkg, "bar", new Map());

    expect(runScript).not.toHaveBeenCalled();
  });

  it("calls npm-lifecycle with prepared arguments", async () => {
    const pkg = new Package(
      {
        name: "test-name",
        version: "1.0.0-test",
        scripts: {
          preversion: "test",
        },
        engines: {
          node: ">= 8.9.0",
        },
      },
      "/test/location"
    );
    const stage = "preversion";
    const opts = npmConf({ "custom-cli-flag": true });

    await runLifecycle(pkg, stage, opts);

    expect(runScript).toHaveBeenLastCalledWith(
      expect.objectContaining({
        name: pkg.name,
        version: pkg.version,
        engines: {
          node: ">= 8.9.0",
        },
        _id: `${pkg.name}@${pkg.version}`,
      }),
      stage,
      pkg.location,
      expect.objectContaining({
        config: expect.objectContaining({
          "custom-cli-flag": true,
        }),
        dir: pkg.location,
        failOk: false,
        log: expect.any(Object),
        unsafePerm: true,
      })
    );
  });

  it("camelCases dashed-options", async () => {
    const pkg = {
      name: "dashed-name",
      version: "1.0.0-dashed",
      location: "dashed-location",
      scripts: {
        "dashed-options": "test",
      },
    };
    const dir = pkg.location;
    const stage = "dashed-options";
    const opts = new Map([
      ["ignore-prepublish", true],
      ["ignore-scripts", false],
      ["node-options", "--a-thing"],
      ["script-shell", "fish"],
      ["scripts-prepend-node-path", true],
      ["unsafe-perm", false],
    ]);

    await runLifecycle(pkg, stage, opts);

    expect(runScript).toHaveBeenLastCalledWith(expect.objectContaining(pkg), stage, dir, {
      config: expect.objectContaining({
        "node-options": "--a-thing",
        "script-shell": "fish",
      }),
      dir,
      failOk: false,
      log,
      nodeOptions: "--a-thing",
      scriptShell: "fish",
      scriptsPrependNodePath: true,
      unsafePerm: false,
    });
  });

  it("ignores prepublish when configured", async () => {
    const pkg = {
      name: "ignore-prepublish",
      scripts: {
        prepublish: "test",
      },
    };
    const stage = "prepublish";
    const opts = new Map().set("ignore-prepublish", true);

    await runLifecycle(pkg, stage, opts);

    expect(runScript).not.toHaveBeenCalled();
  });

  it("ignores scripts when configured", async () => {
    const pkg = {
      name: "ignore-scripts",
      scripts: {
        ignored: "test",
      },
    };
    const stage = "ignored";
    const opts = new Map().set("ignore-scripts", true);

    await runLifecycle(pkg, stage, opts);

    expect(runScript).not.toHaveBeenCalled();
  });

  it("omits circular opts", async () => {
    const pkg = {
      name: "circular-name",
      version: "1.0.0-circular",
      location: "circular-location",
      scripts: {
        prepack: "test",
      },
    };
    const stage = "prepack";
    const opts = new Map();

    await runLifecycle(pkg, stage, opts);

    const callOpts = runScript.mock.calls.pop().pop();

    expect(callOpts).not.toHaveProperty("config.log");
    expect(callOpts).not.toHaveProperty("config.logstream");
  });
});

describe("createRunner", () => {
  const runPackageLifecycle = runLifecycle.createRunner({ "other-cli-flag": 0 });

  it("creates partially-applied function with npm conf", async () => {
    const pkg = {
      name: "partially-applied",
      version: "1.2.3",
      location: "test",
      scripts: { version: "echo yay" },
    };
    const stage = "version";

    await runPackageLifecycle(pkg, stage);

    expect(runScript).toHaveBeenLastCalledWith(
      expect.any(Object),
      stage,
      pkg.location,
      expect.objectContaining({
        config: expect.objectContaining({
          "other-cli-flag": 0,
        }),
      })
    );
  });

  it("skips missing scripts block", async () => {
    const pkg = {
      name: "missing-scripts-block",
      version: "1.0.0",
      location: "test",
    };

    await runPackageLifecycle(pkg, "prepare");
    expect(runScript).not.toHaveBeenCalled();
  });

  it("skips missing script", async () => {
    const pkg = {
      name: "missing-script",
      version: "1.0.0",
      location: "test",
      scripts: { test: "echo foo" },
    };

    await runPackageLifecycle(pkg, "prepare");
    expect(runScript).not.toHaveBeenCalled();
  });

  it("logs script error and re-throws", async () => {
    runScript.mockImplementationOnce(({ scripts }, stage) => {
      const err = new Error("boom");

      // https://git.io/fAE3f
      err.errno = 123;
      err.script = scripts[stage];

      return Promise.reject(err);
    });

    const pkg = {
      name: "has-script-error",
      version: "1.0.0",
      location: "test",
      scripts: { prepublishOnly: "exit 123" },
    };

    await expect(runPackageLifecycle(pkg, "prepublishOnly")).rejects.toThrow(
      expect.objectContaining({
        code: 123,
        script: "exit 123",
      })
    );
    expect(process.exitCode).toBe(123);

    const [errorLog] = loggingOutput("error");
    expect(errorLog).toBe('"prepublishOnly" errored in "has-script-error", exiting 123');
  });

  it("defaults error exit code to 1", async () => {
    runScript.mockImplementationOnce(({ scripts }, stage) => {
      const err = new Error("kersplode");

      // errno only gets added when a proc closes, not from error
      err.script = scripts[stage];

      return Promise.reject(err);
    });

    const pkg = {
      name: "has-execution-error",
      version: "1.0.0",
      location: "test",
      scripts: { prepack: "a-thing-that-ends-poorly" },
    };

    await expect(runPackageLifecycle(pkg, "prepack")).rejects.toThrow(
      expect.objectContaining({
        code: 1,
        script: "a-thing-that-ends-poorly",
      })
    );

    const [errorLog] = loggingOutput("error");
    expect(errorLog).toBe('"prepack" errored in "has-execution-error", exiting 1');
  });
});
