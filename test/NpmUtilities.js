import { EOL } from "os";
import log from "npmlog";
import path from "path";
// mocked modules
import writePkg from "write-pkg";
import ChildProcessUtilities from "../src/ChildProcessUtilities";
import FileSystemUtilities from "../src/FileSystemUtilities";
// file under test
import NpmUtilities from "../src/NpmUtilities";

jest.mock("write-pkg");
jest.mock("../src/ChildProcessUtilities");
jest.mock("../src/FileSystemUtilities");

// silence logs
log.level = "silent";

// we stub getExecOpts() in most tests because
// we already have enough tests of getExecOpts()
const nuGetExecOpts = NpmUtilities.getExecOpts;
const resetExecOpts = () => {
  NpmUtilities.getExecOpts = nuGetExecOpts;
};
const stubExecOpts = () => {
  NpmUtilities.getExecOpts = jest.fn(
    // shorthand so we don't have to mess with process.env everywhere
    (directory, registry) => ({ directory, registry })
  );
};

describe("NpmUtilities", () => {
  afterEach(() => jest.resetAllMocks());

  describe(".addDistTag()", () => {
    const directory = "/test/addDistTag";
    const packageName = "foo-pkg";
    const version = "1.0.0";
    const tag = "added-tag";

    beforeEach(stubExecOpts);
    afterEach(resetExecOpts);

    it("adds a dist-tag for a given package@version", () => {
      NpmUtilities.addDistTag(directory, packageName, version, tag);

      const cmd = "npm";
      const args = ["dist-tag", "add", "foo-pkg@1.0.0", "added-tag"];
      const opts = { directory, registry: undefined };
      expect(ChildProcessUtilities.execSync).lastCalledWith(cmd, args, opts);
    });

    it("supports custom registry", () => {
      const registry = "https://custom-registry/add";
      NpmUtilities.addDistTag(directory, packageName, version, tag, registry);

      const cmd = "npm";
      const args = ["dist-tag", "add", "foo-pkg@1.0.0", "added-tag"];
      const opts = { directory, registry };
      expect(ChildProcessUtilities.execSync).lastCalledWith(cmd, args, opts);
    });
  });

  describe(".removeDistTag()", () => {
    const directory = "/test/removeDistTag";
    const packageName = "bar-pkg";
    const tag = "removed-tag";

    beforeEach(stubExecOpts);
    afterEach(resetExecOpts);

    it("removes a dist-tag for a given package", () => {
      NpmUtilities.removeDistTag(directory, packageName, tag);

      const cmd = "npm";
      const args = ["dist-tag", "rm", "bar-pkg", "removed-tag"];
      const opts = { directory, registry: undefined };
      expect(ChildProcessUtilities.execSync).lastCalledWith(cmd, args, opts);
    });

    it("supports custom registry", () => {
      const registry = "https://custom-registry/remove";
      NpmUtilities.removeDistTag(directory, packageName, tag, registry);

      const cmd = "npm";
      const args = ["dist-tag", "rm", "bar-pkg", "removed-tag"];
      const opts = { directory, registry };
      expect(ChildProcessUtilities.execSync).lastCalledWith(cmd, args, opts);
    });
  });

  describe(".checkDistTag()", () => {
    const directory = "/test/checkDistTag";
    const packageName = "baz-pkg";

    beforeEach(stubExecOpts);
    afterEach(resetExecOpts);

    it("tests if a dist-tag for a given package exists", () => {
      ChildProcessUtilities.execSync.mockImplementation(() => ["latest", "target-tag"].join(EOL));

      expect(NpmUtilities.checkDistTag(directory, packageName, "target-tag")).toBe(true);
      expect(NpmUtilities.checkDistTag(directory, packageName, "latest")).toBe(true);
      expect(NpmUtilities.checkDistTag(directory, packageName, "missing")).toBe(false);

      const cmd = "npm";
      const args = ["dist-tag", "ls", "baz-pkg"];
      const opts = { directory, registry: undefined };
      expect(ChildProcessUtilities.execSync).toBeCalledWith(cmd, args, opts);
    });

    it("supports custom registry", () => {
      const registry = "https://custom-registry/check";
      ChildProcessUtilities.execSync.mockImplementation(() => "target-tag");

      expect(NpmUtilities.checkDistTag(directory, packageName, "target-tag", registry)).toBe(true);

      const cmd = "npm";
      const args = ["dist-tag", "ls", "baz-pkg"];
      const opts = { directory, registry };
      expect(ChildProcessUtilities.execSync).lastCalledWith(cmd, args, opts);
    });
  });

  describe(".runScriptInDir()", () => {
    it("runs an npm script in a directory", () => {
      const script = "foo";
      const options = {
        args: ["--bar", "baz"],
        directory: "/test/runScriptInDir",
        npmClient: "npm",
      };
      const callback = () => {};

      NpmUtilities.runScriptInDir(script, options, callback);

      const cmd = "npm";
      const scriptArgs = ["run", "foo", "--bar", "baz"];
      const opts = {
        cwd: options.directory,
      };
      expect(ChildProcessUtilities.exec).lastCalledWith(cmd, scriptArgs, opts, expect.any(Function));
    });
    it("support different npmClient", () => {
      const script = "foo";
      const options = {
        args: ["--bar", "baz"],
        directory: "/test/runScriptInDir",
        npmClient: "yarn",
      };
      const callback = () => {};

      NpmUtilities.runScriptInDir(script, options, callback);

      const cmd = "yarn";
      const scriptArgs = ["run", "foo", "--bar", "baz"];
      const opts = {
        cwd: options.directory,
      };
      expect(ChildProcessUtilities.exec).lastCalledWith(cmd, scriptArgs, opts, expect.any(Function));
    });
  });

  describe(".runScriptInDirSync()", () => {
    it("runs an npm script syncrhonously in a directory", () => {
      const script = "foo";
      const config = {
        args: ["--bar", "baz"],
        directory: "/test/runScriptInDirSync",
        npmClient: "npm",
      };
      const callback = () => {};

      NpmUtilities.runScriptInDirSync(script, config, callback);

      const cmd = "npm";
      const scriptArgs = ["run", "foo", "--bar", "baz"];
      const opts = {
        cwd: config.directory,
      };
      expect(ChildProcessUtilities.execSync).lastCalledWith(cmd, scriptArgs, opts, expect.any(Function));
    });
  });

  describe(".runScriptInPackageStreaming()", () => {
    it("runs an npm script in a package with streaming", () => {
      const script = "foo";
      const config = {
        args: ["--bar", "baz"],
        pkg: {
          name: "qux",
          location: "/test/runScriptInPackageStreaming",
        },
        npmClient: "npm",
      };
      const callback = () => {};

      NpmUtilities.runScriptInPackageStreaming(script, config, callback);

      expect(ChildProcessUtilities.spawnStreaming).lastCalledWith(
        "npm",
        ["run", "foo", "--bar", "baz"],
        {
          cwd: config.pkg.location,
        },
        "qux",
        expect.any(Function)
      );
    });

    it("runs an npm script in a package with streaming without prefix", () => {
      const script = "foo";
      const config = {
        args: ["--bar", "baz"],
        pkg: {
          name: "qux",
          location: "/test/runScriptInPackageStreaming",
        },
        npmClient: "npm",
        prefix: false,
      };
      const callback = () => {};

      NpmUtilities.runScriptInPackageStreaming(script, config, callback);

      expect(ChildProcessUtilities.spawnStreaming).lastCalledWith(
        "npm",
        ["run", "foo", "--bar", "baz"],
        {
          cwd: config.pkg.location,
        },
        "",
        expect.any(Function)
      );
    });
  });

  describe(".publishTaggedInDir()", () => {
    const directory = "/test/publishTaggedInDir";
    const pkg = { name: "test", location: directory, version: "1.10.100" };
    const callback = () => {};

    beforeEach(stubExecOpts);
    afterEach(resetExecOpts);

    it("runs npm publish in a directory with --tag support", () => {
      const npmClient = "npm";
      NpmUtilities.publishTaggedInDir("published-tag", pkg, { npmClient }, callback);

      const args = ["publish", "--tag", "published-tag"];
      const opts = { directory, registry: undefined };
      expect(ChildProcessUtilities.exec).lastCalledWith(npmClient, args, opts, expect.any(Function));
    });

    it("trims trailing whitespace in tag parameter", () => {
      NpmUtilities.publishTaggedInDir("trailing-tag ", pkg, { npmClient: "npm" }, callback);

      const actualtag = ChildProcessUtilities.exec.mock.calls[0][1][2];
      expect(actualtag).toBe("trailing-tag");
    });

    it("supports custom registry", () => {
      const npmClient = "npm";
      const registry = "https://custom-registry/publishTaggedInDir";
      NpmUtilities.publishTaggedInDir("custom-registry", pkg, { npmClient, registry }, callback);

      const args = ["publish", "--tag", "custom-registry"];
      const opts = { directory, registry };
      expect(ChildProcessUtilities.exec).lastCalledWith(npmClient, args, opts, expect.any(Function));
    });

    describe("with npmClient yarn", () => {
      it("appends --new-version to avoid interactive prompt", () => {
        const npmClient = "yarn";
        NpmUtilities.publishTaggedInDir("yarn-publish", pkg, { npmClient }, callback);

        const args = ["publish", "--tag", "yarn-publish", "--new-version", "1.10.100"];
        const opts = { directory, registry: undefined };
        expect(ChildProcessUtilities.exec).lastCalledWith(npmClient, args, opts, expect.any(Function));
      });
    });
  });

  describe(".getExecOpts()", () => {
    const originalEnv = Object.assign({}, process.env);
    const mockEnv = {
      mock_value: 1,
    };

    afterEach(() => {
      process.env = originalEnv;
    });

    it("should handle environment variables properly", () => {
      process.env = mockEnv;
      const opts = NpmUtilities.getExecOpts("test_dir", "https://my-secure-registry/npm");
      const want = {
        cwd: "test_dir",
        env: Object.assign({}, mockEnv, {
          npm_config_registry: "https://my-secure-registry/npm",
        }),
      };
      expect(opts).toEqual(want);
    });

    it("should handle missing environment variables", () => {
      process.env = mockEnv;
      const opts = NpmUtilities.getExecOpts("test_dir");
      const want = {
        cwd: "test_dir",
      };
      expect(opts).toEqual(want);
    });
  });

  describe(".installInDir()", () => {
    beforeEach(() => {
      stubExecOpts();
      ChildProcessUtilities.exec.mockImplementation(() => Promise.resolve());
      FileSystemUtilities.rename.mockImplementation((...args) => args.pop()());
      writePkg.mockImplementation(() => Promise.resolve());
    });

    afterEach(resetExecOpts);

    it("installs dependencies in targeted directory", done => {
      const directory = path.normalize("/test/installInDir");
      const dependencies = ["@scoped/caret@^2.0.0", "@scoped/exact@2.0.0", "caret@^1.0.0", "exact@1.0.0"];
      const config = {};

      NpmUtilities.installInDir(directory, dependencies, config, err => {
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
            directory,
            registry: undefined,
          });

          done();
        } catch (ex) {
          done.fail(ex);
        }
      });
    });

    it("supports custom registry", done => {
      const registry = "https://custom-registry/installInDir";
      const directory = path.normalize("/test/installInDir");
      const dependencies = ["@scoped/tagged@next", "tagged@next"];
      const config = {
        registry,
      };

      NpmUtilities.installInDir(directory, dependencies, config, err => {
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
            directory,
            registry,
          });

          done();
        } catch (ex) {
          done.fail(ex);
        }
      });
    });

    it("supports npm install --global-style", done => {
      const directory = path.normalize("/test/installInDir");
      const dependencies = ["@scoped/foo@latest", "foo@latest"];
      const config = {
        npmGlobalStyle: true,
      };

      NpmUtilities.installInDir(directory, dependencies, config, err => {
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
            directory,
            registry: undefined,
          });

          done();
        } catch (ex) {
          done.fail(ex);
        }
      });
    });

    it("supports custom npmClient", done => {
      const directory = path.normalize("/test/installInDir");
      const dependencies = ["@scoped/something@github:foo/bar", "something@github:foo/foo"];
      const config = {
        npmClient: "yarn",
        mutex: "network:12345",
      };

      NpmUtilities.installInDir(directory, dependencies, config, err => {
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
            {
              directory,
              registry: undefined,
            }
          );

          done();
        } catch (ex) {
          done.fail(ex);
        }
      });
    });

    it("supports custom npmClientArgs", done => {
      const directory = path.normalize("/test/installInDir");
      const dependencies = ["@scoped/something@github:foo/bar", "something@github:foo/foo"];
      const config = {
        npmClientArgs: ["--production", "--no-optional"],
      };

      NpmUtilities.installInDir(directory, dependencies, config, err => {
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
            {
              directory,
              registry: undefined,
            }
          );

          done();
        } catch (ex) {
          done.fail(ex);
        }
      });
    });

    it("overrides custom npmClient when using global style", done => {
      const directory = path.normalize("/test/installInDir");
      const dependencies = ["@scoped/something@github:foo/bar", "something@github:foo/foo"];
      const config = {
        npmClient: "yarn",
        npmGlobalStyle: true,
        mutex: "network:12345",
      };

      NpmUtilities.installInDir(directory, dependencies, config, err => {
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
            directory,
            registry: undefined,
          });

          done();
        } catch (ex) {
          done.fail(ex);
        }
      });
    });

    it("finishes early when no dependencies exist", done => {
      const directory = path.normalize("/test/installInDir");
      const dependencies = [];
      const config = {};

      NpmUtilities.installInDir(directory, dependencies, config, err => {
        if (err) {
          return done.fail(err);
        }
        try {
          expect(NpmUtilities.getExecOpts).not.toBeCalled();
          done();
        } catch (ex) {
          done.fail(ex);
        }
      });
    });

    it("defaults temporary dependency versions to '*'", done => {
      const directory = path.normalize("/test/installInDir");
      const dependencies = [
        "noversion",
        "@scoped/noversion", // sorted by write-pkg
      ];
      const config = {};

      NpmUtilities.installInDir(directory, dependencies, config, err => {
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
      const directory = path.normalize("/test/installInDir/renameError");
      const dependencies = ["I'm just here so we don't exit early"];
      const config = {};

      FileSystemUtilities.rename.mockImplementation((from, to, cb) => cb(new Error("Unable to rename file")));

      NpmUtilities.installInDir(directory, dependencies, config, err => {
        try {
          expect(err.message).toBe("Unable to rename file");

          done();
        } catch (ex) {
          done.fail(ex);
        }
      });
    });

    it("cleans up synchronously after writeFile error", done => {
      const directory = path.normalize("/test/installInDir/writeError");
      const dependencies = ["I'm just here so we don't exit early"];
      const config = {};

      writePkg.mockImplementation(() => Promise.reject(new Error("Unable to write file")));

      NpmUtilities.installInDir(directory, dependencies, config, err => {
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
      const directory = path.normalize("/test/installInDir/clientError");
      const dependencies = ["I'm just here so we don't exit early"];
      const config = {};

      ChildProcessUtilities.exec.mockImplementation(() =>
        Promise.reject(new Error("Unable to install dependency"))
      );

      NpmUtilities.installInDir(directory, dependencies, config, err => {
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

  describe(".installInDirOriginalPackageJson()", () => {
    beforeEach(() => {
      stubExecOpts();
    });

    afterEach(resetExecOpts);

    it("uses shared code path for install", done => {
      ChildProcessUtilities.exec.mockImplementation(() => Promise.resolve());

      const directory = path.normalize("/test/installInDirOriginalPackageJson");
      const config = {
        npmClient: "yarn",
        npmClientArgs: ["--no-optional"],
        mutex: "file:foo",
      };

      NpmUtilities.installInDirOriginalPackageJson(directory, config, err => {
        if (err) {
          return done.fail(err);
        }

        try {
          expect(ChildProcessUtilities.exec).lastCalledWith(
            "yarn",
            ["install", "--mutex", "file:foo", "--non-interactive", "--no-optional"],
            {
              directory,
              registry: undefined,
            }
          );

          done();
        } catch (ex) {
          done.fail(ex);
        }
      });
    });

    it("calls back with error when thrown", done => {
      ChildProcessUtilities.exec.mockImplementation(() => Promise.reject(new Error("whoopsy-doodle")));

      const directory = path.normalize("/test/installInDirOriginalPackageJsonError");
      const config = {
        npmClient: "yarn",
      };

      NpmUtilities.installInDirOriginalPackageJson(directory, config, err => {
        try {
          expect(err.message).toBe("whoopsy-doodle");

          expect(ChildProcessUtilities.exec).lastCalledWith("yarn", ["install", "--non-interactive"], {
            directory,
            registry: undefined,
          });

          done();
        } catch (ex) {
          done.fail(ex);
        }
      });
    });
  });
});
