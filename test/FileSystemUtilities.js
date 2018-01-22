import path from "path";

// mocked modules
import fs from "fs-extra";
import pathExists from "path-exists";
import cmdShim from "cmd-shim";
import readCmdShim from "read-cmd-shim";
import ChildProcessUtilities from "../src/ChildProcessUtilities";

// helpers
import callsBack from "./helpers/callsBack";

// file under test
import FileSystemUtilities from "../src/FileSystemUtilities";

jest.mock("fs-extra");
jest.mock("path-exists");
jest.mock("cmd-shim");
jest.mock("read-cmd-shim");
jest.mock("../src/ChildProcessUtilities");

const linkRelative = (from, to) => path.relative(path.dirname(to), from);

describe("FileSystemUtilities", () => {
  afterEach(() => jest.resetAllMocks());

  describe(".mkdirp()", () => {
    it("calls fs.ensureDir", done => {
      const dirPath = "mkdirp/test";
      fs.ensureDir.mockImplementation(callsBack());
      FileSystemUtilities.mkdirp(dirPath, () => {
        try {
          expect(fs.ensureDir).lastCalledWith(dirPath, expect.any(Function));
          done();
        } catch (ex) {
          done.fail(ex);
        }
      });
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
      fs.readdirSync.mockImplementation(() => ["a", "b", "c"]);
      expect(FileSystemUtilities.readdirSync(dirPath)).toEqual(["a", "b", "c"]);
      expect(fs.readdirSync).lastCalledWith(dirPath);
    });
  });

  describe(".existsSync()", () => {
    it("calls pathExists.sync", () => {
      const filePath = "existsSync-test";
      pathExists.sync.mockImplementation(() => true);
      expect(FileSystemUtilities.existsSync(filePath)).toBe(true);
      expect(pathExists.sync).lastCalledWith(filePath);
    });
  });

  describe(".writeFile()", () => {
    it("calls fs.writeFile", done => {
      const filePath = "writeFile-test";
      fs.writeFile.mockImplementation(callsBack());
      FileSystemUtilities.writeFile(filePath, "contents", () => {
        try {
          expect(fs.writeFile).lastCalledWith(filePath, "contents\n", expect.any(Function));
          done();
        } catch (ex) {
          done.fail(ex);
        }
      });
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
      fs.readFileSync.mockImplementation(() => "contents\n");
      expect(FileSystemUtilities.readFileSync(filePath)).toBe("contents");
      expect(fs.readFileSync).lastCalledWith(filePath, "utf8");
    });
  });

  describe(".rimraf()", () => {
    beforeEach(() => {
      ChildProcessUtilities.spawn.mockImplementation(callsBack());
    });

    it("calls rimraf CLI with arguments", done => {
      pathExists.mockImplementation(() => Promise.resolve(true));
      FileSystemUtilities.rimraf("rimraf/test", () => {
        try {
          expect(ChildProcessUtilities.spawn).lastCalledWith(
            process.execPath,
            [require.resolve("rimraf/bin"), "--no-glob", path.normalize("rimraf/test/")],
            {},
            expect.any(Function)
          );
          done();
        } catch (ex) {
          done.fail(ex);
        }
      });
    });

    it("does not attempt to delete a non-existent directory", done => {
      pathExists.mockImplementation(() => Promise.resolve(false));
      FileSystemUtilities.rimraf("rimraf/non-existent", () => {
        try {
          expect(ChildProcessUtilities.spawn).not.toBeCalled();
          done();
        } catch (ex) {
          done.fail(ex);
        }
      });
    });
  });

  describe(".rename()", () => {
    it("calls fs.rename", done => {
      const srcPath = "rename-src";
      const dstPath = "rename-dst";
      fs.rename.mockImplementation(callsBack());
      FileSystemUtilities.rename(srcPath, dstPath, () => {
        try {
          expect(fs.rename).lastCalledWith(srcPath, dstPath, expect.any(Function));
          done();
        } catch (ex) {
          done.fail(ex);
        }
      });
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
      const dirPath = "stat-dir";
      fs.statSync.mockImplementation(() => ({
        isDirectory: () => true,
      }));
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
    const originalPlatform = process.platform;
    afterEach(() => {
      process.platform = originalPlatform;
    });

    describe("posix", () => {
      beforeEach(() => {
        if (originalPlatform === "win32") {
          process.platform = "linux";
        }
      });

      it("returns false when filePath is not a symlink", () => {
        const filePath = path.resolve("./not/a/symlink");
        fs.lstatSync.mockImplementation(() => ({
          isSymbolicLink: () => false,
        }));
        expect(FileSystemUtilities.isSymlink(filePath)).toBe(false);
      });

      it("returns resolved path of an existing symlink", () => {
        const original = path.resolve("./packages/package-2");
        const filePath = path.resolve("./packages/package-1/node_modules/package-2");
        fs.lstatSync.mockImplementation(() => ({
          isSymbolicLink: () => true,
        }));
        fs.readlinkSync.mockImplementation(() => linkRelative(original, filePath));
        expect(FileSystemUtilities.isSymlink(filePath)).toBe(original);
      });
    });

    describe("windows", () => {
      beforeEach(() => {
        process.platform = "win32";
      });

      it("returns false when filePath is not a symlink", () => {
        const filePath = path.resolve("./not/a/symlink");
        fs.lstatSync.mockImplementation(() => ({
          isSymbolicLink: () => false,
          isFile: () => false,
        }));
        expect(FileSystemUtilities.isSymlink(filePath)).toBe(false);
      });

      it("returns resolved path of an existing symlink", () => {
        const original = path.resolve("./packages/package-2");
        const filePath = path.resolve("./packages/package-1/node_modules/package-2");
        fs.lstatSync.mockImplementation(() => ({
          isSymbolicLink: () => true,
          isFile: () => false,
        }));
        fs.readlinkSync.mockImplementation(() => linkRelative(original, filePath));
        expect(FileSystemUtilities.isSymlink(filePath)).toBe(original);
      });

      it("returns false when filePath is not a shimmed executable", () => {
        const filePath = path.resolve("./packages/package-1/node_modules/.bin/package-2");
        fs.lstatSync.mockImplementation(() => ({
          isSymbolicLink: () => false,
          isFile: () => true,
        }));
        readCmdShim.sync.mockImplementation(() => {
          throw new Error("ENOTASHIM");
        });
        expect(FileSystemUtilities.isSymlink(filePath)).toBe(false);
      });

      it("returns resolved path of a shimmed executable", () => {
        const original = path.resolve("./packages/package-2/cli.js");
        const filePath = path.resolve("./packages/package-1/node_modules/.bin/package-2.cmd");
        fs.lstatSync.mockImplementation(() => ({
          isSymbolicLink: () => false,
          isFile: () => true,
        }));
        readCmdShim.sync.mockImplementation(() => linkRelative(original, filePath));
        expect(FileSystemUtilities.isSymlink(filePath)).toBe(original);
      });
    });
  });

  describe(".symlink()", () => {
    const originalPlatform = process.platform;
    afterEach(() => {
      process.platform = originalPlatform;
    });

    beforeEach(() => {
      fs.lstat.mockImplementation(callsBack("ENOENT"));
      fs.symlink.mockImplementation(callsBack());
    });

    describe("posix", () => {
      beforeEach(() => {
        if (originalPlatform === "win32") {
          process.platform = "linux";
        }
      });

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

        fs.lstat.mockImplementation(callsBack()); // something _does_ exist at destination
        fs.unlink.mockImplementation(callsBack());

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
    });

    describe("windows", () => {
      beforeEach(() => {
        process.platform = "win32";
      });

      it("creates command shim to an executable file", done => {
        const src = path.resolve("./packages/package-2/cli.js");
        const dst = path.resolve("./packages/package-1/node_modules/.bin/package-2");
        const type = "exec";

        cmdShim.mockImplementation(callsBack());

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

        fs.lstat.mockImplementation(callsBack()); // something _does_ exist at destination
        fs.unlink.mockImplementation(callsBack());

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
    });
  });
});
