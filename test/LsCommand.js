"use strict";

const log = require("npmlog");

// helpers
const consoleOutput = require("./helpers/consoleOutput");
const initFixture = require("./helpers/initFixture");
const yargsRunner = require("./helpers/yargsRunner");

// file under test
const commandModule = require("../src/commands/LsCommand");

const run = yargsRunner(commandModule);

// silence logs
log.level = "silent";

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

  describe("with terribly complicated dependency cycles", () => {
    // for reference: 1->2, 1->3, 1->4, 2->4, 2->5, 3->4, 3->6, 4->1, 4->4,  5->4, 6->4, 7->4
    // We design the package tree in a very specific way. We want to test several different things
    // * A package depending on itself isn't added twice (package 4)
    // * A package being added twice in the same stage of the expansion isn't added twice (package 4)
    // * A package that has already been processed wont get added twice (package 1)
    it("should list all packages with no repeats", async () => {
      const cwd = await initFixture("PackageUtilities/cycles-and-repeated-deps");
      await run(cwd)("--scope", "package-1", "--include-filtered-dependencies");

      // should follow all transitive deps and pass all packages except 7 with no repeats
      expect(consoleOutput()).toMatchSnapshot();
    });
  });
});
