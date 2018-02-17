"use strict";

const execa = require("execa");
const fs = require("fs-extra");
const globby = require("globby");
const normalizePath = require("normalize-path");
const path = require("path");

const { LERNA_BIN } = require("../helpers/constants");
const initFixture = require("../helpers/initFixture");

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
});
