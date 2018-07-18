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
      const project = new Project(testDir);
      expect(project.rootPath).toBe(testDir);
    });

    it("resolves to CWD when lerna.json missing", async () => {
      const cwd = await initFixture("no-lerna-config");
      const project = new Project(cwd);

      expect(project.rootPath).toBe(cwd);
    });

    it("defaults CWD to '.' when constructor argument missing", () => {
      const project = new Project();
      expect(project.rootPath).toBe(testDir);
    });
  });

  describe(".config", () => {
    it("returns parsed lerna.json", () => {
      const project = new Project(testDir);
      expect(project.config).toEqual({
        version: "1.0.0",
      });
    });

    it("defaults to an empty object", async () => {
      await initFixture("no-lerna-config");

      expect(new Project().config).toEqual({});
    });

    it("errors when lerna.json is not valid JSON", async () => {
      expect.assertions(2);

      const cwd = await initFixture("invalid-json");

      try {
        const project = new Project(cwd); // eslint-disable-line no-unused-vars
      } catch (err) {
        expect(err.name).toBe("ValidationError");
        expect(err.prefix).toBe("JSONError");
      }
    });

    it("returns parsed rootPkg.lerna", async () => {
      const cwd = await initFixture("pkg-prop");
      const project = new Project(cwd);

      expect(project.config).toEqual({
        command: {
          publish: {
            loglevel: "verbose",
          },
        },
        loglevel: "success",
        version: "1.0.0",
      });
    });

    it("errors when root package.json is not valid JSON", async () => {
      expect.assertions(2);

      const cwd = await initFixture("pkg-prop-syntax-error");

      try {
        const project = new Project(cwd); // eslint-disable-line no-unused-vars
      } catch (err) {
        expect(err.name).toBe("ValidationError");
        expect(err.prefix).toBe("JSONError");
      }
    });

    it("extends local shared config", async () => {
      const cwd = await initFixture("extends");
      const project = new Project(cwd);

      expect(project.config).toEqual({
        packages: ["custom-local/*"],
        version: "1.0.0",
      });
    });

    it("extends local shared config subpath", async () => {
      const cwd = await initFixture("extends");

      await fs.writeJSON(path.resolve(cwd, "lerna.json"), {
        extends: "local-package/subpath",
        version: "1.0.0",
      });

      const project = new Project(cwd);

      expect(project.config).toEqual({
        packages: ["subpath-local/*"],
        version: "1.0.0",
      });
    });

    it("extends config recursively", async () => {
      const cwd = await initFixture("extends-recursive");
      const project = new Project(cwd);

      expect(project.config).toEqual({
        command: {
          list: {
            json: true,
            private: false,
          },
        },
        packages: ["recursive-pkgs/*"],
        version: "1.0.0",
      });
    });

    it("renames deprecated config recursively", async () => {
      const cwd = await initFixture("extends-deprecated");
      const project = new Project(cwd);

      expect(project.config).not.toHaveProperty("commands");
      expect(project.config).not.toHaveProperty("command.publish.ignore");
      expect(project.config).toHaveProperty("command.publish.ignoreChanges", ["ignored-file"]);
      expect(project.config).toHaveProperty("command.publish.loglevel", "success");
      expect(project.config).toHaveProperty("command.bootstrap.hoist", true);
    });

    it("throws an error when extend target is unresolvable", async () => {
      const cwd = await initFixture("extends-unresolved");

      try {
        // eslint-disable-next-line no-unused-vars
        const project = new Project(cwd);
        console.log(project);
      } catch (err) {
        expect(err.message).toMatch("must be locally-resolvable");
      }

      expect.assertions(1);
    });

    it("throws an error when extend target is circular", async () => {
      const cwd = await initFixture("extends-circular");

      try {
        // eslint-disable-next-line no-unused-vars
        const project = new Project(cwd);
        console.log(project);
      } catch (err) {
        expect(err.message).toMatch("cannot be circular");
      }

      expect.assertions(1);
    });
  });

  describe("get .version", () => {
    it("reads the `version` key from internal config", () => {
      const project = new Project(testDir);
      expect(project.version).toBe("1.0.0");
    });
  });

  describe("set .version", () => {
    it("sets the `version` key of internal config", () => {
      const project = new Project(testDir);
      project.version = "2.0.0";
      expect(project.config.version).toBe("2.0.0");
    });
  });

  describe("get .packageConfigs", () => {
    it("returns the default packageConfigs", () => {
      const project = new Project(testDir);
      expect(project.packageConfigs).toEqual(["packages/*"]);
    });

    it("returns custom packageConfigs", () => {
      const project = new Project(testDir);
      const customPackages = [".", "my-packages/*"];
      project.config.packages = customPackages;
      expect(project.packageConfigs).toBe(customPackages);
    });

    it("returns workspace packageConfigs", async () => {
      const cwd = await initFixture("yarn-workspaces");
      const project = new Project(cwd);
      expect(project.packageConfigs).toEqual(["packages/*"]);
    });

    it("throws with friendly error if workspaces are not configured", () => {
      const project = new Project(testDir);
      project.config.useWorkspaces = true;
      expect(() => project.packageConfigs).toThrow(/workspaces need to be defined/);
    });
  });

  describe("get .packageParentDirs", () => {
    it("returns a list of package parent directories", () => {
      const project = new Project(testDir);
      project.config.packages = [".", "packages/*", "dir/nested/*", "globstar/**"];
      expect(project.packageParentDirs).toEqual([
        testDir,
        path.join(testDir, "packages"),
        path.join(testDir, "dir/nested"),
        path.join(testDir, "globstar"),
      ]);
    });
  });

  describe("get .manifest", () => {
    it("returns a Package instance", () => {
      const project = new Project(testDir);
      expect(project.manifest).toBeDefined();
      expect(project.manifest.name).toBe("test");
      expect(project.manifest.location).toBe(testDir);
    });

    it("caches the first successful value", () => {
      const project = new Project(testDir);
      expect(project.manifest).toBe(project.manifest);
    });

    it("defaults package.json name field when absent", async () => {
      const cwd = await initFixture("basic");
      const manifestLocation = path.join(cwd, "package.json");

      await fs.writeJSON(manifestLocation, { private: true }, { spaces: 2 });

      const project = new Project(cwd);
      expect(project.manifest).toHaveProperty("name", path.basename(cwd));
    });

    it("does not cache failures", async () => {
      const cwd = await initFixture("basic");
      const manifestLocation = path.join(cwd, "package.json");

      await fs.remove(manifestLocation);

      const project = new Project(cwd);
      expect(project.manifest).toBe(undefined);

      await fs.writeJSON(manifestLocation, { name: "test" }, { spaces: 2 });
      expect(project.manifest).toHaveProperty("name", "test");
    });

    it("errors when root package.json is not valid JSON", async () => {
      expect.assertions(2);

      const cwd = await initFixture("invalid-json");

      try {
        const project = new Project(cwd); // eslint-disable-line no-unused-vars
      } catch (err) {
        expect(err.name).toBe("ValidationError");
        expect(err.prefix).toBe("JSONError");
      }
    });
  });

  describe("get .licensePath", () => {
    it("returns path to root LICENSE", async () => {
      const cwd = await initFixture("licenses");
      const project = new Project(cwd);

      expect(project.licensePath).toMatch(/LICENSE$/);
    });

    it("returns path to root LICENSE.md", async () => {
      const cwd = await initFixture("licenses-missing");
      const project = new Project(cwd);

      await fs.outputFile(path.join(cwd, "LICENSE.md"), "copyright, yo", "utf8");

      expect(project.licensePath).toMatch(/LICENSE\.md$/);
    });

    it("returns path to root licence.txt", async () => {
      const cwd = await initFixture("licenses-missing");
      const project = new Project(cwd);

      await fs.outputFile(path.join(cwd, "licence.txt"), "copyright, yo", "utf8");

      expect(project.licensePath).toMatch(/licence\.txt$/);
    });

    it("returns undefined when root license does not exist", async () => {
      const cwd = await initFixture("licenses-missing");
      const project = new Project(cwd);

      expect(project.licensePath).toBeUndefined();
    });

    it("caches the first successful value", async () => {
      const cwd = await initFixture("licenses-missing");
      const project = new Project(cwd);

      expect(project.licensePath).toBeUndefined();

      await fs.outputFile(path.join(cwd, "LiCeNsE"), "copyright, yo", "utf8");

      const foundPath = project.licensePath;
      expect(foundPath).toMatch(/LiCeNsE$/);

      await fs.remove(project.licensePath);

      expect(project.licensePath).toBe(foundPath);
    });
  });

  describe("getPackageLicensePaths()", () => {
    it("returns a list of existing package license files", async () => {
      const cwd = await initFixture("licenses-names");
      const project = new Project(cwd);
      const licensePaths = await project.getPackageLicensePaths();

      expect(licensePaths).toEqual([
        path.join(cwd, "packages", "package-1", "LICENSE"),
        path.join(cwd, "packages", "package-2", "licence"),
        path.join(cwd, "packages", "package-3", "LiCeNSe"),
        path.join(cwd, "packages", "package-5", "LICENCE"),
        // We do not care about duplicates, they are weeded out elsewhere
        path.join(cwd, "packages", "package-5", "license"),
      ]);
    });
  });

  describe("isIndependent()", () => {
    it("returns if the repository versioning is independent", () => {
      const project = new Project(testDir);
      expect(project.isIndependent()).toBe(false);

      project.version = "independent";
      expect(project.isIndependent()).toBe(true);
    });
  });
});
