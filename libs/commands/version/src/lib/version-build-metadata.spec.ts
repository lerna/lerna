import { promptSelectOne as _promptSelectOne, promptTextInput as _promtTextInput } from "@lerna/core";
import { commandRunner, initFixtureFactory, showCommit } from "@lerna/test-helpers";
import path from "path";

// eslint-disable-next-line jest/no-mocks-import
jest.mock("@lerna/core", () => require("@lerna/test-helpers/__mocks__/@lerna/core"));

const promptTextInput = jest.mocked(_promtTextInput);

// The mocked version isn't the same as the real one
const promptSelectOne = _promptSelectOne as any;

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

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { makePromptVersion } = require("./prompt-version");

const resolvePrereleaseId = jest.fn(() => "alpha");
const versionPrompt = (buildMetadata) => makePromptVersion(resolvePrereleaseId, buildMetadata);

// helpers
const initFixture = initFixtureFactory(path.resolve(__dirname, "../../publish/__tests__"));

// file under test
// eslint-disable-next-line @typescript-eslint/no-var-requires
const lernaVersion = commandRunner(require("../command"));

describe("--build-metadata without prompt", () => {
  it("accepts build metadata for explicit version", async () => {
    const testDir = await initFixture("normal");
    await lernaVersion(testDir)("1.0.1", "--build-metadata", "20130313144700");

    expect(promptSelectOne).not.toHaveBeenCalled();

    const patch = await showCommit(testDir);
    expect(patch).toMatchSnapshot();
  });

  it("updates build metadata for explicit version", async () => {
    const testDir = await initFixture("build-metadata");
    await lernaVersion(testDir)("1.0.1", "--build-metadata", "20130313144700");

    expect(promptSelectOne).not.toHaveBeenCalled();

    const patch = await showCommit(testDir);
    expect(patch).toMatchSnapshot();
  });

  it("accepts build metadata for repository version", async () => {
    const testDir = await initFixture("normal");
    await lernaVersion(testDir)("--repo-version", "1.0.2", "--build-metadata", "21AF26D3--117B344092BD");

    expect(promptSelectOne).not.toHaveBeenCalled();

    const patch = await showCommit(testDir);
    expect(patch).toMatchSnapshot();
  });

  it("accepts build metadata with semver keyword", async () => {
    const testDir = await initFixture("normal");
    await lernaVersion(testDir)("minor", "--build-metadata", "001");

    expect(promptSelectOne).not.toHaveBeenCalled();

    const patch = await showCommit(testDir);
    expect(patch).toMatchSnapshot();
  });

  it("accepts build metadata with cd version", async () => {
    const testDir = await initFixture("normal");
    await lernaVersion(testDir)("--cd-version", "premajor", "--build-metadata", "exp.sha.5114f85");

    expect(promptSelectOne).not.toHaveBeenCalled();

    const patch = await showCommit(testDir);
    expect(patch).toMatchSnapshot();
  });

  it("accepts build metadata with default prerelease id", async () => {
    const testDir = await initFixture("normal");
    await lernaVersion(testDir)("prerelease", "--build-metadata", "20130313144700");

    expect(promptSelectOne).not.toHaveBeenCalled();

    const patch = await showCommit(testDir);
    expect(patch).toMatchSnapshot();
  });

  it("accepts build metadata across independent versions with semver keyword", async () => {
    const testDir = await initFixture("independent");
    await lernaVersion(testDir)("minor", "--build-metadata", "001");

    expect(promptSelectOne).not.toHaveBeenCalled();

    const patch = await showCommit(testDir);
    expect(patch).toMatchSnapshot();
  });

  it("updates build metadata across independent versions with semver keyword", async () => {
    const testDir = await initFixture("independent-build-metadata");
    await lernaVersion(testDir)("minor", "--build-metadata", "exp.sha.5114f85");

    expect(promptSelectOne).not.toHaveBeenCalled();

    const patch = await showCommit(testDir);
    expect(patch).toMatchSnapshot();
  });
});

