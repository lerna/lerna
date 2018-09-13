"use strict";

const execa = require("execa");
const fs = require("fs-extra");
const path = require("path");
const tempy = require("tempy");

const cliRunner = require("@lerna-test/cli-runner");
const gitAdd = require("@lerna-test/git-add");
const gitCommit = require("@lerna-test/git-commit");
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

test("lerna publish exits with EBEHIND when behind upstream remote", async () => {
  const { cwd, repository } = await cloneFixture("normal");
  const cloneDir = tempy.directory();

  // simulate upstream change from another clone
  await execa("git", ["clone", repository, cloneDir]);
  await fs.outputFile(path.join(cloneDir, "README.md"), "upstream change");
  await gitAdd(cloneDir, "-A");
  await gitCommit(cloneDir, "upstream change");
  await execa("git", ["push", "origin", "master"], { cwd: cloneDir });

  // throws during interactive publish (local)
  try {
    await cliRunner(cwd, env)("publish", "--no-ci");
  } catch (err) {
    expect(err.message).toMatch(/EBEHIND/);
  }

  // warns during non-interactive publish (CI)
  const { stderr } = await cliRunner(cwd, env)("publish", "--ci");
  expect(stderr).toMatch("EBEHIND");
});
