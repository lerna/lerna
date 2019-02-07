"use strict";

const execa = require("execa");
const fs = require("fs-extra");
const path = require("path");
const initFixture = require("@lerna-test/init-fixture")(__dirname);
const gitCheckout = require("../lib/git-checkout");

test("gitCheckout files", async () => {
  const cwd = await initFixture("no-interdependencies");
  const files = ["package-1", "package-2"].map(name => path.join("packages", name, "package.json"));

  await Promise.all(files.map(fp => fs.writeJSON(path.join(cwd, fp), { foo: "bar" })));
  await gitCheckout(files, { cwd });

  const modified = await execa.stdout("git", ["ls-files", "--modified"], { cwd });
  expect(modified).toBe("");
});
