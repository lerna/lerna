import fs from "graceful-fs";
import pathExists from "path-exists";
import assert from "assert";
import mkdirp from "mkdirp";
import path from "path";

import {
  fixtureNamer,
  getTempDir,
  rimrafAsync,
} from "./helpers/fixtureUtils";

import FileSystemUtilities from "../src/FileSystemUtilities";

describe("FileSystemUtilities", () => {
  const getFixtureName = fixtureNamer();

  let testDir;

  beforeEach(() => getTempDir(getFixtureName("FileSystemUtilities")).then((dir) => {
    testDir = dir;
  }));

  afterEach(() => rimrafAsync(testDir));

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
        if (err) return done.fail(err);

        try {
          assert.ok(pathExists.sync(dirPath));
          done();
        } catch (ex) {
          done.fail(ex);
        }
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
        if (err) return done.fail(err);

        try {
          assert.ok(pathExists.sync(filePath));
          assert.equal(fs.readFileSync(filePath).toString(), "contents\n");
          done();
        } catch (ex) {
          done.fail(ex);
        }
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
        if (err) return done.fail(err);

        try {
          assert.ok(!pathExists.sync(dirPath));
          done();
        } catch (ex) {
          done.fail(ex);
        }
      });
    });
  });

  describe(".rename()", () => {
    it("should rename a file", (done) => {
      const srcPath = path.join(testDir, "src");
      const dstPath = path.join(testDir, "dst");
      fs.writeFileSync(srcPath, "contents");
      FileSystemUtilities.rename(srcPath, dstPath, (err) => {
        if (err) return done.fail(err);

        try {
          assert.ok(pathExists.sync(dstPath));
          assert.ok(!pathExists.sync(srcPath));
          assert.equal(fs.readFileSync(dstPath).toString(), "contents");
          done();
        } catch (ex) {
          done.fail(ex);
        }
      });
    });
  });

  describe(".renameSync()", () => {
    it("should rename a file", () => {
      const srcPath = path.join(testDir, "src");
      const dstPath = path.join(testDir, "dst");
      fs.writeFileSync(srcPath, "contents");
      FileSystemUtilities.renameSync(srcPath, dstPath);
      assert.ok(pathExists.sync(dstPath));
      assert.ok(!pathExists.sync(srcPath));
      assert.equal(fs.readFileSync(dstPath).toString(), "contents");
    });
  });

  describe(".statSync()", () => {
    it("should stat a file", () => {
      const dirPath = path.join(testDir, "stat-dir");
      mkdirp.sync(dirPath);
      const stat = FileSystemUtilities.statSync(dirPath);
      assert.ok(stat.isDirectory());
    });
  });
});
