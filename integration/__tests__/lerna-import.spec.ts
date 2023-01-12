import { cliRunner, initFixtureFactory, loadManifests } from "@lerna/test-helpers";

const initFixture = initFixtureFactory(__dirname);

describe("lerna import", () => {
  test("works with argument provided", async () => {
    const externalPath = await initFixture("lerna-import-external", "Init external commit");
    const cwd = await initFixture("lerna-import");

    await cliRunner(cwd)("import", externalPath, "--yes");

    const allPackageJsons = await loadManifests(cwd);
    expect(allPackageJsons).toMatchInlineSnapshot(`
Array [
  Object {
    "//": "Import should use _directory_ name, not package name",
    "name": "external-name",
  },
]
`);
  });
});
