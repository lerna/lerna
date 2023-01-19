import { cliRunner, initFixtureFactory } from "@lerna/test-helpers";

const initFixture = initFixtureFactory(__dirname);

// ls never makes changes to repo, so we only need one fixture + runner
let lerna: ReturnType<typeof cliRunner>;

beforeAll(async () => {
  const cwd = await initFixture("lerna-ls");

  lerna = cliRunner(cwd);
});

test("lerna list", async () => {
  const { stdout } = await lerna("list");
  expect(stdout).toMatchInlineSnapshot(`
package-1
@test/package-2
package-3
`);
});

test("lerna ls", async () => {
  const { stdout } = await lerna("ls");
  expect(stdout).toMatchInlineSnapshot(`
package-1
@test/package-2
package-3
`);
});

test("lerna ls --all", async () => {
  const { stdout } = await lerna("ls", "--all");
  expect(stdout).toMatchInlineSnapshot(`
package-1
@test/package-2
package-3
package-4       (PRIVATE)
`);
});

test("lerna ls --long", async () => {
  const { stdout } = await lerna("ls", "--long");
  expect(stdout).toMatchInlineSnapshot(`
package-1        v1.0.0 packages/pkg-1
@test/package-2  v2.0.0 packages/pkg-2
package-3       MISSING packages/pkg-3
`);
});

test("lerna ls --parseable", async () => {
  const { stdout } = await lerna("ls", "--parseable");
  expect(stdout).toMatchInlineSnapshot(`
__TEST_ROOTDIR__/packages/pkg-1
__TEST_ROOTDIR__/packages/pkg-2
__TEST_ROOTDIR__/packages/pkg-3
`);
});

test("lerna ls --all --long --parseable", async () => {
  const { stdout } = await lerna("ls", "-alp");
  expect(stdout).toMatchInlineSnapshot(`
__TEST_ROOTDIR__/packages/pkg-1:package-1:1.0.0
__TEST_ROOTDIR__/packages/pkg-2:@test/package-2:2.0.0
__TEST_ROOTDIR__/packages/pkg-3:package-3:MISSING
__TEST_ROOTDIR__/packages/pkg-4:package-4:4.0.0:PRIVATE
`);
});

test("lerna la", async () => {
  const { stdout } = await lerna("la");
  expect(stdout).toMatchInlineSnapshot(`
package-1        v1.0.0 packages/pkg-1
@test/package-2  v2.0.0 packages/pkg-2
package-3       MISSING packages/pkg-3
package-4        v4.0.0 packages/pkg-4 (PRIVATE)
`);
});

test("lerna ll", async () => {
  const { stdout } = await lerna("ll");
  expect(stdout).toMatchInlineSnapshot(`
package-1        v1.0.0 packages/pkg-1
@test/package-2  v2.0.0 packages/pkg-2
package-3       MISSING packages/pkg-3
`);
});
