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
      lerna info Initializing Git repository
      lerna info Creating .gitignore
      lerna info Creating package.json
      lerna info Creating lerna.json
      lerna info Creating packages directory
      lerna success Initialized Lerna files
      lerna info New to Lerna? Check out the docs: https://lerna.js.org/docs/getting-started
    `);

    const [packageJson, lernaJson] = await loadMetaData(cwd);
    expect(packageJson).toMatchInlineSnapshot(`
      Object {
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
        "useWorkspaces": true,
        "version": "0.0.0",
      }
    `);
  });

  test("updates existing metadata", async () => {
    const cwd = await initFixture("lerna-init");

    const { stderr } = await cliRunner(cwd)("init", "--exact");
    expect(stderr).toMatchInlineSnapshot(`
      lerna notice cli __TEST_VERSION__
      lerna WARN project Deprecated key "commands" found in lerna.json
      lerna WARN project Please update "commands" => "command"
      lerna info Updating package.json
      lerna info Updating lerna.json
      lerna info Creating packages directory
      lerna success Initialized Lerna files
      lerna info New to Lerna? Check out the docs: https://lerna.js.org/docs/getting-started
    `);

    const [packageJson, lernaJson] = await loadMetaData(cwd);
    expect(packageJson).toMatchInlineSnapshot(`
      Object {
        "devDependencies": Object {
          "lerna": "__TEST_VERSION__",
        },
        "name": "updates",
      }
    `);
    expect(lernaJson).toMatchInlineSnapshot(`
      Object {
        "$schema": "node_modules/lerna/schemas/lerna-schema.json",
        "command": Object {
          "bootstrap": Object {
            "hoist": true,
          },
          "init": Object {
            "exact": true,
          },
        },
        "packages": Array [
          "packages/*",
        ],
        "useWorkspaces": false,
        "version": "1.0.0",
      }
    `);
  });
});
