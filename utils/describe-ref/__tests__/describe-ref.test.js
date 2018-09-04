"use strict";

jest.mock("@lerna/child-process");

const childProcess = require("@lerna/child-process");
const describeRef = require("../lib/describe-ref");

const DEFAULT_ARGS = ["describe", "--always", "--long", "--dirty", "--first-parent"];

childProcess.exec.mockResolvedValue({ stdout: "v1.2.3-4-g567890a" });
childProcess.execSync.mockReturnValue("v1.2.3-4-g567890a");

describe("describeRef()", () => {
  it("resolves parsed metadata", async () => {
    const result = await describeRef();

    expect(childProcess.exec).lastCalledWith("git", DEFAULT_ARGS, {});
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

    expect(childProcess.exec).lastCalledWith("git", DEFAULT_ARGS, options);
  });

  it("accepts options.match", async () => {
    const options = { match: "v*.*.*" };
    await describeRef(options);

    expect(childProcess.exec).lastCalledWith("git", DEFAULT_ARGS.concat(["--match", "v*.*.*"]), options);
  });
});

describe("describeRef.sync()", () => {
  it("returns parsed metadata", () => {
    const result = describeRef.sync();

    expect(childProcess.execSync).lastCalledWith("git", DEFAULT_ARGS, {});
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
    describeRef.sync(options);

    expect(childProcess.execSync).lastCalledWith("git", DEFAULT_ARGS, options);
  });

  it("accepts options.match", () => {
    const options = { match: "v*.*.*" };
    describeRef.sync(options);

    expect(childProcess.execSync).lastCalledWith("git", DEFAULT_ARGS.concat(["--match", "v*.*.*"]), options);
  });
});

describe("describeRef.parse()", () => {
  it("matches independent tags", () => {
    const result = describeRef.parse("pkg-name@1.2.3-4-g567890a");

    expect(result.lastTagName).toBe("pkg-name@1.2.3");
    expect(result.lastVersion).toBe("1.2.3");
  });

  it("matches independent tags for scoped packages", () => {
    const result = describeRef.parse("@scope/pkg-name@1.2.3-4-g567890a");

    expect(result.lastTagName).toBe("@scope/pkg-name@1.2.3");
    expect(result.lastVersion).toBe("1.2.3");
  });

  it("matches dirty annotations", () => {
    const result = describeRef.parse("pkg-name@1.2.3-4-g567890a-dirty");

    expect(result.isDirty).toBe(true);
  });

  it("handles non-matching strings safely", () => {
    const result = describeRef.parse("poopy-pants");

    expect(result).toEqual({
      isDirty: false,
      lastTagName: undefined,
      lastVersion: undefined,
      refCount: undefined,
      sha: undefined,
    });
  });

  it("detects fallback and returns partial metadata", () => {
    childProcess.execSync.mockReturnValueOnce("123");

    const options = { cwd: "bar" };
    const result = describeRef.parse("a1b2c3d", options);

    expect(childProcess.execSync).lastCalledWith("git", ["rev-list", "--count", "a1b2c3d"], options);
    expect(result).toEqual({
      isDirty: false,
      refCount: "123",
      sha: "a1b2c3d",
    });
  });

  it("detects dirty fallback and returns partial metadata", () => {
    childProcess.execSync.mockReturnValueOnce("456");

    const result = describeRef.parse("a1b2c3d-dirty");

    expect(childProcess.execSync).lastCalledWith("git", ["rev-list", "--count", "a1b2c3d"], {});
    expect(result).toEqual({
      isDirty: true,
      refCount: "456",
      sha: "a1b2c3d",
    });
  });
});
