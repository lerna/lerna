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
    expect(stderr).toMatchSnapshot("stderr");

    const [packageJson, lernaJson] = await loadMetaData(cwd);
    expect(packageJson).toMatchSnapshot("package.json");
    expect(lernaJson).toMatchSnapshot("lerna.json");
  });

  test("updates existing metadata", async () => {
    const cwd = await initFixture("lerna-init");

    const { stderr } = await cliRunner(cwd)("init", "--exact");
    expect(stderr).toMatchSnapshot("stderr");

    const [packageJson, lernaJson] = await loadMetaData(cwd);
    expect(packageJson).toMatchSnapshot("package.json");
    expect(lernaJson).toMatchSnapshot("lerna.json");
  });
});
