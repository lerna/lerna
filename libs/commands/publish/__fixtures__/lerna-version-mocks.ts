import { vi } from "vitest";

/**
 * Creates and initializes needed version mocks for all publish specs.
 *
 * NOTE: these mocks are registered at runtime (not hoisted), which works because the
 * version command modules are only ever loaded lazily via dynamic import when the
 * publish command handler executes.
 *
 * @returns all created version mocks
 */
export function setupLernaVersionMocks() {
  return {
    gitPush: vi.doMock("@lerna/commands/version/lib/git-push"),
    isAnythingCommitted: vi.doMock("@lerna/commands/version/lib/is-anything-committed", () => ({
      isAnythingCommitted: vi.fn().mockResolvedValue(true),
    })),
    isBehindUpstream: vi.doMock("@lerna/commands/version/lib/is-behind-upstream"),
    remoteBranchExists: vi.doMock("@lerna/commands/version/lib/remote-branch-exists", () => ({
      remoteBranchExists: vi.fn().mockResolvedValue(true),
    })),
  };
}
