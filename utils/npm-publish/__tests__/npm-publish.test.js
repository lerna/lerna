"use strict";

jest.mock("@lerna/child-process");
jest.mock("@lerna/has-npm-version");
jest.mock("@lerna/log-packed");
jest.mock("fs-extra");

// mocked modules
const ChildProcessUtilities = require("@lerna/child-process");
const fs = require("fs-extra");

// helpers
const path = require("path");
const Package = require("@lerna/package");

// file under test
const npmPublish = require("..");

describe("npm-publish", () => {
  fs.remove.mockResolvedValue();
  ChildProcessUtilities.exec.mockResolvedValue();

  const rootPath = path.normalize("/test");
  const pkg = new Package(
    { name: "test", version: "1.10.100" },
    path.join(rootPath, "npmPublish/test"),
    rootPath
  );

  // technically decorated in npmPack, stubbed here
  pkg.tarball = {
    filename: "test-1.10.100.tgz",
  };

  it("runs npm publish in a directory with --tag support", async () => {
    const result = await npmPublish(pkg, "published-tag", { npmClient: "npm" });

    expect(result).toBe(pkg);
    expect(ChildProcessUtilities.exec).toHaveBeenLastCalledWith(
      "npm",
      ["publish", "--ignore-scripts", "--tag", "published-tag", "test-1.10.100.tgz"],
      {
        cwd: pkg.location,
        env: {},
        pkg,
      }
    );
    expect(fs.remove).toHaveBeenLastCalledWith(path.join(pkg.location, pkg.tarball.filename));
  });

  it("does not pass --tag when none present (npm default)", async () => {
    await npmPublish(pkg, undefined, { npmClient: "npm" });

    expect(ChildProcessUtilities.exec).toHaveBeenLastCalledWith(
      "npm",
      ["publish", "--ignore-scripts", "test-1.10.100.tgz"],
      {
        cwd: pkg.location,
        env: {},
        pkg,
      }
    );
  });

  it("trims trailing whitespace in tag parameter", async () => {
    await npmPublish(pkg, "trailing-tag ", { npmClient: "npm" });

    expect(ChildProcessUtilities.exec).toHaveBeenLastCalledWith(
      "npm",
      ["publish", "--ignore-scripts", "--tag", "trailing-tag", "test-1.10.100.tgz"],
      {
        cwd: pkg.location,
        env: {},
        pkg,
      }
    );
  });

  it("supports custom registry", async () => {
    const registry = "https://custom-registry/npmPublish";

    await npmPublish(pkg, "custom-registry", { npmClient: "npm", registry });

    expect(ChildProcessUtilities.exec).toHaveBeenLastCalledWith(
      "npm",
      ["publish", "--ignore-scripts", "--tag", "custom-registry", "test-1.10.100.tgz"],
      {
        cwd: pkg.location,
        env: {
          npm_config_registry: registry,
        },
        pkg,
      }
    );
  });

  describe("with npmClient yarn", () => {
    it("appends --new-version to avoid interactive prompt", async () => {
      await npmPublish(pkg, "yarn-publish", { npmClient: "yarn" });

      expect(ChildProcessUtilities.exec).toHaveBeenLastCalledWith(
        "yarn",
        [
          "publish",
          "--ignore-scripts",
          "--tag",
          "yarn-publish",
          "--new-version",
          pkg.version,
          "--non-interactive",
          "--no-git-tag-version",
          "test-1.10.100.tgz",
        ],
        {
          cwd: pkg.location,
          env: {},
          pkg,
        }
      );
    });
  });
});
