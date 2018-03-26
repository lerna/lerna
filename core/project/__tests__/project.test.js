"use strict";

const fs = require("fs-extra");
const path = require("path");

// helpers
const initFixture = require("@lerna-test/init-fixture")(__dirname);

// file under test
const Project = require("..");

describe("Project", () => {
  let testDir;

  beforeAll(async () => {
    testDir = await initFixture("basic");
  });

  afterEach(() => {
    // ensure common CWD is restored when individual tests
    // initialize their own fixture (which changes CWD)
    if (process.cwd() !== testDir) {
      process.chdir(testDir);
    }
  });

  describe(".rootPath", () => {
    it("should be added to the instance", () => {
      const repo = new Project(testDir);
      expect(repo.rootPath).toBe(testDir);
    });

    it("resolves to CWD when lerna.json missing", async () => {
      const cwd = await initFixture("no-lerna-config");
      const repo = new Project(cwd);

      expect(repo.rootPath).toBe(cwd);
    });

    it("defaults CWD to '.' when constructor argument missing", () => {
      const repo = new Project();
      expect(repo.rootPath).toBe(testDir);
    });
  });

  describe(".lernaConfigLocation", () => {
    it("should be added to the instance", () => {
      const repo = new Project(testDir);
      expect(repo.lernaConfigLocation).toBe(path.join(testDir, "lerna.json"));
    });
  });

  describe(".packageJsonLocation", () => {
    it("should be added to the instance", () => {
      const repo = new Project(testDir);
      expect(repo.packageJsonLocation).toBe(path.join(testDir, "package.json"));
    });
  });

  describe(".config", () => {
    it("returns parsed lerna.json", () => {
      const repo = new Project(testDir);
      expect(repo.config).toEqual({
        version: "1.0.0",
      });
    });

    it("defaults to an empty object", async () => {
      const cwd = await initFixture("no-lerna-config");
      const repo = new Project(cwd);

      expect(repo.config).toEqual({});
    });

    it("errors when lerna.json is not valid JSON", async () => {
      expect.assertions(2);

      const cwd = await initFixture("invalid-json");

      try {
        const repo = new Project(cwd); // eslint-disable-line no-unused-vars
      } catch (err) {
        expect(err.name).toBe("ValidationError");
        expect(err.prefix).toBe("JSONError");
      }
    });
  });

  describe("get .version", () => {
    it("reads the `version` key from internal config", () => {
      const repo = new Project(testDir);
      expect(repo.version).toBe("1.0.0");
    });
  });

  describe("set .version", () => {
    it("sets the `version` key of internal config", () => {
      const repo = new Project(testDir);
      repo.version = "2.0.0";
      expect(repo.config.version).toBe("2.0.0");
    });
  });

  describe("get .packageConfigs", () => {
    it("returns the default packageConfigs", () => {
      const repo = new Project(testDir);
      expect(repo.packageConfigs).toEqual(["packages/*"]);
    });

    it("returns custom packageConfigs", () => {
      const repo = new Project(testDir);
      const customPackages = [".", "my-packages/*"];
      repo.config.packages = customPackages;
      expect(repo.packageConfigs).toBe(customPackages);
    });

    it("returns workspace packageConfigs", async () => {
      const testDirWithWorkspaces = await initFixture("yarn-workspaces");
      const repo = new Project(testDirWithWorkspaces);
      expect(repo.packageConfigs).toEqual(["packages/*"]);
    });

    it("throws with friendly error if workspaces are not configured", () => {
      const repo = new Project(testDir);
      repo.config.useWorkspaces = true;
      expect(() => repo.packageConfigs).toThrow(/workspaces need to be defined/);
    });
  });

  describe("get .packageParentDirs", () => {
    it("returns a list of package parent directories", () => {
      const repo = new Project(testDir);
      repo.config.packages = [".", "packages/*", "dir/nested/*", "globstar/**"];
      expect(repo.packageParentDirs).toEqual([
        testDir,
        path.join(testDir, "packages"),
        path.join(testDir, "dir/nested"),
        path.join(testDir, "globstar"),
      ]);
    });
  });

  describe("get .packageJson", () => {
    it("returns parsed package.json", () => {
      const repo = new Project(testDir);
      expect(repo.packageJson).toMatchObject({
        name: "test",
        devDependencies: {
          lerna: "500.0.0",
          external: "^1.0.0",
        },
      });
    });

    it("caches the first successful value", () => {
      const repo = new Project(testDir);
      expect(repo.packageJson).toBe(repo.packageJson);
    });

    it("does not cache failures", async () => {
      const cwd = await initFixture("basic");

      await fs.remove(path.join(cwd, "package.json"));

      const repo = new Project(cwd);
      expect(repo.packageJson).toBe(undefined);

      await fs.writeJSON(repo.packageJsonLocation, { name: "test" }, { spaces: 2 });
      expect(repo.packageJson).toHaveProperty("name", "test");
    });

    it("errors when root package.json is not valid JSON", async () => {
      expect.assertions(2);

      const cwd = await initFixture("invalid-json");

      try {
        const repo = new Project(cwd); // eslint-disable-line no-unused-vars
      } catch (err) {
        expect(err.name).toBe("ValidationError");
        expect(err.prefix).toBe("JSONError");
      }
    });
  });

  describe("get .package", () => {
    it("returns a Package instance", () => {
      const repo = new Project(testDir);
      expect(repo.package).toBeDefined();
      expect(repo.package.name).toBe("test");
      expect(repo.package.location).toBe(testDir);
    });

    it("caches the initial value", () => {
      const repo = new Project(testDir);
      expect(repo.package).toBe(repo.package);
    });
  });

  describe("isIndependent()", () => {
    it("returns if the repository versioning is independent", () => {
      const repo = new Project(testDir);
      expect(repo.isIndependent()).toBe(false);

      repo.version = "independent";
      expect(repo.isIndependent()).toBe(true);
    });
  });
});
