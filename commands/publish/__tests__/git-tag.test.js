"use strict";

const execa = require("execa");
const initFixture = require("@lerna-test/init-fixture")(__dirname);
const gitTag = require("../lib/git-tag");

test("gitTag", async () => {
  const cwd = await initFixture("root-manifest-only");

  await gitTag("v1.2.3", { cwd });

  const list = await execa.stdout("git", ["tag", "--list"], { cwd });
  expect(list).toMatch("v1.2.3");
});
