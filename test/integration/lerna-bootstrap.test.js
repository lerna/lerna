import execa from "execa";
import getPort from "get-port";
import globby from "globby";
import normalizePath from "normalize-path";
import initFixture from "../helpers/initFixture";
import { LERNA_BIN } from "../helpers/constants";

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
      await execa("npm", ["install", "--cache-min=99999"], { cwd });

      const result = await execa("npm", ["test", "--silent"], { cwd });
      expect(result.stdout).toMatchSnapshot("stdout: postinstall");
    });

    test.skip("works with yarn install", async () => {
      const cwd = await initFixture("BootstrapCommand/integration-lifecycle");

      const port = await getPort(42042);
      const mutex = ["--mutex", `network:${port}`];

      // NOTE: yarn doesn't support linking binaries from transitive dependencies,
      // so it's important to test _both_ lifecycle variants.
      // TODO: ...eventually :P
      // FIXME: yarn doesn't understand file:// URLs... /sigh
      await execa("yarn", ["install", "--no-lockfile", ...mutex], { cwd });

      const result = await execa("yarn", ["test", "--silent", ...mutex], { cwd });
      expect(result.stdout).toMatchSnapshot("stdout: postinstall");
    });
  });
});
