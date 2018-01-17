"use strict";

const execa = require("execa");
const loadJsonFile = require("load-json-file");
const path = require("path");
const readPkg = require("read-pkg");
const tempy = require("tempy");

const { LERNA_BIN } = require("../helpers/constants");
const initFixture = require("../helpers/initFixture");

const initEmptyDir = () => tempy.directoryAsync();

const parsePackageJson = cwd => readPkg(path.join(cwd, "package.json"), { normalize: false });

const parseLernaJson = cwd => loadJsonFile(path.join(cwd, "lerna.json"));

const loadMetaData = cwd => Promise.all([parsePackageJson(cwd), parseLernaJson(cwd)]);

describe("lerna init", () => {
  test.concurrent("initializes empty directory", async () => {
    const cwd = await initEmptyDir();

    const { stderr } = await execa(LERNA_BIN, ["init"], { cwd });
    expect(stderr).toMatchSnapshot("stderr: empty directory");

    const [packageJson, lernaJson] = await loadMetaData(cwd);
    expect(packageJson).toMatchSnapshot("package.json: empty directory");
    expect(lernaJson).toMatchSnapshot("lerna.json: empty directory");
  });

  test.concurrent("updates existing metadata", async () => {
    const cwd = await initFixture("InitCommand/updates");

    const { stderr } = await execa(LERNA_BIN, ["init", "--exact"], { cwd });
    expect(stderr).toMatchSnapshot("stderr: updates");

    const [packageJson, lernaJson] = await loadMetaData(cwd);
    expect(packageJson).toMatchSnapshot("package.json: updates");
    expect(lernaJson).toMatchSnapshot("lerna.json: updates");
  });

  test.concurrent("removes VERSION file", async () => {
    const cwd = await initFixture("InitCommand/has-version");

    const { stderr } = await execa(LERNA_BIN, ["init"], { cwd });
    expect(stderr).toMatchSnapshot("stderr: has-version");
  });
});
