import { commandRunner, getCommitMessage, gitSHASerializer, initFixtureFactory } from "@lerna/test-helpers";
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

const initFixture = initFixtureFactory(path.resolve(__dirname, "../../../publish"));

// test command
// eslint-disable-next-line @typescript-eslint/no-var-requires
const lernaVersion = commandRunner(require("../command"));

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
