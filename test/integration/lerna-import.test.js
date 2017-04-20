import execa from "execa";
import initFixture from "../helpers/initFixture";
import loadPkgManifests from "../helpers/loadPkgManifests";
import { LERNA_BIN } from "../helpers/constants";

describe("lerna import", () => {
  test.concurrent("works with argument provided", async () => {
    const [externalPath, cwd] = await Promise.all([
      initFixture("ImportCommand/external", "Init external commit"),
      initFixture("ImportCommand/basic"),
    ]);

    const args = [
      "import",
      externalPath,
      "--yes"
    ];

    await execa(LERNA_BIN, args, { cwd });

    const allPackageJsons = await loadPkgManifests(cwd);
    expect(allPackageJsons).toMatchSnapshot("simple: import with argument");
  });
});
