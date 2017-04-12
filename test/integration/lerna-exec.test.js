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
        expect(result.stdout).toMatchSnapshot("ls: --ignore");
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
        expect(result.stdout).toMatchSnapshot("ls: --scope");
      });
    });
  });
});
