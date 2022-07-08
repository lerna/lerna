"use strict";

const execa = require("execa");
const fs = require("fs-extra");
const path = require("path");
const tempy = require("tempy");

const { cliRunner } = require("@lerna-test/helpers");
const { gitAdd } = require("@lerna-test/helpers");
const { gitCommit } = require("@lerna-test/helpers");
const cloneFixture = require("@lerna-test/helpers").cloneFixtureFactory(
  path.resolve(__dirname, "../commands/publish/__tests__")
);

// stabilize changelog commit SHA and datestamp
expect.addSnapshotSerializer(require("@lerna-test/helpers/serializers/serialize-changelog"));

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
  await execa("git", ["checkout", "-B", "main", "origin/main"], { cwd: cloneDir });
  await fs.outputFile(path.join(cloneDir, "README.md"), "upstream change");
  await gitAdd(cloneDir, "-A");
  await gitCommit(cloneDir, "upstream change");
  await execa("git", ["push", "origin", "main"], { cwd: cloneDir });

  // throws during interactive publish (local)
  await expect(cliRunner(cwd, env)("publish", "--no-ci")).rejects.toThrow(/EBEHIND/);

  // warns during non-interactive publish (CI)
  const { stderr } = await cliRunner(cwd, env)("publish", "--ci");
  expect(stderr).toMatch("EBEHIND");
});
