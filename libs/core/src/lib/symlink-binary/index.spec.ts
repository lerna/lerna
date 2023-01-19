/* eslint-disable @typescript-eslint/no-var-requires */
import { Package } from "../package";
/* eslint-disable @nrwl/nx/enforce-module-boundaries */
// nx-ignore-next-line
import { initFixtureFactory } from "@lerna/test-helpers";
import path from "path";
import { symlinkBinary } from ".";

const initFixture = initFixtureFactory(__dirname);

// nx-ignore-next-line
expect.extend(require("@lerna/test-helpers/src/lib/pkg-matchers"));

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    interface Matchers<R> {
      toHaveBinaryLinks(...binNames: string[]): R;
      toHaveExecutables(...binNames: string[]): R;
    }
  }
}

describe("symlink-binary", () => {
  it("should work with path references", async () => {
    const testDir = await initFixture("links");
    const srcPath = path.join(testDir, "packages/package-2");
    const dstPath = path.join(testDir, "packages/package-3");

    await symlinkBinary(srcPath, dstPath);

    expect(dstPath).toHaveBinaryLinks("links-2");
  });

  it("should work with Package instances", async () => {
    const testDir = await initFixture("links");
    const srcPath = path.join(testDir, "packages/package-2");
    const dstPath = path.join(testDir, "packages/package-3");

    await symlinkBinary(Package.lazy(srcPath), Package.lazy(dstPath));

    expect(dstPath).toHaveBinaryLinks("links-2");
  });

  it("should skip missing bin config", async () => {
    const testDir = await initFixture("links");
    const srcPath = path.join(testDir, "packages/package-1");
    const dstPath = path.join(testDir, "packages/package-2");

    await symlinkBinary(srcPath, dstPath);

    expect(dstPath).not.toHaveBinaryLinks();
  });

  it("should create shims for all declared binaries", async () => {
    const testDir = await initFixture("links");
    const srcPath = path.join(testDir, "packages/package-3");
    const dstPath = path.join(testDir, "packages/package-4");

    await symlinkBinary(srcPath, dstPath);

    expect(srcPath).toHaveExecutables("cli1.js", "cli2.js");
    expect(dstPath).toHaveBinaryLinks("links3cli1", "links3cli2", "links3cli3");
  });

  it("should preserve previous bin entries", async () => {
    const testDir = await initFixture("links");
    const pkg2Path = path.join(testDir, "packages/package-2");
    const pkg3Path = path.join(testDir, "packages/package-3");
    const destPath = path.join(testDir, "packages/package-4");

    await symlinkBinary(pkg2Path, destPath);
    await symlinkBinary(pkg3Path, destPath);

    expect(destPath).toHaveBinaryLinks("links-2", "links3cli1", "links3cli2", "links3cli3");
  });
});
