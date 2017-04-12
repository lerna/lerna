import execa from "execa";
import initFixture from "../helpers/initFixture";
import { loadAllPackages } from "../helpers/packageTools";
import { LERNA_BIN } from "../helpers/constants";

const installInDir = (cwd) =>
  execa("npm", ["install", "--cache-min=99999"], { cwd });

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

  test("updates independent versions by npm", () => {
    return initFixture("PublishCommand/integration").then((cwd) => {
      const args = [
        "run",
        "lp",
        "--silent"
      ];
      return Promise.resolve()
        .then(() => installInDir(cwd))
        .then(() => execa("npm", args, { cwd }))
        .then((result) => {
          expect(result.stdout).toMatchSnapshot("packages: updates independent versions by npm");
        });
    });
  });
});
