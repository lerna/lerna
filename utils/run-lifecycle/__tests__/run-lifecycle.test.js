"use strict";

jest.mock("libnpm/run-script", () => jest.fn(() => Promise.resolve()));

const loggingOutput = require("@lerna-test/logging-output");
const runScript = require("libnpm/run-script");
const npmConf = require("@lerna/npm-conf");
const runLifecycle = require("../run-lifecycle");

describe("runLifecycle()", () => {
  it("skips packages without scripts", async () => {
    const pkg = {
      name: "no-scripts",
    };

    const result = await runLifecycle(pkg, "foo", new Map());

    expect(result).toBe(pkg);
    expect(runScript).not.toHaveBeenCalled();
  });

  it("skips packages without matching script", async () => {
    const pkg = {
      name: "missing-script",
      scripts: {
        test: "foo",
      },
    };

    const result = await runLifecycle(pkg, "bar", new Map());

    expect(result).toBe(pkg);
    expect(runScript).not.toHaveBeenCalled();
  });

  it("calls npm-lifecycle with prepared arguments", async () => {
    const pkg = {
      name: "test-name",
      version: "1.0.0-test",
      location: "test-location",
      scripts: {
        preversion: "test",
      },
    };
    const stage = "preversion";
    const opts = npmConf({ "custom-cli-flag": true });

    const result = await runLifecycle(pkg, stage, opts);

    expect(result).toBe(pkg);
    expect(runScript).toHaveBeenLastCalledWith(
      expect.objectContaining({
        name: pkg.name,
        version: pkg.version,
        location: pkg.location,
        _id: `${pkg.name}@${pkg.version}`,
      }),
      stage,
      pkg.location,
      expect.objectContaining({
        config: expect.objectContaining({
          prefix: pkg.location,
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
        prepublish: "test",
      },
    };
    const dir = pkg.location;
    const stage = "prepublish";
    const opts = new Map([
      ["ignore-prepublish", true],
      ["ignore-scripts", true],
      ["node-options", true],
      ["script-shell", true],
      ["scripts-prepend-node-path", true],
      ["unsafe-perm", true],
    ]);

    await runLifecycle(pkg, stage, opts);

    expect(runScript).toHaveBeenLastCalledWith(expect.objectContaining(pkg), stage, dir, {
      config: expect.objectContaining({
        prefix: dir,
      }),
      dir,
      failOk: false,
      log: expect.any(Object),
      ignorePrepublish: true,
      ignoreScripts: true,
      nodeOptions: true,
      scriptShell: true,
      scriptsPrependNodePath: true,
      unsafePerm: true,
    });
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

    const result = await runPackageLifecycle(pkg, stage);

    expect(result).toBe(pkg);
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

    try {
      await runPackageLifecycle(pkg, "prepublishOnly");
    } catch (err) {
      expect(err.code).toBe(123);
      expect(err.script).toBe("exit 123");
      expect(process.exitCode).toBe(123);
    }

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

    try {
      await runPackageLifecycle(pkg, "prepack");
    } catch (err) {
      expect(err.code).toBe(1);
      expect(err.script).toBe("a-thing-that-ends-poorly");
    }

    const [errorLog] = loggingOutput("error");
    expect(errorLog).toBe('"prepack" errored in "has-execution-error", exiting 1');
  });
});
