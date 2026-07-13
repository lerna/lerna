import { commandRunner, getCommitMessage, gitSHASerializer, initFixtureFactory } from "@lerna/test-helpers";
import path from "path";
import versionCommand from "../command";

vi.mock("@lerna/core", async () => ({
  ...(await vi.importActual("@lerna/core")),
  ...(await import("@lerna/test-helpers/__mocks__/@lerna/core")),
}));

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

test("publish --message %s", async () => {
  const cwd = await initFixture("normal");
  await lernaVersion(cwd)("--message", "chore: Release %s :rocket:");

  const message = await getCommitMessage(cwd);
  expect(message).toMatch("chore: Release v1.0.1 :rocket:");
});

test("publish --message %v", async () => {
  const cwd = await initFixture("normal");
  await lernaVersion(cwd)("--message", "chore: Version %v without prefix");

  const message = await getCommitMessage(cwd);
  expect(message).toMatch("chore: Version 1.0.1 without prefix");
});

test("publish -m --independent", async () => {
  const cwd = await initFixture("independent");
  await lernaVersion(cwd)("-m", "chore: Custom publish message subject");

  const message = await getCommitMessage(cwd);
  expect(message).toMatch("chore: Custom publish message subject");
});
