"use strict";

const execa = require("execa");
const initFixture = require("@lerna-test/init-fixture")(__dirname);
const isAnythingCommited = require("../lib/is-anything-commited");

test("isAnythingCommited", async () => {
  const cwd = await initFixture("root-manifest-only");

  expect(isAnythingCommited({ cwd })).toBe(true);
});

test("isAnythingCommited without and with a commit", async () => {
  const cwd = await initFixture("root-manifest-only", false);

  expect(isAnythingCommited({ cwd })).toBe(false);

  await execa("git", ["commit", "--allow-empty", "-m", "change"], { cwd });

  expect(isAnythingCommited({ cwd })).toBe(true);
});
