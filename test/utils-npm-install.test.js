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

      const directory = path.normalize("/test/npm/install");
      const config = {
        npmClient: "yarn",
        npmClientArgs: ["--no-optional"],
        mutex: "file:foo",
      };

      await npmInstall(directory, config);

      expect(ChildProcessUtilities.exec).lastCalledWith(
        "yarn",
        ["install", "--mutex", "file:foo", "--non-interactive", "--no-optional"],
        { cwd: directory }
      );
    });

    it("does not swallow errors", async () => {
      expect.assertions(2);

      ChildProcessUtilities.exec.mockRejectedValueOnce(new Error("whoopsy-doodle"));

      const directory = path.normalize("/test/npm/install/error");
      const config = {
        npmClient: "yarn",
      };

      try {
        await npmInstall(directory, config);
      } catch (err) {
        expect(err.message).toBe("whoopsy-doodle");

        expect(ChildProcessUtilities.exec).lastCalledWith("yarn", ["install", "--non-interactive"], {
          cwd: directory,
        });
      }
    });
  });

  describe("npmInstall.dependencies()", () => {
    it("installs dependencies in targeted directory", async () => {
      const directory = path.normalize("/test/npm-install-deps");
      const dependencies = ["@scoped/caret@^2.0.0", "@scoped/exact@2.0.0", "caret@^1.0.0", "exact@1.0.0"];
      const config = {};

      await npmInstall.dependencies(directory, dependencies, config);

      expect(FileSystemUtilities.rename).lastCalledWith(
        path.join(directory, "package.json"),
        path.join(directory, "package.json.lerna_backup")
      );
      expect(FileSystemUtilities.renameSync).lastCalledWith(
        path.join(directory, "package.json.lerna_backup"),
        path.join(directory, "package.json")
      );
      expect(writePkg).lastCalledWith(path.join(directory, "package.json"), {
        dependencies: {
          "@scoped/caret": "^2.0.0",
          "@scoped/exact": "2.0.0",
          caret: "^1.0.0",
          exact: "1.0.0",
        },
      });
      expect(ChildProcessUtilities.exec).lastCalledWith("npm", ["install"], {
        cwd: directory,
      });
    });

    it("supports custom registry", async () => {
      const registry = "https://custom-registry/npm-install-deps";
      const directory = path.normalize("/test/npm-install-deps");
      const dependencies = ["@scoped/tagged@next", "tagged@next"];
      const config = {
        registry,
      };

      await npmInstall.dependencies(directory, dependencies, config);

      expect(writePkg).lastCalledWith(path.join(directory, "package.json"), {
        dependencies: {
          "@scoped/tagged": "next",
          tagged: "next",
        },
      });
      expect(ChildProcessUtilities.exec).lastCalledWith("npm", ["install"], {
        cwd: directory,
        env: expect.objectContaining({
          npm_config_registry: registry,
        }),
      });
    });

    it("supports npm install --global-style", async () => {
      const directory = path.normalize("/test/npm-install-deps");
      const dependencies = ["@scoped/foo@latest", "foo@latest"];
      const config = {
        npmGlobalStyle: true,
      };

      await npmInstall.dependencies(directory, dependencies, config);

      expect(writePkg).lastCalledWith(path.join(directory, "package.json"), {
        dependencies: {
          "@scoped/foo": "latest",
          foo: "latest",
        },
      });
      expect(ChildProcessUtilities.exec).lastCalledWith("npm", ["install", "--global-style"], {
        cwd: directory,
      });
    });

    it("supports custom npmClient", async () => {
      const directory = path.normalize("/test/npm-install-deps");
      const dependencies = ["@scoped/something@github:foo/bar", "something@github:foo/foo"];
      const config = {
        npmClient: "yarn",
        mutex: "network:12345",
      };

      await npmInstall.dependencies(directory, dependencies, config);

      expect(writePkg).lastCalledWith(path.join(directory, "package.json"), {
        dependencies: {
          "@scoped/something": "github:foo/bar",
          something: "github:foo/foo",
        },
      });
      expect(ChildProcessUtilities.exec).lastCalledWith(
        "yarn",
        ["install", "--mutex", "network:12345", "--non-interactive"],
        { cwd: directory }
      );
    });

    it("supports custom npmClientArgs", async () => {
      const directory = path.normalize("/test/npm-install-deps");
      const dependencies = ["@scoped/something@github:foo/bar", "something@github:foo/foo"];
      const config = {
        npmClientArgs: ["--production", "--no-optional"],
      };

      await npmInstall.dependencies(directory, dependencies, config);

      expect(writePkg).lastCalledWith(path.join(directory, "package.json"), {
        dependencies: {
          "@scoped/something": "github:foo/bar",
          something: "github:foo/foo",
        },
      });
      expect(ChildProcessUtilities.exec).lastCalledWith("npm", ["install", "--production", "--no-optional"], {
        cwd: directory,
      });
    });

    it("overrides custom npmClient when using global style", async () => {
      const directory = path.normalize("/test/npm-install-deps");
      const dependencies = ["@scoped/something@github:foo/bar", "something@github:foo/foo"];
      const config = {
        npmClient: "yarn",
        npmGlobalStyle: true,
        mutex: "network:12345",
      };

      await npmInstall.dependencies(directory, dependencies, config);

      expect(writePkg).lastCalledWith(path.join(directory, "package.json"), {
        dependencies: {
          "@scoped/something": "github:foo/bar",
          something: "github:foo/foo",
        },
      });
      expect(ChildProcessUtilities.exec).lastCalledWith("npm", ["install", "--global-style"], {
        cwd: directory,
      });
    });

    it("finishes early when no dependencies exist", async () => {
      const directory = path.normalize("/test/npm-install-deps");
      const dependencies = [];
      const config = {};

      await npmInstall.dependencies(directory, dependencies, config);

      expect(ChildProcessUtilities.exec).not.toBeCalled();
    });

    it("defaults temporary dependency versions to '*'", async () => {
      const directory = path.normalize("/test/npm-install-deps");
      const dependencies = [
        "noversion",
        "@scoped/noversion", // sorted by write-pkg
      ];
      const config = {};

      await npmInstall.dependencies(directory, dependencies, config);

      expect(writePkg).lastCalledWith(path.join(directory, "package.json"), {
        dependencies: {
          "@scoped/noversion": "*",
          noversion: "*",
        },
      });
    });

    it("rejects with rename error", async () => {
      const directory = path.normalize("/test/npm-install-deps/renameError");
      const dependencies = ["I'm just here so we don't exit early"];
      const config = {};

      FileSystemUtilities.rename.mockRejectedValueOnce(new Error("Unable to rename file"));

      try {
        await npmInstall.dependencies(directory, dependencies, config);
      } catch (err) {
        expect(err.message).toBe("Unable to rename file");
      }
    });

    it("cleans up synchronously after writeFile error", async () => {
      const directory = path.normalize("/test/npm-install-deps/writeError");
      const dependencies = ["just-here-so-we-dont-exit-early"];
      const config = {};

      writePkg.mockRejectedValueOnce(new Error("Unable to write file"));

      try {
        await npmInstall.dependencies(directory, dependencies, config);
      } catch (err) {
        expect(err.message).toBe("Unable to write file");

        expect(FileSystemUtilities.renameSync).lastCalledWith(
          path.join(directory, "package.json.lerna_backup"),
          path.join(directory, "package.json")
        );
      }
    });

    it("cleans up synchronously after client install error", async () => {
      const directory = path.normalize("/test/npm-install-deps/clientError");
      const dependencies = ["just-here-so-we-dont-exit-early"];
      const config = {};

      ChildProcessUtilities.exec.mockRejectedValueOnce(new Error("Unable to install dependency"));

      try {
        await npmInstall.dependencies(directory, dependencies, config);
      } catch (err) {
        expect(err.message).toBe("Unable to install dependency");

        expect(FileSystemUtilities.renameSync).lastCalledWith(
          path.join(directory, "package.json.lerna_backup"),
          path.join(directory, "package.json")
        );
      }
    });
  });
});
