"use strict";

const execa = require("execa");
const fs = require("fs-extra");
// const getPort = require("get-port");
const globby = require("globby");
const normalizePath = require("normalize-path");
const path = require("path");
const tempy = require("tempy");

const { LERNA_BIN } = require("../helpers/constants");
const initFixture = require("../helpers/initFixture");
const copyFixture = require("../helpers/copyFixture");

describe("lerna bootstrap", () => {
  const npmTest = cwd =>
    execa(
      LERNA_BIN,
      [
        "run",
        "test",
        "--",
        // arguments to npm test
        "--silent",
        "--onload-script=false",
      ],
      { cwd }
    );

  describe("from CLI", () => {
    test("bootstraps all packages", async () => {
      const cwd = await initFixture("BootstrapCommand/integration");
      const args = ["bootstrap"];

      const stderr = await execa.stderr(LERNA_BIN, args, { cwd });
      expect(stderr).toMatchSnapshot("stderr");

      const { stdout } = await npmTest(cwd);
      expect(stdout).toMatchSnapshot("stdout");
    });

    test("respects ignore flag", async () => {
      const cwd = await initFixture("BootstrapCommand/integration");
      const args = ["bootstrap", "--ignore", "@integration/package-1"];

      const stderr = await execa.stderr(LERNA_BIN, args, { cwd });
      expect(stderr).toMatchSnapshot("stderr");
    });

    test("git repo check is ignored by default", async () => {
      const cwd = await tempy.directoryAsync();
      await copyFixture(cwd, "BootstrapCommand/integration");
      const args = ["bootstrap"];

      const stderr = await execa.stderr(LERNA_BIN, args, { cwd });
      expect(stderr).toMatchSnapshot("stderr");
    });

    test("--npm-client yarn", async () => {
      const cwd = await initFixture("BootstrapCommand/integration");
      const args = ["bootstrap", "--npm-client", "yarn"];

      const stderr = await execa.stderr(LERNA_BIN, args, { cwd });
      expect(stderr).toMatchSnapshot("stderr");

      const lockfiles = await globby(["package-*/yarn.lock"], { cwd }).then(globbed =>
        globbed.map(fp => normalizePath(fp))
      );
      expect(lockfiles).toMatchSnapshot("lockfiles");

      const { stdout } = await npmTest(cwd);
      expect(stdout).toMatchSnapshot("stdout");
    });

    test("passes remaining arguments to npm client", async () => {
      const cwd = await initFixture("BootstrapCommand/npm-client-args-1");
      const args = ["bootstrap", "--npm-client", path.resolve(cwd, "npm"), "--", "--no-optional"];

      await execa(LERNA_BIN, args, { cwd });

      const npmDebugLog = fs.readFileSync(path.resolve(cwd, "npm-debug.log")).toString();
      expect(npmDebugLog).toMatchSnapshot();
    });

    test("passes remaining arguments + npmClientArgs to npm client", async () => {
      const cwd = await initFixture("BootstrapCommand/npm-client-args-2");
      const args = ["bootstrap", "--npm-client", path.resolve(cwd, "npm"), "--", "--no-optional"];

      await execa(LERNA_BIN, args, { cwd });

      const npmDebugLog = fs.readFileSync(path.resolve(cwd, "npm-debug.log")).toString();
      expect(npmDebugLog).toMatchSnapshot();
    });
  });

  describe("from npm script", async () => {
    test("bootstraps all packages", async () => {
      const cwd = await initFixture("BootstrapCommand/integration-lifecycle");
      await execa("npm", ["install", "--cache-min=99999"], { cwd });

      const { stdout, stderr } = await npmTest(cwd);
      expect(stdout).toMatchSnapshot("stdout");
      expect(stderr).toMatchSnapshot("stderr");
    });

    /*
    test("works with yarn install", async () => {
      const cwd = await initFixture("BootstrapCommand/integration-lifecycle");

      const port = await getPort({ port: 42042, host: "0.0.0.0" });
      const mutex = ["--mutex", `network:${port}`];

      // NOTE: yarn doesn't support linking binaries from transitive dependencies,
      // so it's important to test _both_ lifecycle variants.
      // TODO: ...eventually :P
      // FIXME: yarn doesn't understand file:// URLs... /sigh
      await execa("yarn", ["install", "--no-lockfile", ...mutex], { cwd });

      const { stdout, stderr } = await execa("yarn", ["test", "--silent", ...mutex], { cwd });
      expect(stdout).toMatchSnapshot("stdout");
      expect(stderr).toMatchSnapshot("stderr");
    });
    */
  });
});
