import { npmRunScript, npmRunScriptStreaming } from "./npm-run-script";

jest.mock("@lerna/child-process");

// eslint-disable-next-line @typescript-eslint/no-var-requires
const childProcess = require("@lerna/child-process");

describe("npm-run-script", () => {
  childProcess.exec.mockResolvedValue();
  childProcess.spawnStreaming.mockResolvedValue();

  describe("npmRunScript()", () => {
    it("runs an npm script in a directory", async () => {
      const script = "foo";
      const config = {
        args: ["--bar", "baz"],
        pkg: {
          location: "/test/npm/run/script",
        },
        npmClient: "npm",
      };

      await npmRunScript(script, config);

      expect(childProcess.exec).toHaveBeenLastCalledWith("npm", ["run", script, "--bar", "baz"], {
        cwd: config.pkg.location,
        env: {},
        pkg: config.pkg,
        reject: true,
        windowsHide: false,
      });
    });

    it("accepts opts.reject", async () => {
      const script = "foo";
      const config = {
        args: [],
        pkg: {
          location: "/test/npm/run/script",
        },
        npmClient: "npm",
        reject: false,
      };

      await npmRunScript(script, config);

      expect(childProcess.exec).toHaveBeenLastCalledWith("npm", ["run", script], {
        cwd: config.pkg.location,
        env: {},
        pkg: config.pkg,
        reject: false,
        windowsHide: false,
      });
    });

    it("supports a different npmClient", async () => {
      const script = "foo";
      const config = {
        args: ["--bar", "baz"],
        pkg: {
          location: "/test/npm/run/script",
        },
        npmClient: "yarn",
      };

      await npmRunScript(script, config);

      expect(childProcess.exec).toHaveBeenLastCalledWith("yarn", ["run", script, "--bar", "baz"], {
        cwd: config.pkg.location,
        env: {},
        pkg: config.pkg,
        reject: true,
        windowsHide: false,
      });
    });
  });

  describe("npmRunScriptStreaming()", () => {
    it("runs an npm script in a package with streaming", async () => {
      const script = "foo";
      const config = {
        args: ["--bar", "baz"],
        pkg: {
          name: "qux",
          location: "/test/npm/run/script/stream",
        },
        prefix: true,
        npmClient: "npm",
      };

      await npmRunScriptStreaming(script, config);

      expect(childProcess.spawnStreaming).toHaveBeenLastCalledWith(
        "npm",
        ["run", script, "--bar", "baz"],
        {
          cwd: config.pkg.location,
          env: {
            LERNA_PACKAGE_NAME: "qux",
          },
          pkg: config.pkg,
          reject: true,
          windowsHide: false,
        },
        config.pkg.name
      );
    });

    it("accepts opts.reject", async () => {
      const script = "foo";
      const config = {
        args: [],
        pkg: {
          name: "qux",
          location: "/test/npm/run/script/stream",
        },
        npmClient: "npm",
        reject: false,
      };

      await npmRunScriptStreaming(script, config);

      expect(childProcess.spawnStreaming).toHaveBeenLastCalledWith(
        "npm",
        ["run", script],
        {
          cwd: config.pkg.location,
          env: {
            LERNA_PACKAGE_NAME: "qux",
          },
          pkg: config.pkg,
          reject: false,
          windowsHide: false,
        },
        undefined
      );
    });
  });
});
