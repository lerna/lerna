import execa from "execa";
import initFixture from "../helpers/initFixture";
import { LERNA_BIN } from "../helpers/constants";

describe("lerna run", () => {
  test.concurrent("my-script --scope", () => {
    return initFixture("RunCommand/basic").then((cwd) => {
      const args = [
        "run",
        "my-script",
        "--scope=package-1",
        "--concurrency=1",
        // args below tell npm to be quiet
        "--", "--silent",
      ];

      return execa(LERNA_BIN, args, { cwd }).then((result) => {
        expect(result.stdout).toMatchSnapshot("stdout: my-script --scope");
      });
    });
  });

  test.concurrent("test --ignore", () => {
    return initFixture("RunCommand/integration-lifecycle").then((cwd) => {
      const args = [
        "run",
        "--concurrency=1",
        "test",
        "--ignore=package-1",
        // args below tell npm to be quiet
        "--", "--silent",
      ];

      return execa(LERNA_BIN, args, { cwd }).then((result) => {
        expect(result.stdout).toMatchSnapshot("stdout: test --ignore");
      });
    });
  });
});
