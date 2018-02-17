"use strict";

const execa = require("execa");
const fs = require("fs-extra");
const globby = require("globby");
const normalizePath = require("normalize-path");
const path = require("path");

const { LERNA_BIN } = require("../helpers/constants");
const initFixture = require("../helpers/initFixture");

describe("lerna bootstrap", () => {
  // the "--silent" flag is passed to `npm run`
  const npmTest = cwd => execa.stdout(LERNA_BIN, ["run", "test", "--", "--silent"], { cwd });

  test("bootstraps all packages", async () => {
    const cwd = await initFixture("BootstrapCommand/integration");
    const args = ["bootstrap"];

    const stderr = await execa.stderr(LERNA_BIN, args, { cwd });
    expect(stderr).toMatchSnapshot("stderr");

    const stdout = await npmTest(cwd);
    expect(stdout).toMatchSnapshot("stdout");
  });

  test("--npm-client yarn", async () => {
    const cwd = await initFixture("BootstrapCommand/integration");
    const args = ["bootstrap", "--npm-client", "yarn"];

    const stderr = await execa.stderr(LERNA_BIN, args, { cwd });
    expect(stderr).toMatchSnapshot("stderr");

    const lockfiles = await globby(["package-*/yarn.lock"], { cwd });
    expect(lockfiles.map(fp => normalizePath(fp))).toEqual([
      "package-1/yarn.lock",
      "package-2/yarn.lock",
      "package-3/yarn.lock",
    ]);

    const stdout = await npmTest(cwd);
    expect(stdout).toMatchSnapshot("stdout");
  });

  test("--npm-client npm -- --no-optional", async () => {
    const cwd = await initFixture("BootstrapCommand/npm-client-args-1");
    const args = ["bootstrap", "--npm-client", path.resolve(cwd, "npm"), "--", "--no-optional"];

    await execa(LERNA_BIN, args, { cwd });

    const npmDebugLog = await fs.readFile(path.resolve(cwd, "npm-debug.log"), "utf8");
    expect(npmDebugLog.split(",")).toEqual(["install", "--no-optional"]);
  });

  test("--npm-client npm -- --no-optional extends durable npmClientArgs", async () => {
    const cwd = await initFixture("BootstrapCommand/npm-client-args-2");
    const args = ["bootstrap", "--npm-client", path.resolve(cwd, "npm"), "--", "--no-optional"];

    await execa(LERNA_BIN, args, { cwd });

    const npmDebugLog = await fs.readFile(path.resolve(cwd, "npm-debug.log"), "utf8");
    expect(npmDebugLog.split(",")).toEqual(["install", "--production", "--no-optional"]);
  });
});
