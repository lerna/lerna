"use strict";

const cliRunner = require("@lerna-test/cli-runner");
const initFixture = require("@lerna-test/init-fixture")(__dirname);

test("lerna link symlinks generated binaries of sibling packages", async () => {
  const cwd = await initFixture("lerna-generated-build-tool");
  const lerna = cliRunner(cwd);

  // First bootstrap, I expect this to succeed but don't are about the output
  await lerna("bootstrap");

  const { stdout } = await lerna("run", "build");

  expect(stdout).toMatch("build tool executed");
});
