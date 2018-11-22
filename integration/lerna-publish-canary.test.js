"use strict";

const path = require("path");

const cliRunner = require("@lerna-test/cli-runner");
const commitChangeToPackage = require("@lerna-test/commit-change-to-package");
const gitTag = require("@lerna-test/git-tag");
const gitStatus = require("@lerna-test/git-status");
const cloneFixture = require("@lerna-test/clone-fixture")(
  path.resolve(__dirname, "../commands/publish/__tests__")
);

// stabilize changelog commit SHA and datestamp
expect.addSnapshotSerializer(require("@lerna-test/serialize-changelog"));

const env = {
  // never actually upload when calling `npm publish`
  npm_config_dry_run: true,
  // skip npm package validation, none of the stubs are real
  LERNA_INTEGRATION: "SKIP",
};

test("lerna publish --canary uses default prerelease id", async () => {
  const { cwd } = await cloneFixture("normal");
  const args = ["publish", "--canary", "--yes"];

  await gitTag(cwd, "v1.0.0");
  await commitChangeToPackage(cwd, "package-1", "change", { change: true });

  const { stdout } = await cliRunner(cwd, env)(...args);
  expect(stdout).toMatchInlineSnapshot(`

Found 3 packages to publish:
 - package-1 => 1.0.1-alpha.0+SHA
 - package-2 => 1.0.1-alpha.0+SHA
 - package-3 => 1.0.1-alpha.0+SHA

Successfully published:
 - package-1@1.0.1-alpha.0+SHA
 - package-2@1.0.1-alpha.0+SHA
 - package-3@1.0.1-alpha.0+SHA
`);
});

test("lerna publish --canary --no-git-reset leaves the working tree dirty", async () => {
  const { cwd } = await cloneFixture("normal");
  const args = ["publish", "--canary", "--yes", "--no-git-reset"];

  await gitTag(cwd, "v1.0.0");
  await commitChangeToPackage(cwd, "package-1", "change", { change: true });

  const { stdout } = await cliRunner(cwd, env)(...args);
  expect(stdout).toMatchInlineSnapshot(`

Found 3 packages to publish:
 - package-1 => 1.0.1-alpha.0+SHA
 - package-2 => 1.0.1-alpha.0+SHA
 - package-3 => 1.0.1-alpha.0+SHA

Successfully published:
 - package-1@1.0.1-alpha.0+SHA
 - package-2@1.0.1-alpha.0+SHA
 - package-3@1.0.1-alpha.0+SHA
`);

  const { stdout: statusStdOut } = await gitStatus();
  expect(statusStdOut).toMatchInlineSnapshot(`
On branch master
Your branch is ahead of 'origin/master' by 1 commit.
  (use "git push" to publish your local commits)

Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git checkout -- <file>..." to discard changes in working directory)

	modified:   packages/package-1/package.json
	modified:   packages/package-2/package.json
	modified:   packages/package-3/package.json

no changes added to commit (use "git add" and/or "git commit -a")
`);
});
