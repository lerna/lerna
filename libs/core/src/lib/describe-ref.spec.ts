"use strict";

jest.mock("@lerna/child-process");

// eslint-disable-next-line @typescript-eslint/no-var-requires
const childProcess = require("@lerna/child-process");

import { describeRef, DescribeRefDetailedResult, describeRefSync } from "./describe-ref";

const DEFAULT_ARGS = ["describe", "--always", "--long", "--dirty", "--first-parent"];

describe("describeRef()", () => {
  beforeEach(() => {
    childProcess.exec.mockResolvedValueOnce({ stdout: "v1.2.3-4-g567890a" });
  });

  it("resolves parsed metadata", async () => {
    const result = await describeRef();

    expect(childProcess.exec).toHaveBeenLastCalledWith("git", DEFAULT_ARGS, {});
    expect(result).toEqual({
      isDirty: false,
      lastTagName: "v1.2.3",
      lastVersion: "v1.2.3",
      refCount: "4",
      sha: "567890a",
    });
  });

  it("accepts options.cwd", async () => {
    const options = { cwd: "foo" };
    await describeRef(options);

    expect(childProcess.exec).toHaveBeenLastCalledWith("git", DEFAULT_ARGS, options);
  });

  it("accepts options.match", async () => {
    const options = { match: "v*.*.*" };
    await describeRef(options);

    expect(childProcess.exec).toHaveBeenLastCalledWith(
      "git",
      DEFAULT_ARGS.concat(["--match", "v*.*.*"]),
      options
    );
  });

  it("accepts includeMergedTags argument", async () => {
    const includeMergedTags = true;

    await describeRef({}, includeMergedTags);

    const newArgs = [...DEFAULT_ARGS];
    newArgs.pop();
    expect(childProcess.exec).toHaveBeenLastCalledWith("git", newArgs, {});
  });
});

describe("describeRefSync()", () => {
  beforeEach(() => {
    childProcess.execSync.mockReturnValueOnce("v1.2.3-4-g567890a");
  });

  it("returns parsed metadata", () => {
    const result = describeRefSync();

    expect(childProcess.execSync).toHaveBeenLastCalledWith("git", DEFAULT_ARGS, {});
    expect(result).toEqual({
      isDirty: false,
      lastTagName: "v1.2.3",
      lastVersion: "v1.2.3",
      refCount: "4",
      sha: "567890a",
    });
  });

  it("accepts options.cwd", () => {
    const options = { cwd: "foo" };
    describeRefSync(options);

    expect(childProcess.execSync).toHaveBeenLastCalledWith("git", DEFAULT_ARGS, options);
  });

  it("accepts options.match", () => {
    const options = { match: "v*.*.*" };
    describeRefSync(options);

    expect(childProcess.execSync).toHaveBeenLastCalledWith(
      "git",
      DEFAULT_ARGS.concat(["--match", "v*.*.*"]),
      options
    );
  });

  it("accepts includeMergedTags argument", async () => {
    const includeMergedTags = true;

    describeRefSync({}, includeMergedTags);

    const newArgs = [...DEFAULT_ARGS];
    newArgs.pop();
    expect(childProcess.execSync).toHaveBeenLastCalledWith("git", newArgs, {});
  });
});

describe("parser", () => {
  it("matches independent tags", () => {
    childProcess.execSync.mockReturnValueOnce("pkg-name@1.2.3-4-g567890a");

    const result = describeRefSync() as DescribeRefDetailedResult;

    expect(result.lastTagName).toBe("pkg-name@1.2.3");
    expect(result.lastVersion).toBe("1.2.3");
  });

  it("matches independent tags for scoped packages", () => {
    childProcess.execSync.mockReturnValueOnce("@scope/pkg-name@1.2.3-4-g567890a");

    const result = describeRefSync() as DescribeRefDetailedResult;

    expect(result.lastTagName).toBe("@scope/pkg-name@1.2.3");
    expect(result.lastVersion).toBe("1.2.3");
  });

  it("matches dirty annotations", () => {
    childProcess.execSync.mockReturnValueOnce("pkg-name@1.2.3-4-g567890a-dirty");

    const result = describeRefSync();

    expect(result.isDirty).toBe(true);
  });

  it("handles non-matching strings safely", () => {
    childProcess.execSync.mockReturnValueOnce("poopy-pants");

    const result = describeRefSync();

    expect(result).toEqual({
      isDirty: false,
      lastTagName: undefined,
      lastVersion: undefined,
      refCount: undefined,
      sha: undefined,
    });
  });

  it("detects fallback and returns partial metadata", () => {
    childProcess.execSync.mockReturnValueOnce("a1b2c3d");
    childProcess.execSync.mockReturnValueOnce("123");

    const options = { cwd: "bar" };
    const result = describeRefSync(options);

    expect(childProcess.execSync).toHaveBeenLastCalledWith(
      "git",
      ["rev-list", "--count", "a1b2c3d"],
      options
    );
    expect(result).toEqual({
      isDirty: false,
      refCount: "123",
      sha: "a1b2c3d",
    });
  });

  it("detects dirty fallback and returns partial metadata", () => {
    childProcess.execSync.mockReturnValueOnce("a1b2c3d-dirty");
    childProcess.execSync.mockReturnValueOnce("456");

    const result = describeRefSync();

    expect(childProcess.execSync).toHaveBeenLastCalledWith("git", ["rev-list", "--count", "a1b2c3d"], {});
    expect(result).toEqual({
      isDirty: true,
      refCount: "456",
      sha: "a1b2c3d",
    });
  });

  it("should return metadata for tag names that are sha-like", () => {
    childProcess.execSync.mockReturnValueOnce("20190104-5-g6fb4e3293");

    const result = describeRefSync();

    expect(result).toEqual({
      isDirty: false,
      lastTagName: "20190104",
      lastVersion: "20190104",
      refCount: "5",
      sha: "6fb4e3293",
    });
  });
});
