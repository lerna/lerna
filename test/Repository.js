import log from "npmlog";
import path from "path";

// mocked or stubbed modules
import findUp from "find-up";
import loadJsonFile from "load-json-file";
import readPkg from "read-pkg";

// helpers
import initFixture from "./helpers/initFixture";

// file under test
import Repository from "../src/Repository";

// silence logs
log.level = "silent";

describe("Repository", () => {
  let testDir;

  const findUpSync = findUp.sync;
  const loadJsonFileSync = loadJsonFile.sync;
  const readPkgSync = readPkg.sync;

  beforeAll(() =>
    initFixture("Repository/basic").then(dir => {
      testDir = dir;
    })
  );

  describe(".rootPath", () => {
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
    afterEach(() => {
      loadJsonFile.sync = loadJsonFileSync;
    });

    it("returns parsed lerna.json", () => {
      const repo = new Repository(testDir);
      expect(repo.lernaJson).toEqual({
        lerna: "500.0.0",
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

  describe("get .initVersion", () => {
    it("reads the `lerna` key from lerna.json", () => {
      const repo = new Repository(testDir);
      expect(repo.initVersion).toBe("500.0.0");
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
    afterEach(() => {
      readPkg.sync = readPkgSync;
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
      readPkg.sync = jest.fn(() => {
        throw new Error("File not found");
      });

      const repo = new Repository(testDir);
      expect(repo.packageJson).toBe(null);

      readPkg.sync = readPkgSync;
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

  describe("get .versionLocation", () => {
    it("returns the path to (deprecated) VERSION file", () => {
      const repo = new Repository(testDir);
      expect(repo.versionLocation).toBe(path.join(testDir, "VERSION"));
    });
  });

  describe("isCompatibleLerna()", () => {
    it("returns true when lerna CLI version satisfies initVersion range", () => {
      const repo = new Repository(testDir);
      expect(repo.isCompatibleLerna("500.250.0")).toBe(true);
    });

    it("returns true when lerna version is identical to initVersion", () => {
      const repo = new Repository(testDir);
      expect(repo.isCompatibleLerna("500.0.0")).toBe(true);
    });

    it("returns false when lerna CLI version does not satisfy initVersion range", () => {
      const repo = new Repository(testDir);
      expect(repo.isCompatibleLerna("1000.0.0")).toBe(false);
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

  describe("hasDependencyInstalled()", () => {
    it("should match installed dependency", () => {
      const repo = new Repository(testDir);
      expect(repo.hasDependencyInstalled("external", "^1")).toBe(true);
    });

    it("should not match non-installed dependency", () => {
      const repo = new Repository(testDir);
      expect(repo.hasDependencyInstalled("missing", "^1")).toBe(false);
    });

    it("should not match installed dependency with non-matching version", () => {
      const repo = new Repository(testDir);
      expect(repo.hasDependencyInstalled("external", "^2")).toBe(false);
    });
  });
});
