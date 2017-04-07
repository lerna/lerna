import glob from "glob";
import execa from "execa";
import readPkg from "read-pkg";
import initFixture from "../helpers/initFixture";
import replaceLernaVersion from "../helpers/replaceLernaVersion";
import { LERNA_BIN } from "../helpers/constants";

expect.addSnapshotSerializer(replaceLernaVersion);

const parsePackageJson = (filePath) =>
  readPkg(filePath, { normalize: false });

const loadAllPackages = (cwd) => {
  return new Promise((resolve, reject) => {
    glob("packages/*/package.json", {
      absolute: true,
      strict: true,
      cwd,
    }, (err, files) => {
      if (err) {
        reject(err);
      } else {
        resolve(Promise.all(files.map(parsePackageJson)));
      }
    });
  });
};

describe("lerna publish", () => {
  test.concurrent("updates fixed versions", () => initFixture("PublishCommand/normal").then((cwd) => {
    const args = [
      "publish",
      "--skip-npm",
      "--cd-version=patch",
      "--yes",
    ];

    return execa(LERNA_BIN, args, { cwd }).then((result) => {
      expect(result.stdout).toMatchSnapshot("stdout: updates fixed versions");

      return loadAllPackages(cwd).then((allPackageJsons) => {
        expect(allPackageJsons).toMatchSnapshot("packages: updates fixed versions");
      });
    });
  }));

  test("updates independent versions", () => initFixture("PublishCommand/independent").then((cwd) => {
    const args = [
      "publish",
      "--skip-npm",
      "--cd-version=major",
      "--yes",
    ];

    return execa(LERNA_BIN, args, { cwd }).then((result) => {
      expect(result.stdout).toMatchSnapshot("stdout: updates independent versions");

      return loadAllPackages(cwd).then((allPackageJsons) => {
        expect(allPackageJsons).toMatchSnapshot("packages: updates independent versions");
      });
    });
  }));
});
