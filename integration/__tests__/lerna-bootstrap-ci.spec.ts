import { cliRunner, cloneFixtureFactory } from "@lerna/test-helpers";
import path from "path";

const cloneFixture = cloneFixtureFactory(path.resolve(__dirname, "../../libs/commands/bootstrap/__tests__"));

test("lerna bootstrap --ci", async () => {
  const { cwd } = await cloneFixture("ci");
  const lerna = cliRunner(cwd);

  const { stderr } = await lerna("bootstrap", "--ci");
  expect(stderr).toMatchInlineSnapshot(`
lerna notice cli __TEST_VERSION__
lerna info ci enabled
lerna info Bootstrapping 1 package
lerna info Installing external dependencies
lerna info Symlinking packages and binaries
lerna success Bootstrapped 1 package
`);

  // the "--silent" flag is passed to `npm run`
  const { stdout } = await lerna("run", "test", "--", "--silent");
  expect(stdout).toBe("package-1");
});
