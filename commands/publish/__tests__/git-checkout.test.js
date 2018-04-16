"use strict";

const execa = require("execa");
const fs = require("fs-extra");
const path = require("path");
const initFixture = require("@lerna-test/init-fixture")(__dirname);
const gitCheckout = require("../lib/git-checkout");

test("gitCheckout", async () => {
  const cwd = await initFixture("normal-no-inter-dependencies");

  await fs.writeJSON(path.join(cwd, "packages", "package-1", "package.json"), { foo: "bar" });
  await gitCheckout("packages/*/package.json", { cwd });

  const modified = await execa.stdout("git", ["ls-files", "--modified"], { cwd });
  expect(modified).toBe("");
});
