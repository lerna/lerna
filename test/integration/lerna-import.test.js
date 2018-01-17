"use strict";

const execa = require("execa");

const { LERNA_BIN } = require("../helpers/constants");
const initFixture = require("../helpers/initFixture");
const loadPkgManifests = require("../helpers/loadPkgManifests");

describe("lerna import", () => {
  test.concurrent("works with argument provided", async () => {
    const [externalPath, cwd] = await Promise.all([
      initFixture("ImportCommand/external", "Init external commit"),
      initFixture("ImportCommand/basic"),
    ]);

    const args = ["import", externalPath, "--yes"];

    await execa(LERNA_BIN, args, { cwd });

    const allPackageJsons = await loadPkgManifests(cwd);
    expect(allPackageJsons).toMatchSnapshot("simple: import with argument");
  });
});
