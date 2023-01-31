import { promptSelectOne as _promptSelectOne } from "@lerna/core";
import { commandRunner, getCommitMessage, initFixtureFactory } from "@lerna/test-helpers";
import path from "path";

// eslint-disable-next-line jest/no-mocks-import
jest.mock("@lerna/core", () => require("@lerna/test-helpers/__mocks__/@lerna/core"));

jest.mock("./git-push");
jest.mock("./is-anything-committed", () => ({
  isAnythingCommitted: jest.fn().mockReturnValue(true),
}));
jest.mock("./is-behind-upstream", () => ({
  isBehindUpstream: jest.fn().mockReturnValue(false),
}));
jest.mock("./remote-branch-exists", () => ({
  remoteBranchExists: jest.fn().mockResolvedValue(true),
}));

// helpers
const initFixture = initFixtureFactory(path.resolve(__dirname, "../../../publish"));

// The mocked version isn't the same as the real one
const promptSelectOne = _promptSelectOne as any;

// test command
// eslint-disable-next-line @typescript-eslint/no-var-requires
const lernaVersion = commandRunner(require("../command"));

describe("version bump", () => {
  it("accepts explicit versions", async () => {
    const testDir = await initFixture("normal");
    await lernaVersion(testDir)("1.0.1-beta.25");

    expect(promptSelectOne).not.toHaveBeenCalled();

    const message = await getCommitMessage(testDir);
    expect(message).toBe("v1.0.1-beta.25");
  });

  it("receives --repo-version <value> as explicit [bump]", async () => {
    const testDir = await initFixture("normal");
    await lernaVersion(testDir)("--repo-version", "1.0.1-beta.25");

    const message = await getCommitMessage(testDir);
    expect(message).toBe("v1.0.1-beta.25");
  });

  it("errors when --repo-version and [bump] positional passed", async () => {
    const testDir = await initFixture("normal");
    const command = lernaVersion(testDir)("v1.0.1-beta.25", "--repo-version", "v1.0.1-beta.25");

    await expect(command).rejects.toThrow("Arguments repo-version and bump are mutually exclusive");
  });

  it("strips invalid semver information from explicit value", async () => {
    const testDir = await initFixture("normal");
    await lernaVersion(testDir)("v1.2.0-beta.1+deadbeef");

    const message = await getCommitMessage(testDir);
    expect(message).toBe("v1.2.0-beta.1");
  });

  it("accepts semver keywords", async () => {
    const testDir = await initFixture("normal");
    await lernaVersion(testDir)("minor");

    expect(promptSelectOne).not.toHaveBeenCalled();

    const message = await getCommitMessage(testDir);
    expect(message).toBe("v1.1.0");
  });

  it("receives --cd-version <bump>", async () => {
    const testDir = await initFixture("normal");
    await lernaVersion(testDir)("--cd-version", "premajor");

    const message = await getCommitMessage(testDir);
    expect(message).toBe("v2.0.0-alpha.0");
  });

  it("errors when --cd-version and [bump] positional passed", async () => {
    const testDir = await initFixture("normal");
    const command = lernaVersion(testDir)("minor", "--cd-version", "minor");

    await expect(command).rejects.toThrow("Arguments cd-version and bump are mutually exclusive");
  });

  it("throws an error when an invalid semver keyword is used", async () => {
    const testDir = await initFixture("normal");
    const command = lernaVersion(testDir)("poopypants");

    await expect(command).rejects.toThrow(
      "bump must be an explicit version string _or_ one of: " +
        "'major', 'minor', 'patch', 'premajor', 'preminor', 'prepatch', or 'prerelease'."
    );
  });

  test("prerelease increments version with default --preid", async () => {
    const testDir = await initFixture("independent");

    await lernaVersion(testDir)("prerelease");

    const message = await getCommitMessage(testDir);
    expect(message).toContain("package-1@1.0.1-alpha.0");
    // TODO: (major) make --no-private the default
    expect(message).toContain("package-5@5.0.1-alpha.0");
  });

  test("prerelease increments version with custom --preid", async () => {
    const testDir = await initFixture("independent");

    await lernaVersion(testDir)("prerelease", "--preid", "foo");

    const message = await getCommitMessage(testDir);
    expect(message).toContain("package-1@1.0.1-foo.0");
  });

  it("ignores private packages with --no-private", async () => {
    const testDir = await initFixture("independent");

    await lernaVersion(testDir)("patch", "--no-private");

    const message = await getCommitMessage(testDir);
    // TODO: (major) make --no-private the default
    expect(message).not.toContain("package-5");
  });
});
