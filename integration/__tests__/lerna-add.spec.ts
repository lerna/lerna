import { cliRunner, initFixtureFactory } from "@lerna/test-helpers";
import globby from "globby";
import loadJson from "load-json-file";
import pMap from "p-map";
import path from "path";

const initFixture = initFixtureFactory(__dirname);

// eslint-disable-next-line @typescript-eslint/no-var-requires
expect.extend(require("@lerna/test-helpers/src/lib/pkg-matchers"));

// extend jest types with custom matcher toDependOn
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    interface Matchers<R> {
      toDependOn(received: string, name?: string, range?: { exact: boolean }, options?: any): R;
      toDevDependOn(received: string, name?: string, range?: { exact: boolean }, options?: any): R;
      toPeerDependOn(received: string, name?: string, range?: { exact: boolean }, options?: any): R;
    }
  }
}

describe("lerna add", () => {
  test("add to all packages", async () => {
    const cwd = await initFixture("lerna-add");

    const { stderr } = await cliRunner(cwd)("add", "@test/package-1");
    expect(stderr).toMatchInlineSnapshot(`
lerna notice cli __TEST_VERSION__
lerna info ci enabled
lerna info Adding @test/package-1 in 3 packages
lerna info Bootstrapping 4 packages
lerna info Symlinking packages and binaries
lerna success Bootstrapped 4 packages
`);

    const filePaths = await globby("packages/*/package.json", { cwd });
    const [pkg1, pkg2, pkg3, pkg4] = await pMap(filePaths.sort(), (fp) => loadJson(path.join(cwd, fp)));

    expect(pkg1).not.toDependOn("@test/package-1");
    expect(pkg2).toDependOn("@test/package-1");
    expect(pkg3).toDependOn("@test/package-1");
    expect(pkg4).toDependOn("@test/package-1");
  });
});
