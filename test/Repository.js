"use strict";

const path = require("path");

// mocked or stubbed modules
const findUp = require("find-up");
const loadJsonFile = require("load-json-file");

// helpers
const initFixture = require("./helpers/initFixture");

// file under test
const Repository = require("../src/Repository");

describe("Repository", () => {
  let testDir;

  beforeAll(async () => {
    testDir = await initFixture("Repository/basic");
  });

  describe(".rootPath", () => {
    const findUpSync = findUp.sync;

    afterEach(() => {
      findUp.sync = findUpSync;
    });

    it("should be added to the instance", () => {
      const repo = new Repository(testDir);
      expect(repo.rootPath).toBe(testDir);
    });

    it("resolves to CWD when lerna.json missing", () => {
      findUp.sync = jest.fn(() => null);

      const repo = new Repository(testDir);
      expect(repo.rootPath).toBe(testDir);
    });

    it("defaults CWD to '.' when constructor argument missing", () => {
      findUp.sync = jest.fn(() => null);

      const repo = new Repository();
      expect(repo.rootPath).toBe(path.resolve(__dirname, ".."));
    });
  });

  describe(".lernaJsonLocation", () => {
    it("should be added to the instance", () => {
      const repo = new Repository(testDir);
      expect(repo.lernaJsonLocation).toBe(path.join(testDir, "lerna.json"));
    });
  });

  describe(".packageJsonLocation", () => {
    it("should be added to the instance", () => {
      const repo = new Repository(testDir);
      expect(repo.packageJsonLocation).toBe(path.join(testDir, "package.json"));
    });
  });

  describe("get .lernaJson", () => {
    const loadJsonFileSync = loadJsonFile.sync;

    afterEach(() => {
      loadJsonFile.sync = loadJsonFileSync;
    });

    it("returns parsed lerna.json", () => {
      const repo = new Repository(testDir);
      expect(repo.lernaJson).toEqual({
        version: "1.0.0",
      });
    });

    it("defaults to an empty object", () => {
      loadJsonFile.sync = jest.fn(() => {
        throw new Error("File not found");
      });

      const repo = new Repository(testDir);
      expect(repo.lernaJson).toEqual({});
    });

    it("errors when lerna.json is not valid JSON", async () => {
      expect.assertions(2);

      const cwd = await initFixture("Repository/invalid-json");
      const repo = new Repository(cwd);

      try {
        repo.lernaJson; // eslint-disable-line no-unused-expressions
      } catch (err) {
        expect(err.name).toBe("ValidationError");
        expect(err.prefix).toBe("JSONError");
      }
    });
  });

  describe("get .version", () => {
    it("reads the `version` key from lerna.json", () => {
      const repo = new Repository(testDir);
      expect(repo.version).toBe("1.0.0");
    });
  });

  describe("get .nodeModulesLocation", () => {
    it("returns the root node_modules location", () => {
      const repo = new Repository(testDir);
      expect(repo.nodeModulesLocation).toBe(path.join(testDir, "node_modules"));
    });
  });

  describe("get .packageConfigs", () => {
    it("returns the default packageConfigs", () => {
      const repo = new Repository(testDir);
      expect(repo.packageConfigs).toEqual(["packages/*"]);
    });

    it("returns custom packageConfigs", () => {
      const repo = new Repository(testDir);
      const customPackages = [".", "my-packages/*"];
      repo.lernaJson.packages = customPackages;
      expect(repo.packageConfigs).toBe(customPackages);
    });

    it("returns workspace packageConfigs", async () => {
      const testDirWithWorkspaces = await initFixture("Repository/yarn-workspaces");
      const repo = new Repository(testDirWithWorkspaces);
      expect(repo.packageConfigs).toEqual(["packages/*"]);
    });

    it("throws with friendly error if workspaces are not configured", () => {
      const repo = new Repository(testDir);
      repo.lernaJson.useWorkspaces = true;
      expect(() => repo.packageConfigs).toThrow(/workspaces need to be defined/);
    });
  });

  describe("get .packageParentDirs", () => {
    it("returns a list of package parent directories", () => {
      const repo = new Repository(testDir);
      repo.lernaJson.packages = [".", "packages/*", "dir/nested/*", "globstar/**"];
      expect(repo.packageParentDirs).toEqual([
        testDir,
        path.join(testDir, "packages"),
        path.join(testDir, "dir/nested"),
        path.join(testDir, "globstar"),
      ]);
    });
  });

  describe("get .packageJson", () => {
    const loadJsonFileSync = loadJsonFile.sync;

    afterEach(() => {
      loadJsonFile.sync = loadJsonFileSync;
    });

    it("returns parsed package.json", () => {
      const repo = new Repository(testDir);
      expect(repo.packageJson).toMatchObject({
        name: "test",
        devDependencies: {
          lerna: "500.0.0",
          external: "^1.0.0",
        },
      });
    });

    it("caches the first successful value", () => {
      const repo = new Repository(testDir);
      expect(repo.packageJson).toBe(repo.packageJson);
    });

    it("does not cache failures", () => {
      loadJsonFile.sync = jest.fn(() => {
        throw new Error("File not found");
      });

      const repo = new Repository(testDir);
      expect(repo.packageJson).toBe(null);

      loadJsonFile.sync = loadJsonFileSync;
      expect(repo.packageJson).toHaveProperty("name", "test");
    });

    it("errors when root package.json is not valid JSON", async () => {
      expect.assertions(2);

      const cwd = await initFixture("Repository/invalid-json");
      const repo = new Repository(cwd);

      try {
        repo.packageJson; // eslint-disable-line no-unused-expressions
      } catch (err) {
        expect(err.name).toBe("ValidationError");
        expect(err.prefix).toBe("JSONError");
      }
    });
  });

  describe("get .package", () => {
    it("returns a Package instance", () => {
      const repo = new Repository(testDir);
      expect(repo.package).toBeDefined();
      expect(repo.package.name).toBe("test");
      expect(repo.package.location).toBe(testDir);
    });

    it("caches the initial value", () => {
      const repo = new Repository(testDir);
      expect(repo.package).toBe(repo.package);
    });
  });

  describe("isIndependent()", () => {
    it("returns if the repository versioning is independent", () => {
      const repo = new Repository(testDir);
      expect(repo.isIndependent()).toBe(false);

      repo.lernaJson.version = "independent";
      expect(repo.isIndependent()).toBe(true);
    });
  });
});
