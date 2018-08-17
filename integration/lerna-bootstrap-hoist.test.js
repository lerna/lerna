"use strict";

const fs = require("fs-extra");
const globby = require("globby");

const cliRunner = require("@lerna-test/cli-runner");
const initFixture = require("@lerna-test/init-fixture")(__dirname);

test("lerna bootstrap --hoist", async () => {
  const cwd = await initFixture("lerna-bootstrap");
  const lerna = cliRunner(cwd);

  /* eslint-disable max-len */
  const { stderr } = await lerna("bootstrap", "--no-ci", "--hoist");
  expect(stderr).toMatchInlineSnapshot(`
lerna notice cli __TEST_VERSION__
lerna info Bootstrapping 4 packages
lerna info lifecycle package-4@1.0.0~preinstall: package-4@1.0.0
lerna WARN EHOIST_PKG_VERSION "@integration/package-3" package depends on pify@^1.0.0, which differs from the hoisted pify@^2.0.0.
lerna info Installing external dependencies
lerna info hoist Installing hoisted dependencies into root
lerna info hoist Pruning hoisted dependencies
lerna info hoist Finished pruning hoisted dependencies
lerna info hoist Finished bootstrapping root
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
    absolute: true,
    followSymlinkedDirectories: false,
  };
  const lockfiles = await globby(["**/package-lock.json"], config);
  const [lock3, rootLock] = await Promise.all(lockfiles.sort().map(fp => fs.readJson(fp)));

  expect(lock3).toMatchObject({
    name: "@integration/package-3",
    version: "1.0.0",
    dependencies: { pify: expect.any(Object) },
  });
  expect(rootLock).toMatchObject({
    name: "integration",
    version: "0.0.0",
    dependencies: {
      pify: expect.any(Object),
      "tiny-tarball": {
        version: "1.0.0",
        // root hoist does not preserve optional
      },
    },
  });
  expect(rootLock).not.toHaveProperty("dependencies.tiny-tarball.optional");
});
