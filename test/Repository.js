import path from "path";
import findUp from "find-up";
import loadJsonFile from "load-json-file";
import initFixture from "./helpers/initFixture";

import Repository from "../src/Repository";

describe("Repository", () => {
  let testDir;

  const findUpSync = findUp.sync;
  const loadJsonFileSync = loadJsonFile.sync;
  const pj = (...pathParts) => path.join(testDir, ...pathParts);

  beforeEach(() => initFixture("Repository/basic").then((dir) => {
    testDir = dir;
  }));

  describe(".rootPath", () => {
    afterEach(() => {
      findUp.sync = findUpSync;
    });

    it("should be added to the instance", () => {
      // const repo = new Repository();
      // expect(repo.rootPath).toBe(testDir);
      expect(new Repository()).toHaveProperty("rootPath", testDir);
    });

    it("resolves to CWD when lerna.json missing", () => {
      findUp.sync = jest.fn(() => null);

      // const repo = new Repository();
      // expect(repo.rootPath).toBe(testDir);
      expect(new Repository()).toHaveProperty("rootPath", testDir);
    });
  });

  describe(".lernaJsonLocation", () => {
    it("should be added to the instance", () => {
      // const repo = new Repository();
      // expect(repo.lernaJsonLocation).toBe(pj("lerna.json"));
      expect(new Repository()).toHaveProperty("lernaJsonLocation", pj("lerna.json"));
    });
  });

  describe(".packageJsonLocation", () => {
    it("should be added to the instance", () => {
      // const repo = new Repository();
      // expect(repo.packageJsonLocation).toBe(pj("package.json"));
      expect(new Repository()).toHaveProperty("packageJsonLocation", pj("package.json"));
    });
  });

  describe("get .lernaJson", () => {
    afterEach(() => {
      loadJsonFile.sync = loadJsonFileSync;
    });

    it("returns parsed lerna.json", () => {
      const repo = new Repository();
      expect(repo.lernaJson).toEqual({
        "lerna": "500.0.0",
        "version": "1.0.0"
      });
    });

    it("defaults to an empty object", () => {
      loadJsonFile.sync = jest.fn(() => {
        throw new Error("File not found");
      });

      const repo = new Repository();
      expect(repo.lernaJson).toEqual({});
    });
  });

  describe("get .initVersion", () => {
    it("reads the `lerna` key from lerna.json", () => {
      const repo = new Repository();
      expect(repo.initVersion).toBe("500.0.0");
    });
  });

  describe("get .version", () => {
    it("reads the `version` key from lerna.json", () => {
      const repo = new Repository();
      expect(repo.version).toBe("1.0.0");
    });
  });

  describe("get .nodeModulesLocation", () => {
    it("returns the root node_modules location", () => {
      const repo = new Repository();
      expect(repo.nodeModulesLocation).toBe(pj("node_modules"));
    });
  });

  describe("get .packageConfigs", () => {
    it("returns the default packageConfigs", () => {
      const repo = new Repository();
      expect(repo.packageConfigs).toEqual([
        "packages/*",
      ]);
    });

    it("returns custom packageConfigs", () => {
      const repo = new Repository();
      const customPackages = [
        ".",
        "my-packages/*",
      ];
      repo.lernaJson.packages = customPackages;
      expect(repo.packageConfigs).toBe(customPackages);
    });
  });

  describe("get .packages", () => {
    it("returns the list of packages", () => {
      const repo = new Repository();
      expect(repo.packages).toEqual([]);
    });

    it("caches the initial value", () => {
      const repo = new Repository();
      expect(repo.packages).toBe(repo.packages);
    });
  });

  describe("get .packageGraph", () => {
    it("returns the graph of packages", () => {
      const repo = new Repository();
      expect(repo.packageGraph).toBeDefined();
      expect(repo.packageGraph).toHaveProperty("nodes", []);
      expect(repo.packageGraph).toHaveProperty("nodesByName", {});
    });

    it("caches the initial value", () => {
      const repo = new Repository();
      expect(repo.packageGraph).toBe(repo.packageGraph);
    });
  });

  describe("get .packageJson", () => {
    afterEach(() => {
      loadJsonFile.sync = loadJsonFileSync;
    });

    it("returns parsed package.json", () => {
      const repo = new Repository();
      expect(repo.packageJson).toEqual({
        "name": "test",
        "devDependencies": {
          "lerna": "500.0.0",
          "external": "^1.0.0"
        }
      });
    });

    it("caches the first successful value", () => {
      const repo = new Repository();
      expect(repo.package).toBe(repo.package);
    });

    it("does not cache failures", () => {
      loadJsonFile.sync = jest.fn(() => {
        throw new Error("File not found");
      });

      const repo = new Repository();
      expect(repo.packageJson).toBe(null);

      loadJsonFile.sync = loadJsonFileSync;
      expect(repo.packageJson).toHaveProperty("name", "test");
    });
  });

  describe("get .package", () => {
    it("returns a Package instance", () => {
      const repo = new Repository();
      expect(repo.package).toBeDefined();
      expect(repo.package.name).toBe("test");
      expect(repo.package.location).toBe(testDir);
    });

    it("caches the initial value", () => {
      const repo = new Repository();
      expect(repo.package).toBe(repo.package);
    });
  });

  describe("get .versionLocation", () => {
    it("returns the path to (deprecated) VERSION file", () => {
      const repo = new Repository();
      expect(repo.versionLocation).toBe(pj("VERSION"));
    });
  });

  describe("isCompatibleLerna()", () => {
    it("returns true when lerna major version matches", () => {
      const repo = new Repository();
      expect(repo.isCompatibleLerna("500.250.0")).toBe(true);
    });

    it("returns true when initVersion is identical", () => {
      const repo = new Repository();
      expect(repo.isCompatibleLerna("500.0.0")).toBe(true);
    });

    it("returns false when lerna major version does not match", () => {
      const repo = new Repository();
      expect(repo.isCompatibleLerna("1000.0.0")).toBe(false);
    });
  });

  describe("isIndependent()", () => {
    it("returns if the repository versioning is independent", () => {
      const repo = new Repository();
      expect(repo.isIndependent()).toBe(false);

      repo.lernaJson.version = "independent";
      expect(repo.isIndependent()).toBe(true);
    });
  });

  describe("hasDependencyInstalled()", () => {
    it("should match installed dependency", () => {
      const repo = new Repository();
      expect(repo.hasDependencyInstalled("external", "^1")).toBe(true);
    });

    it("should not match non-installed dependency", () => {
      const repo = new Repository();
      expect(repo.hasDependencyInstalled("missing", "^1")).toBe(false);
    });

    it("should not match installed dependency with non-matching version", () => {
      const repo = new Repository();
      expect(repo.hasDependencyInstalled("external", "^2")).toBe(false);
    });
  });
});
