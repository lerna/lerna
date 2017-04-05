import { EOL } from "os";
import path from "path";
import escapeArgs from "command-join";
import writePkg from "write-pkg";

import ChildProcessUtilities from "../src/ChildProcessUtilities";
import FileSystemUtilities from "../src/FileSystemUtilities";
import NpmUtilities from "../src/NpmUtilities";

jest.mock("write-pkg");
jest.mock("../src/ChildProcessUtilities");
jest.mock("../src/FileSystemUtilities");

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

      const cmd = `npm dist-tag add ${packageName}@${version} ${tag}`;
      const opts = { directory, registry: undefined };
      expect(ChildProcessUtilities.execSync).lastCalledWith(cmd, opts);
    });

    it("supports custom registry", () => {
      const registry = "https://custom-registry/add";
      NpmUtilities.addDistTag(directory, packageName, version, tag, registry);

      const cmd = `npm dist-tag add ${packageName}@${version} ${tag}`;
      const opts = { directory, registry };
      expect(ChildProcessUtilities.execSync).lastCalledWith(cmd, opts);
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

      const cmd = `npm dist-tag rm ${packageName} ${tag}`;
      const opts = { directory, registry: undefined };
      expect(ChildProcessUtilities.execSync).lastCalledWith(cmd, opts);
    });

    it("supports custom registry", () => {
      const registry = "https://custom-registry/remove";
      NpmUtilities.removeDistTag(directory, packageName, tag, registry);

      const cmd = `npm dist-tag rm ${packageName} ${tag}`;
      const opts = { directory, registry };
      expect(ChildProcessUtilities.execSync).lastCalledWith(cmd, opts);
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

      const cmd = `npm dist-tag ls ${packageName}`;
      const opts = { directory, registry: undefined };
      expect(ChildProcessUtilities.execSync).toBeCalledWith(cmd, opts);
    });

    it("supports custom registry", () => {
      const registry = "https://custom-registry/check";
      ChildProcessUtilities.execSync.mockImplementation(() => "target-tag");

      expect(NpmUtilities.checkDistTag(directory, packageName, "target-tag", registry)).toBe(true);

      const cmd = `npm dist-tag ls ${packageName}`;
      const opts = { directory, registry };
      expect(ChildProcessUtilities.execSync).lastCalledWith(cmd, opts);
    });
  });

  describe(".runScriptInDir()", () => {
    it("runs an npm script in a directory", () => {
      const script = "foo";
      const args = ["--bar", "baz"];
      const directory = "/test/runScriptInDir";
      const callback = () => {};

      NpmUtilities.runScriptInDir(script, args, directory, callback);

      const cmd = `npm run ${script} ${escapeArgs(args)}`;
      const opts = {
        cwd: directory,
        env: process.env,
      };
      expect(ChildProcessUtilities.exec).lastCalledWith(cmd, opts, expect.any(Function));
    });
  });

  describe(".runScriptInPackageStreaming()", () => {
    it("runs an npm script in a package with streaming", () => {
      const script = "foo";
      const args = ["--bar", "baz"];
      const pkg = {
        name: "qux",
        location: "/test/runScriptInPackageStreaming",
      };
      const callback = () => {};

      NpmUtilities.runScriptInPackageStreaming(script, args, pkg, callback);

      expect(ChildProcessUtilities.spawnStreaming).lastCalledWith(
        "npm",
        ["run", script, ...args],
        {
          cwd: pkg.location,
          env: process.env,
        },
        "qux: ",
        expect.any(Function)
      );
    });
  });

  describe(".publishTaggedInDir()", () => {
    const tag = "published-tag";
    const directory = "/test/publishTaggedInDir";
    const callback = () => {};

    beforeEach(stubExecOpts);
    afterEach(resetExecOpts);

    it("runs npm publish in a directory with --tag support", () => {
      NpmUtilities.publishTaggedInDir(tag, directory, undefined, callback);

      const cmd = `npm publish --tag ${tag}`;
      const opts = { directory, registry: undefined };
      expect(ChildProcessUtilities.exec).lastCalledWith(cmd, opts, expect.any(Function));
    });

    it("trims trailing whitespace in tag parameter", () => {
      NpmUtilities.publishTaggedInDir(`${tag}  `, directory, callback);

      const actualCommand = ChildProcessUtilities.exec.mock.calls[0][0];
      expect(actualCommand).toBe(`npm publish --tag ${tag}`);
    });

    it("supports custom registry", () => {
      const registry = "https://custom-registry/publishTaggedInDir";
      NpmUtilities.publishTaggedInDir(tag, directory, registry, callback);

      const cmd = `npm publish --tag ${tag}`;
      const opts = { directory, registry };
      expect(ChildProcessUtilities.exec).lastCalledWith(cmd, opts, expect.any(Function));
    });
  });

  describe(".getExecOpts()", () => {
    const originalEnv = Object.assign({}, process.env);
    const mockEnv = {
      mock_value: 1,
      NODE_ENV: "lerna-test",
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
          npm_config_registry: "https://my-secure-registry/npm"
        })
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
    const callbackSuccess = (...args) => args.pop()();

    beforeEach(() => {
      stubExecOpts();
      ChildProcessUtilities.spawn.mockImplementation(callbackSuccess);
      FileSystemUtilities.rename.mockImplementation(callbackSuccess);
      writePkg.mockImplementation(() => Promise.resolve());
    });

    afterEach(resetExecOpts);

    it("installs dependencies in targeted directory", (done) => {
      const directory = path.normalize("/test/installInDir");
      const dependencies = [
        "@scoped/caret@^2.0.0",
        "@scoped/exact@2.0.0",
        "caret@^1.0.0",
        "exact@1.0.0",
      ];
      const config = {};

      NpmUtilities.installInDir(directory, dependencies, config, (err) => {
        if (err) return done.fail(err);

        try {
          expect(FileSystemUtilities.rename).lastCalledWith(
            path.join(directory, "package.json"),
            path.join(directory, "package.json.lerna_backup"),
            expect.any(Function),
          );
          expect(FileSystemUtilities.renameSync).lastCalledWith(
            path.join(directory, "package.json.lerna_backup"),
            path.join(directory, "package.json"),
          );
          expect(writePkg).lastCalledWith(
            path.join(directory, "package.json"),
            {
              dependencies: {
                "@scoped/caret": "^2.0.0",
                "@scoped/exact": "2.0.0",
                caret: "^1.0.0",
                exact: "1.0.0",
              },
            },
          );
          expect(ChildProcessUtilities.spawn).lastCalledWith("npm", ["install"], {
            directory,
            registry: undefined,
            stdio: ["ignore", "pipe", "pipe"],
          }, expect.any(Function));

          done();
        } catch (ex) {
          done.fail(ex);
        }
      });
    });

    it("supports custom registry", (done) => {
      const registry = "https://custom-registry/installInDir";
      const directory = path.normalize("/test/installInDir");
      const dependencies = [
        "@scoped/tagged@next",
        "tagged@next",
      ];
      const config = {
        registry,
      };

      NpmUtilities.installInDir(directory, dependencies, config, (err) => {
        if (err) return done.fail(err);

        try {
          expect(writePkg.mock.calls[0][1]).toEqual(
            {
              dependencies: {
                "@scoped/tagged": "next",
                tagged: "next",
              },
            },
          );
          expect(ChildProcessUtilities.spawn.mock.calls[0][2]).toMatchObject({
            registry,
          });

          done();
        } catch (ex) {
          done.fail(ex);
        }
      });
    });

    it("supports custom npmClient", (done) => {
      const directory = path.normalize("/test/installInDir");
      const dependencies = [
        "@scoped/something@github:foo/bar",
        "something@github:foo/foo",
      ];
      const config = {
        client: "yarn",
      };

      NpmUtilities.installInDir(directory, dependencies, config, (err) => {
        if (err) return done.fail(err);

        try {
          expect(writePkg.mock.calls[0][1]).toEqual(
            {
              dependencies: {
                "@scoped/something": "github:foo/bar",
                something: "github:foo/foo",
              },
            },
          );
          expect(ChildProcessUtilities.spawn).lastCalledWith("yarn", ["install"], {
            directory,
            registry: undefined,
            stdio: ["ignore", "pipe", "pipe"],
          }, expect.any(Function));

          done();
        } catch (ex) {
          done.fail(ex);
        }
      });
    });

    it("finishes early when no dependencies exist", (done) => {
      const directory = path.normalize("/test/installInDir");
      const dependencies = [];
      const config = {};

      NpmUtilities.installInDir(directory, dependencies, config, (err) => {
        if (err) return done.fail(err);
        try {
          expect(NpmUtilities.getExecOpts).not.toBeCalled();
          done();
        } catch (ex) {
          done.fail(ex);
        }
      });
    });

    it("defaults temporary dependency versions to '*'", (done) => {
      const directory = path.normalize("/test/installInDir");
      const dependencies = [
        "noversion",
        "@scoped/noversion", // sorted by write-pkg
      ];
      const config = {};

      NpmUtilities.installInDir(directory, dependencies, config, (err) => {
        if (err) return done.fail(err);

        try {
          expect(writePkg.mock.calls[0][1]).toEqual(
            {
              dependencies: {
                "@scoped/noversion": "*",
                noversion: "*",
              },
            },
          );

          done();
        } catch (ex) {
          done.fail(ex);
        }
      });
    });

    it("passes rename error to callback", (done) => {
      const directory = path.normalize("/test/installInDir/renameError");
      const dependencies = [
        "I'm just here so we don't exit early",
      ];
      const config = {};

      FileSystemUtilities.rename.mockImplementation((from, to, cb) => {
        return cb(new Error("Unable to rename file"));
      });

      NpmUtilities.installInDir(directory, dependencies, config, (err) => {
        try {
          expect(err.message).toBe("Unable to rename file");

          done();
        } catch (ex) {
          done.fail(ex);
        }
      });
    });

    it("cleans up synchronously after writeFile error", (done) => {
      const directory = path.normalize("/test/installInDir/writeError");
      const dependencies = [
        "I'm just here so we don't exit early",
      ];
      const config = {};

      writePkg.mockImplementation(() => {
        return Promise.reject(new Error("Unable to write file"));
      });

      NpmUtilities.installInDir(directory, dependencies, config, (err) => {
        try {
          expect(err.message).toBe("Unable to write file");

          expect(FileSystemUtilities.renameSync).lastCalledWith(
            path.join(directory, "package.json.lerna_backup"),
            path.join(directory, "package.json"),
          );

          done();
        } catch (ex) {
          done.fail(ex);
        }
      });
    });

    it("cleans up synchronously after client install error", (done) => {
      const directory = path.normalize("/test/installInDir/clientError");
      const dependencies = [
        "I'm just here so we don't exit early",
      ];
      const config = {};

      ChildProcessUtilities.spawn.mockImplementation((client, args, opts, cb) => {
        return cb(new Error("Unable to install dependency"));
      });

      NpmUtilities.installInDir(directory, dependencies, config, (err) => {
        try {
          expect(err.message).toBe("Unable to install dependency");

          expect(FileSystemUtilities.renameSync).lastCalledWith(
            path.join(directory, "package.json.lerna_backup"),
            path.join(directory, "package.json"),
          );

          done();
        } catch (ex) {
          done.fail(ex);
        }
      });
    });
  });
});
