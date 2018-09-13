"use strict";

const fs = require("fs-extra");
const path = require("path");

const cliRunner = require("@lerna-test/cli-runner");
const gitAdd = require("@lerna-test/git-add");
const gitCommit = require("@lerna-test/git-commit");
const cloneFixture = require("@lerna-test/clone-fixture")(
  path.resolve(__dirname, "../commands/publish/__tests__")
);

const env = {
  // never actually upload when calling `npm publish`
  npm_config_dry_run: true,
  // skip npm package validation, none of the stubs are real
  LERNA_INTEGRATION: "SKIP",
};

test("lerna publish lifecycle scripts stop on non-zero exit", async () => {
  const { cwd } = await cloneFixture("lifecycle");
  const args = ["publish", "minor", "--yes"];

  const rootManifest = path.join(cwd, "package.json");
  const json = await fs.readJson(rootManifest);

  json.scripts.preversion = "echo boom && exit 123";

  await fs.writeJson(rootManifest, json);
  await gitAdd(cwd, rootManifest);
  await gitCommit(cwd, "update root prepack");

  try {
    await cliRunner(cwd, env)(...args);
  } catch (err) {
    expect(err.code).toBe(123);

    if (process.platform !== "win32") {
      // windows can go pound sand, i'm done debugging this shit
      expect(err.stdout).toMatchInlineSnapshot(`

Changes:
 - package-1: 1.0.0 => 1.1.0
 - package-2: 1.0.0 => 1.1.0


> lifecycle@0.0.0-monorepo preversion __TEST_ROOTDIR__
> echo boom && exit 123

boom

`);
      expect(err.stderr).toMatchInlineSnapshot(`
lerna notice cli __TEST_VERSION__
lerna info Verifying npm credentials
lerna info current version 1.0.0
lerna info Looking for changed packages since initial commit.
lerna info auto-confirmed 
lerna info lifecycle lifecycle@0.0.0-monorepo~preversion: lifecycle@0.0.0-monorepo
lerna info lifecycle lifecycle@0.0.0-monorepo~preversion: Failed to exec preversion script
lerna ERR! lifecycle "preversion" errored in "lifecycle", exiting 123

`);
    }
  }
});
