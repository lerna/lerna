"use strict";

const fs = require("fs-extra");
const log = require("npmlog");
const path = require("path");
const tempy = require("tempy");

// helpers
const initFixture = require("./helpers/initFixture");
const yargsRunner = require("./helpers/yargsRunner");

// file under test
const commandModule = require("../src/commands/InitCommand");

const run = yargsRunner(commandModule);
const lernaVersion = require("../package.json").version;

// silence logs
log.level = "silent";

describe("InitCommand", () => {
  describe("in an empty directory", () => {
    let testDir;
    let lernaInit;

    beforeEach(() => {
      testDir = tempy.directory();
      lernaInit = run(testDir);
    });

    it("initializes git repo with lerna files", async () => {
      await lernaInit();

      const [lernaJson, pkgJson, packagesDirExists, gitDirExists] = await Promise.all([
        fs.readJSON(path.join(testDir, "lerna.json")),
        fs.readJSON(path.join(testDir, "package.json")),
        fs.exists(path.join(testDir, "packages")),
        fs.exists(path.join(testDir, ".git")),
      ]);

      expect(lernaJson).toMatchObject({
        packages: ["packages/*"],
        version: "0.0.0",
      });
      expect(pkgJson).toMatchObject({
        devDependencies: {
          lerna: `^${lernaVersion}`,
        },
      });
      expect(packagesDirExists).toBe(true);
      expect(gitDirExists).toBe(true);
    });

    it("initializes git repo with lerna files in independent mode", async () => {
      await lernaInit("--independent");

      expect(await fs.readJSON(path.join(testDir, "lerna.json"))).toHaveProperty("version", "independent");
    });

    describe("with --exact", () => {
      it("uses exact version when adding lerna dependency", async () => {
        await lernaInit("--exact");

        expect(await fs.readJSON(path.join(testDir, "package.json"))).toMatchObject({
          devDependencies: {
            lerna: lernaVersion,
          },
        });
      });

      it("sets lerna.json command.init.exact to true", async () => {
        await lernaInit("--exact");

        expect(await fs.readJSON(path.join(testDir, "lerna.json"))).toMatchObject({
          command: {
            init: {
              exact: true,
            },
          },
        });
      });
    });
  });

  describe("in a subdirectory of a git repo", () => {
    let testDir;

    beforeEach(async () => {
      const dir = await initFixture("InitCommand/empty");
      testDir = path.join(dir, "subdir");

      await fs.ensureDir(testDir);
    });

    it("creates lerna files", async () => {
      await run(testDir)();

      const [lernaJson, pkgJson, packagesDirExists] = await Promise.all([
        fs.readJSON(path.join(testDir, "lerna.json")),
        fs.readJSON(path.join(testDir, "package.json")),
        fs.exists(path.join(testDir, "packages")),
      ]);

      expect(lernaJson).toMatchObject({
        packages: ["packages/*"],
        version: "0.0.0",
      });
      expect(pkgJson).toMatchObject({
        devDependencies: {
          lerna: `^${lernaVersion}`,
        },
      });
      expect(packagesDirExists).toBe(true);
    });
  });

  describe("when package.json exists", () => {
    let testDir;
    let lernaInit;

    beforeEach(async () => {
      testDir = await initFixture("InitCommand/has-package");
      lernaInit = run(testDir);
    });

    it("adds lerna to sorted devDependencies", async () => {
      const pkgJsonPath = path.join(testDir, "package.json");

      await fs.outputJSON(pkgJsonPath, {
        devDependencies: {
          alpha: "first",
          omega: "last",
        },
      });

      await lernaInit();

      expect(await fs.readJSON(pkgJsonPath)).toMatchObject({
        devDependencies: {
          alpha: "first",
          lerna: `^${lernaVersion}`,
          omega: "last",
        },
      });
    });

    it("updates existing lerna in devDependencies", async () => {
      const pkgJsonPath = path.join(testDir, "package.json");

      await fs.outputJSON(pkgJsonPath, {
        dependencies: {
          alpha: "first",
          omega: "last",
        },
        devDependencies: {
          lerna: "0.1.100",
        },
      });

      await lernaInit();

      expect(await fs.readJSON(pkgJsonPath)).toMatchObject({
        dependencies: {
          alpha: "first",
          omega: "last",
        },
        devDependencies: {
          lerna: `^${lernaVersion}`,
        },
      });
    });

    it("updates existing lerna in sorted dependencies", async () => {
      const pkgJsonPath = path.join(testDir, "package.json");

      await fs.outputJSON(pkgJsonPath, {
        dependencies: {
          alpha: "first",
          lerna: "0.1.100",
          omega: "last",
        },
      });

      await lernaInit();

      expect(await fs.readJSON(pkgJsonPath)).toMatchObject({
        dependencies: {
          alpha: "first",
          lerna: `^${lernaVersion}`,
          omega: "last",
        },
      });
    });
  });

  describe("when lerna.json exists", () => {
    let testDir;
    let lernaInit;

    beforeEach(async () => {
      testDir = await initFixture("InitCommand/has-lerna");
      lernaInit = run(testDir);
    });

    it("deletes lerna property if found", async () => {
      const lernaJsonPath = path.join(testDir, "lerna.json");

      await fs.outputJSON(lernaJsonPath, {
        lerna: "0.1.100",
        version: "1.2.3",
      });

      await lernaInit();

      expect(await fs.readJSON(lernaJsonPath)).toEqual({
        packages: ["packages/*"],
        version: "1.2.3",
      });
    });

    it("creates package directories when glob is configured", async () => {
      const lernaJsonPath = path.join(testDir, "lerna.json");

      await fs.outputJSON(lernaJsonPath, {
        packages: ["modules/*"],
      });

      await lernaInit();

      expect(await fs.exists(path.join(testDir, "modules"))).toBe(true);
    });
  });

  describe("when re-initializing with --exact", () => {
    let testDir;
    let lernaInit;

    beforeEach(async () => {
      testDir = await initFixture("InitCommand/updates");
      lernaInit = run(testDir);
    });

    it("sets lerna.json commands.init.exact to true", async () => {
      const lernaJsonPath = path.join(testDir, "lerna.json");
      const pkgJsonPath = path.join(testDir, "package.json");

      await fs.outputJSON(lernaJsonPath, {
        lerna: "0.1.100",
        commands: {
          bootstrap: {
            hoist: true,
          },
        },
        version: "1.2.3",
      });
      await fs.outputJSON(pkgJsonPath, {
        devDependencies: {
          lerna: lernaVersion,
        },
      });

      await lernaInit("--exact");

      expect(await fs.readJSON(lernaJsonPath)).toMatchObject({
        commands: {
          bootstrap: {
            hoist: true,
          },
          init: {
            exact: true,
          },
        },
      });
    });
  });
});
