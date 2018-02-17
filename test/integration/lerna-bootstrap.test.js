"use strict";

const fs = require("fs-extra");
const globby = require("globby");
const normalizePath = require("normalize-path");
const path = require("path");

const cliRunner = require("../helpers/cli-runner");
const initFixture = require("../helpers/initFixture");

describe("lerna bootstrap", () => {
  test("bootstraps all packages", async () => {
    const cwd = await initFixture("BootstrapCommand/integration");
    const lerna = cliRunner(cwd);

    const { stderr } = await lerna("bootstrap");
    expect(stderr).toMatchSnapshot("stderr");

    // the "--silent" flag is passed to `npm run`
    const { stdout } = await lerna("run", "test", "--", "--silent");
    expect(stdout).toMatchSnapshot("stdout");
  });

  test("--npm-client yarn", async () => {
    const cwd = await initFixture("BootstrapCommand/integration");
    const lerna = cliRunner(cwd);

    const { stderr } = await lerna("bootstrap", "--npm-client", "yarn");
    expect(stderr).toMatchSnapshot("stderr");

    const lockfiles = await globby(["package-*/yarn.lock"], { cwd });
    expect(lockfiles.map(fp => normalizePath(fp))).toEqual([
      "package-1/yarn.lock",
      "package-2/yarn.lock",
      "package-3/yarn.lock",
    ]);

    // the "--silent" flag is passed to `npm run`
    const { stdout } = await lerna("run", "test", "--", "--silent");
    expect(stdout).toMatchSnapshot("stdout");
  });

  test("--npm-client npm -- --no-optional", async () => {
    const cwd = await initFixture("BootstrapCommand/npm-client-args-1");
    const args = ["bootstrap", "--npm-client", path.resolve(cwd, "npm"), "--", "--no-optional"];

    await cliRunner(cwd)(...args);

    const npmDebugLog = await fs.readFile(path.resolve(cwd, "npm-debug.log"), "utf8");
    expect(npmDebugLog.split(",")).toEqual(["install", "--no-optional"]);
  });

  test("--npm-client npm -- --no-optional extends durable npmClientArgs", async () => {
    const cwd = await initFixture("BootstrapCommand/npm-client-args-2");
    const args = ["bootstrap", "--npm-client", path.resolve(cwd, "npm"), "--", "--no-optional"];

    await cliRunner(cwd)(...args);

    const npmDebugLog = await fs.readFile(path.resolve(cwd, "npm-debug.log"), "utf8");
    expect(npmDebugLog.split(",")).toEqual(["install", "--production", "--no-optional"]);
  });
});
