"use strict";

const cliRunner = require("../helpers/cli-runner");
const initFixture = require("../helpers/initFixture");
const loadPkgManifests = require("../helpers/loadPkgManifests");

describe("lerna import", () => {
  test("works with argument provided", async () => {
    const [externalPath, cwd] = await Promise.all([
      initFixture("ImportCommand/external", "Init external commit"),
      initFixture("ImportCommand/basic"),
    ]);

    await cliRunner(cwd)("import", externalPath, "--yes");

    const allPackageJsons = await loadPkgManifests(cwd);
    expect(allPackageJsons).toMatchSnapshot();
  });
});
