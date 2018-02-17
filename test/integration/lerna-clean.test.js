"use strict";

const globby = require("globby");
const normalizePath = require("normalize-path");
const path = require("path");

const cliRunner = require("../helpers/cli-runner");
const initFixture = require("../helpers/initFixture");

describe("lerna clean", () => {
  const serializeTestRoot = (match, testDir, subPath) =>
    normalizePath(path.join("__TEST_ROOTDIR__", subPath));

  const normalizeLog = cwd => {
    // lol windows paths often look like escaped slashes, so re-re-escape them :P
    const dirPath = new RegExp(`(${cwd.replace(/\\/g, "\\\\")})([\\S]+)`, "g");

    return stderr => stderr.replace(dirPath, serializeTestRoot);
  };

  test("global", async () => {
    const cwd = await initFixture("CleanCommand/basic");
    const args = ["clean", "--yes", "--concurrency=1"];

    const { stderr } = await cliRunner(cwd)(...args);
    expect(normalizeLog(cwd)(stderr)).toMatchSnapshot("stderr");

    const found = await globby(["package-*/node_modules"], { cwd });
    expect(found).toEqual([]);
  });
});
