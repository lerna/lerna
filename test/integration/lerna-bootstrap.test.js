import execa from "execa";
import globby from "globby";
import normalizePath from "normalize-path";
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
    test.concurrent("bootstraps all packages", async () => {
      const cwd = await initFixture("BootstrapCommand/integration");
      const args = [
        "bootstrap",
      ];

      const stdout = await execa.stdout(LERNA_BIN, args, { cwd });
      expect(stdout).toMatchSnapshot("stdout: simple");

      const output = await execa.stdout(LERNA_BIN, ["run", "test", "--", "--silent"], { cwd });
      expect(output).toMatchSnapshot("stdout: simple");
    });

    test.concurrent("respects ignore flag", async () => {
      const cwd = await initFixture("BootstrapCommand/integration");
      const args = [
        "bootstrap",
        "--ignore",
        "@integration/package-1",
      ];

      const stdout = await execa.stdout(LERNA_BIN, args, { cwd });
      expect(stdout).toMatchSnapshot("stdout: --ignore");
    });

    test.concurrent("--npm-client yarn", async () => {
      const cwd = await initFixture("BootstrapCommand/integration");
      const args = [
        "bootstrap",
        "--npm-client",
        "yarn",
      ];

      const stdout = await execa.stdout(LERNA_BIN, args, { cwd });
      expect(stdout).toMatchSnapshot("stdout: --npm-client yarn");

      const lockfiles = await globby(["package-*/yarn.lock"], { cwd })
        .then((globbed) => globbed.map((fp) => normalizePath(fp)));
      expect(lockfiles).toMatchSnapshot("lockfiles: --npm-client yarn");

      const output = await execa.stdout(LERNA_BIN, ["run", "test", "--", "--silent"], { cwd });
      expect(output).toMatchSnapshot("stdout: --npm-client yarn");
    });
  });

  describe("from npm script", async () => {
    test.concurrent("bootstraps all packages", async () => {
      const cwd = await initFixture("BootstrapCommand/integration-lifecycle");
      await installInDir(cwd);

      const result = await npmTestInDir(cwd);
      expect(result.stdout).toMatchSnapshot("stdout: postinstall");
    });
  });
});
