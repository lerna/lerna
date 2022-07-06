"use strict";

const execa = require("execa");
const cloneFixture = require("@lerna-test/clone-fixture")(__dirname);
const { remoteBranchExists } = require("../lib/remote-branch-exists");

test("remoteBranchExists", async () => {
  const { cwd } = await cloneFixture("root-manifest-only");

  expect(remoteBranchExists("origin", "new-branch", { cwd })).toBe(false);

  await execa("git", ["checkout", "-b", "new-branch"], { cwd });
  await execa("git", ["push", "-u", "origin", "new-branch"], { cwd });

  expect(remoteBranchExists("origin", "new-branch", { cwd })).toBe(true);
});
