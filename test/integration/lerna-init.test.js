"use strict";

const execa = require("execa");
const loadJsonFile = require("load-json-file");
const path = require("path");
const tempy = require("tempy");

const { LERNA_BIN } = require("../helpers/constants");
const initFixture = require("../helpers/initFixture");

const parsePackageJson = cwd => loadJsonFile(path.join(cwd, "package.json"));

const parseLernaJson = cwd => loadJsonFile(path.join(cwd, "lerna.json"));

const loadMetaData = cwd => Promise.all([parsePackageJson(cwd), parseLernaJson(cwd)]);

describe("lerna init", () => {
  test("initializes empty directory", async () => {
    const cwd = tempy.directory();

    const { stderr } = await execa(LERNA_BIN, ["init"], { cwd });
    expect(stderr).toMatchSnapshot("stderr");

    const [packageJson, lernaJson] = await loadMetaData(cwd);
    expect(packageJson).toMatchSnapshot("package.json");
    expect(lernaJson).toMatchSnapshot("lerna.json");
  });

  test("updates existing metadata", async () => {
    const cwd = await initFixture("InitCommand/updates");

    const { stderr } = await execa(LERNA_BIN, ["init", "--exact"], { cwd });
    expect(stderr).toMatchSnapshot("stderr");

    const [packageJson, lernaJson] = await loadMetaData(cwd);
    expect(packageJson).toMatchSnapshot("package.json");
    expect(lernaJson).toMatchSnapshot("lerna.json");
  });
});
