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

    const lockfiles = await globby(["package-*/package-lock.json"], { cwd, absolute: true });
    const [lock1, lock2, lock3] = await Promise.all(lockfiles.map(fp => fs.readJson(fp)));

    expect(lock1).toMatchObject({
      name: "@integration/package-1",
      version: "1.0.0",
      dependencies: { pify: expect.any(Object) },
    });
    expect(lock2).toMatchObject({
      name: "@integration/package-2",
      version: "1.0.0",
      dependencies: { pify: expect.any(Object) },
    });
    expect(lock3).toMatchObject({
      name: "@integration/package-3",
      version: "1.0.0",
      dependencies: { pify: expect.any(Object) },
    });
  });

  test("hoists correctly", async () => {
    const cwd = await initFixture("BootstrapCommand/integration");
    const lerna = cliRunner(cwd);

    const { stderr } = await lerna("bootstrap", "--hoist");
    expect(stderr).toMatchSnapshot("stderr");

    // the "--silent" flag is passed to `npm run`
    const { stdout } = await lerna("run", "test", "--", "--silent");
    expect(stdout).toMatchSnapshot("stdout");

    // `realpath: true` avoids duplicate from package-4/node_modules/package-3 symlink
    const lockfiles = await globby(["package-lock.json"], { cwd, matchBase: true, realpath: true });
    const [lock3, rootLock] = await Promise.all(lockfiles.map(fp => fs.readJson(fp)));

    expect(lock3).toMatchObject({
      name: "@integration/package-3",
      version: "1.0.0",
      dependencies: { pify: expect.any(Object) },
    });
    expect(rootLock).toMatchObject({
      name: "integration",
      version: "0.0.0",
      dependencies: { pify: expect.any(Object) },
    });
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
