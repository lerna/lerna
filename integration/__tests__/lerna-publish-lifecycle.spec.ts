import { cliRunner, cloneFixtureFactory } from "@lerna/test-helpers";
import path from "path";

const cloneFixture = cloneFixtureFactory(path.resolve(__dirname, "../../libs/commands/publish"));

const env = {
  // never actually upload when calling `npm publish`
  npm_config_dry_run: true,
  // skip npm package validation, none of the stubs are real
  LERNA_INTEGRATION: "SKIP",
};

test("lerna publish lifecycle scripts", async () => {
  const { cwd } = await cloneFixture("lifecycle");
  const args = ["publish", "minor", "--yes"];

  const { stdout } = await cliRunner(cwd, env)(...args);
  expect(stdout).toMatchInlineSnapshot(`

Changes:
 - package-1: 1.0.0 => 1.1.0
 - package-2: 1.0.0 => 1.1.0


> lifecycle@0.0.0-monorepo preversion __TEST_ROOTDIR__
> echo preversion-root

preversion-root

> package-1@1.0.0 preversion __TEST_ROOTDIR__/packages/package-1
> echo preversion-package-1

preversion-package-1

> package-1@1.1.0 version __TEST_ROOTDIR__/packages/package-1
> echo version-package-1

version-package-1

> lifecycle@0.0.0-monorepo version __TEST_ROOTDIR__
> echo version-root

version-root

> package-1@1.1.0 postversion __TEST_ROOTDIR__/packages/package-1
> echo postversion-package-1

postversion-package-1

> lifecycle@0.0.0-monorepo postversion __TEST_ROOTDIR__
> echo postversion-root

postversion-root

> lifecycle@0.0.0-monorepo prepublish __TEST_ROOTDIR__
> echo prepublish-root

prepublish-root

> lifecycle@0.0.0-monorepo prepare __TEST_ROOTDIR__
> echo prepare-root

prepare-root

> lifecycle@0.0.0-monorepo prepublishOnly __TEST_ROOTDIR__
> echo prepublishOnly-root

prepublishOnly-root

> lifecycle@0.0.0-monorepo prepack __TEST_ROOTDIR__
> echo prepack-root

prepack-root

> package-1@1.1.0 prepare __TEST_ROOTDIR__/packages/package-1
> echo prepare-package-1

prepare-package-1

> package-1@1.1.0 prepublishOnly __TEST_ROOTDIR__/packages/package-1
> echo prepublishOnly-package-1

prepublishOnly-package-1

> package-1@1.1.0 prepack __TEST_ROOTDIR__/packages/package-1
> echo prepack-package-1

prepack-package-1

> package-2@1.1.0 prepublish __TEST_ROOTDIR__/packages/package-2
> echo prepublish-package-2

prepublish-package-2

> lifecycle@0.0.0-monorepo postpack __TEST_ROOTDIR__
> echo postpack-root

postpack-root

> package-1@1.1.0 postpublish __TEST_ROOTDIR__/packages/package-1
> echo postpublish-package-1

postpublish-package-1

> lifecycle@0.0.0-monorepo postpublish __TEST_ROOTDIR__
> echo postpublish-root

postpublish-root
Successfully published:
 - package-1@1.1.0
 - package-2@1.1.0
`);
});

test("lerna publish --ignore-prepublish", async () => {
  const { cwd } = await cloneFixture("lifecycle");
  const args = ["publish", "--ignore-prepublish", "patch", "--yes"];

  const { stdout } = await cliRunner(cwd, env)(...args);
  expect(stdout).not.toContain("prepublish-root");
  expect(stdout).not.toContain("prepublish-package-2");
});

test("lerna publish --ignore-scripts", async () => {
  const { cwd } = await cloneFixture("lifecycle");
  const args = ["publish", "--ignore-scripts", "major", "--yes", "--loglevel=verbose"];

  const { stdout } = await cliRunner(cwd, env)(...args);
  expect(stdout).toMatchInlineSnapshot(`

    Changes:
     - package-1: 1.0.0 => 2.0.0
     - package-2: 1.0.0 => 2.0.0

    Successfully published:
     - package-1@2.0.0
     - package-2@2.0.0
  `);
});
