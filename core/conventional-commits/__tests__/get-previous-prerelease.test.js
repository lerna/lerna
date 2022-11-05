"use strict";

jest.mock("@lerna/child-process");

const childProcess = require("@lerna/child-process");
const { getPreviousPrerelease } = require("../lib/get-previous-prerelease");

describe("get-previous-prerelease", () => {
  childProcess.execSync.mockReturnValue(
    "package-1@1.2.3-alpha.2\npackage-1@1.2.3-alpha.1\npackage-1@1.2.3-alpha.0"
  );

  it("should return current version if semver.coerce fails", () => {
    const currentVersion = "some-version";
    const previousPrerelease = getPreviousPrerelease(currentVersion, "package-1", "alpha");

    expect(previousPrerelease).toBe("some-version");
  });

  it("should return previous prerelease version with package name", () => {
    const currentVersion = "1.2.3-alpha.0";
    const previousPrerelease = getPreviousPrerelease(currentVersion, "package-1", "alpha");

    expect(previousPrerelease).toBe("1.2.3-alpha.2");
    expect(childProcess.execSync).toHaveBeenLastCalledWith("git", [
      "tag",
      "--list",
      "package-1@1.2.3-alpha*",
      "--sort",
      "-version:refname",
    ]);
  });

  it("should return previous prerelease version without package name", () => {
    const currentVersion = "1.2.3-alpha.0";
    const previousPrerelease = getPreviousPrerelease(currentVersion, undefined, "alpha");

    expect(previousPrerelease).toBe("1.2.3-alpha.2");
    expect(childProcess.execSync).toHaveBeenLastCalledWith("git", [
      "tag",
      "--list",
      "1.2.3-alpha*",
      "--sort",
      "-version:refname",
    ]);
  });
});
