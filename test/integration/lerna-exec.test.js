import execa from "execa";
import initFixture from "../helpers/initFixture";
import { LERNA_BIN } from "../helpers/constants";

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
});
