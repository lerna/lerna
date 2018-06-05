"use strict";

const execa = require("execa");
const isAnythingCommited = require("../lib/is-anything-commited");
const initFixture = require("@lerna-test/init-fixture")(__dirname);
const initFixtureWithoutCommits = require("@lerna-test/init-fixture")(__dirname, true);

test("isAnythingCommited", async () => {
  const cwd = await initFixture("root-manifest-only");

  expect(isAnythingCommited({ cwd })).toBe(true);
});

test("isAnythingCommited without and with a commit", async () => {
  const cwd = await initFixtureWithoutCommits("root-manifest-only");

  expect(isAnythingCommited({ cwd })).toBe(false);

  await execa("git", ["commit", "--allow-empty", "-m", "change"], { cwd });

  expect(isAnythingCommited({ cwd })).toBe(true);
});
