import { cliRunner, initFixtureFactory } from "@lerna/test-helpers";
import globby from "globby";
import normalizePath from "normalize-path";

const initFixture = initFixtureFactory(__dirname);

test("lerna bootstrap --npm-client yarn", async () => {
  const cwd = await initFixture("lerna-bootstrap");
  const lerna = cliRunner(cwd);

  const { stderr } = await lerna("bootstrap", "--npm-client", "yarn");
  expect(stderr).toMatchInlineSnapshot(`
lerna notice cli __TEST_VERSION__
lerna info ci enabled
lerna info Bootstrapping 4 packages
lerna info lifecycle package-4@1.0.0~preinstall: package-4@1.0.0
lerna info Installing external dependencies
lerna info Symlinking packages and binaries
lerna info lifecycle @integration/package-3@1.0.0~postinstall: @integration/package-3@1.0.0
lerna info lifecycle @integration/package-2@1.0.0~prepublish: @integration/package-2@1.0.0
lerna info lifecycle @integration/package-1@1.0.0~prepare: @integration/package-1@1.0.0
lerna success Bootstrapped 4 packages
`);

  // the "--silent" flag is passed to `npm run`
  const { stdout } = await lerna("run", "test", "--", "--silent");
  expect(stdout).toMatchInlineSnapshot(`
package-1
package-2
cli package-2 OK
package-3 cli1 OK
package-3 cli2 package-2 OK
`);

  const config = {
    cwd,
  };
  const lockfiles = await globby(["package-*/yarn.lock"], config);
  expect(lockfiles.sort().map((fp) => normalizePath(fp))).toEqual([
    "package-1/yarn.lock",
    "package-2/yarn.lock",
    "package-3/yarn.lock",
  ]);
});
