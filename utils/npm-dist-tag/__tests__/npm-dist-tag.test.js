"use strict";

jest.mock("@lerna/child-process");

const os = require("os");

// mocked modules
const ChildProcessUtilities = require("@lerna/child-process");

// file under test
const npmDistTag = require("..");

describe("dist-tag", () => {
  ChildProcessUtilities.exec.mockResolvedValue();

  describe("npmDistTag.add()", () => {
    const pkg = {
      name: "foo-pkg",
      version: "1.0.0",
      location: "/test/npm/dist-tag/add",
    };
    const tag = "added-tag";
    const registry = "https://custom-registry/add";

    it("adds a dist-tag for a given package@version", async () => {
      await npmDistTag.add(pkg, tag, {});

      expect(ChildProcessUtilities.exec).lastCalledWith("npm", ["dist-tag", "add", "foo-pkg@1.0.0", tag], {
        cwd: pkg.location,
        env: {},
        pkg,
      });
    });

    it("supports custom registry", async () => {
      await npmDistTag.add(pkg, tag, { registry });

      expect(ChildProcessUtilities.exec).lastCalledWith("npm", ["dist-tag", "add", "foo-pkg@1.0.0", tag], {
        cwd: pkg.location,
        env: {
          npm_config_registry: registry,
        },
        pkg,
      });
    });
  });

  describe("npmDistTag.remove()", () => {
    const pkg = {
      name: "bar-pkg",
      location: "/test/npm/dist-tag/remove",
    };
    const tag = "removed-tag";
    const registry = "https://custom-registry/remove";

    it("removes a dist-tag for a given package", async () => {
      await npmDistTag.remove(pkg, tag, {});

      expect(ChildProcessUtilities.exec).lastCalledWith("npm", ["dist-tag", "rm", pkg.name, tag], {
        cwd: pkg.location,
        env: {},
        pkg,
      });
    });

    it("supports custom registry", async () => {
      await npmDistTag.remove(pkg, tag, { registry });

      expect(ChildProcessUtilities.exec).lastCalledWith("npm", ["dist-tag", "rm", pkg.name, tag], {
        cwd: pkg.location,
        env: {
          npm_config_registry: registry,
        },
        pkg,
      });
    });
  });

  describe("npmDistTag.check()", () => {
    const pkg = {
      name: "baz-pkg",
      location: "/test/npm/dist-tag/check",
    };
    const registry = "https://custom-registry/check";

    it("tests if a dist-tag for a given package exists", () => {
      ChildProcessUtilities.execSync.mockReturnValue(["latest", "target-tag"].join(os.EOL));

      expect(npmDistTag.check(pkg, "target-tag", {})).toBe(true);
      expect(npmDistTag.check(pkg, "latest", {})).toBe(true);
      expect(npmDistTag.check(pkg, "missing", {})).toBe(false);

      expect(ChildProcessUtilities.execSync).lastCalledWith("npm", ["dist-tag", "ls", pkg.name], {
        cwd: pkg.location,
        env: {},
        pkg,
      });
    });

    it("supports custom registry", () => {
      ChildProcessUtilities.execSync.mockReturnValue("target-tag");

      expect(npmDistTag.check(pkg, "target-tag", { registry })).toBe(true);

      expect(ChildProcessUtilities.execSync).lastCalledWith("npm", ["dist-tag", "ls", pkg.name], {
        cwd: pkg.location,
        env: {
          npm_config_registry: registry,
        },
        pkg,
      });
    });
  });
});
