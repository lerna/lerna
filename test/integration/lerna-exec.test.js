import execa from "execa";

import { LERNA_BIN } from "../helpers/constants";
import initFixture from "../helpers/initFixture";

describe("lerna exec", () => {
  test.concurrent("--ignore <pkg> ls -- -1", async () => {
    const cwd = await initFixture("ExecCommand/basic");
    const args = [
      "exec",
      "--ignore=package-1",
      "ls",
      "--concurrency=1",
      "--",
      // args to ls
      "-1",
    ];

    const { stdout, stderr } = await execa(LERNA_BIN, args, { cwd });
    expect(stdout).toMatchSnapshot("stdout: ls --ignore");
    expect(stderr).toMatchSnapshot("stderr: ls --ignore");
  });

  test.concurrent("ls --scope <pkg>", async () => {
    const cwd = await initFixture("ExecCommand/basic");
    const args = [
      "exec",
      "--concurrency=1",
      "ls",
      "--scope=package-1",
      // no args to ls
    ];

    const { stdout, stderr } = await execa(LERNA_BIN, args, { cwd });
    expect(stdout).toMatchSnapshot("stdout: ls --scope");
    expect(stderr).toMatchSnapshot("stderr: ls --scope");
  });

  test.concurrent("without --", async () => {
    const cwd = await initFixture("ExecCommand/basic");
    const args = [
      "--concurrency=1",
      "exec",
      "ls",
      // no --
      "-C",
    ];

    const { stdout, stderr } = await execa(LERNA_BIN, args, { cwd });
    expect(stdout).toMatchSnapshot("stdout: without --");
    expect(stderr).toMatchSnapshot("stderr: without --");
  });

  test.concurrent("echo $LERNA_PACKAGE_NAME", async () => {
    const cwd = await initFixture("ExecCommand/basic");
    const args = [
      "exec",
      "--concurrency=1",
      "echo",
      (process.platform == "win32" ? "%LERNA_PACKAGE_NAME%" : "$LERNA_PACKAGE_NAME"),
    ];

    const { stdout, stderr } = await execa(LERNA_BIN, args, { cwd });
    expect(stdout).toMatchSnapshot("stdout: echo LERNA_PACKAGE_NAME");
    expect(stderr).toMatchSnapshot("stderr: echo LERNA_PACKAGE_NAME");
  });

  test.concurrent("<cmd> --parallel", async () => {
    const cwd = await initFixture("ExecCommand/basic");
    const args = [
      "exec",
      "ls",
      "--parallel",
      // no --
      "-C",
    ];

    const { stdout, stderr } = await execa(LERNA_BIN, args, { cwd });
    expect(stderr).toMatchSnapshot("stderr: <cmd> --parallel");

    // order is non-deterministic, so assert individually
    expect(stdout).toMatch("package-1: file-1.js");
    expect(stdout).toMatch("package-1: package.json");
    expect(stdout).toMatch("package-2: file-2.js");
    expect(stdout).toMatch("package-2: package.json");
  });

  test.concurrent("--parallel <cmd>", async () => {
    const cwd = await initFixture("ExecCommand/basic");
    const args = [
      "exec",
      "--parallel",
      "ls",
      // no --
      "-C",
    ];

    const { stdout, stderr } = await execa(LERNA_BIN, args, { cwd });
    expect(stderr).toMatchSnapshot("stderr: --parallel <cmd>");

    // order is non-deterministic, so assert individually
    expect(stdout).toMatch("package-1: file-1.js");
    expect(stdout).toMatch("package-1: package.json");
    expect(stdout).toMatch("package-2: file-2.js");
    expect(stdout).toMatch("package-2: package.json");
  });

  test.concurrent("--bail=false <cmd>", async () => {
    const cwd = await initFixture("ExecCommand/basic");
    const args = [
      "exec",
      "--bail=false",
      "--concurrency=1",
      "--",
      "npm run fail-or-succeed",
    ];

    const { stdout, stderr } = await execa(LERNA_BIN, args, { cwd });
    expect(stderr).toMatch(
      "Failed at the package-1@1.0.0 fail-or-succeed script 'echo \"failure!\" && exit 1'."
    );
    expect(stdout).toMatch("failure!");
    expect(stdout).toMatch("success!");
  });

  test.concurrent("--bail=true <cmd>", async () => {
    const cwd = await initFixture("ExecCommand/basic");
    const args = [
      "exec",
      "--bail=true",
      "--concurrency=1",
      "--",
      "npm run fail-or-succeed",
    ];

    let hasError = false;
    try {
      await execa(LERNA_BIN, args, { cwd });
    } catch (error) {
      hasError = true;
      expect(error.message).toMatch(
        "exec Errored while executing 'npm run fail-or-succeed' in 'package-1'",
      );

      // Script should halt before any attempts on "package-2" are attempted.
      expect(error.message).not.toMatch("package-2");
    }

    expect(hasError).toBe(true);
  });
});