describe("--build-metadata with prompt", () => {
  it("accepts build metadata", async () => {
    const testDir = await initFixture("normal");
    promptSelectOne.chooseBump("minor");

    await lernaVersion(testDir)("--build-metadata", "20130313144700");

    expect(promptSelectOne).toHaveBeenCalled();

    const patch = await showCommit(testDir);
    expect(patch).toMatchSnapshot();
  });

  it("updates build metadata", async () => {
    const testDir = await initFixture("build-metadata");
    promptSelectOne.chooseBump("minor");

    await lernaVersion(testDir)("--build-metadata", "20130313144700");

    expect(promptSelectOne).toHaveBeenCalled();

    const patch = await showCommit(testDir);
    expect(patch).toMatchSnapshot();
  });

  it("accepts build metadata across independent versions", async () => {
    const testDir = await initFixture("independent");
    promptSelectOne.chooseBump("patch");
    promptSelectOne.chooseBump("minor");
    promptSelectOne.chooseBump("major");
    promptSelectOne.chooseBump("minor");
    promptSelectOne.chooseBump("patch");

    await lernaVersion(testDir)("--build-metadata", "21AF26D3--117B344092BD");

    expect(promptSelectOne).toHaveBeenCalled();

    const patch = await showCommit(testDir);
    expect(patch).toMatchSnapshot();
  });

  it("updates build metadata across independent versions", async () => {
    const testDir = await initFixture("independent-build-metadata");
    promptSelectOne.chooseBump("patch");
    promptSelectOne.chooseBump("minor");

    await lernaVersion(testDir)("--build-metadata", "exp.sha.5114f85");

    expect(promptSelectOne).toHaveBeenCalled();

    const patch = await showCommit(testDir);
    expect(patch).toMatchSnapshot();
  });
});

describe("--build-metadata in version prompt", () => {
  test.each([
    ["patch", "1.0.1+001"],
    ["minor", "1.1.0+001"],
    ["major", "2.0.0+001"],
    ["prepatch", "1.0.1-alpha.0+001"],
    ["preminor", "1.1.0-alpha.0+001"],
    ["premajor", "2.0.0-alpha.0+001"],
  ])("accepts build metadata for prompted choice %s", async (bump, result) => {
    promptSelectOne.chooseBump(bump);

    const choice = await versionPrompt("001")({ version: "1.0.0" });

    expect(promptSelectOne).toHaveBeenLastCalledWith(
      "Select a new version (currently 1.0.0)",
      expect.objectContaining({
        choices: expect.any(Array),
      })
    );
    expect(choice).toBe(result);
  });

  it("updates build metadata for prompted choice", async () => {
    promptSelectOne.chooseBump("patch");

    const choice = await versionPrompt("20130313144700")({ version: "1.0.0+001" });

    expect(promptSelectOne).toHaveBeenLastCalledWith(
      "Select a new version (currently 1.0.0+001)",
      expect.objectContaining({
        choices: expect.any(Array),
      })
    );
    expect(choice).toBe("1.0.1+20130313144700");
  });

  it("accepts build metadata for prompted prerelease version", async () => {
    let inputFilter;

    promptSelectOne.chooseBump("PRERELEASE");
    promptTextInput.mockImplementationOnce((msg, cfg) => {
      inputFilter = cfg.filter;
      return Promise.resolve(msg);
    });

    await versionPrompt("exp.sha.5114f85")({ version: "1.0.0" });

    expect(promptSelectOne).toHaveBeenLastCalledWith(
      "Select a new version (currently 1.0.0)",
      expect.objectContaining({
        choices: expect.any(Array),
      })
    );
    expect(inputFilter("rc")).toBe("1.0.1-rc.0+exp.sha.5114f85");
  });

  it("accepts build metadata for prompted custom version", async () => {
    let inputFilter;
    let inputValidate;

    promptSelectOne.chooseBump("CUSTOM");
    promptTextInput.mockImplementationOnce((msg, cfg) => {
      inputFilter = cfg.filter;
      inputValidate = cfg.validate;
      return Promise.resolve(msg);
    });

    await versionPrompt("20130313144700")({ version: "1.0.0" });

    expect(promptSelectOne).toHaveBeenLastCalledWith(
      "Select a new version (currently 1.0.0)",
      expect.objectContaining({
        choices: expect.any(Array),
      })
    );
    expect(inputValidate(inputFilter("2.0.0+20130313144700"))).toBe(true);
  });
});
