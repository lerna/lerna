import execa from "execa";
import fs from "fs-extra";
// import getPort from "get-port";
import globby from "globby";
import normalizePath from "normalize-path";
import path from "path";
import tempy from "tempy";

import { LERNA_BIN } from "../helpers/constants";
import initFixture from "../helpers/initFixture";
import copyFixture from "../helpers/copyFixture";

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
    test.concurrent("bootstraps all packages", async () => {
      const cwd = await initFixture("BootstrapCommand/integration");
      const args = ["bootstrap"];

      const stderr = await execa.stderr(LERNA_BIN, args, { cwd });
      expect(stderr).toMatchSnapshot("simple: stderr");

      const { stdout } = await npmTest(cwd);
      expect(stdout).toMatchSnapshot("simple: stdout");
    });

    test.concurrent("respects ignore flag", async () => {
      const cwd = await initFixture("BootstrapCommand/integration");
      const args = ["bootstrap", "--ignore", "@integration/package-1"];

      const stderr = await execa.stderr(LERNA_BIN, args, { cwd });
      expect(stderr).toMatchSnapshot("ignore: stderr");
    });

    test.concurrent("git repo check is ignored by default", async () => {
      const cwd = await tempy.directoryAsync();
      await copyFixture(cwd, "BootstrapCommand/integration");
      const args = ["bootstrap"];

      const stderr = await execa.stderr(LERNA_BIN, args, { cwd });
      expect(stderr).toMatchSnapshot("simple-no-git-check: stdout");
    });

    test.concurrent("--npm-client yarn", async () => {
      const cwd = await initFixture("BootstrapCommand/integration");
      const args = ["bootstrap", "--npm-client", "yarn"];

      const stderr = await execa.stderr(LERNA_BIN, args, { cwd });
      expect(stderr).toMatchSnapshot("--npm-client yarn: stderr");

      const lockfiles = await globby(["package-*/yarn.lock"], { cwd }).then(globbed =>
        globbed.map(fp => normalizePath(fp))
      );
      expect(lockfiles).toMatchSnapshot("--npm-client yarn: lockfiles");

      const { stdout } = await npmTest(cwd);
      expect(stdout).toMatchSnapshot("--npm-client yarn: stdout");
    });

    test.concurrent("passes remaining arguments to npm client", async () => {
      const cwd = await initFixture("BootstrapCommand/npm-client-args-1");
      const args = ["bootstrap", "--npm-client", path.resolve(cwd, "npm"), "--", "--no-optional"];

      await execa(LERNA_BIN, args, { cwd });

      const npmDebugLog = fs.readFileSync(path.resolve(cwd, "npm-debug.log")).toString();
      expect(npmDebugLog).toMatchSnapshot("passes remaining arguments to npm client");
    });

    test.concurrent("passes remaining arguments + npmClientArgs to npm client", async () => {
      const cwd = await initFixture("BootstrapCommand/npm-client-args-2");
      const args = ["bootstrap", "--npm-client", path.resolve(cwd, "npm"), "--", "--no-optional"];

      await execa(LERNA_BIN, args, { cwd });

      const npmDebugLog = fs.readFileSync(path.resolve(cwd, "npm-debug.log")).toString();
      expect(npmDebugLog).toMatchSnapshot("passes remaining arguments + npmClientArgs to npm client");
    });
  });

  describe("from npm script", async () => {
    test.concurrent("bootstraps all packages", async () => {
      const cwd = await initFixture("BootstrapCommand/integration-lifecycle");
      await execa("npm", ["install", "--cache-min=99999"], { cwd });

      const { stdout, stderr } = await npmTest(cwd);
      expect(stdout).toMatchSnapshot("npm postinstall: stdout");
      expect(stderr).toMatchSnapshot("npm postinstall: stderr");
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
      expect(stdout).toMatchSnapshot("yarn postinstall: stdout");
      expect(stderr).toMatchSnapshot("yarn postinstall: stderr");
    });
    */
  });
});
