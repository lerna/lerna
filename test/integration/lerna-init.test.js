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
  test("initializes empty directory", async () => {
    const cwd = await initEmptyDir();

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

  test("removes VERSION file", async () => {
    const cwd = await initFixture("InitCommand/has-version");

    const { stderr } = await execa(LERNA_BIN, ["init"], { cwd });
    expect(stderr).toMatchSnapshot("stderr");
  });
});
