/**
 * Creates and initializes needed version mocks for all publish specs
 * @returns all created version mocks
 */
export function setupLernaVersionMocks() {
  return {
    gitPush: jest.mock("@lerna/commands/version/lib/git-push"),
    isAnythingCommitted: jest.mock("@lerna/commands/version/lib/is-anything-committed", () => ({
      isAnythingCommitted: jest.fn().mockResolvedValue(true),
    })),
    isBehindUpstream: jest.mock("@lerna/commands/version/lib/is-behind-upstream"),
    remoteBranchExists: jest.mock("@lerna/commands/version/lib/remote-branch-exists", () => ({
      remoteBranchExists: jest.fn().mockResolvedValue(true),
    })),
  };
}
