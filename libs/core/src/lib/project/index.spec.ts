/* eslint-disable @nx/enforce-module-boundaries */
// nx-ignore-next-line
import { initFixtureFactory, loggingOutput } from "@lerna/test-helpers";
import fs from "fs-extra";
import { dump } from "js-yaml";
import path from "path";

// Serialize the JSONError output to be more human readable
expect.addSnapshotSerializer({
  serialize(str: string) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const stripAnsi = require("strip-ansi");
    return stripAnsi(str).replace(/Error in: .*lerna\.json/, "Error in: normalized/path/to/lerna.json");
  },
  test(val: string) {
    return val != null && typeof val === "string" && val.includes("Error in: ");
  },
});

// helpers
const initFixture = initFixtureFactory(__dirname);

// file under test
import { Project } from "./index";

describe("Project", () => {
  let testDir: string;

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
        packages: ["packages/*"],
      });
    });

    it("throws ENOLERNA when lerna.json is not found", async () => {
      const cwd = await initFixture("no-lerna-config");

      expect(() => new Project(cwd)).toThrow(
        expect.objectContaining({
          prefix: "ENOLERNA",
        })
      );
    });

    it("does not error when lerna.json contains trailing commas and/or comments", async () => {
      const cwd = await initFixture("invalid-lerna-json-recoverable");

      expect(new Project(cwd).config).toMatchInlineSnapshot(`
        Object {
          "packages": Array [
            "packages/*",
          ],
          "version": "1.0.0",
        }
      `);
    });

    it("errors when lerna.json is irrecoverably invalid JSON", async () => {
      const cwd = await initFixture("invalid-lerna-json-irrecoverable");

      expect(() => new Project(cwd)).toThrow(
        expect.objectContaining({
          name: "ValidationError",
          prefix: "JSONError",
        })
      );

      expect(() => new Project(cwd)).toThrowErrorMatchingInlineSnapshot(`
        Error in: normalized/path/to/lerna.json
        PropertyNameExpected in JSON at 2:3
          1 | {
        > 2 |   233434
            |   ^^^^^^
          3 |   "version": "1.0.0",
          4 | }
          5 | 

      `);
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
        packages: ["packages/*"],
      });
    });

    it("errors when root package.json is not valid JSON", async () => {
      const cwd = await initFixture("pkg-prop-syntax-error");

      expect(() => new Project(cwd)).toThrow(
        expect.objectContaining({
          name: "ValidationError",
          prefix: "JSONError",
        })
      );
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

      expect(() => new Project(cwd)).toThrow("must be locally-resolvable");
    });

    it("throws an error when extend target is circular", async () => {
      const cwd = await initFixture("extends-circular");

      expect(() => new Project(cwd)).toThrow("cannot be circular");
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
    describe("when npmClient is pnpm", () => {
      it("returns packages from pnpm workspace config", async () => {
        const cwd = await initFixture("pnpm");

        const project = new Project(cwd);

        expect(project.packageConfigs).toEqual(["packages/*", "modules/*"]);

        const warningLogs = loggingOutput("warn");
        expect(warningLogs).toEqual([]);

        const verboseLogs = loggingOutput("verbose");
        expect(
          verboseLogs.includes(
            'Package manager "pnpm" detected. Resolving packages using `pnpm-workspace.yaml`.'
          )
        ).toBe(true);
      });

      it("throws with friendly error if pnpm workspaces file does not exist", async () => {
        const cwd = await initFixture("pnpm");

        await fs.remove(path.join(cwd, "pnpm-workspace.yaml"));

        expect(() => new Project(cwd)).toThrowErrorMatchingInlineSnapshot(
          `"No pnpm-workspace.yaml found. See https://pnpm.io/workspaces for help configuring workspaces in pnpm."`
        );

        const verboseLogs = loggingOutput("verbose");
        expect(
          verboseLogs.includes(
            'Package manager "pnpm" detected. Resolving packages using `pnpm-workspace.yaml`.'
          )
        ).toBe(true);
      });

      it("throws with friendly error if pnpm workspaces file has no packages property", async () => {
        const cwd = await initFixture("pnpm");

        const pnpmWorkspaceConfigPath = path.join(cwd, "pnpm-workspace.yaml");
        const pnpmWorkspaceConfigContent = dump({
          otherProperty: ["someValue"],
        });
        await fs.writeFile(pnpmWorkspaceConfigPath, pnpmWorkspaceConfigContent);

        expect(() => new Project(cwd)).toThrowErrorMatchingInlineSnapshot(
          `"No \\"packages\\" property found in \`pnpm-workspace.yaml\`. See https://pnpm.io/workspaces for help configuring workspaces in pnpm."`
        );
      });
    });

    // TODO: is the kind of dynamism after Project creation actually needed/desirable?
    // it("returns custom packageConfigs", () => {
    //   const project = new Project(testDir);
    //   const customPackages = [".", "my-packages/*"];
    //   project.config.packages = customPackages;
    //   expect(project.packageConfigs).toBe(customPackages);

    //   const warningLogs = loggingOutput("warn");
    //   expect(warningLogs).toEqual([]);
    // });

    it("returns workspace packageConfigs", async () => {
      const cwd = await initFixture("yarn-workspaces");
      const project = new Project(cwd);
      expect(project.packageConfigs).toEqual(["packages/*"]);
    });
  });

  // TODO: is the kind of dynamism after Project creation actually needed/desirable?
  // describe("get .packageParentDirs", () => {
  // it("returns a list of package parent directories", () => {
  //   const project = new Project(testDir);
  //   project.config.packages = [".", "packages/*", "dir/nested/*", "globstar/**"];
  //   expect(project.packageParentDirs).toEqual([
  //     testDir,
  //     path.join(testDir, "packages"),
  //     path.join(testDir, "dir/nested"),
  //     path.join(testDir, "globstar"),
  //   ]);
  // });
  // });

  describe(".getPackages()", () => {
    it("returns a list of package instances asynchronously", async () => {
      const project = new Project(testDir);
      const result = await project.getPackages();
      expect(result).toMatchInlineSnapshot(`
        Array [
          Object {
            "name": "pkg-1",
            "version": "1.0.0",
          },
          Object {
            "dependencies": Object {
              "pkg-1": "^1.0.0",
            },
            "name": "pkg-2",
            "version": "1.0.0",
          },
        ]
      `);
    });
  });

  describe(".getPackagesSync()", () => {
    it("returns a list of package instances synchronously", () => {
      const project = new Project(testDir);
      expect(project.getPackagesSync()).toMatchInlineSnapshot(`
        Array [
          Object {
            "name": "pkg-1",
            "version": "1.0.0",
          },
          Object {
            "dependencies": Object {
              "pkg-1": "^1.0.0",
            },
            "name": "pkg-2",
            "version": "1.0.0",
          },
        ]
      `);
    });
  });

  describe("manifest", () => {
    it("throws ENOPKG when root package.json is not found", async () => {
      const cwd = await initFixture("basic");

      await fs.remove(path.join(cwd, "package.json"));

      expect(() => new Project(cwd)).toThrow(
        expect.objectContaining({
          prefix: "ENOPKG",
        })
      );
    });

    it("throws JSONError when root package.json has syntax error", async () => {
      const cwd = await initFixture("basic");

      await fs.writeFile(
        path.join(cwd, "package.json"), // trailing comma ...v
        '{ "name": "invalid", "lerna": { "version": "1.0.0" }, }'
      );

      expect(() => new Project(cwd)).toThrow(
        expect.objectContaining({
          prefix: "JSONError",
        })
      );
    });

    it("throws ENOVERSION when lerna.json is empty", async () => {
      const cwd = await initFixture("basic");

      const lernaConfigPath = path.join(cwd, "lerna.json");
      await fs.writeJson(lernaConfigPath, { packages: [] });

      expect(() => new Project(cwd)).toThrow(
        expect.objectContaining({
          prefix: "ENOVERSION",
        })
      );
    });

    it("throws ENOVERSION when no version property exists in lerna.json", async () => {
      const cwd = await initFixture("basic");

      const lernaConfigPath = path.join(cwd, "lerna.json");
      const lernaConfig = await fs.readJson(lernaConfigPath);
      delete lernaConfig.version;
      await fs.writeJson(lernaConfigPath, {
        ...lernaConfig,
      });

      expect(() => new Project(cwd)).toThrow(
        expect.objectContaining({
          prefix: "ENOVERSION",
        })
      );
    });

    it("returns a Package instance", () => {
      const project = new Project(testDir);
      expect(project.manifest).toBeDefined();
      // TODO: refactor to address type issues
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      expect(project.manifest.name).toBe("test");
      // TODO: refactor to address type issues
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
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

    // TODO: is the kind of dynamism after Project creation actually needed/desirable?
    // it("does not cache failures", async () => {
    //   const cwd = await initFixture("basic");
    //   const manifestLocation = path.join(cwd, "package.json");

    //   await fs.remove(manifestLocation);

    //   const project = new Project(cwd);
    //   expect(project.manifest).toBe(undefined);

    //   await fs.writeJSON(manifestLocation, { name: "test" }, { spaces: 2 });
    //   expect(project.manifest).toHaveProperty("name", "test");
    // });

    it("errors when root package.json is not valid JSON", async () => {
      const cwd = await initFixture("invalid-package-json");

      expect(() => new Project(cwd)).toThrow(
        expect.objectContaining({
          name: "ValidationError",
          prefix: "JSONError",
        })
      );
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

      // TODO: refactor to address type issues
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
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
