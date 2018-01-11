import execa from "execa";
import loadJsonFile from "load-json-file";
import path from "path";
import readPkg from "read-pkg";
import tempy from "tempy";

import { LERNA_BIN } from "../helpers/constants";
import initFixture from "../helpers/initFixture";

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
