"use strict";

// helpers
const initFixture = require("@lerna-test/init-fixture")(__dirname);
const consoleOutput = require("@lerna-test/console-output");

// file under test
const lernaLs = require("@lerna-test/command-runner")(require("../command"));

describe("LsCommand", () => {
  describe("in a basic repo", () => {
    it("should list packages", async () => {
      const testDir = await initFixture("basic");
      await lernaLs(testDir)();
      expect(consoleOutput()).toMatchSnapshot();
    });

    it("lists changes for a given scope", async () => {
      const testDir = await initFixture("basic");
      await lernaLs(testDir)("--scope", "package-1");
      expect(consoleOutput()).toMatchSnapshot();
    });

    it("does not list changes for ignored packages", async () => {
      const testDir = await initFixture("basic");
      await lernaLs(testDir)("--ignore", "package-@(2|3|4|5)");
      expect(consoleOutput()).toMatchSnapshot();
    });

    it("does not list private packages with --no-private", async () => {
      const testDir = await initFixture("basic");
      await lernaLs(testDir)("--no-private");
      expect(consoleOutput()).not.toMatch("package-5 v1.0.0 (private)");
    });
  });

  describe("in a repo with packages outside of packages/", () => {
    it("should list packages", async () => {
      const testDir = await initFixture("extra");
      await lernaLs(testDir)();
      expect(consoleOutput()).toMatchSnapshot();
    });
  });

  describe("with --include-filtered-dependencies", () => {
    it("should list packages, including filtered ones", async () => {
      const testDir = await initFixture("include-filtered-dependencies");
      await lernaLs(testDir)("--scope", "@test/package-2", "--include-filtered-dependencies");
      expect(consoleOutput()).toMatchSnapshot();
    });
  });

  describe("with --include-filtered-dependents", () => {
    it("should list packages, including filtered ones", async () => {
      const testDir = await initFixture("include-filtered-dependencies");
      await lernaLs(testDir)("--scope", "@test/package-1", "--include-filtered-dependents");
      expect(consoleOutput()).toMatchSnapshot();
    });
  });

  describe("with an undefined version", () => {
    it("should list packages", async () => {
      const testDir = await initFixture("undefined-version");
      await lernaLs(testDir)();
      expect(consoleOutput()).toMatchSnapshot();
    });
  });

  describe("with --json", () => {
    it("should list packages as json objects", async () => {
      const testDir = await initFixture("basic");
      await lernaLs(testDir)("--json");

      // Output should be a parseable string
      const jsonOutput = JSON.parse(consoleOutput());
      expect(jsonOutput).toMatchSnapshot();
    });
  });

  describe("in a Yarn workspace", () => {
    it("should use package.json/workspaces setting", async () => {
      const testDir = await initFixture("yarn-workspaces");
      await lernaLs(testDir)();
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
      const testDir = await initFixture("cycles-and-repeated-deps");
      await lernaLs(testDir)("--scope", "package-1", "--include-filtered-dependencies");

      // should follow all transitive deps and pass all packages except 7 with no repeats
      expect(consoleOutput()).toMatchSnapshot();
    });
  });

  describe("with fancy 'packages' configuration", () => {
    it("lists globstar-nested packages", async () => {
      const testDir = await initFixture("globstar");
      await lernaLs(testDir)();
      expect(consoleOutput()).toMatchSnapshot();
    });

    it("lists packages under explicitly configured node_modules directories", async () => {
      const testDir = await initFixture("explicit-node-modules");
      await lernaLs(testDir)();
      expect(consoleOutput()).toMatchSnapshot();
    });

    it("throws an error when globstars and explicit node_modules configs are mixed", async () => {
      expect.assertions(1);

      const testDir = await initFixture("mixed-globstar");

      try {
        await lernaLs(testDir)();
      } catch (err) {
        expect(err.message).toMatch("An explicit node_modules package path does not allow globstars");
      }
    });
  });

  describe("filtering", () => {
    let testDir;

    beforeAll(async () => {
      testDir = await initFixture("filtering");
    });

    it("includes all packages when --scope is omitted", async () => {
      await lernaLs(testDir)();
      expect(consoleOutput()).toMatchSnapshot();
    });

    it("includes packages when --scope is a package name", async () => {
      await lernaLs(testDir)("--scope", "package-3");
      expect(consoleOutput()).toMatchSnapshot();
    });

    it("excludes packages when --ignore is a package name", async () => {
      await lernaLs(testDir)("--ignore", "package-3");
      expect(consoleOutput()).toMatchSnapshot();
    });

    it("includes packages when --scope is a glob", async () => {
      await lernaLs(testDir)("--scope", "package-a-*");
      expect(consoleOutput()).toMatchSnapshot();
    });

    it("excludes packages when --ignore is a glob", async () => {
      await lernaLs(testDir)("--ignore", "package-@(2|3|4)");
      expect(consoleOutput()).toMatchSnapshot();
    });

    it("excludes packages when --ignore is a brace-expanded list", async () => {
      await lernaLs(testDir)("--ignore", "package-{3,4}");
      expect(consoleOutput()).toMatchSnapshot();
    });

    it("filters packages when both --scope and --ignore are passed", async () => {
      await lernaLs(testDir)("--scope", "package-a-*", "--ignore", "package-a-2");
      expect(consoleOutput()).toMatchSnapshot();
    });

    it("throws an error when --scope is lacking an argument", async () => {
      try {
        await lernaLs(testDir)("--scope");
      } catch (err) {
        expect(err).toHaveProperty("message", expect.stringContaining("Not enough arguments"));
      }
    });

    it("throws an error when --scope glob excludes all packages", async () => {
      expect.assertions(1);

      try {
        await lernaLs(testDir)("--scope", "no-package-*");
      } catch (err) {
        expect(err.message).toBe("No packages remain after filtering [ 'no-package-*' ]");
      }
    });

    it("throws an error when --ignore glob excludes all packages", async () => {
      expect.assertions(1);

      try {
        await lernaLs(testDir)("--ignore", "package-*");
      } catch (err) {
        expect(err.message).toBe("No packages remain after filtering [ '**', '!package-*' ]");
      }
    });

    it("throws an error when --scope and --ignore globs exclude all packages", async () => {
      expect.assertions(1);

      try {
        await lernaLs(testDir)("--scope", "package-a-*", "--ignore", "package-a-@(1|2)");
      } catch (err) {
        expect(err.message).toBe("No packages remain after filtering [ 'package-a-*', '!package-a-@(1|2)' ]");
      }
    });
  });
});
