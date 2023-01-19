import { cliRunner, cloneFixtureFactory } from "@lerna/test-helpers";
import path from "path";

const cloneFixture = cloneFixtureFactory(path.resolve(__dirname, "../../commands/publish/__tests__"));

const env = {
  // never actually upload when calling `npm publish`
  npm_config_dry_run: true,
  // skip npm package validation, none of the stubs are real
  LERNA_INTEGRATION: "SKIP",
};

test("lerna publish --legacy-auth", async () => {
  const { cwd } = await cloneFixture("normal");
  const data = "hi:mom";
  const auth = Buffer.from(data).toString("base64");
  const args = ["publish", "patch", "--yes", "--legacy-auth", auth];

  const { stdout } = await cliRunner(cwd, env)(...args);
  expect(stdout).toMatchInlineSnapshot(`

    Changes:
     - package-1: 1.0.0 => 1.0.1
     - package-2: 1.0.0 => 1.0.1
     - package-3: 1.0.0 => 1.0.1
     - package-4: 1.0.0 => 1.0.1
     - package-5: 1.0.0 => 1.0.1 (private)

    Successfully published:
     - package-1@1.0.1
     - package-2@1.0.1
     - package-3@1.0.1
     - package-4@1.0.1
  `);
});
