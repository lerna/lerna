"use strict";

const async = require("async");
const path = require("path");
const readPkg = require("read-pkg");

const Package = require("../src/Package");

// helpers
const initFixture = require("./helpers/initFixture");
const pkgMatchers = require("./helpers/pkgMatchers");

// file under test
const symlink = require("../src/utils/symlink");

expect.extend(pkgMatchers);

describe("symlink.bin()", () => {
  it("should work with references", async done => {
    const testDir = await initFixture("PackageUtilities/links");
    const srcRef = path.join(testDir, "packages/package-2");
    const destRef = path.join(testDir, "packages/package-3");

    const cb = err => {
      expect(err).toBe(null);
      done();
    };

    symlink.bin(srcRef, destRef, cb);
  });

  it("should work with packages", async done => {
    const testDir = await initFixture("PackageUtilities/links");
    const srcRef = path.join(testDir, "packages/package-2");
    const destRef = path.join(testDir, "packages/package-3");
    const src = new Package(await readPkg(srcRef), srcRef);
    const dest = new Package(await readPkg(destRef), destRef);

    const cb = err => {
      expect(err).toBe(null);
      done();
    };

    symlink.bin(src, dest, cb);
  });

  it("should work with missing bin files", async done => {
    const testDir = await initFixture("PackageUtilities/links");
    const srcRef = path.join(testDir, "packages/package-3");
    const destRef = path.join(testDir, "packages/package-4");

    const cb = err => {
      expect(err).toBe(null);
      done();
    };

    symlink.bin(srcRef, destRef, cb);
  });

  it("should create a link string bin entry", async done => {
    const testDir = await initFixture("PackageUtilities/links");
    const src = path.join(testDir, "packages/package-2");
    const dest = path.join(testDir, "packages/package-3");

    const cb = () => {
      expect(dest).toHaveBinaryLink("links-2");
      done();
    };

    symlink.bin(src, dest, cb);
  });

  it("should create links for object bin entry", async done => {
    const testDir = await initFixture("PackageUtilities/links");
    const src = path.join(testDir, "packages/package-3");
    const dest = path.join(testDir, "packages/package-4");

    const cb = () => {
      expect(dest).toHaveBinaryLink(["links3cli1", "links3cli2"]);
      done();
    };

    symlink.bin(src, dest, cb);
  });

  it("should make links targets executable", async done => {
    const testDir = await initFixture("PackageUtilities/links");
    const src = path.join(testDir, "packages/package-3");
    const dest = path.join(testDir, "packages/package-4");

    const cb = () => {
      expect(src).toHaveExecutable(["cli1.js", "cli2.js"]);
      done();
    };

    symlink.bin(src, dest, cb);
  });

  it("should preserve previous bin entries", async done => {
    const testDir = await initFixture("PackageUtilities/links");
    const firstSrcRef = path.join(testDir, "packages/package-2");
    const secondSrcRef = path.join(testDir, "packages/package-3");
    const dest = path.join(testDir, "packages/package-4");

    const finish = () => {
      expect(dest).toHaveBinaryLink(["links-2", "links3cli1", "links3cli2"]);
      done();
    };

    async.series(
      [cb => symlink.bin(firstSrcRef, dest, cb), cb => symlink.bin(secondSrcRef, dest, cb)],
      finish
    );
  });
});
