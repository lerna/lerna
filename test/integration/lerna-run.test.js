"use strict";

const cliRunner = require("../helpers/cli-runner");
const initFixture = require("../helpers/initFixture");

/**
 * NOTE: We do not test the "missing test script" case here
 * because Windows makes the snapshots impossible to stabilize.
 */
describe("lerna run", () => {
  test("my-script --scope", async () => {
    const cwd = await initFixture("RunCommand/basic");
    const args = [
      "run",
      "my-script",
      "--scope=package-1",
      "--concurrency=1",
      // args below tell npm to be quiet
      "--",
      "--silent",
    ];
    const { stdout, stderr } = await cliRunner(cwd)(...args);
    expect(stdout).toBe("package-1");
    expect(stderr).toMatchSnapshot("stderr");
  });

  test("test --ignore", async () => {
    const cwd = await initFixture("RunCommand/integration-lifecycle");
    const args = [
      "run",
      "--concurrency=1",
      "test",
      "--ignore",
      "package-@(1|2|3)",
      // args below tell npm to be quiet
      "--",
      "--silent",
    ];
    const { stdout, stderr } = await cliRunner(cwd)(...args);
    expect(stdout).toBe("package-4");
    expect(stderr).toMatchSnapshot("stderr");
  });

  test("test --stream", async () => {
    const cwd = await initFixture("RunCommand/integration-lifecycle");
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

  test("test --parallel", async () => {
    const cwd = await initFixture("RunCommand/integration-lifecycle");
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

  test("my-script --parallel", async () => {
    const cwd = await initFixture("RunCommand/basic");
    const args = [
      "run",
      "--parallel",
      "my-script",
      // args below tell npm to be quiet
      "--",
      "--silent",
    ];
    const { stdout, stderr } = await cliRunner(cwd)(...args);
    expect(stderr).toMatchSnapshot("stderr");

    // order is non-deterministic, so assert each item seperately
    expect(stdout).toMatch("package-1: package-1");
    expect(stdout).not.toMatch("package-2");
    expect(stdout).toMatch("package-3: package-3");
    expect(stdout).not.toMatch("package-4");
  });
});
