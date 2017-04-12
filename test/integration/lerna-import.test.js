import execa from "execa";
import initFixture from "../helpers/initFixture";
import { loadAllPackages } from "../helpers/packageTools";
import { LERNA_BIN } from "../helpers/constants";

describe("lerna import", () => {
  test.concurrent("works with argument provided", () => {
    return Promise.all([
      initFixture("ImportCommand/external", "Init external commit"),
      initFixture("ImportCommand/basic"),
    ]).then(([externalPath, basicPath]) => {
      const args = [
        "import",
        externalPath,
        "--yes"
      ];

      return execa(LERNA_BIN, args, { cwd: basicPath })
        .then(() => loadAllPackages(basicPath))
        .then((allPackageJsons) => {
          expect(allPackageJsons).toMatchSnapshot("simple: import with argument");
        });
    });
  });
});
