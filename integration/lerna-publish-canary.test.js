"use strict";

const path = require("path");

const cliRunner = require("@lerna-test/cli-runner");
const commitChangeToPackage = require("@lerna-test/commit-change-to-package");
const gitTag = require("@lerna-test/git-tag");
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
