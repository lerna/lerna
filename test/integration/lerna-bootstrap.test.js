import execa from "execa";
import initFixture from "../helpers/initFixture";
import { LERNA_BIN } from "../helpers/constants";

const installInDir = (cwd) =>
  execa("npm", ["install", "--cache-min=99999"], { cwd });
  // execa("yarn", ["install", "--mutex", "network:42042"], { cwd });
  // NOTE: yarn doesn't support linking binaries from transitive dependencies
  // AND it caches the tarball such that it breaks local test suite re-runs :P

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

    test.concurrent("respects ignore flag", () => {
      return initFixture("BootstrapCommand/integration").then((cwd) => {
        return Promise.resolve()
          .then(() => execa(LERNA_BIN, ["bootstrap", "--ignore", "@integration/package-1"], { cwd }))
          .then((result) => {
            expect(result.stdout).toMatchSnapshot("stdout: --ignore");
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
