"use strict";

const execa = require("execa");
const cloneFixture = require("@lerna-test/clone-fixture")(__dirname);
const isBehindUpstream = require("../lib/is-behind-upstream");

test("isBehindUpstream", async () => {
  const { cwd } = await cloneFixture("root-manifest-only");

  expect(isBehindUpstream("origin", "master", { cwd })).toBe(false);

  await execa("git", ["commit", "--allow-empty", "-m", "change"], { cwd });
  await execa("git", ["push", "origin", "master"], { cwd });
  await execa("git", ["reset", "--hard", "HEAD^"], { cwd });

  expect(isBehindUpstream("origin", "master", { cwd })).toBe(true);
});
