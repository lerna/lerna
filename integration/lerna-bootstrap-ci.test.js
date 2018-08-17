"use strict";

const path = require("path");
const cliRunner = require("@lerna-test/cli-runner");
const cloneFixture = require("@lerna-test/clone-fixture")(
  path.resolve(__dirname, "../commands/bootstrap/__tests__")
);

test("lerna bootstrap --ci", async () => {
  const { cwd } = await cloneFixture("ci");
  const lerna = cliRunner(cwd);

  const { stderr } = await lerna("bootstrap", "--ci");
  expect(stderr).toMatchInlineSnapshot(`
lerna notice cli __TEST_VERSION__
lerna info Bootstrapping 1 package
lerna info Installing external dependencies
lerna info Symlinking packages and binaries
lerna success Bootstrapped 1 package
`);

  // the "--silent" flag is passed to `npm run`
  const { stdout } = await lerna("run", "test", "--", "--silent");
  expect(stdout).toBe("package-1");
});
