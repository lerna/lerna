"use strict";

jest.mock("../src/ChildProcessUtilities");

// mocked modules
const ChildProcessUtilities = require("../src/ChildProcessUtilities");

// file under test
const npmRunScript = require("../src/utils/npm-run-script");

describe("npm-run-script", () => {
  ChildProcessUtilities.exec.mockResolvedValue();
  ChildProcessUtilities.spawnStreaming.mockResolvedValue();

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

      expect(ChildProcessUtilities.exec).lastCalledWith("npm", ["run", script, "--bar", "baz"], {
        cwd: config.pkg.location,
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

      expect(ChildProcessUtilities.exec).lastCalledWith("yarn", ["run", script, "--bar", "baz"], {
        cwd: config.pkg.location,
      });
    });
  });

  describe("npmRunScript.stream()", () => {
    it("runs an npm script in a package with streaming", async () => {
      const script = "foo";
      const config = {
        args: ["--bar", "baz"],
        pkg: {
          name: "qux",
          location: "/test/npm/run/script/stream",
        },
        npmClient: "npm",
      };

      await npmRunScript.stream(script, config);

      expect(ChildProcessUtilities.spawnStreaming).lastCalledWith(
        "npm",
        ["run", script, "--bar", "baz"],
        {
          cwd: config.pkg.location,
        },
        config.pkg.name
      );
    });
  });
});
