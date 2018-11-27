"use strict";

const path = require("path");

const cliRunner = require("@lerna-test/cli-runner");
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

test("lerna publish from-git handles custom tags", async () => {
  const { cwd } = await cloneFixture("independent");

  await gitTag(cwd, "some-unrelated-tag");

  const args = ["publish", "--yes", "from-git"];

  const { stderr } = await cliRunner(cwd, env)(...args);
  expect(stderr).toMatch("lerna notice from-git No tagged release found");
});
