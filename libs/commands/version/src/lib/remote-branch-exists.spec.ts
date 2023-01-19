import { cloneFixtureFactory } from "@lerna/test-helpers";
import execa from "execa";

const cloneFixture = cloneFixtureFactory(__dirname);

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { remoteBranchExists } = require("./remote-branch-exists");

test("remoteBranchExists", async () => {
  const { cwd } = await cloneFixture("root-manifest-only");

  expect(remoteBranchExists("origin", "new-branch", { cwd })).toBe(false);

  await execa("git", ["checkout", "-b", "new-branch"], { cwd });
  await execa("git", ["push", "-u", "origin", "new-branch"], { cwd });

  expect(remoteBranchExists("origin", "new-branch", { cwd })).toBe(true);
});
