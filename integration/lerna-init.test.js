"use strict";

const loadJsonFile = require("load-json-file");
const path = require("path");
const tempy = require("tempy");

const cliRunner = require("@lerna-test/cli-runner");
const initFixture = require("@lerna-test/init-fixture")(__dirname);

describe("lerna init", () => {
  const parsePackageJson = cwd => loadJsonFile(path.join(cwd, "package.json"));
  const parseLernaJson = cwd => loadJsonFile(path.join(cwd, "lerna.json"));
  const loadMetaData = cwd => Promise.all([parsePackageJson(cwd), parseLernaJson(cwd)]);

  test("initializes empty directory", async () => {
    const cwd = tempy.directory();

    const { stderr } = await cliRunner(cwd)("init");
    expect(stderr).toMatchInlineSnapshot(`
lerna notice cli __TEST_VERSION__
lerna info Initializing Git repository
lerna info Creating package.json
lerna info Creating lerna.json
lerna info Creating packages directory
lerna success Initialized Lerna files
`);

    const [packageJson, lernaJson] = await loadMetaData(cwd);
    expect(packageJson).toMatchInlineSnapshot(`
Object {
  "devDependencies": Object {
    "lerna": "^__TEST_VERSION__",
  },
  "name": "root",
  "private": true,
}
`);
    expect(lernaJson).toMatchInlineSnapshot(`
Object {
  "packages": Array [
    "packages/*",
  ],
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
lerna WARN project Please rename "commands" => "command"
lerna info Updating package.json
lerna info Updating lerna.json
lerna info Creating packages directory
lerna success Initialized Lerna files
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
  "version": "1.0.0",
}
`);
  });
});
