"use strict";

// mocked modules
const ChildProcessUtilities = require("../src/ChildProcessUtilities");

// helpers
const callsBack = require("./helpers/callsBack");

// file under test
const npmRunScript = require("../src/utils/npm-run-script");

jest.mock("../src/ChildProcessUtilities");

describe("npm-run-script", () => {
  ChildProcessUtilities.exec.mockImplementation(callsBack());
  ChildProcessUtilities.spawnStreaming.mockImplementation(callsBack());

  afterEach(jest.clearAllMocks);

  describe("npmRunScript()", () => {
    it("runs an npm script in a directory", done => {
      expect.assertions(1);

      const script = "foo";
      const config = {
        args: ["--bar", "baz"],
        pkg: {
          location: "/test/npm/run/script",
        },
        npmClient: "npm",
      };

      npmRunScript(script, config, done);

      expect(ChildProcessUtilities.exec).lastCalledWith(
        "npm",
        ["run", script, "--bar", "baz"],
        {
          cwd: config.pkg.location,
        },
        done
      );
    });

    it("supports a different npmClient", done => {
      expect.assertions(1);

      const script = "foo";
      const config = {
        args: ["--bar", "baz"],
        pkg: {
          location: "/test/npm/run/script",
        },
        npmClient: "yarn",
      };

      npmRunScript(script, config, done);

      expect(ChildProcessUtilities.exec).lastCalledWith(
        "yarn",
        ["run", script, "--bar", "baz"],
        {
          cwd: config.pkg.location,
        },
        done
      );
    });
  });

  describe("npmRunScript.stream()", () => {
    it("runs an npm script in a package with streaming", done => {
      expect.assertions(1);

      const script = "foo";
      const config = {
        args: ["--bar", "baz"],
        pkg: {
          name: "qux",
          location: "/test/npm/run/script/stream",
        },
        npmClient: "npm",
      };

      npmRunScript.stream(script, config, done);

      expect(ChildProcessUtilities.spawnStreaming).lastCalledWith(
        "npm",
        ["run", script, "--bar", "baz"],
        {
          cwd: config.pkg.location,
        },
        config.pkg.name,
        done
      );
    });
  });
});
