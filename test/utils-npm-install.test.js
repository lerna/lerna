"use strict";

jest.mock("write-pkg");
jest.mock("../src/ChildProcessUtilities");
jest.mock("../src/FileSystemUtilities");

const path = require("path");

// mocked modules
const writePkg = require("write-pkg");
const ChildProcessUtilities = require("../src/ChildProcessUtilities");
const FileSystemUtilities = require("../src/FileSystemUtilities");

// helpers
const callsBack = require("./helpers/callsBack");

// file under test
const npmInstall = require("../src/utils/npm-install");

describe("npm-install", () => {
  ChildProcessUtilities.exec.mockResolvedValue();
  FileSystemUtilities.rename.mockImplementation(callsBack());
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
    it("installs dependencies in targeted directory", done => {
      const directory = path.normalize("/test/npm-install-deps");
      const dependencies = ["@scoped/caret@^2.0.0", "@scoped/exact@2.0.0", "caret@^1.0.0", "exact@1.0.0"];
      const config = {};

      npmInstall.dependencies(directory, dependencies, config, err => {
        if (err) {
          return done.fail(err);
        }

        try {
          expect(FileSystemUtilities.rename).lastCalledWith(
            path.join(directory, "package.json"),
            path.join(directory, "package.json.lerna_backup"),
            expect.any(Function)
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

          done();
        } catch (ex) {
          done.fail(ex);
        }
      });
    });

    it("supports custom registry", done => {
      const registry = "https://custom-registry/npm-install-deps";
      const directory = path.normalize("/test/npm-install-deps");
      const dependencies = ["@scoped/tagged@next", "tagged@next"];
      const config = {
        registry,
      };

      npmInstall.dependencies(directory, dependencies, config, err => {
        if (err) {
          return done.fail(err);
        }

        try {
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

          done();
        } catch (ex) {
          done.fail(ex);
        }
      });
    });

    it("supports npm install --global-style", done => {
      const directory = path.normalize("/test/npm-install-deps");
      const dependencies = ["@scoped/foo@latest", "foo@latest"];
      const config = {
        npmGlobalStyle: true,
      };

      npmInstall.dependencies(directory, dependencies, config, err => {
        if (err) {
          return done.fail(err);
        }

        try {
          expect(writePkg).lastCalledWith(path.join(directory, "package.json"), {
            dependencies: {
              "@scoped/foo": "latest",
              foo: "latest",
            },
          });
          expect(ChildProcessUtilities.exec).lastCalledWith("npm", ["install", "--global-style"], {
            cwd: directory,
          });

          done();
        } catch (ex) {
          done.fail(ex);
        }
      });
    });

    it("supports custom npmClient", done => {
      const directory = path.normalize("/test/npm-install-deps");
      const dependencies = ["@scoped/something@github:foo/bar", "something@github:foo/foo"];
      const config = {
        npmClient: "yarn",
        mutex: "network:12345",
      };

      npmInstall.dependencies(directory, dependencies, config, err => {
        if (err) {
          return done.fail(err);
        }

        try {
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

          done();
        } catch (ex) {
          done.fail(ex);
        }
      });
    });

    it("supports custom npmClientArgs", done => {
      const directory = path.normalize("/test/npm-install-deps");
      const dependencies = ["@scoped/something@github:foo/bar", "something@github:foo/foo"];
      const config = {
        npmClientArgs: ["--production", "--no-optional"],
      };

      npmInstall.dependencies(directory, dependencies, config, err => {
        if (err) {
          return done.fail(err);
        }

        try {
          expect(writePkg).lastCalledWith(path.join(directory, "package.json"), {
            dependencies: {
              "@scoped/something": "github:foo/bar",
              something: "github:foo/foo",
            },
          });
          expect(ChildProcessUtilities.exec).lastCalledWith(
            "npm",
            ["install", "--production", "--no-optional"],
            { cwd: directory }
          );

          done();
        } catch (ex) {
          done.fail(ex);
        }
      });
    });

    it("overrides custom npmClient when using global style", done => {
      const directory = path.normalize("/test/npm-install-deps");
      const dependencies = ["@scoped/something@github:foo/bar", "something@github:foo/foo"];
      const config = {
        npmClient: "yarn",
        npmGlobalStyle: true,
        mutex: "network:12345",
      };

      npmInstall.dependencies(directory, dependencies, config, err => {
        if (err) {
          return done.fail(err);
        }

        try {
          expect(writePkg).lastCalledWith(path.join(directory, "package.json"), {
            dependencies: {
              "@scoped/something": "github:foo/bar",
              something: "github:foo/foo",
            },
          });
          expect(ChildProcessUtilities.exec).lastCalledWith("npm", ["install", "--global-style"], {
            cwd: directory,
          });

          done();
        } catch (ex) {
          done.fail(ex);
        }
      });
    });

    it("finishes early when no dependencies exist", done => {
      const directory = path.normalize("/test/npm-install-deps");
      const dependencies = [];
      const config = {};

      npmInstall.dependencies(directory, dependencies, config, err => {
        if (err) {
          return done.fail(err);
        }
        try {
          expect(ChildProcessUtilities.exec).not.toBeCalled();
          done();
        } catch (ex) {
          done.fail(ex);
        }
      });
    });

    it("defaults temporary dependency versions to '*'", done => {
      const directory = path.normalize("/test/npm-install-deps");
      const dependencies = [
        "noversion",
        "@scoped/noversion", // sorted by write-pkg
      ];
      const config = {};

      npmInstall.dependencies(directory, dependencies, config, err => {
        if (err) {
          return done.fail(err);
        }

        try {
          expect(writePkg).lastCalledWith(path.join(directory, "package.json"), {
            dependencies: {
              "@scoped/noversion": "*",
              noversion: "*",
            },
          });

          done();
        } catch (ex) {
          done.fail(ex);
        }
      });
    });

    it("passes rename error to callback", done => {
      const directory = path.normalize("/test/npm-install-deps/renameError");
      const dependencies = ["I'm just here so we don't exit early"];
      const config = {};

      FileSystemUtilities.rename.mockImplementationOnce(callsBack(new Error("Unable to rename file")));

      npmInstall.dependencies(directory, dependencies, config, err => {
        try {
          expect(err.message).toBe("Unable to rename file");

          done();
        } catch (ex) {
          done.fail(ex);
        }
      });
    });

    it("cleans up synchronously after writeFile error", done => {
      const directory = path.normalize("/test/npm-install-deps/writeError");
      const dependencies = ["I'm just here so we don't exit early"];
      const config = {};

      writePkg.mockRejectedValueOnce(new Error("Unable to write file"));

      npmInstall.dependencies(directory, dependencies, config, err => {
        try {
          expect(err.message).toBe("Unable to write file");

          expect(FileSystemUtilities.renameSync).lastCalledWith(
            path.join(directory, "package.json.lerna_backup"),
            path.join(directory, "package.json")
          );

          done();
        } catch (ex) {
          done.fail(ex);
        }
      });
    });

    it("cleans up synchronously after client install error", done => {
      const directory = path.normalize("/test/npm-install-deps/clientError");
      const dependencies = ["I'm just here so we don't exit early"];
      const config = {};

      ChildProcessUtilities.exec.mockRejectedValueOnce(new Error("Unable to install dependency"));

      npmInstall.dependencies(directory, dependencies, config, err => {
        try {
          expect(err.message).toBe("Unable to install dependency");

          expect(FileSystemUtilities.renameSync).lastCalledWith(
            path.join(directory, "package.json.lerna_backup"),
            path.join(directory, "package.json")
          );

          done();
        } catch (ex) {
          done.fail(ex);
        }
      });
    });
  });
});
