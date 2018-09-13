"use strict";

const path = require("path");

const cliRunner = require("@lerna-test/cli-runner");
const cloneFixture = require("@lerna-test/clone-fixture")(
  path.resolve(__dirname, "../commands/publish/__tests__")
);

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

> lifecycle@0.0.0-monorepo prepare __TEST_ROOTDIR__
> echo prepare-root

prepare-root

> lifecycle@0.0.0-monorepo prepublishOnly __TEST_ROOTDIR__
> echo prepublishOnly-root

prepublishOnly-root

> lifecycle@0.0.0-monorepo prepack __TEST_ROOTDIR__
> echo prepack-root

prepack-root

> package-1@1.1.0 prepublishOnly __TEST_ROOTDIR__/packages/package-1
> echo prepublishOnly-package-1

prepublishOnly-package-1

> package-1@1.1.0 prepublish __TEST_ROOTDIR__/packages/package-1
> echo prepublish-package-1

prepublish-package-1

> package-1@1.1.0 prepare __TEST_ROOTDIR__/packages/package-1
> echo prepare-package-1

prepare-package-1

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
