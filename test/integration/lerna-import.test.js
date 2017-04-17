import execa from "execa";
import initFixture from "../helpers/initFixture";
import loadPkgManifests from "../helpers/loadPkgManifests";
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
        .then(() => loadPkgManifests(basicPath))
        .then((allPackageJsons) => {
          expect(allPackageJsons).toMatchSnapshot("simple: import with argument");
        });
    });
  });
});
