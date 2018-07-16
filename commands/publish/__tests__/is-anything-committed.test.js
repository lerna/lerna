"use strict";

const execa = require("execa");
const initFixture = require("@lerna-test/init-fixture")(__dirname);
const isAnythingCommitted = require("../lib/is-anything-committed");

test("isAnythingCommitted", async () => {
  const cwd = await initFixture("root-manifest-only");

  expect(isAnythingCommitted({ cwd })).toBe(true);
});

test("isAnythingCommitted without and with a commit", async () => {
  const cwd = await initFixture("root-manifest-only", false);

  expect(isAnythingCommitted({ cwd })).toBe(false);

  await execa("git", ["commit", "--allow-empty", "-m", "change"], { cwd });

  expect(isAnythingCommitted({ cwd })).toBe(true);
});
