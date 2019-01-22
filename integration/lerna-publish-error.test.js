"use strict";

const path = require("path");

const cliRunner = require("@lerna-test/cli-runner");
const cloneFixture = require("@lerna-test/clone-fixture")(
  path.resolve(__dirname, "../commands/publish/__tests__")
);

test("lerna publish sets correct exit code when libnpm/publish fails", async () => {
  const { cwd } = await cloneFixture("normal");

  try {
    await cliRunner(cwd)("publish", "patch", "--yes", "--no-verify-access", "--loglevel", "error");
  } catch (err) {
    expect(err.stderr).toMatchInlineSnapshot(`
lerna ERR! E401 You must be logged in to publish packages.

`);
    expect(err.code).toBe(1);
  }

  expect.hasAssertions();
});
