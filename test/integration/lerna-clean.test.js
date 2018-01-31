"use strict";

const execa = require("execa");
const globby = require("globby");
const normalizePath = require("normalize-path");
const path = require("path");

const { LERNA_BIN } = require("../helpers/constants");
const initFixture = require("../helpers/initFixture");

const serializeTestRoot = (match, testDir, subPath) => normalizePath(path.join("__TEST_ROOTDIR__", subPath));

const normalizeLog = cwd => {
  // lol windows paths often look like escaped slashes, so re-re-escape them :P
  const dirPath = new RegExp(`(${cwd.replace(/\\/g, "\\\\")})([\\S]+)`, "g");

  return stderr => stderr.replace(dirPath, serializeTestRoot);
};

describe("lerna clean", () => {
  test("global", async () => {
    const cwd = await initFixture("CleanCommand/basic");
    const args = ["clean", "--yes", "--concurrency=1"];

    const { stderr } = await execa(LERNA_BIN, args, { cwd });

    expect(normalizeLog(cwd)(stderr)).toMatchSnapshot("stderr");

    const found = await globby(["package-*/node_modules"], { cwd });
    expect(found).toEqual([]);
  });
});
