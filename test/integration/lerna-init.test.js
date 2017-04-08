import path from "path";
import execa from "execa";
import readPkg from "read-pkg";
import loadJsonFile from "load-json-file";
import tempy from "tempy";
import initFixture from "../helpers/initFixture";
import { LERNA_BIN } from "../helpers/constants";

const initEmptyDir = () => tempy.directoryAsync();

const parsePackageJson = (cwd) =>
  readPkg(path.join(cwd, "package.json"), { normalize: false });

const parseLernaJson = (cwd) =>
  loadJsonFile(path.join(cwd, "lerna.json"));

const loadMetaData = (cwd) => Promise.all([
  parsePackageJson(cwd),
  parseLernaJson(cwd),
]);

describe("lerna init", () => {
  test.concurrent("initializes empty directory", () => initEmptyDir().then((cwd) => {
    return execa(LERNA_BIN, ["init"], { cwd }).then((result) => {
      expect(result.stdout).toMatchSnapshot("stdout: empty directory");

      return loadMetaData(cwd).then(([packageJson, lernaJson]) => {
        expect(packageJson).toMatchSnapshot("package.json: empty directory");
        expect(lernaJson).toMatchSnapshot("lerna.json: empty directory");
      });
    });
  }));

  test.concurrent("updates existing metadata", () => initFixture("InitCommand/updates").then((cwd) => {
    return execa(LERNA_BIN, ["init", "--exact"], { cwd }).then((result) => {
      expect(result.stdout).toMatchSnapshot("stdout: updates");

      return loadMetaData(cwd).then(([packageJson, lernaJson]) => {
        expect(packageJson).toMatchSnapshot("package.json: updates");
        expect(lernaJson).toMatchSnapshot("lerna.json: updates");
      });
    });
  }));

  test.concurrent("removes VERSION file", () => initFixture("InitCommand/has-version").then((cwd) => {
    return execa(LERNA_BIN, ["init"], { cwd }).then((result) => {
      expect(result.stdout).toMatchSnapshot("stdout: has-version");
    });
  }));
});
