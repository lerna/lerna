import { cliRunner, cloneFixtureFactory } from "@lerna/test-helpers";
import path from "path";

const cloneFixture = cloneFixtureFactory(path.resolve(__dirname, "../../libs/commands/publish"));

const env = {
  // never actually upload when calling `npm publish`
  npm_config_dry_run: true,
  // skip npm package validation, none of the stubs are real
  LERNA_INTEGRATION: "SKIP",
};

test("lerna publish lifecycle scripts --loglevel=silent", async () => {
  const { cwd } = await cloneFixture("lifecycle");
  const args = ["publish", "minor", "--yes", "--loglevel", "silent"];

  const { stdout } = await cliRunner(cwd, env)(...args);
  expect(stdout).toMatchInlineSnapshot(`

Changes:
 - package-1: 1.0.0 => 1.1.0
 - package-2: 1.0.0 => 1.1.0

preversion-root
preversion-package-1
version-package-1
version-root
postversion-package-1
postversion-root
prepublish-root
prepare-root
prepublishOnly-root
prepack-root
prepare-package-1
prepublishOnly-package-1
prepack-package-1
prepublish-package-2
postpack-root
postpublish-package-1
postpublish-root
Successfully published:
 - package-1@1.1.0
 - package-2@1.1.0
`);
});
