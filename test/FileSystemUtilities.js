import pathExists from "path-exists";
import assert from "assert";
import mkdirp from "mkdirp";
import rimraf from "rimraf";
import path from "path";
import fs from "fs";

import FileSystemUtilities from "../src/FileSystemUtilities";

const tmpDir = path.resolve(__dirname, "../tmp");

describe("FileSystemUtilities", () => {
  let testDir;

  beforeEach(() => {
    testDir = path.resolve(tmpDir, "test-" + Date.now());
    mkdirp.sync(testDir);
  });

  afterEach(() => {
    rimraf.sync(testDir);
  });

  describe(".mkdirSync()", () => {
    it("should create a directory", () => {
      const dirPath = path.join(testDir, "mkdirSync-test");
      FileSystemUtilities.mkdirSync(dirPath);
      assert.ok(pathExists.sync(dirPath));
    });
  });

  describe(".mkdirp()", () => {
    it("should create a nested directory", (done) => {
      const dirPath = path.join(testDir, "mkdirp/test");
      FileSystemUtilities.mkdirp(dirPath, (err) => {
        assert.ok(pathExists.sync(dirPath));
        done(err);
      });
    });
  });

  describe(".readdirSync()", () => {
    it("should read a directory synchronously", () => {
      fs.writeFileSync(path.join(testDir, "a"), "contents");
      fs.writeFileSync(path.join(testDir, "b"), "contents");
      fs.writeFileSync(path.join(testDir, "c"), "contents");
      assert.deepEqual(FileSystemUtilities.readdirSync(testDir), ["a", "b", "c"]);
    });
  });

  describe(".existsSync()", () => {
    it("should test for existance synchronously", () => {
      const filePath = path.join(testDir, "existsSync-test");
      fs.writeFileSync(filePath, "contents");
      assert.ok(FileSystemUtilities.existsSync(filePath));
    });
  });

  describe(".writeFile()", () => {
    it("should write a file", (done) => {
      const filePath = path.join(testDir, "writeFile-test");
      FileSystemUtilities.writeFile(filePath, "contents", (err) => {
        assert.ok(pathExists.sync(filePath));
        assert.equal(fs.readFileSync(filePath).toString(), "contents\n");
        done(err);
      });
    });
  });

  describe(".writeFileSync()", () => {
    it("should write a file synchronously", () => {
      const filePath = path.join(testDir, "writeFileSync-test");
      FileSystemUtilities.writeFileSync(filePath, "contents");
      assert.equal(fs.readFileSync(filePath).toString(), "contents\n");
    });
  });

  describe(".readFileSync()", () => {
    it("should read a file synchronously", () => {
      const filePath = path.join(testDir, "readFileSync-test");
      fs.writeFileSync(filePath, "contents\n");
      assert.equal(FileSystemUtilities.readFileSync(filePath), "contents");
    });
  });

  describe(".rimraf()", () => {
    it("should delete a directory", (done) => {
      const dirPath = path.join(testDir, "rimraf/test");
      mkdirp.sync(dirPath);
      FileSystemUtilities.rimraf(dirPath, (err) => {
        assert.ok(!pathExists.sync(dirPath));
        done(err);
      });
    });
  });
});
