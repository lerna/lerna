"use strict";

const execa = require("execa");
// const getPort = require("get-port");
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

  test("local npm", async () => {
    const cwd = await initFixture("CleanCommand/integration");

    await execa("npm", ["install", "--cache-min=99999"], { cwd });

    const { stderr } = await execa("npm", ["run", "clean", "--silent"], { cwd });

    expect(normalizeLog(cwd)(stderr)).toMatchSnapshot("stderr");

    const found = await globby(["package-*/node_modules"], { cwd });
    expect(found).toEqual([]);
  });

  /*
  test("local yarn", async () => {
    const cwd = await initFixture("CleanCommand/integration");

    const port = await getPort({ port: 42042, host: "0.0.0.0" });
    const mutex = ["--mutex", `network:${port}`];

    await execa("yarn", ["install", "--no-lockfile", ...mutex], { cwd });

    const { stderr } = await execa("yarn", ["clean", "--silent", ...mutex], { cwd });

    expect(normalizeLog(cwd)(stderr)).toMatchSnapshot("stderr");

    const found = await globby(["node_modules"], { cwd });
    expect(found).toEqual([]);
  });
  */
});
