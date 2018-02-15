"use strict";

const path = require("path");

// mocked modules
const fs = require("fs-extra");
const pathExists = require("path-exists");
const cmdShim = require("cmd-shim");
const readCmdShim = require("read-cmd-shim");
const ChildProcessUtilities = require("../src/ChildProcessUtilities");

// helpers
const callsBack = require("./helpers/callsBack");

// file under test
const FileSystemUtilities = require("../src/FileSystemUtilities");

jest.mock("fs-extra");
jest.mock("path-exists");
jest.mock("cmd-shim");
jest.mock("read-cmd-shim");
jest.mock("../src/ChildProcessUtilities");

const linkRelative = (from, to) => path.relative(path.dirname(to), from);

describe("FileSystemUtilities", () => {
  describe(".mkdirp()", () => {
    it("calls fs.ensureDir", done => {
      expect.assertions(1);
      const dirPath = "mkdirp/test";

      fs.ensureDir.mockImplementationOnce(callsBack());

      FileSystemUtilities.mkdirp(dirPath, done);

      expect(fs.ensureDir).lastCalledWith(dirPath, done);
    });
  });

  describe(".mkdirpSync()", () => {
    it("calls fs.ensureDirSync", () => {
      const dirPath = "mkdirpSync/test";

      FileSystemUtilities.mkdirpSync(dirPath);
      expect(fs.ensureDirSync).lastCalledWith(dirPath);
    });
  });

  describe(".readdirSync()", () => {
    it("calls fs.readdirSync", () => {
      const dirPath = "readdirSync-test";

      fs.readdirSync.mockReturnValueOnce(["a", "b", "c"]);

      expect(FileSystemUtilities.readdirSync(dirPath)).toEqual(["a", "b", "c"]);
      expect(fs.readdirSync).lastCalledWith(dirPath);
    });
  });

  describe(".existsSync()", () => {
    it("calls pathExists.sync", () => {
      const filePath = "existsSync-test";

      pathExists.sync.mockReturnValueOnce(true);

      expect(FileSystemUtilities.existsSync(filePath)).toBe(true);
      expect(pathExists.sync).lastCalledWith(filePath);
    });
  });

  describe(".writeFile()", () => {
    it("calls fs.writeFile", done => {
      expect.assertions(1);
      const filePath = "writeFile-test";

      fs.writeFile.mockImplementationOnce(callsBack());

      FileSystemUtilities.writeFile(filePath, "contents", done);
      expect(fs.writeFile).lastCalledWith(filePath, "contents\n", done);
    });
  });

  describe(".writeFileSync()", () => {
    it("calls fs.writeFileSync", () => {
      const filePath = "writeFileSync-test";

      FileSystemUtilities.writeFileSync(filePath, "contents");
      expect(fs.writeFileSync).lastCalledWith(filePath, "contents\n");
    });
  });

  describe(".readFileSync()", () => {
    it("calls fs.readFileSync", () => {
      const filePath = "readFileSync-test";

      fs.readFileSync.mockReturnValueOnce("contents\n");

      expect(FileSystemUtilities.readFileSync(filePath)).toBe("contents");
      expect(fs.readFileSync).lastCalledWith(filePath, "utf8");
    });
  });

  describe(".rimraf()", () => {
    it("calls rimraf CLI with arguments", done => {
      expect.assertions(1);
      const dirPath = "rimraf/test";

      pathExists.mockResolvedValueOnce(true);
      ChildProcessUtilities.spawn.mockImplementationOnce(callsBack());

      FileSystemUtilities.rimraf(dirPath, () => {
        // a Promise gating a callback means we can't do the shorthand done()
        try {
          expect(ChildProcessUtilities.spawn).lastCalledWith(
            process.execPath,
            [require.resolve("rimraf/bin"), "--no-glob", path.normalize(`${dirPath}/`)],
            {},
            expect.any(Function)
          );
          done();
        } catch (err) {
          done.fail(err);
        }
      });
    });

    it("does not attempt to delete a non-existent directory", done => {
      expect.assertions(1);
      pathExists.mockResolvedValueOnce(false);

      FileSystemUtilities.rimraf("rimraf/non-existent", done);
      expect(ChildProcessUtilities.spawn).not.toBeCalled();
    });
  });

  describe(".rename()", () => {
    it("calls fs.rename", done => {
      expect.assertions(1);
      const srcPath = "rename-src";
      const dstPath = "rename-dst";

      fs.rename.mockImplementationOnce(callsBack());

      FileSystemUtilities.rename(srcPath, dstPath, done);
      expect(fs.rename).lastCalledWith(srcPath, dstPath, done);
    });
  });

  describe(".renameSync()", () => {
    it("calls fs.renameSync", () => {
      const srcPath = "renameSync-src";
      const dstPath = "renameSync-dst";

      FileSystemUtilities.renameSync(srcPath, dstPath);
      expect(fs.renameSync).lastCalledWith(srcPath, dstPath);
    });
  });

  describe(".statSync()", () => {
    it("calls fs.statSync", () => {
      fs.statSync.mockReturnValueOnce({
        isDirectory: () => true,
      });

      const dirPath = "stat-dir";
      const stat = FileSystemUtilities.statSync(dirPath);

      expect(fs.statSync).lastCalledWith(dirPath);
      expect(stat.isDirectory()).toBe(true);
    });
  });

  describe(".unlinkSync()", () => {
    it("calls fs.unlinkSync", () => {
      const filePath = "unlinkSync-test";

      FileSystemUtilities.unlinkSync(filePath);
      expect(fs.unlinkSync).lastCalledWith(filePath);
    });
  });

  describe(".isSymlink()", () => {
    if (process.platform !== "win32") {
      it("returns false when filePath is not a symlink", () => {
        const filePath = path.resolve("./not/a/symlink");

        fs.lstatSync.mockReturnValueOnce({
          isSymbolicLink: () => false,
        });

        expect(FileSystemUtilities.isSymlink(filePath)).toBe(false);
      });

      it("returns resolved path of an existing symlink", () => {
        const original = path.resolve("./packages/package-2");
        const filePath = path.resolve("./packages/package-1/node_modules/package-2");

        fs.lstatSync.mockReturnValueOnce({
          isSymbolicLink: () => true,
        });
        fs.readlinkSync.mockReturnValueOnce(linkRelative(original, filePath));

        expect(FileSystemUtilities.isSymlink(filePath)).toBe(original);
      });
    } else {
      it("returns false when filePath is not a symlink (windows)", () => {
        const filePath = path.resolve("./not/a/symlink");

        fs.lstatSync.mockReturnValueOnce({
          isSymbolicLink: () => false,
          isFile: () => false,
        });

        expect(FileSystemUtilities.isSymlink(filePath)).toBe(false);
      });

      it("returns resolved path of an existing symlink (windows)", () => {
        const original = path.resolve("./packages/package-2");
        const filePath = path.resolve("./packages/package-1/node_modules/package-2");

        fs.lstatSync.mockReturnValueOnce({
          isSymbolicLink: () => true,
          isFile: () => false,
        });
        fs.readlinkSync.mockReturnValueOnce(linkRelative(original, filePath));

        expect(FileSystemUtilities.isSymlink(filePath)).toBe(original);
      });

      it("returns false when filePath is not a shimmed executable", () => {
        const filePath = path.resolve("./packages/package-1/node_modules/.bin/package-2");

        fs.lstatSync.mockReturnValueOnce({
          isSymbolicLink: () => false,
          isFile: () => true,
        });
        readCmdShim.sync.mockImplementationOnce(() => {
          throw new Error("ENOTASHIM");
        });

        expect(FileSystemUtilities.isSymlink(filePath)).toBe(false);
      });

      it("returns resolved path of a shimmed executable", () => {
        const original = path.resolve("./packages/package-2/cli.js");
        const filePath = path.resolve("./packages/package-1/node_modules/.bin/package-2.cmd");

        fs.lstatSync.mockReturnValueOnce({
          isSymbolicLink: () => false,
          isFile: () => true,
        });
        readCmdShim.sync.mockReturnValueOnce(linkRelative(original, filePath));

        expect(FileSystemUtilities.isSymlink(filePath)).toBe(original);
      });
    }
  });

  describe(".symlink()", () => {
    fs.lstat.mockImplementation(callsBack("ENOENT"));
    fs.unlink.mockImplementation(callsBack());
    fs.symlink.mockImplementation(callsBack());

    if (process.platform !== "win32") {
      it("creates relative symlink to a directory", done => {
        const src = path.resolve("./packages/package-2");
        const dst = path.resolve("./packages/package-1/node_modules/package-2");
        const type = "junction"; // even in posix environments :P

        FileSystemUtilities.symlink(src, dst, type, () => {
          try {
            expect(fs.unlink).not.toBeCalled();
            expect(fs.symlink).lastCalledWith(linkRelative(src, dst), dst, type, expect.any(Function));
            done();
          } catch (ex) {
            done.fail(ex);
          }
        });
      });

      it("creates relative symlink to an executable file", done => {
        const src = path.resolve("./packages/package-2/cli.js");
        const dst = path.resolve("./packages/package-1/node_modules/.bin/package-2");
        const type = "exec";

        FileSystemUtilities.symlink(src, dst, type, () => {
          try {
            expect(fs.unlink).not.toBeCalled();
            expect(fs.symlink).lastCalledWith(linkRelative(src, dst), dst, "file", expect.any(Function));
            done();
          } catch (ex) {
            done.fail(ex);
          }
        });
      });

      it("overwrites an existing symlink", done => {
        const src = path.resolve("./packages/package-2");
        const dst = path.resolve("./packages/package-1/node_modules/package-2");
        const type = "junction"; // even in posix environments :P

        fs.lstat.mockImplementationOnce(callsBack()); // something _does_ exist at destination

        FileSystemUtilities.symlink(src, dst, type, () => {
          try {
            expect(fs.unlink).lastCalledWith(dst, expect.any(Function));
            expect(fs.symlink).lastCalledWith(linkRelative(src, dst), dst, type, expect.any(Function));
            done();
          } catch (ex) {
            done.fail(ex);
          }
        });
      });
    } else {
      it("creates command shim to an executable file", done => {
        const src = path.resolve("./packages/package-2/cli.js");
        const dst = path.resolve("./packages/package-1/node_modules/.bin/package-2");
        const type = "exec";

        cmdShim.mockImplementationOnce(callsBack());

        FileSystemUtilities.symlink(src, dst, type, () => {
          try {
            expect(fs.lstat).not.toBeCalled();
            expect(cmdShim).lastCalledWith(src, dst, expect.any(Function));
            done();
          } catch (ex) {
            done.fail(ex);
          }
        });
      });

      it("always uses absolute paths when creating symlinks", done => {
        const src = path.resolve("./packages/package-2");
        const dst = path.resolve("./packages/package-1/node_modules/package-2");
        const type = "junction"; // only _actually_ matters in windows

        fs.lstat.mockImplementationOnce(callsBack()); // something _does_ exist at destination

        FileSystemUtilities.symlink(src, dst, type, () => {
          try {
            expect(fs.unlink).lastCalledWith(dst, expect.any(Function));
            expect(fs.symlink).lastCalledWith(src, dst, type, expect.any(Function));
            done();
          } catch (ex) {
            done.fail(ex);
          }
        });
      });
    }
  });
});
