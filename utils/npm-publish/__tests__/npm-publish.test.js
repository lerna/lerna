"use strict";

jest.mock("@lerna/child-process");

// mocked modules
const ChildProcessUtilities = require("@lerna/child-process");

// file under test
const npmPublish = require("..");

describe("npm-publish", () => {
  ChildProcessUtilities.exec.mockResolvedValue();

  const pkg = {
    name: "test",
    location: "/test/npmPublish",
    version: "1.10.100",
  };

  it("runs npm publish in a directory with --tag support", async () => {
    await npmPublish("published-tag", pkg, { npmClient: "npm" });

    expect(ChildProcessUtilities.exec).lastCalledWith("npm", ["publish", "--tag", "published-tag"], {
      cwd: pkg.location,
    });
  });

  it("trims trailing whitespace in tag parameter", async () => {
    await npmPublish("trailing-tag ", pkg, { npmClient: "npm" });

    expect(ChildProcessUtilities.exec).lastCalledWith("npm", ["publish", "--tag", "trailing-tag"], {
      cwd: pkg.location,
    });
  });

  it("supports custom registry", async () => {
    const registry = "https://custom-registry/npmPublish";

    await npmPublish("custom-registry", pkg, { npmClient: "npm", registry });

    expect(ChildProcessUtilities.exec).lastCalledWith("npm", ["publish", "--tag", "custom-registry"], {
      cwd: pkg.location,
      env: expect.objectContaining({
        npm_config_registry: registry,
      }),
      extendEnv: false,
    });
  });

  describe("with npmClient yarn", () => {
    it("appends --new-version to avoid interactive prompt", async () => {
      await npmPublish("yarn-publish", pkg, { npmClient: "yarn" });

      expect(ChildProcessUtilities.exec).lastCalledWith(
        "yarn",
        ["publish", "--tag", "yarn-publish", "--new-version", pkg.version],
        {
          cwd: pkg.location,
        }
      );
    });
  });
});
