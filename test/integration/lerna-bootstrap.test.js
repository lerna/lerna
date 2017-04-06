import fs from "fs-promise";
import path from "path";
import execa from "execa";
import readPkg from "read-pkg";
import writePkg from "write-pkg";
import initFixture from "../helpers/initFixture";
import replaceLernaVersion from "../helpers/replaceLernaVersion";

expect.addSnapshotSerializer(replaceLernaVersion);

const ROOTDIR = path.resolve(__dirname, "../..");
const PACKAGE = readPkg.sync(ROOTDIR);
const VERSION = PACKAGE.version;
const TGZ_SRC = path.join(ROOTDIR, `lerna-${VERSION}.tgz`);
const LERNA = path.join(ROOTDIR, PACKAGE.bin.lerna);

const copyTarball = (cwd) =>
  fs.copy(TGZ_SRC, path.join(cwd, "lerna-latest.tgz"));

const installInDir = (cwd) =>
  execa("yarn", ["install", "--mutex", "network:42042"], { cwd });

const npmTestInDir = (cwd) =>
  execa("npm", ["test", "--silent"], { cwd });
  // yarn doesn't support --silent yet (https://github.com/yarnpkg/yarn/pull/2420)

describe("lerna bootstrap", () => {
  describe("from CLI", () => {
    test.concurrent("bootstraps all packages", () => {
      return initFixture("BootstrapCommand/integration").then((cwd) => {
        return Promise.resolve()
          .then(() => execa(LERNA, ["bootstrap"], { cwd }))
          .then((result) => {
            expect(result.stdout).toMatchSnapshot("stdout: simple");
          })
          .then(() => execa(LERNA, ["run", "test", "--", "--silent"], { cwd }))
          .then((result) => {
            expect(result.stdout).toMatchSnapshot("stdout: simple");
          });
      });
    });
  });

  describe("from npm script", () => {
    test.concurrent("bootstraps all packages", () => {
      return initFixture("BootstrapCommand/integration").then((cwd) => {
        return copyTarball(cwd)
          .then(() => writePkg(cwd, {
            "name": "integration",
            "scripts": {
              postinstall: "lerna bootstrap",
              test: "lerna run test",
            },
            devDependencies: {
              lerna: "file:lerna-latest.tgz",
            }
          }))
          .then(() => installInDir(cwd))
          .then(() => npmTestInDir(cwd))
          .then((result) => {
            expect(result.stdout).toMatchSnapshot("stdout: postinstall");
          });
      });
    });
  });
});
