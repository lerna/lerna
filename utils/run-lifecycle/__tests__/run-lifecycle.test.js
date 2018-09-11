"use strict";

jest.mock("npm-lifecycle", () => jest.fn(() => Promise.resolve()));

const loggingOutput = require("@lerna-test/logging-output");
const npmLifecycle = require("npm-lifecycle");
const npmConf = require("@lerna/npm-conf");
const runLifecycle = require("../run-lifecycle");

describe("default export", () => {
  it("calls npm-lifecycle with prepared arguments", async () => {
    const pkg = {
      name: "test-name",
      version: "1.0.0-test",
      location: "test-location",
    };
    const stage = "preversion";
    const config = npmConf({ "custom-cli-flag": true });

    const result = await runLifecycle(pkg, stage, config);

    expect(result).toBe(pkg);
    expect(npmLifecycle).lastCalledWith(
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
    expect(npmLifecycle).lastCalledWith(
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
    expect(npmLifecycle).not.toBeCalled();
  });

  it("skips missing script", async () => {
    const pkg = {
      name: "missing-script",
      version: "1.0.0",
      location: "test",
      scripts: { test: "echo foo" },
    };

    await runPackageLifecycle(pkg, "prepare");
    expect(npmLifecycle).not.toBeCalled();
  });

  it("logs script error and re-throws", async () => {
    npmLifecycle.mockImplementationOnce(({ scripts }, stage) => {
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
    npmLifecycle.mockImplementationOnce(({ scripts }, stage) => {
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
