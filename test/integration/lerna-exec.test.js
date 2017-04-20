import execa from "execa";
import initFixture from "../helpers/initFixture";
import { LERNA_BIN } from "../helpers/constants";

describe("lerna exec", () => {
  test.concurrent("--ignore <pkg> ls -- -1", () => {
    return initFixture("ExecCommand/basic").then((cwd) => {
      const args = [
        "exec",
        "--ignore=package-1",
        "ls",
        "--concurrency=1",
        "--",
        // args to ls
        "-1",
      ];

      return execa(LERNA_BIN, args, { cwd }).then((result) => {
        expect(result.stdout).toMatchSnapshot("stdout: ls --ignore");
        expect(result.stderr).toMatchSnapshot("stderr: ls --ignore");
      });
    });
  });

  test.concurrent("ls --scope <pkg>", () => {
    return initFixture("ExecCommand/basic").then((cwd) => {
      const args = [
        "exec",
        "--concurrency=1",
        "ls",
        "--scope=package-1",
        // no args to ls
      ];

      return execa(LERNA_BIN, args, { cwd }).then((result) => {
        expect(result.stdout).toMatchSnapshot("stdout: ls --scope");
        expect(result.stderr).toMatchSnapshot("stderr: ls --scope");
      });
    });
  });

  test.concurrent("without --", () => {
    return initFixture("ExecCommand/basic").then((cwd) => {
      const args = [
        "--concurrency=1",
        "exec",
        "ls",
        // no --
        "-C",
      ];

      return execa(LERNA_BIN, args, { cwd }).then((result) => {
        expect(result.stdout).toMatchSnapshot("stdout: without --");
        expect(result.stderr).toMatchSnapshot("stderr: without --");
      });
    });
  });

  test.concurrent("echo $LERNA_PACKAGE_NAME", () => {
    return initFixture("ExecCommand/basic").then((cwd) => {
      const args = [
        "exec",
        "--concurrency=1",
        "echo",
        (process.platform == "win32" ? "%LERNA_PACKAGE_NAME%" : "$LERNA_PACKAGE_NAME"),
      ];

      return execa(LERNA_BIN, args, { cwd }).then((result) => {
        expect(result.stdout).toMatchSnapshot("stdout: echo LERNA_PACKAGE_NAME");
        expect(result.stderr).toMatchSnapshot("stderr: echo LERNA_PACKAGE_NAME");
      });
    });
  });
});
