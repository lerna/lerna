import execa from "execa";
import initFixture from "../helpers/initFixture";
import { LERNA_BIN } from "../helpers/constants";

const installInDir = (cwd) =>
  execa("npm", ["install", "--cache-min=99999"], { cwd });

describe("lerna run", () => {

  test.concurrent("can run script in packages", () => {
    return initFixture("RunCommand/basic").then((cwd) => {
      return Promise.resolve()
        .then(() => installInDir(cwd))
        .then(() => execa(LERNA_BIN, ["run", "my-script", "--scope=package-1"], { cwd }))
        .then((result) => {
          expect(result.stdout).toMatchSnapshot("stdout: simple");
        });
    });
  });
});
