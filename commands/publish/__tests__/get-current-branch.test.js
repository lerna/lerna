"use strict";

const initFixture = require("@lerna-test/init-fixture")(__dirname);
const getCurrentBranch = require("../lib/get-current-branch");

test("getCurrentBranch", async () => {
  const cwd = await initFixture("root-manifest-only");

  expect(getCurrentBranch({ cwd })).toBe("master");
});

test("getCurrentBranch without commit", async () => {
  const cwd = await initFixture("root-manifest-only", false);
  expect.assertions(1);
  try {
    await getCurrentBranch({ cwd });
  } catch (err) {
    expect(err.message).toMatch(/Command failed: git rev-parse --abbrev-ref HEAD.*/);
  }
});
