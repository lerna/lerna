import fs from "fs-promise";
import path from "path";
import execa from "execa";
import readPkg from "read-pkg";
import loadJsonFile from "load-json-file";
import initDirName from "../helpers/initDirName";
import initExternalFixture from "../helpers/initExternalFixture";
import replaceLernaVersion from "../helpers/replaceLernaVersion";

expect.addSnapshotSerializer(replaceLernaVersion);

const ROOTDIR = path.resolve(__dirname, "../..");
const PACKAGE = readPkg.sync(ROOTDIR);
const LERNA = path.join(ROOTDIR, PACKAGE.bin.lerna);

const initEmptyDir = () =>
  initDirName("InitCommand/empty").then((dir) => {
    return fs.ensureDir(dir).then(() => dir);
  });

const initFixture = (name) =>
  initExternalFixture(`InitCommand/${name}`);

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
    return execa(LERNA, ["init"], { cwd }).then((result) => {
      expect(result.stdout).toMatchSnapshot("stdout: empty directory");

      return loadMetaData(cwd).then(([packageJson, lernaJson]) => {
        expect(packageJson).toMatchSnapshot("package.json: empty directory");
        expect(lernaJson).toMatchSnapshot("lerna.json: empty directory");
      });
    });
  }));

  test.concurrent("updates existing metadata", () => initFixture("updates").then((cwd) => {
    return execa(LERNA, ["init", "--exact"], { cwd }).then((result) => {
      expect(result.stdout).toMatchSnapshot("stdout: updates");

      return loadMetaData(cwd).then(([packageJson, lernaJson]) => {
        expect(packageJson).toMatchSnapshot("package.json: updates");
        expect(lernaJson).toMatchSnapshot("lerna.json: updates");
      });
    });
  }));

  test.concurrent("removes VERSION file", () => initFixture("has-version").then((cwd) => {
    return execa(LERNA, ["init"], { cwd }).then((result) => {
      expect(result.stdout).toMatchSnapshot("stdout: has-version");
    });
  }));
});
