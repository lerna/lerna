"use strict";

const execa = require("execa");
const fs = require("fs-extra");
const path = require("path");
const initFixture = require("@lerna-test/init-fixture")(__dirname);
const { gitCheckout } = require("../lib/git-checkout");

test("gitCheckout files", async () => {
  const cwd = await initFixture("no-interdependencies");
  const files = ["package-1", "package-2"].map((name) => path.join("packages", name, "package.json"));

  await Promise.all(files.map((fp) => fs.writeJSON(path.join(cwd, fp), { foo: "bar" })));
  await gitCheckout(files, { granularPathspec: true }, { cwd });

  const { stdout: modified } = await execa("git", ["ls-files", "--modified"], { cwd });
  expect(modified).toBe("");
});

test("gitCheckout files with .gitignored files", async () => {
  const cwd = await initFixture("no-interdependencies");
  const files = ["package-1", "package-2", "package-3"].map((name) =>
    path.join("packages", name, "package.json")
  );

  // simulate a "dynamic", intentionally unversioned package by gitignoring it
  await fs.writeFile(path.join(cwd, ".gitignore"), "packages/package-3/*", "utf8");

  await Promise.all(files.map((fp) => fs.outputJSON(path.join(cwd, fp), { foo: "bar" })));
  await gitCheckout(files, { granularPathspec: false }, { cwd });

  const { stdout: modified } = await execa("git", ["ls-files", "--others"], { cwd });
  expect(modified).toBe("packages/package-3/package.json");
});
