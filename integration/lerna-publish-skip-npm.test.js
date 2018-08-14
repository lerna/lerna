"use strict";

const writeJsonFile = require("write-json-file");
const loadJsonFile = require("load-json-file");
const path = require("path");

const cliRunner = require("@lerna-test/cli-runner");
const gitAdd = require("@lerna-test/git-add");
const gitCommit = require("@lerna-test/git-commit");
const gitTag = require("@lerna-test/git-tag");
const cloneFixture = require("@lerna-test/clone-fixture")(
  path.resolve(__dirname, "../commands/publish/__tests__")
);

// stabilize changelog commit SHA and datestamp
expect.addSnapshotSerializer(require("@lerna-test/serialize-changelog"));

async function commitChangeToPackage(cwd, packageName, commitMsg, data) {
  const packageJSONPath = path.join(cwd, "packages", packageName, "package.json");
  const pkg = await loadJsonFile(packageJSONPath);

  await writeJsonFile(packageJSONPath, Object.assign(pkg, data));
  await gitAdd(cwd, packageJSONPath);

  return gitCommit(cwd, commitMsg);
}

const env = {
  // never actually upload when calling `npm install`
  npm_config_dry_run: true,
  // skip npm package validation, none of the stubs are real
  LERNA_INTEGRATION: "SKIP",
};

test("lerna publish --skip-npm aliases to lerna version immediately", async () => {
  const { cwd } = await cloneFixture("normal", "feat: init repo");
  const args = ["publish", "--skip-npm", "--conventional-commits", "--yes"];

  await gitTag(cwd, "v1.0.0");
  await commitChangeToPackage(cwd, "package-3", "feat(package-3): Add foo", { foo: true });

  const { stdout, stderr } = await cliRunner(cwd, env)(...args);

  expect(stdout).toMatchInlineSnapshot(`

Changes:
 - package-3: 1.0.0 => 1.1.0
 - package-5: 1.0.0 => 1.1.0 (private)

`);
  expect(stderr).toMatch("Instead of --skip-npm, call `lerna version` directly");
});
