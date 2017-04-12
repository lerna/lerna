import execa from "execa";
import initFixture from "../helpers/initFixture";
import { LERNA_BIN } from "../helpers/constants";

describe("lerna exec", () => {
  test.concurrent("works with ignore flag", () => {
    return initFixture("ExecCommand/basic").then((cwd) => {
      const args = [
        "ls",
        "--ignore=package-1"
      ];
      return Promise.resolve()
        .then(() => execa(LERNA_BIN, args, { cwd: cwd }))
        .then((result) => {
          expect(result.stdout).toMatchSnapshot("exec: with ignore");
        });
    });
  });
});
