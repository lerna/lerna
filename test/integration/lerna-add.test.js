"use strict";

const path = require("path");
const globby = require("globby");
const loadJson = require("load-json-file");
const pMap = require("p-map");

const cliRunner = require("../helpers/cli-runner");
const initFixture = require("../helpers/initFixture");
const pkgMatchers = require("../helpers/pkgMatchers");

expect.extend(pkgMatchers);

describe("lerna add", () => {
  test("add to all packages", async () => {
    const cwd = await initFixture("AddCommand/basic");

    await cliRunner(cwd)("add", "@test/package-1");

    const filePaths = await globby("packages/*/package.json", { cwd });
    const [pkg1, pkg2, pkg3, pkg4] = await pMap(filePaths, fp => loadJson(path.join(cwd, fp)));

    expect(pkg1).not.toDependOn("@test/package-1");
    expect(pkg2).toDependOn("@test/package-1");
    expect(pkg3).toDependOn("@test/package-1");
    expect(pkg4).toDependOn("@test/package-1");
  });
});
