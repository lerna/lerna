"use strict";

const execa = require("execa");
const fs = require("fs-extra");
const path = require("path");
const slash = require("slash");
const initFixture = require("@lerna-test/init-fixture")(__dirname);
const gitAdd = require("../lib/git-add");

test("relative files", async () => {
  const cwd = await initFixture("root-manifest-only");
  const file = path.join("packages", "pkg-1", "index.js");

  await fs.outputFile(path.join(cwd, file), "hello");
  await gitAdd([file], { cwd });

  const list = await execa.stdout("git", ["diff", "--cached", "--name-only"], { cwd });
  expect(slash(list)).toBe("packages/pkg-1/index.js");
});

test("absolute files", async () => {
  const cwd = await initFixture("root-manifest-only");
  const file = path.join(cwd, "packages", "pkg-2", "index.js");

  await fs.outputFile(file, "hello");
  await gitAdd([file], { cwd });

  const list = await execa.stdout("git", ["diff", "--cached", "--name-only"], { cwd });
  expect(slash(list)).toBe("packages/pkg-2/index.js");
});
