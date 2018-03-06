"use strict";

const path = require("path");
const readPkg = require("read-pkg");

const Package = require("@lerna/package");

// helpers
const initFixture = require("@lerna-test/init-fixture")(__dirname);
const pkgMatchers = require("@lerna-test/pkg-matchers");

// file under test
const symlinkBinary = require("..");

expect.extend(pkgMatchers);

describe("symlink-binary", () => {
  it("should work with references", async () => {
    const testDir = await initFixture("links");
    const srcPath = path.join(testDir, "packages/package-2");
    const dstPath = path.join(testDir, "packages/package-3");

    await symlinkBinary(srcPath, dstPath);

    expect(dstPath).toHaveBinaryLink("links-2");
  });

  it("should work with packages", async () => {
    const testDir = await initFixture("links");
    const srcPath = path.join(testDir, "packages/package-2");
    const dstPath = path.join(testDir, "packages/package-3");
    const [srcJson, dstJson] = await Promise.all([
      readPkg(srcPath, { normalize: false }),
      readPkg(dstPath, { normalize: false }),
    ]);

    await symlinkBinary(new Package(srcJson, srcPath), new Package(dstJson, dstPath));

    expect(dstPath).toHaveBinaryLink("links-2");
  });

  it("should skip missing bin config", async () => {
    const testDir = await initFixture("links");
    const srcPath = path.join(testDir, "packages/package-1");
    const dstPath = path.join(testDir, "packages/package-2");

    await symlinkBinary(srcPath, dstPath);

    expect(dstPath).toHaveBinaryLink([]);
  });

  it("should skip missing bin files", async () => {
    const testDir = await initFixture("links");
    const srcPath = path.join(testDir, "packages/package-3");
    const dstPath = path.join(testDir, "packages/package-4");

    await symlinkBinary(srcPath, dstPath);

    expect(srcPath).toHaveExecutable(["cli1.js", "cli2.js"]);
    expect(dstPath).toHaveBinaryLink(["links3cli1", "links3cli2"]);
  });

  it("should preserve previous bin entries", async () => {
    const testDir = await initFixture("links");
    const pkg2Path = path.join(testDir, "packages/package-2");
    const pkg3Path = path.join(testDir, "packages/package-3");
    const destPath = path.join(testDir, "packages/package-4");

    await symlinkBinary(pkg2Path, destPath);
    await symlinkBinary(pkg3Path, destPath);

    expect(destPath).toHaveBinaryLink(["links-2", "links3cli1", "links3cli2"]);
  });
});
