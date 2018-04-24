import chalk from "chalk";
import log from "npmlog";
import normalizeNewline from "normalize-newline";

// mocked or stubbed modules
import output from "../src/utils/output";

// helpers
import initFixture from "./helpers/initFixture";
import yargsRunner from "./helpers/yargsRunner";

// file under test
import * as commandModule from "../src/commands/LsCommand";

const run = yargsRunner(commandModule);

jest.mock("../src/utils/output");

// silence logs
log.level = "silent";

// keep snapshots stable cross-platform
chalk.enabled = false;

const consoleOutput = () => output.mock.calls.map(args => normalizeNewline(args[0]));

describe("LsCommand", () => {
  afterEach(() => jest.resetAllMocks());

  describe("in a basic repo", () => {
    it("should list packages", async () => {
      const lernaLs = run(await initFixture("LsCommand/basic"));
      await lernaLs();
      expect(consoleOutput()).toMatchSnapshot();
    });

    it("lists changes for a given scope", async () => {
      const lernaLs = run(await initFixture("LsCommand/basic"));
      await lernaLs("--scope", "package-1");
      expect(consoleOutput()).toMatchSnapshot();
    });

    it("does not list changes for ignored packages", async () => {
      const lernaLs = run(await initFixture("LsCommand/basic"));
      await lernaLs("--ignore", "package-@(2|3|4|5)");
      expect(consoleOutput()).toMatchSnapshot();
    });
  });

  describe("in a repo with packages outside of packages/", () => {
    it("should list packages", async () => {
      const lernaLs = run(await initFixture("LsCommand/extra"));
      await lernaLs();
      expect(consoleOutput()).toMatchSnapshot();
    });
  });

  describe("with --include-filtered-dependencies", () => {
    it("should list packages, including filtered ones", async () => {
      const lernaLs = run(await initFixture("LsCommand/include-filtered-dependencies"));
      await lernaLs("--scope", "@test/package-2", "--include-filtered-dependencies");
      expect(consoleOutput()).toMatchSnapshot();
    });
  });

  describe("with --include-filtered-dependents", () => {
    it("should list packages, including filtered ones", async () => {
      const lernaLs = run(await initFixture("LsCommand/include-filtered-dependencies"));
      await lernaLs("--scope", "@test/package-1", "--include-filtered-dependents");
      expect(consoleOutput()).toMatchSnapshot();
    });
  });

  describe("with an undefined version", () => {
    it("should list packages", async () => {
      const lernaLs = run(await initFixture("LsCommand/undefined-version"));
      await lernaLs();
      expect(consoleOutput()).toMatchSnapshot();
    });
  });

  describe("with --json", () => {
    it("should list packages as json objects", async () => {
      const lernaLs = run(await initFixture("LsCommand/basic"));
      await lernaLs("--json");

      // Output should be a parseable string
      const jsonOutput = JSON.parse(consoleOutput());
      expect(jsonOutput).toMatchSnapshot();
    });
  });

  describe("in a Yarn workspace", () => {
    it("should use package.json/workspaces setting", async () => {
      const lernaLs = run(await initFixture("LsCommand/yarn-workspaces"));
      await lernaLs();
      expect(consoleOutput()).toMatchSnapshot();
    });
  });
});
