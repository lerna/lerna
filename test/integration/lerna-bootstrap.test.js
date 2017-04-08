import execa from "execa";
import initFixture from "../helpers/initFixture";
import { LERNA_BIN } from "../helpers/constants";

const installInDir = (cwd) =>
  execa("npm", ["install", "--cache-min=99999"], { cwd });
  // yarn doesn't support installing from a local directory

const npmTestInDir = (cwd) =>
  execa("npm", ["test", "--silent"], { cwd });
  // yarn doesn't support --silent yet (https://github.com/yarnpkg/yarn/pull/2420)

describe("lerna bootstrap", () => {
  describe("from CLI", () => {
    test.concurrent("bootstraps all packages", () => {
      return initFixture("BootstrapCommand/integration").then((cwd) => {
        return Promise.resolve()
          .then(() => execa(LERNA_BIN, ["bootstrap"], { cwd }))
          .then((result) => {
            expect(result.stdout).toMatchSnapshot("stdout: simple");
          })
          .then(() => execa(LERNA_BIN, ["run", "test", "--", "--silent"], { cwd }))
          .then((result) => {
            expect(result.stdout).toMatchSnapshot("stdout: simple");
          });
      });
    });
  });

  describe("from npm script", () => {
    test.concurrent("bootstraps all packages", () => {
      return initFixture("BootstrapCommand/integration-lifecycle").then((cwd) => {
        return Promise.resolve()
          .then(() => installInDir(cwd))
          .then(() => npmTestInDir(cwd))
          .then((result) => {
            expect(result.stdout).toMatchSnapshot("stdout: postinstall");
          });
      });
    });
  });
});
