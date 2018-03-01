"use strict";

const globby = require("globby");

const cliRunner = require("../helpers/cli-runner");
const initFixture = require("../helpers/initFixture");
const normalizeTestRoot = require("../helpers/normalize-test-root");

describe("lerna clean", () => {
  test("global", async () => {
    const cwd = await initFixture("CleanCommand/basic");
    const args = ["clean", "--yes", "--concurrency=1"];

    const { stderr } = await cliRunner(cwd)(...args);
    expect(normalizeTestRoot(cwd)(stderr)).toMatchSnapshot("stderr");

    const found = await globby(["package-*/node_modules"], { cwd, onlyDirectories: true });
    expect(found).toEqual([]);
  });
});
