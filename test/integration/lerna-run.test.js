import execa from "execa";
import initFixture from "../helpers/initFixture";
import { LERNA_BIN } from "../helpers/constants";

const installInDir = (cwd) =>
  execa("npm", ["install", "--cache-min=99999"], { cwd });

const npmTestInDir = (cwd) =>
  execa("npm", ["test", "--silent"], { cwd });

describe("lerna run", () => {
  test.concurrent("can run script in packages", () => {
    return initFixture("RunCommand/basic").then((cwd) => {
      const args = [
        "run",
        "my-script",
        "--scope=package-1",
        "--",
        "--silent"
      ];
      return Promise.resolve()
        .then(() => installInDir(cwd))
        .then(() => execa(LERNA_BIN, args, { cwd }))
        .then((result) => {
          expect(result.stdout).toMatchSnapshot("stdout: simple");
        });
    });
  });

  test.concurrent("can run script in packages through npm lifecycle hook", () => {
    return initFixture("RunCommand/integration-lifecycle").then((cwd) => {
      return Promise.resolve()
        .then(() => installInDir(cwd))
        .then(() => npmTestInDir(cwd))
        .then((result) => {
          expect(result.stdout).toMatchSnapshot("stdout: simple-npm");
        });
    });
  });
});
