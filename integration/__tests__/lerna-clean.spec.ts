import { cliRunner, initFixtureFactory } from "@lerna/test-helpers";
import globby from "globby";

const initFixture = initFixtureFactory(__dirname);

describe("lerna clean", () => {
  test("global", async () => {
    const cwd = await initFixture("lerna-clean");
    const args = ["clean", "--yes", "--concurrency=1"];

    const { stderr } = await cliRunner(cwd)(...args);
    expect(stderr).toMatchInlineSnapshot(`
lerna notice cli __TEST_VERSION__
lerna info ci enabled
lerna info clean removing __TEST_ROOTDIR__/packages/package-1/node_modules
lerna info clean removing __TEST_ROOTDIR__/packages/package-2/node_modules
lerna info clean removing __TEST_ROOTDIR__/packages/package-3/node_modules
lerna success clean finished
`);

    const found = await globby(["package-*/node_modules"], { cwd, onlyDirectories: true });
    expect(found).toEqual([]);
  });
});
