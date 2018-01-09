import execa from "execa";

import { LERNA_BIN } from "../helpers/constants";
import initFixture from "../helpers/initFixture";
import initExecTest from "../helpers/initExecTest";

describe("lerna exec", () => {
  const EXEC_TEST_COMMAND = process.platform === "win32" ? "exec-test.cmd" : "exec-test";
  const env = initExecTest("ExecCommand");

  test("--ignore <pkg> exec-test -- -1", async () => {
    const cwd = await initFixture("ExecCommand/basic");
    const args = [
      "exec",
      "--ignore=package-1",
      EXEC_TEST_COMMAND,
      "--concurrency=1",
      "--",
      // args to exec-test
      "-1",
    ];

    const { stdout } = await execa(LERNA_BIN, args, { cwd, env });
    expect(stdout).toMatchSnapshot();
  });

  test("exec-test --scope <pkg>", async () => {
    const cwd = await initFixture("ExecCommand/basic");
    const args = [
      "exec",
      "--concurrency=1",
      EXEC_TEST_COMMAND,
      "--scope=package-1",
      // no args to exec-test
    ];

    const { stdout } = await execa(LERNA_BIN, args, { cwd, env });
    expect(stdout).toMatchSnapshot();
  });

  test("without --", async () => {
    const cwd = await initFixture("ExecCommand/basic");
    const args = [
      "--concurrency=1",
      "exec",
      EXEC_TEST_COMMAND,
      // no --
      "-C",
    ];

    const { stdout } = await execa(LERNA_BIN, args, { cwd, env });
    expect(stdout).toMatchSnapshot();
  });

  test("echo $LERNA_PACKAGE_NAME", async () => {
    const cwd = await initFixture("ExecCommand/basic");
    const args = [
      "exec",
      "--concurrency=1",
      "echo",
      process.platform === "win32" ? "%LERNA_PACKAGE_NAME%" : "$LERNA_PACKAGE_NAME",
    ];

    const { stdout } = await execa(LERNA_BIN, args, { cwd });
    expect(stdout).toMatchSnapshot();
  });

  test("<cmd> --parallel", async () => {
    const cwd = await initFixture("ExecCommand/basic");
    const args = [
      "exec",
      EXEC_TEST_COMMAND,
      "--parallel",
      // no --
      "-C",
    ];

    const { stdout, stderr } = await execa(LERNA_BIN, args, { cwd, env });
    expect(stderr).toMatch(EXEC_TEST_COMMAND);

    // order is non-deterministic, so assert individually
    expect(stdout).toMatch("package-1: file-1.js");
    expect(stdout).toMatch("package-1: package.json");
    expect(stdout).toMatch("package-2: file-2.js");
    expect(stdout).toMatch("package-2: package.json");
  });

  test("--parallel <cmd>", async () => {
    const cwd = await initFixture("ExecCommand/basic");
    const args = [
      "exec",
      "--parallel",
      EXEC_TEST_COMMAND,
      // no --
      "-C",
    ];

    const { stdout, stderr } = await execa(LERNA_BIN, args, { cwd, env });
    expect(stderr).toMatch(EXEC_TEST_COMMAND);

    // order is non-deterministic, so assert individually
    expect(stdout).toMatch("package-1: file-1.js");
    expect(stdout).toMatch("package-1: package.json");
    expect(stdout).toMatch("package-2: file-2.js");
    expect(stdout).toMatch("package-2: package.json");
  });

  test("<cmd> --stream", async () => {
    const cwd = await initFixture("ExecCommand/basic");
    const args = ["exec", EXEC_TEST_COMMAND, "--stream", "-C"];

    const { stdout } = await execa(LERNA_BIN, args, { cwd, env });

    // order is non-deterministic, so assert individually
    expect(stdout).toMatch("package-1: file-1.js");
    expect(stdout).toMatch("package-1: package.json");
    expect(stdout).toMatch("package-2: file-2.js");
    expect(stdout).toMatch("package-2: package.json");
  });

  test("--stream <cmd>", async () => {
    const cwd = await initFixture("ExecCommand/basic");
    const args = ["exec", "--stream", EXEC_TEST_COMMAND, "-C"];

    const { stdout } = await execa(LERNA_BIN, args, { cwd, env });

    // order is non-deterministic, so assert individually
    expect(stdout).toMatch("package-1: file-1.js");
    expect(stdout).toMatch("package-1: package.json");
    expect(stdout).toMatch("package-2: file-2.js");
    expect(stdout).toMatch("package-2: package.json");
  });

  test("--bail=false <cmd>", async () => {
    const cwd = await initFixture("ExecCommand/basic");
    const args = ["exec", "--bail=false", "--concurrency=1", "--", "npm run fail-or-succeed"];

    const { stdout, stderr } = await execa(LERNA_BIN, args, { cwd });
    expect(stderr).toMatch("Failed at the package-1@1.0.0 fail-or-succeed script");
    expect(stdout).toMatch("failure!");
    expect(stdout).toMatch("success!");
  });

  test("--no-bail <cmd>", async () => {
    const cwd = await initFixture("ExecCommand/basic");
    const args = ["exec", "--no-bail", "--concurrency=1", "--", "npm run fail-or-succeed"];

    const { stdout, stderr } = await execa(LERNA_BIN, args, { cwd });
    expect(stderr).toMatch("Failed at the package-1@1.0.0 fail-or-succeed script");
    expect(stdout).toMatch("failure!");
    expect(stdout).toMatch("success!");
  });
});
