"use strict";

const path = require("path");

// mocked modules
const fs = require("fs-extra");
const pathExists = require("path-exists");
const ChildProcessUtilities = require("../src/ChildProcessUtilities");

// helpers
const callsBack = require("./helpers/callsBack");

// file under test
const FileSystemUtilities = require("../src/FileSystemUtilities");

jest.mock("fs-extra");
jest.mock("path-exists");
jest.mock("../src/ChildProcessUtilities");

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
});
