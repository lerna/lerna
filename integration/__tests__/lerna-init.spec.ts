import { cliRunner, initFixtureFactory } from "@lerna/test-helpers";
import loadJsonFile from "load-json-file";
import path from "path";
import tempy from "tempy";

const initFixture = initFixtureFactory(__dirname);

describe("lerna init", () => {
  const parsePackageJson = (cwd: string) => loadJsonFile(path.join(cwd, "package.json"));
  const parseLernaJson = (cwd: string) => loadJsonFile(path.join(cwd, "lerna.json"));
  const loadMetaData = (cwd: string) => Promise.all([parsePackageJson(cwd), parseLernaJson(cwd)]);

  test("initializes empty directory", async () => {
    const cwd = tempy.directory();

    const { stderr } = await cliRunner(cwd)("init");
    expect(stderr).toMatchInlineSnapshot(`
      lerna notice cli __TEST_VERSION__
      lerna info Applying the following file system updates:
      CREATE lerna.json
      CREATE package.json
      CREATE .gitignore
      lerna info Initializing Git repository
      lerna success Initialized Lerna files
      lerna info New to Lerna? Check out the docs: https://lerna.js.org/docs/getting-started
    `);

    const [packageJson, lernaJson] = await loadMetaData(cwd);
    expect(packageJson).toMatchInlineSnapshot(`
      Object {
        "dependencies": Object {},
        "devDependencies": Object {
          "lerna": "^__TEST_VERSION__",
        },
        "name": "root",
        "private": true,
        "workspaces": Array [
          "packages/*",
        ],
      }
    `);
    expect(lernaJson).toMatchInlineSnapshot(`
      Object {
        "$schema": "node_modules/lerna/schemas/lerna-schema.json",
        "version": "0.0.0",
      }
    `);
  });

  test("works with dryRun", async () => {
    const cwd = tempy.directory();

    const { stderr } = await cliRunner(cwd)("init", "--dryRun");
    const stderrWithoutVersion = stderr.replace(/\^[\d.]+-?[\w.]+/g, "<lerna-version>");
    expect(stderrWithoutVersion).toMatchInlineSnapshot(`
      lerna notice cli __TEST_VERSION__
      lerna info The following file system updates will be made:
      CREATE lerna.json [preview]
      + {
      +   "$schema": "node_modules/lerna/schemas/lerna-schema.json",
      +   "version": "0.0.0"
      + }
      +
      CREATE package.json [preview]
      + {
      +   "name": "root",
      +   "private": true,
      +   "workspaces": [
      +     "packages/*"
      +   ],
      +   "dependencies": {},
      +   "devDependencies": {
      +     "lerna": "<lerna-version>"
      +   }
      + }
      +
      CREATE .gitignore [preview]
      + node_modules/
      lerna WARN The "dryRun" flag means no changes were made.
    `);

    // No config files should have been created in dry run mode
    await expect(loadMetaData(cwd)).rejects.toThrowErrorMatchingInlineSnapshot(
      `ENOENT: no such file or directory, open __TEST_ROOTDIR__/package.json'`
    );
  });

  test("errors when run on existing lerna repo", async () => {
    const cwd = await initFixture("lerna-init");

    const { stderr } = await cliRunner(cwd)("init", "--exact");
    expect(stderr).toMatchInlineSnapshot(`
      lerna notice cli __TEST_VERSION__
      lerna ERR! Lerna has already been initialized for this repo.
      lerna ERR! If you are looking to ensure that your config is up to date with the latest and greatest, run \`lerna repair\` instead
    `);
  });
});
