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

  describe("isIndependent()", () => {
    it("returns if the repository versioning is independent", () => {
      const project = new Project(testDir);
      expect(project.isIndependent()).toBe(false);

      project.version = "independent";
      expect(project.isIndependent()).toBe(true);
    });
  });
});
