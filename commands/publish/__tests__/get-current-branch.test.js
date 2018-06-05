"use strict";

const getCurrentBranch = require("../lib/get-current-branch");
const initFixture = require("@lerna-test/init-fixture")(__dirname);
const initFixtureWithoutCommits = require("@lerna-test/init-fixture")(__dirname, true);

test("getCurrentBranch", async () => {
  const cwd = await initFixture("root-manifest-only");

  expect(getCurrentBranch({ cwd })).toBe("master");
});

test("getCurrentBranch without commit", async () => {
  const cwd = await initFixtureWithoutCommits("root-manifest-only");
  expect.assertions(1);
  try {
    await getCurrentBranch({ cwd });
  } catch (err) {
    expect(err.message).toMatch(/Command failed: git rev-parse --abbrev-ref HEAD.*/);
  }
});
