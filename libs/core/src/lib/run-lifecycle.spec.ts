/* eslint-disable @nrwl/nx/enforce-module-boundaries */
// nx-ignore-next-line
import { loggingOutput } from "@lerna/test-helpers";
import { Package } from "./package";
import { createRunner, runLifecycle } from "./run-lifecycle";

// TODO: remove concatenation workaround once the issue with !test-helpers not being respected is resolved
require("@lerna" + "/test-helpers/src/lib/silence-logging");

jest.mock("@npmcli/run-script", () => jest.fn(() => Promise.resolve({ stdout: "" })));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const runScript = require("@npmcli/run-script");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const npmConf = require("./npm-conf");

describe("runLifecycle()", () => {
  it("skips packages without scripts", async () => {
    const pkg = {
      name: "no-scripts",
    } as any;

    await runLifecycle(pkg, "foo", new Map() as any);

    expect(runScript).not.toHaveBeenCalled();
  });

  it("skips packages without matching script", async () => {
    const pkg = {
      name: "missing-script",
      scripts: {
        test: "foo",
      },
    };

    await runLifecycle(pkg as any, "bar", new Map() as any);

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
      } as any,
      "/test/location"
    );
    const stage = "preversion";
    const opts = npmConf({ "custom-cli-flag": true });

    await runLifecycle(pkg, stage, opts);

    expect(runScript).toHaveBeenLastCalledWith(
      expect.objectContaining({
        pkg: expect.objectContaining({
          name: pkg.name,
          version: pkg.version,
          engines: {
            node: ">= 8.9.0",
          },
          _id: `${pkg.name}@${pkg.version}`,
        }),
        event: stage,
        path: pkg.location,
        args: [],
      })
    );
  });

  it("passes through the value for script-shell from npm config", async () => {
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
    const opts = {
      "script-shell": "fish",
    };

    await runLifecycle(pkg as any, stage, opts as any);

    expect(runScript).toHaveBeenLastCalledWith(
      expect.objectContaining({
        event: stage,
        path: dir,
        args: [],
        scriptShell: "fish",
      })
    );
  });

  it("ignores prepublish when configured", async () => {
    const pkg = {
      name: "ignore-prepublish",
      scripts: {
        prepublish: "test",
      },
    };
    const stage = "prepublish";
    const opts = {
      "ignore-prepublish": true,
    };

    await runLifecycle(pkg as any, stage, opts as any);

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
    const opts = {
      "ignore-scripts": true,
    };

    await runLifecycle(pkg as any, stage, opts as any);

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
    const opts = {};

    await runLifecycle(pkg as any, stage, opts);

    const callOpts = runScript.mock.calls.pop().pop();

    expect(callOpts).not.toHaveProperty("config.log");
    expect(callOpts).not.toHaveProperty("config.logstream");
  });
});

describe("createRunner", () => {
  const runPackageLifecycle = createRunner({ "other-cli-flag": 0 });

  it("skips missing scripts block", async () => {
    const pkg = {
      name: "missing-scripts-block",
      version: "1.0.0",
      location: "test",
    };

    await runPackageLifecycle(pkg as any, "prepare");
    expect(runScript).not.toHaveBeenCalled();
  });

  it("skips missing script", async () => {
    const pkg = {
      name: "missing-script",
      version: "1.0.0",
      location: "test",
      scripts: { test: "echo foo" },
    };

    await runPackageLifecycle(pkg as any, "prepare");
    expect(runScript).not.toHaveBeenCalled();
  });

  it("logs script error and re-throws", async () => {
    runScript.mockImplementationOnce(({ pkg, event }: any) => {
      const err = new Error("boom") as any;

      err.code = 123;
      err.script = pkg.scripts[event];

      return Promise.reject(err);
    });

    const pkg = {
      name: "has-script-error",
      version: "1.0.0",
      location: "test",
      scripts: { prepublishOnly: "exit 123" },
    };

    await expect(runPackageLifecycle(pkg as any, "prepublishOnly")).rejects.toThrow(
      expect.objectContaining({
        exitCode: 123,
        script: "exit 123",
      })
    );
    expect(process.exitCode).toBe(123);

    const [errorLog] = loggingOutput("error");
    expect(errorLog).toBe('"prepublishOnly" errored in "has-script-error", exiting 123');
  });

  it("defaults error exit code to 1", async () => {
    runScript.mockImplementationOnce(({ pkg, event }: any) => {
      const err = new Error("kersplode") as any;

      // errno only gets added when a proc closes, not from error
      err.script = pkg.scripts[event];

      return Promise.reject(err);
    });

    const pkg = {
      name: "has-execution-error",
      version: "1.0.0",
      location: "test",
      scripts: { prepack: "a-thing-that-ends-poorly" },
    };

    await expect(runPackageLifecycle(pkg as any, "prepack")).rejects.toThrow(
      expect.objectContaining({
        exitCode: 1,
        script: "a-thing-that-ends-poorly",
      })
    );

    const [errorLog] = loggingOutput("error");
    expect(errorLog).toBe('"prepack" errored in "has-execution-error", exiting 1');
  });
});
