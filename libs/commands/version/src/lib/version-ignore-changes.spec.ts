import {
  commandRunner,
  gitAdd,
  gitCommit,
  gitSHASerializer,
  gitTag,
  initFixtureFactory,
  showCommit,
} from "@lerna/test-helpers";
import fs from "fs-extra";
import path from "path";
import versionCommand from "../command";

vi.mock("@lerna/core", async () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const realCore = (await vi.importActual("@lerna/core")) as any;
  const mockCore = await import("@lerna/test-helpers/__mocks__/@lerna/core");
  return {
    ...realCore,
    ...mockCore,
    // we're actually testing integration with git
    collectProjectUpdates: realCore.collectProjectUpdates,
    gitCheckout: realCore.gitCheckout,
  };
});

vi.mock("./git-add");
vi.mock("./git-commit");
vi.mock("./git-push");
vi.mock("./is-anything-committed", async () => ({
  isAnythingCommitted: vi.fn().mockReturnValue(true),
}));
vi.mock("./is-behind-upstream", async () => ({
  isBehindUpstream: vi.fn().mockReturnValue(false),
}));
vi.mock("./remote-branch-exists", async () => ({
  remoteBranchExists: vi.fn().mockResolvedValue(true),
}));

const initFixture = initFixtureFactory(path.resolve(__dirname, "../../../publish"));

// test command

const lernaVersion = commandRunner(versionCommand);

// stabilize commit SHA
expect.addSnapshotSerializer(gitSHASerializer);

// TODO: figure out why these tests can't run with the mocks but others can
describe.skip("version --ignore-changes", () => {
  const setupChanges = async (cwd, tuples) => {
    await gitTag(cwd, "v1.0.0");
    await Promise.all(
      tuples.map(([filePath, content]) => fs.outputFile(path.join(cwd, filePath), content, "utf8"))
    );
    await gitAdd(cwd, ".");
    await gitCommit(cwd, "setup");
  };

  it("does not version packages with ignored changes", async () => {
    const cwd = await initFixture("normal");

    await setupChanges(cwd, [
      ["packages/package-2/README.md", "oh"],
      ["packages/package-3/__tests__/pkg3.test.js", "hai"],
      ["packages/package-4/lib/foo.js", "there"],
    ]);

    await lernaVersion(cwd)(
      "--ignore-changes",
      "README.md",

      "--ignore-changes",
      "**/__tests__/**",

      "--ignore-changes",
      "package-4" // notably does NOT work, needs to be "**/package-4/**" to match
    );

    const changedFiles = await showCommit(cwd, "--name-only");
    expect(changedFiles).toMatchSnapshot();
  });

  it("is mapped from deprecated --ignore", async () => {
    const cwd = await initFixture("normal");

    await setupChanges(cwd, [
      ["packages/package-3/README.md", "wat"],
      ["packages/package-4/lib/foo.js", "hey"],
    ]);

    await lernaVersion(cwd)("--ignore", "*.md");

    const changedFiles = await showCommit(cwd, "--name-only");
    expect(changedFiles).toMatchSnapshot();
  });
});
