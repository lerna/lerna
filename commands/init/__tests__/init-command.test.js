"use strict";

const fs = require("fs-extra");
const path = require("path");
const tempy = require("tempy");

// helpers
const initFixture = require("@lerna-test/init-fixture")(__dirname);

// file under test
const lernaInit = require("@lerna-test/command-runner")(require("../command"));

describe("InitCommand", () => {
  const lernaVersion = "__TEST_VERSION__";

  describe("in an empty directory", () => {
    it("initializes git repo with lerna files", async () => {
      const testDir = tempy.directory();

      await lernaInit(testDir)();

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
      const testDir = tempy.directory();

      await lernaInit(testDir)("--independent");

      expect(await fs.readJSON(path.join(testDir, "lerna.json"))).toHaveProperty("version", "independent");
    });

    describe("with --exact", () => {
      it("uses exact version when adding lerna dependency", async () => {
        const testDir = tempy.directory();

        await lernaInit(testDir)("--exact");

        expect(await fs.readJSON(path.join(testDir, "package.json"))).toMatchObject({
          devDependencies: {
            lerna: lernaVersion,
          },
        });
      });

      it("sets lerna.json command.init.exact to true", async () => {
        const testDir = tempy.directory();

        await lernaInit(testDir)("--exact");

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
    it("creates lerna files", async () => {
      const dir = await initFixture("empty");
      const testDir = path.join(dir, "subdir");

      await fs.ensureDir(testDir);
      await lernaInit(testDir)();

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
    it("adds lerna to sorted devDependencies", async () => {
      const testDir = await initFixture("has-package");
      const pkgJsonPath = path.join(testDir, "package.json");

      await fs.outputJSON(pkgJsonPath, {
        devDependencies: {
          alpha: "first",
          omega: "last",
        },
      });

      await lernaInit(testDir)();

      expect(await fs.readJSON(pkgJsonPath)).toMatchObject({
        devDependencies: {
          alpha: "first",
          lerna: `^${lernaVersion}`,
          omega: "last",
        },
      });
    });

    it("updates existing lerna in devDependencies", async () => {
      const testDir = await initFixture("has-package");
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

      await lernaInit(testDir)();

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
      const testDir = await initFixture("has-package");
      const pkgJsonPath = path.join(testDir, "package.json");

      await fs.outputJSON(pkgJsonPath, {
        dependencies: {
          alpha: "first",
          lerna: "0.1.100",
          omega: "last",
        },
      });

      await lernaInit(testDir)();

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
    it("deletes lerna property if found", async () => {
      const testDir = await initFixture("has-lerna");
      const lernaJsonPath = path.join(testDir, "lerna.json");

      await fs.outputJSON(lernaJsonPath, {
        lerna: "0.1.100",
        version: "1.2.3",
      });

      await lernaInit(testDir)();

      expect(await fs.readJSON(lernaJsonPath)).toEqual({
        packages: ["packages/*"],
        version: "1.2.3",
      });
    });

    it("creates package directories when glob is configured", async () => {
      const testDir = await initFixture("has-lerna");
      const lernaJsonPath = path.join(testDir, "lerna.json");

      await fs.outputJSON(lernaJsonPath, {
        packages: ["modules/*"],
      });

      await lernaInit(testDir)();

      expect(await fs.exists(path.join(testDir, "modules"))).toBe(true);
    });
  });

  describe("when re-initializing with --exact", () => {
    it("sets lerna.json command.init.exact to true", async () => {
      const testDir = await initFixture("updates");
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

      await lernaInit(testDir)("--exact");

      expect(await fs.readJSON(lernaJsonPath)).toEqual({
        command: {
          bootstrap: {
            hoist: true,
          },
          init: {
            exact: true,
          },
        },
        packages: ["packages/*"],
        version: "1.2.3",
      });
    });
  });
});
