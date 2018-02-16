"use strict";

jest.mock("../src/ChildProcessUtilities");

// mocked modules
const ChildProcessUtilities = require("../src/ChildProcessUtilities");

// helpers
const callsBack = require("./helpers/callsBack");

// file under test
const npmPublish = require("../src/utils/npm-publish");

describe("npm-publish", () => {
  ChildProcessUtilities.exec.mockImplementation(callsBack());

  const pkg = {
    name: "test",
    location: "/test/npmPublish",
    version: "1.10.100",
  };

  it("runs npm publish in a directory with --tag support", done => {
    npmPublish("published-tag", pkg, { npmClient: "npm" }, done);

    expect(ChildProcessUtilities.exec).lastCalledWith(
      "npm",
      ["publish", "--tag", "published-tag"],
      {
        cwd: pkg.location,
      },
      done
    );
  });

  it("trims trailing whitespace in tag parameter", done => {
    npmPublish("trailing-tag ", pkg, { npmClient: "npm" }, done);

    expect(ChildProcessUtilities.exec).lastCalledWith(
      "npm",
      ["publish", "--tag", "trailing-tag"],
      {
        cwd: pkg.location,
      },
      done
    );
  });

  it("supports custom registry", done => {
    const registry = "https://custom-registry/npmPublish";

    npmPublish("custom-registry", pkg, { npmClient: "npm", registry }, done);

    expect(ChildProcessUtilities.exec).lastCalledWith(
      "npm",
      ["publish", "--tag", "custom-registry"],
      {
        cwd: pkg.location,
        env: expect.objectContaining({
          npm_config_registry: registry,
        }),
      },
      done
    );
  });

  describe("with npmClient yarn", () => {
    it("appends --new-version to avoid interactive prompt", done => {
      npmPublish("yarn-publish", pkg, { npmClient: "yarn" }, done);

      expect(ChildProcessUtilities.exec).lastCalledWith(
        "yarn",
        ["publish", "--tag", "yarn-publish", "--new-version", pkg.version],
        {
          cwd: pkg.location,
        },
        done
      );
    });
  });
});
