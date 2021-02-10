"use strict";

const initFixture = require("@lerna-test/init-fixture")(__dirname);
const { getCurrentSHA } = require("../lib/get-current-sha");

test("getCurrentSHA", async () => {
  const cwd = await initFixture("root-manifest-only");

  expect(getCurrentSHA({ cwd })).toMatch(/^[0-9a-f]{40}$/);
});
