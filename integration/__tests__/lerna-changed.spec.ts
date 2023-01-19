import { cliRunner, commitChangeToPackage, gitTag, initFixtureFactory } from "@lerna/test-helpers";

const initFixture = initFixtureFactory(__dirname);

test("includes dependents", async () => {
  const cwd = await initFixture("normal");

  await gitTag(cwd, "v1.0.0");
  await commitChangeToPackage(cwd, "package-1", "change", { change: true });

  const { stdout } = await cliRunner(cwd)("changed");
  expect(stdout).toMatchInlineSnapshot(`
package-1
package-2
package-3
`);
});

test("no changes since release", async () => {
  const cwd = await initFixture("normal");

  await gitTag(cwd, "v1.0.0");

  await expect(cliRunner(cwd)("changed")).rejects.toThrow("No changed packages found");
});

test("no reachable tags", async () => {
  const cwd = await initFixture("normal");

  const { stdout } = await cliRunner(cwd)("changed");
  expect(stdout).toMatchInlineSnapshot(`
package-1
package-2
package-3
package-4
`);
});

test("--force-publish package-2", async () => {
  const cwd = await initFixture("normal");

  await gitTag(cwd, "v1.0.0");

  const { stdout } = await cliRunner(cwd)("changed", "--force-publish", "package-2");
  expect(stdout).toMatchInlineSnapshot(`
package-2
package-3
`);
});

test("--ignore-changes **/package-2/package.json", async () => {
  const cwd = await initFixture("normal");

  await gitTag(cwd, "v1.0.0");
  await commitChangeToPackage(cwd, "package-2", "change", { change: true });
  await commitChangeToPackage(cwd, "package-3", "change", { change: true });

  const { stdout } = await cliRunner(cwd)("changed", "--ignore-changes", "**/package-2/package.json");
  expect(stdout).toMatchInlineSnapshot(`"package-3"`);
});

test("listable flags", async () => {
  const cwd = await initFixture("normal");

  await gitTag(cwd, "v1.0.0");
  await commitChangeToPackage(cwd, "package-1", "change", { change: true });
  await commitChangeToPackage(cwd, "package-4", "change", { change: true });

  const { stdout } = await cliRunner(cwd)("changed", "-alp");
  expect(stdout).toMatchInlineSnapshot(`
__TEST_ROOTDIR__/packages/package-1:package-1:1.0.0
__TEST_ROOTDIR__/packages/package-2:package-2:1.0.0
__TEST_ROOTDIR__/packages/package-3:package-3:1.0.0
__TEST_ROOTDIR__/packages/package-4:package-4:1.0.0
__TEST_ROOTDIR__/packages/package-5:package-5:1.0.0:PRIVATE
`);
});
