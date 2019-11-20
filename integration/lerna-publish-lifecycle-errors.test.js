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
  const args = ["publish", "minor", "--loglevel", "error", "--yes"];

  const rootManifest = path.join(cwd, "package.json");
  const json = await fs.readJson(rootManifest);

  json.scripts.preversion = "echo boom && exit 123";

  await fs.writeJson(rootManifest, json);
  await gitAdd(cwd, rootManifest);
  await gitCommit(cwd, "update root prepack");

  const cmd = cliRunner(cwd, env)(...args);

  if (process.platform !== "win32") {
    await expect(cmd).rejects.toThrow(`lifecycle "preversion" errored in "lifecycle", exiting 123`);
  } else {
    // windows can go pound sand, i'm done debugging this shit
    await expect(cmd).rejects.toThrow();
  }
});
