"use strict";

jest.mock("fs-extra");
// write-pkg mocked manually
jest.mock("@lerna/child-process");

const path = require("path");

// mocked modules
const fs = require("fs-extra");
const writePkg = require("write-pkg");
const ChildProcessUtilities = require("@lerna/child-process");

// helpers
const Package = require("@lerna/package");

// file under test
const npmInstall = require("..");

describe("npm-install", () => {
  ChildProcessUtilities.exec.mockResolvedValue();
  fs.rename.mockResolvedValue();
  writePkg.mockResolvedValue();

  describe("npmInstall()", () => {
    it("returns a promise for a non-mangling install", async () => {
      const pkg = new Package(
        {
          name: "test-npm-install",
        },
        path.normalize("/test/npm-install-promise"),
        path.normalize("/test")
      );

      await npmInstall(pkg, {
        npmClient: "yarn",
        npmClientArgs: ["--no-optional"],
        mutex: "file:foo",
      });

      expect(ChildProcessUtilities.exec).toHaveBeenLastCalledWith(
        "yarn",
        ["install", "--mutex", "file:foo", "--non-interactive", "--no-optional"],
        {
          cwd: pkg.location,
          env: {
            LERNA_EXEC_PATH: pkg.location,
            LERNA_ROOT_PATH: pkg.rootPath,
          },
          pkg,
          stdio: "pipe",
        }
      );
    });

    it("allows override of opts.stdio", async () => {
      const pkg = new Package(
        {
          name: "test-npm-install",
        },
        path.normalize("/test/npm-install-stdio")
      );

      await npmInstall(pkg, {
        stdio: "inherit",
      });

      expect(ChildProcessUtilities.exec).toHaveBeenLastCalledWith(
        "npm",
        ["install"],
        expect.objectContaining({
          stdio: "inherit",
        })
      );
    });

    it("does not swallow errors", async () => {
      ChildProcessUtilities.exec.mockRejectedValueOnce(new Error("whoopsy-doodle"));

      const pkg = new Package(
        {
          name: "test-npm-install-error",
        },
        path.normalize("/test/npm-install-error")
      );

      await expect(
        npmInstall(pkg, {
          npmClient: "yarn",
        })
      ).rejects.toThrow("whoopsy-doodle");

      expect(ChildProcessUtilities.exec).toHaveBeenLastCalledWith("yarn", ["install", "--non-interactive"], {
        cwd: pkg.location,
        env: expect.any(Object),
        pkg,
        stdio: "pipe",
      });
    });
  });

  describe("npmInstall.dependencies()", () => {
    it("installs dependencies in targeted directory", async () => {
      const pkg = new Package(
        {
          name: "npm-install-deps",
          version: "1.0.0",
          scripts: {
            test: "i am deleted",
          },
          dependencies: {
            "@scoped/caret": "^2.0.0",
            "local-dependency": "^1.0.0",
            exact: "1.0.0",
          },
          devDependencies: {
            "@scoped/exact": "2.0.0",
            caret: "^1.0.0",
            exact: "1.0.0", // will be removed
            "local-dev-dependency": "^1.0.0",
          },
          optionalDependencies: {
            "@scoped/others": "1.0.0", // will be removed
            caret: "^1.0.0",
            "local-dependency": "^1.0.0",
          },
          bundledDependencies: ["local-dependency", "@scoped/exact", "others"],
          bundleDependencies: ["local-dependency", "@scoped/exact", "others"],
        },
        path.normalize("/test/npm-install-deps")
      );
      const backupManifest = `${pkg.manifestLocation}.lerna_backup`;
      const dependencies = [
        "@scoped/caret@^2.0.0",
        "@scoped/exact@2.0.0",
        "caret@^1.0.0",
        "exact@1.0.0",
        "@scoped/others@1.0.0",
        "others@1.0.0",
      ];

      await npmInstall.dependencies(pkg, dependencies, {});

      expect(fs.rename).toHaveBeenLastCalledWith(pkg.manifestLocation, backupManifest);
      expect(fs.renameSync).toHaveBeenLastCalledWith(backupManifest, pkg.manifestLocation);
      expect(writePkg).toHaveBeenLastCalledWith(pkg.manifestLocation, {
        name: "npm-install-deps",
        version: "1.0.0",
        dependencies: {
          "@scoped/caret": "^2.0.0",
          // removed local-dependency
          exact: "1.0.0",
        },
        devDependencies: {
          "@scoped/exact": "2.0.0",
          caret: "^1.0.0",
          // removed local-dev-dependency
        },
        optionalDependencies: {
          "@scoped/others": "1.0.0",
          // removed caret, local-dependency
        },
        bundledDependencies: [/* removed local-dependency */ "others"],
        bundleDependencies: [
          /* removed  */
        ],
      });
      expect(ChildProcessUtilities.exec).toHaveBeenLastCalledWith("npm", ["install"], {
        cwd: pkg.location,
        env: expect.any(Object),
        pkg,
        stdio: "pipe",
      });
    });

    it("supports custom registry", async () => {
      const pkg = new Package(
        {
          name: "npm-install-deps",
          version: "1.0.0",
          dependencies: {
            "@scoped/tagged": "next",
            "local-dependency": "file:../local-dependency",
          },
          devDependencies: {
            tagged: "next",
            "local-dev-dependency": "file:../local-dev-dependency",
          },
        },
        path.normalize("/test/npm-install-deps")
      );
      const dependencies = ["@scoped/tagged@next", "tagged@next"];
      const config = {
        registry: "https://custom-registry/npm-install-deps",
      };

      await npmInstall.dependencies(pkg, dependencies, config);

      expect(writePkg).toHaveBeenLastCalledWith(pkg.manifestLocation, {
        name: "npm-install-deps",
        version: "1.0.0",
        dependencies: {
          "@scoped/tagged": "next",
        },
        devDependencies: {
          tagged: "next",
        },
      });
      expect(ChildProcessUtilities.exec).toHaveBeenLastCalledWith("npm", ["install"], {
        cwd: pkg.location,
        env: expect.objectContaining({
          npm_config_registry: config.registry,
        }),
        pkg,
        stdio: "pipe",
      });
    });

    it("supports npm install --global-style", async () => {
      const pkg = new Package(
        {
          name: "npm-install-deps",
          version: "1.0.0",
          dependencies: {
            "local-dependency": "^1.0.0",
          },
          devDependencies: {
            caret: "^1.0.0",
            "local-dev-dependency": "^1.0.0",
          },
        },
        path.normalize("/test/npm-install-deps")
      );
      const dependencies = ["@scoped/foo@latest", "foo@latest", "caret@^1.0.0"];

      await npmInstall.dependencies(pkg, dependencies, {
        npmGlobalStyle: true,
      });

      expect(writePkg).toHaveBeenLastCalledWith(pkg.manifestLocation, {
        name: "npm-install-deps",
        version: "1.0.0",
        dependencies: {
          "@scoped/foo": "latest",
          foo: "latest",
        },
        devDependencies: {
          caret: "^1.0.0",
        },
      });
      expect(ChildProcessUtilities.exec).toHaveBeenLastCalledWith("npm", ["install", "--global-style"], {
        cwd: pkg.location,
        env: expect.any(Object),
        pkg,
        stdio: "pipe",
      });
    });

    it("supports custom npmClient", async () => {
      const pkg = new Package(
        {
          name: "npm-install-deps",
          version: "1.0.0",
          dependencies: {
            "@scoped/something": "^2.0.0",
            "local-dependency": "^1.0.0",
          },
        },
        path.normalize("/test/npm-install-deps")
      );
      const dependencies = ["@scoped/something@^2.0.0", "something@^1.0.0"];

      await npmInstall.dependencies(pkg, dependencies, {
        npmClient: "yarn",
        mutex: "network:12345",
      });

      expect(writePkg).toHaveBeenLastCalledWith(pkg.manifestLocation, {
        name: "npm-install-deps",
        version: "1.0.0",
        dependencies: {
          "@scoped/something": "^2.0.0",
          something: "^1.0.0",
        },
      });
      expect(ChildProcessUtilities.exec).toHaveBeenLastCalledWith(
        "yarn",
        ["install", "--mutex", "network:12345", "--non-interactive"],
        { cwd: pkg.location, env: expect.any(Object), pkg, stdio: "pipe" }
      );
    });

    it("supports custom npmClientArgs", async () => {
      const pkg = new Package(
        {
          name: "npm-install-deps",
          version: "1.0.0",
          optionalDependencies: {
            "@scoped/something": "github:foo/bar",
            "local-optional-dependency": "^1.0.0",
          },
          devDependencies: {
            something: "github:foo/foo",
            "local-dev-dependency": "^1.0.0",
          },
        },
        path.normalize("/test/npm-install-deps")
      );
      const dependencies = ["@scoped/something@github:foo/bar", "something@github:foo/foo"];

      await npmInstall.dependencies(pkg, dependencies, {
        npmClientArgs: ["--production", "--no-optional"],
      });

      expect(writePkg).toHaveBeenLastCalledWith(pkg.manifestLocation, {
        name: "npm-install-deps",
        version: "1.0.0",
        optionalDependencies: {
          "@scoped/something": "github:foo/bar",
        },
        devDependencies: {
          something: "github:foo/foo",
        },
      });
      expect(ChildProcessUtilities.exec).toHaveBeenLastCalledWith(
        "npm",
        ["install", "--production", "--no-optional"],
        {
          cwd: pkg.location,
          env: expect.any(Object),
          pkg,
          stdio: "pipe",
        }
      );
    });

    it("overrides custom npmClient when using global style", async () => {
      const pkg = new Package(
        {
          name: "npm-install-deps",
          version: "1.0.0",
          dependencies: {
            "@scoped/something": "github:foo/bar",
            "local-dependency": "^1.0.0",
          },
          devDependencies: {
            something: "github:foo/foo",
            "local-dev-dependency": "^1.0.0",
          },
        },
        path.normalize("/test/npm-install-deps")
      );
      const dependencies = ["@scoped/something@github:foo/bar", "something@github:foo/foo"];

      await npmInstall.dependencies(pkg, dependencies, {
        npmClient: "yarn",
        npmGlobalStyle: true,
        mutex: "network:12345",
      });

      expect(writePkg).toHaveBeenLastCalledWith(pkg.manifestLocation, {
        name: "npm-install-deps",
        version: "1.0.0",
        dependencies: {
          "@scoped/something": "github:foo/bar",
        },
        devDependencies: {
          something: "github:foo/foo",
        },
      });
      expect(ChildProcessUtilities.exec).toHaveBeenLastCalledWith("npm", ["install", "--global-style"], {
        cwd: pkg.location,
        env: expect.any(Object),
        pkg,
        stdio: "pipe",
      });
    });

    it("calls npm ci instead of npm install when subCommand is ci", async () => {
      const pkg = new Package(
        {
          name: "npm-install-deps",
          version: "1.0.0",
          dependencies: {
            "@scoped/something": "github:foo/bar",
            "local-dependency": "^1.0.0",
          },
          devDependencies: {
            something: "github:foo/foo",
            "local-dev-dependency": "^1.0.0",
          },
        },
        path.normalize("/test/npm-install-deps")
      );
      const dependencies = ["@scoped/something@github:foo/bar", "something@github:foo/foo"];

      await npmInstall.dependencies(pkg, dependencies, {
        subCommand: "ci",
      });

      expect(writePkg).toHaveBeenLastCalledWith(pkg.manifestLocation, {
        name: "npm-install-deps",
        version: "1.0.0",
        dependencies: {
          "@scoped/something": "github:foo/bar",
        },
        devDependencies: {
          something: "github:foo/foo",
        },
      });
      expect(ChildProcessUtilities.exec).toHaveBeenLastCalledWith("npm", ["ci"], {
        cwd: pkg.location,
        env: expect.any(Object),
        pkg,
        stdio: "pipe",
      });
    });

    it("finishes early when no dependencies exist", async () => {
      const pkg = new Package(
        {
          name: "npm-install-deps",
          version: "1.0.0",
        },
        path.normalize("/test/npm-install-deps")
      );
      const dependencies = [];

      await npmInstall.dependencies(pkg, dependencies, {});

      expect(ChildProcessUtilities.exec).not.toHaveBeenCalled();
    });

    it("defaults temporary dependency versions to '*'", async () => {
      const pkg = new Package(
        {
          name: "npm-install-deps",
          version: "1.0.0",
          dependencies: {
            "local-dependency": "^1.0.0",
          },
          devDependencies: {
            "local-dev-dependency": "^1.0.0",
          },
        },
        path.normalize("/test/npm-install-deps")
      );
      const dependencies = [
        "noversion",
        "@scoped/noversion", // sorted by write-pkg
      ];

      await npmInstall.dependencies(pkg, dependencies, {});

      expect(writePkg).toHaveBeenLastCalledWith(pkg.manifestLocation, {
        name: "npm-install-deps",
        version: "1.0.0",
        dependencies: {
          "@scoped/noversion": "*",
          noversion: "*",
        },
        devDependencies: {},
      });
    });

    it("rejects with rename error", async () => {
      const pkg = new Package(
        {
          name: "npm-install-deps-rename-error",
          version: "1.0.0",
        },
        path.normalize("/test/npm-install-deps/renameError")
      );
      const dependencies = ["I'm just here so we don't exit early"];

      fs.rename.mockRejectedValueOnce(new Error("Unable to rename file"));

      await expect(npmInstall.dependencies(pkg, dependencies, {})).rejects.toThrow("Unable to rename file");
    });

    it("cleans up synchronously after writeFile error", async () => {
      const pkg = new Package(
        {
          name: "npm-install-deps-write-error",
          version: "1.0.0",
        },
        path.normalize("/test/npm-install-deps/writeError")
      );
      const backupManifest = `${pkg.manifestLocation}.lerna_backup`;
      const dependencies = ["just-here-so-we-dont-exit-early"];

      writePkg.mockRejectedValueOnce(new Error("Unable to write file"));

      await expect(npmInstall.dependencies(pkg, dependencies, {})).rejects.toThrow("Unable to write file");
      expect(fs.renameSync).toHaveBeenLastCalledWith(backupManifest, pkg.manifestLocation);
    });

    it("cleans up synchronously after client install error", async () => {
      const pkg = new Package(
        {
          name: "npm-install-deps-client-error",
          version: "1.0.0",
        },
        path.normalize("/test/npm-install-deps/clientError")
      );
      const backupManifest = `${pkg.manifestLocation}.lerna_backup`;
      const dependencies = ["just-here-so-we-dont-exit-early"];

      ChildProcessUtilities.exec.mockRejectedValueOnce(new Error("Unable to install"));

      await expect(npmInstall.dependencies(pkg, dependencies, {})).rejects.toThrow("Unable to install");
      expect(fs.renameSync).toHaveBeenLastCalledWith(backupManifest, pkg.manifestLocation);
    });
  });
});
