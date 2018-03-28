"use strict";

const fs = require("fs-extra");
const globby = require("globby");
const normalizePath = require("normalize-path");

const cliRunner = require("@lerna-test/cli-runner");
const initFixture = require("@lerna-test/init-fixture")(__dirname);

describe("lerna bootstrap", () => {
  test("bootstraps all packages", async () => {
    const cwd = await initFixture("lerna-bootstrap");
    const lerna = cliRunner(cwd);

    const { stderr } = await lerna("bootstrap");
    expect(stderr).toMatchSnapshot("stderr");

    // the "--silent" flag is passed to `npm run`
    const { stdout } = await lerna("run", "test", "--", "--silent");
    expect(stdout).toMatchSnapshot("stdout");

    const lockfiles = await globby(["package-*/package-lock.json"], { cwd, absolute: true });
    const [lock1, lock2, lock3] = await Promise.all(lockfiles.sort().map(fp => fs.readJson(fp)));

    expect(lock1).toMatchObject({
      name: "@integration/package-1",
      version: "1.0.0",
      dependencies: {
        pify: expect.any(Object),
        "tiny-tarball": {
          version: "1.0.0",
          optional: true,
        },
      },
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
    const cwd = await initFixture("lerna-bootstrap");
    const lerna = cliRunner(cwd);

    const { stderr } = await lerna("bootstrap", "--hoist");
    expect(stderr).toMatchSnapshot("stderr");

    // the "--silent" flag is passed to `npm run`
    const { stdout } = await lerna("run", "test", "--", "--silent");
    expect(stdout).toMatchSnapshot("stdout");

    const lockfiles = await globby(["**/package-lock.json"], {
      cwd,
      absolute: true,
      followSymlinkedDirectories: false,
    });
    const [lock3, rootLock] = await Promise.all(lockfiles.sort().map(fp => fs.readJson(fp)));

    expect(lock3).toMatchObject({
      name: "@integration/package-3",
      version: "1.0.0",
      dependencies: { pify: expect.any(Object) },
    });
    expect(rootLock).toMatchObject({
      name: "integration",
      version: "0.0.0",
      dependencies: {
        pify: expect.any(Object),
        "tiny-tarball": {
          version: "1.0.0",
          // root hoist does not preserve optional
        },
      },
    });
    expect(rootLock).not.toHaveProperty("dependencies.tiny-tarball.optional");
  });

  test("--npm-client yarn", async () => {
    const cwd = await initFixture("lerna-bootstrap");
    const lerna = cliRunner(cwd);

    const { stderr } = await lerna("bootstrap", "--npm-client", "yarn");
    expect(stderr).toMatchSnapshot("stderr");

    const lockfiles = await globby(["package-*/yarn.lock"], { cwd });
    expect(lockfiles.sort().map(fp => normalizePath(fp))).toEqual([
      "package-1/yarn.lock",
      "package-2/yarn.lock",
      "package-3/yarn.lock",
    ]);

    // the "--silent" flag is passed to `npm run`
    const { stdout } = await lerna("run", "test", "--", "--silent");
    expect(stdout).toMatchSnapshot("stdout");
  });
});
