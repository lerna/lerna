"use strict";

const execa = require("execa");
// const getPort = require("get-port");
const globby = require("globby");
const normalizePath = require("normalize-path");
const path = require("path");

const { LERNA_BIN } = require("../helpers/constants");
const initFixture = require("../helpers/initFixture");

const serializeTestRoot = (match, testDir, subPath) => normalizePath(path.join("__TEST_ROOTDIR__", subPath));

const normalizeStdio = cwd => {
  // lol windows paths often look like escaped slashes, so re-re-escape them :P
  const dirPath = new RegExp(`(${cwd.replace(/\\/g, "\\\\")})([\\S]+)`, "g");

  return result => {
    const stdout = result.stdout.replace(dirPath, serializeTestRoot);
    const stderr = result.stderr.replace(dirPath, serializeTestRoot);

    return Object.assign(result, {
      stdout,
      stderr,
    });
  };
};

describe("lerna clean", () => {
  test.concurrent("global", async () => {
    const cwd = await initFixture("CleanCommand/basic");
    const args = ["clean", "--yes", "--concurrency=1"];

    const { stdout, stderr } = await execa(LERNA_BIN, args, { cwd }).then(normalizeStdio(cwd));

    expect(stdout).toMatchSnapshot("stdout: global --yes");
    expect(stderr).toMatchSnapshot("stderr: global --yes");

    const found = await globby(["package-*/node_modules"], { cwd });
    expect(found).toEqual([]);
  });

  test.concurrent("local npm", async () => {
    const cwd = await initFixture("CleanCommand/integration");

    await execa("npm", ["install", "--cache-min=99999"], { cwd });

    const { stdout, stderr } = await execa("npm", ["run", "clean", "--silent"], { cwd }).then(
      normalizeStdio(cwd),
    );

    expect(stdout).toMatchSnapshot("stdout: local npm");
    expect(stderr).toMatchSnapshot("stderr: local npm");

    const found = await globby(["package-*/node_modules"], { cwd });
    expect(found).toEqual([]);
  });

  /*
  test("local yarn", async () => {
    const cwd = await initFixture("CleanCommand/integration");

    const port = await getPort({ port: 42042, host: "0.0.0.0" });
    const mutex = ["--mutex", `network:${port}`];

    await execa("yarn", ["install", "--no-lockfile", ...mutex], { cwd });

    const { stdout, stderr } = await execa("yarn", ["clean", "--silent", ...mutex], { cwd }).then(
      normalizeStdio(cwd),
    );

    expect(stdout).toMatchSnapshot("stdout: local yarn");
    expect(stderr).toMatchSnapshot("stderr: local yarn");

    const found = await globby(["node_modules"], { cwd });
    expect(found).toEqual([]);
  });
  */
});
