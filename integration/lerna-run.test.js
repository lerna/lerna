"use strict";

const cliRunner = require("@lerna-test/cli-runner");
const initFixture = require("@lerna-test/init-fixture")(__dirname);

/**
 * NOTE: We do not test the "missing test script" case here
 * because Windows makes the snapshots impossible to stabilize.
 */
describe("lerna run", () => {
  test("fail", async () => {
    const cwd = await initFixture("lerna-run");
    const args = ["run", "fail", "--", "--silent"];

    try {
      await cliRunner(cwd)(...args);
    } catch (err) {
      expect(err.message).toMatch("Errored while running script in 'package-3'");
    }
  });

  test("fail --no-bail", async () => {
    const cwd = await initFixture("lerna-run");
    const args = ["run", "fail", "--no-bail", "--", "--silent"];

    const { stdout } = await cliRunner(cwd)(...args);

    expect(stdout).toMatch("package-3");
    expect(stdout).toMatch("package-1");
  });

  test("test --stream", async () => {
    const cwd = await initFixture("lerna-run");
    const args = [
      "run",
      "--stream",
      "test",
      "--concurrency=1",
      // args below tell npm to be quiet
      "--",
      "--silent",
    ];
    const { stdout, stderr } = await cliRunner(cwd)(...args);
    expect(stdout).toMatchSnapshot("stdout");
    expect(stderr).toMatchSnapshot("stderr");
  });

  test("test --stream --no-prefix", async () => {
    const cwd = await initFixture("lerna-run");
    const args = [
      "run",
      "--stream",
      "--no-prefix",
      "test",
      "--concurrency=1",
      // args below tell npm to be quiet
      "--",
      "--silent",
    ];
    const { stdout, stderr } = await cliRunner(cwd)(...args);
    expect(stdout).toMatchSnapshot("stdout");
    expect(stderr).toMatchSnapshot("stderr");
  });

  test("test --parallel", async () => {
    const cwd = await initFixture("lerna-run");
    const args = [
      "run",
      "test",
      "--parallel",
      // args below tell npm to be quiet
      "--",
      "--silent",
    ];
    const { stdout, stderr } = await cliRunner(cwd)(...args);
    expect(stderr).toMatchSnapshot("stderr");

    // order is non-deterministic, so assert each item seperately
    expect(stdout).toMatch("package-1: package-1");
    expect(stdout).toMatch("package-2: package-2");
    expect(stdout).toMatch("package-3: package-3");
    expect(stdout).toMatch("package-4: package-4");
  });
});
