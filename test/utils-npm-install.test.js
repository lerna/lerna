"use strict";

jest.mock("write-pkg");
jest.mock("../src/ChildProcessUtilities");
jest.mock("../src/FileSystemUtilities");

const path = require("path");

// mocked modules
const writePkg = require("write-pkg");
const ChildProcessUtilities = require("../src/ChildProcessUtilities");
const FileSystemUtilities = require("../src/FileSystemUtilities");

// file under test
const npmInstall = require("../src/utils/npm-install");

describe("npm-install", () => {
  ChildProcessUtilities.exec.mockResolvedValue();
  FileSystemUtilities.rename.mockResolvedValue();
  writePkg.mockResolvedValue();

  describe("npmInstall()", () => {
    it("returns a promise for a non-mangling install", async () => {
      expect.assertions(1);

      const location = path.normalize("/test/npm/install");
      const pkg = {
        name: "test-npm-install",
        location,
      };
      const config = {
        npmClient: "yarn",
        npmClientArgs: ["--no-optional"],
        mutex: "file:foo",
      };

      await npmInstall(pkg, config);

      expect(ChildProcessUtilities.exec).lastCalledWith(
        "yarn",
        ["install", "--mutex", "file:foo", "--non-interactive", "--no-optional"],
        { cwd: location }
      );
    });

    it("does not swallow errors", async () => {
      expect.assertions(2);

      ChildProcessUtilities.exec.mockRejectedValueOnce(new Error("whoopsy-doodle"));

      const location = path.normalize("/test/npm/install/error");
      const pkg = {
        name: "test-npm-install-error",
        location,
      };
      const config = {
        npmClient: "yarn",
      };

      try {
        await npmInstall(pkg, config);
      } catch (err) {
        expect(err.message).toBe("whoopsy-doodle");

        expect(ChildProcessUtilities.exec).lastCalledWith("yarn", ["install", "--non-interactive"], {
          cwd: location,
        });
      }
    });
  });

  describe("npmInstall.dependencies()", () => {
    it("installs dependencies in targeted directory", async () => {
      const location = path.normalize("/test/npm-install-deps");
      const manifestLocation = path.join(location, "package.json");
      const pkg = {
        location,
        manifestLocation,
        toJSON: () => ({
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
        }),
      };
      const dependencies = ["@scoped/caret@^2.0.0", "@scoped/exact@2.0.0", "caret@^1.0.0", "exact@1.0.0"];
      const config = {};

      await npmInstall.dependencies(pkg, dependencies, config);

      expect(FileSystemUtilities.rename).lastCalledWith(
        manifestLocation,
        path.join(location, "package.json.lerna_backup")
      );
      expect(FileSystemUtilities.renameSync).lastCalledWith(
        path.join(location, "package.json.lerna_backup"),
        manifestLocation
      );
      expect(writePkg).lastCalledWith(manifestLocation, {
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
      });
      expect(ChildProcessUtilities.exec).lastCalledWith("npm", ["install"], {
        cwd: location,
      });
    });

    it("supports custom registry", async () => {
      const registry = "https://custom-registry/npm-install-deps";
      const location = path.normalize("/test/npm-install-deps");
      const manifestLocation = path.join(location, "package.json");
      const pkg = {
        location,
        manifestLocation,
        toJSON: () => ({
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
        }),
      };
      const dependencies = ["@scoped/tagged@next", "tagged@next"];
      const config = {
        registry,
      };

      await npmInstall.dependencies(pkg, dependencies, config);

      expect(writePkg).lastCalledWith(manifestLocation, {
        name: "npm-install-deps",
        version: "1.0.0",
        dependencies: {
          "@scoped/tagged": "next",
        },
        devDependencies: {
          tagged: "next",
        },
      });
      expect(ChildProcessUtilities.exec).lastCalledWith("npm", ["install"], {
        cwd: location,
        env: expect.objectContaining({
          npm_config_registry: registry,
        }),
      });
    });

    it("supports npm install --global-style", async () => {
      const location = path.normalize("/test/npm-install-deps");
      const manifestLocation = path.join(location, "package.json");
      const pkg = {
        location,
        manifestLocation,
        toJSON: () => ({
          name: "npm-install-deps",
          version: "1.0.0",
          dependencies: {
            "local-dependency": "^1.0.0",
          },
          devDependencies: {
            caret: "^1.0.0",
            "local-dev-dependency": "^1.0.0",
          },
        }),
      };
      const dependencies = ["@scoped/foo@latest", "foo@latest", "caret@^1.0.0"];
      const config = {
        npmGlobalStyle: true,
      };

      await npmInstall.dependencies(pkg, dependencies, config);

      expect(writePkg).lastCalledWith(manifestLocation, {
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
      expect(ChildProcessUtilities.exec).lastCalledWith("npm", ["install", "--global-style"], {
        cwd: location,
      });
    });

    it("supports custom npmClient", async () => {
      const location = path.normalize("/test/npm-install-deps");
      const manifestLocation = path.join(location, "package.json");
      const pkg = {
        location,
        manifestLocation,
        toJSON: () => ({
          name: "npm-install-deps",
          version: "1.0.0",
          dependencies: {
            "@scoped/something": "^2.0.0",
            "local-dependency": "^1.0.0",
          },
        }),
      };
      const dependencies = ["@scoped/something@^2.0.0", "something@^1.0.0"];
      const config = {
        npmClient: "yarn",
        mutex: "network:12345",
      };

      await npmInstall.dependencies(pkg, dependencies, config);

      expect(writePkg).lastCalledWith(manifestLocation, {
        name: "npm-install-deps",
        version: "1.0.0",
        dependencies: {
          "@scoped/something": "^2.0.0",
          something: "^1.0.0",
        },
      });
      expect(ChildProcessUtilities.exec).lastCalledWith(
        "yarn",
        ["install", "--mutex", "network:12345", "--non-interactive"],
        { cwd: location }
      );
    });

    it("supports custom npmClientArgs", async () => {
      const location = path.normalize("/test/npm-install-deps");
      const manifestLocation = path.join(location, "package.json");
      const pkg = {
        location,
        manifestLocation,
        toJSON: () => ({
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
        }),
      };
      const dependencies = ["@scoped/something@github:foo/bar", "something@github:foo/foo"];
      const config = {
        npmClientArgs: ["--production", "--no-optional"],
      };

      await npmInstall.dependencies(pkg, dependencies, config);

      expect(writePkg).lastCalledWith(manifestLocation, {
        name: "npm-install-deps",
        version: "1.0.0",
        optionalDependencies: {
          "@scoped/something": "github:foo/bar",
        },
        devDependencies: {
          something: "github:foo/foo",
        },
      });
      expect(ChildProcessUtilities.exec).lastCalledWith("npm", ["install", "--production", "--no-optional"], {
        cwd: location,
      });
    });

    it("overrides custom npmClient when using global style", async () => {
      const location = path.normalize("/test/npm-install-deps");
      const manifestLocation = path.join(location, "package.json");
      const pkg = {
        location,
        manifestLocation,
        toJSON: () => ({
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
        }),
      };
      const dependencies = ["@scoped/something@github:foo/bar", "something@github:foo/foo"];
      const config = {
        npmClient: "yarn",
        npmGlobalStyle: true,
        mutex: "network:12345",
      };

      await npmInstall.dependencies(pkg, dependencies, config);

      expect(writePkg).lastCalledWith(manifestLocation, {
        name: "npm-install-deps",
        version: "1.0.0",
        dependencies: {
          "@scoped/something": "github:foo/bar",
        },
        devDependencies: {
          something: "github:foo/foo",
        },
      });
      expect(ChildProcessUtilities.exec).lastCalledWith("npm", ["install", "--global-style"], {
        cwd: location,
      });
    });

    it("finishes early when no dependencies exist", async () => {
      const location = path.normalize("/test/npm-install-deps");
      const manifestLocation = path.join(location, "package.json");
      const pkg = {
        location,
        manifestLocation,
        toJSON: () => ({
          name: "npm-install-deps",
          version: "1.0.0",
        }),
      };
      const dependencies = [];
      const config = {};

      await npmInstall.dependencies(pkg, dependencies, config);

      expect(ChildProcessUtilities.exec).not.toBeCalled();
    });

    it("defaults temporary dependency versions to '*'", async () => {
      const location = path.normalize("/test/npm-install-deps");
      const manifestLocation = path.join(location, "package.json");
      const pkg = {
        location,
        manifestLocation,
        toJSON: () => ({
          name: "npm-install-deps",
          version: "1.0.0",
          dependencies: {
            "local-dependency": "^1.0.0",
          },
          devDependencies: {
            "local-dev-dependency": "^1.0.0",
          },
        }),
      };
      const dependencies = [
        "noversion",
        "@scoped/noversion", // sorted by write-pkg
      ];
      const config = {};

      await npmInstall.dependencies(pkg, dependencies, config);

      expect(writePkg).lastCalledWith(manifestLocation, {
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
      const location = path.normalize("/test/npm-install-deps/renameError");
      const manifestLocation = path.join(location, "package.json");
      const pkg = {
        location,
        manifestLocation,
        toJSON: () => ({
          name: "npm-install-deps/renameError",
          version: "1.0.0",
        }),
      };
      const dependencies = ["I'm just here so we don't exit early"];
      const config = {};

      FileSystemUtilities.rename.mockRejectedValueOnce(new Error("Unable to rename file"));

      try {
        await npmInstall.dependencies(pkg, dependencies, config);
      } catch (err) {
        expect(err.message).toBe("Unable to rename file");
      }
    });

    it("cleans up synchronously after writeFile error", async () => {
      const location = path.normalize("/test/npm-install-deps/writeError");
      const manifestLocation = path.join(location, "package.json");
      const pkg = {
        location,
        manifestLocation,
        toJSON: () => ({
          name: "npm-install-deps/writeError",
          version: "1.0.0",
        }),
      };
      const dependencies = ["just-here-so-we-dont-exit-early"];
      const config = {};

      writePkg.mockRejectedValueOnce(new Error("Unable to write file"));

      try {
        await npmInstall.dependencies(pkg, dependencies, config);
      } catch (err) {
        expect(err.message).toBe("Unable to write file");

        expect(FileSystemUtilities.renameSync).lastCalledWith(
          path.join(location, "package.json.lerna_backup"),
          manifestLocation
        );
      }
    });

    it("cleans up synchronously after client install error", async () => {
      const location = path.normalize("/test/npm-install-deps/clientError");
      const manifestLocation = path.join(location, "package.json");
      const pkg = {
        location,
        manifestLocation,
        toJSON: () => ({
          name: "npm-install-deps/clientError",
          version: "1.0.0",
        }),
      };
      const dependencies = ["just-here-so-we-dont-exit-early"];
      const config = {};

      ChildProcessUtilities.exec.mockRejectedValueOnce(new Error("Unable to install dependency"));

      try {
        await npmInstall.dependencies(pkg, dependencies, config);
      } catch (err) {
        expect(err.message).toBe("Unable to install dependency");

        expect(FileSystemUtilities.renameSync).lastCalledWith(
          path.join(location, "package.json.lerna_backup"),
          manifestLocation
        );
      }
    });
  });
});
