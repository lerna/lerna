import { existsSync } from "fs-extra";
import {
  addNxToWorkspace,
  addScriptsToPackage,
  createEmptyDirectoryForWorkspace,
  e2eRoot,
  removeWorkspace,
  runCLI,
  tmpProjPath,
} from "../utils";

expect.addSnapshotSerializer({
  serialize(str) {
    return str
      .replaceAll(/package-\d/g, "package-X")
      .replaceAll(/\d\.(\d{1}|\d{2})s/g, "X.Xs")
      .replaceAll(/Lerna-Profile-\d{8}T\d{6}\.json/g, "Lerna-Profile-XXXXXXXXTXXXXXX.json")
      .replaceAll(/\/private\/tmp\//g, "/tmp/")
      .replaceAll(/lerna info ci enabled\n/g, "")
      .replaceAll(e2eRoot, "/tmp/lerna-e2e");
  },
  test(val) {
    return val != null && typeof val === "string";
  },
});

describe("lerna run", () => {
  afterEach(() => removeWorkspace());

  it("should run script on all child packages", async () => {
    createEmptyDirectoryForWorkspace("lerna-run-test");
    await runCLI("init");

    await runCLI("create package-1");
    await addScriptsToPackage("package-1", {
      "print-name": "echo test-package-1",
    });
    await runCLI("create package-2");
    await addScriptsToPackage("package-2", {
      "print-name": "echo test-package-2",
    });
    await runCLI("create package-3");
    await addScriptsToPackage("package-3", {
      "print-name": "echo test-package-3",
    });

    const output = await runCLI("run print-name -- --silent");

    expect(output.combinedOutput).toMatchInlineSnapshot(`
      test-package-X
      test-package-X
      test-package-X
      lerna notice cli v999.9.9-e2e.0
      lerna info Executing command in 3 packages: "npm run print-name --silent"
      lerna info run Ran npm script 'print-name' in 'package-X' in X.Xs:
      lerna info run Ran npm script 'print-name' in 'package-X' in X.Xs:
      lerna info run Ran npm script 'print-name' in 'package-X' in X.Xs:
      lerna success run Ran npm script 'print-name' in 3 packages in X.Xs:
      lerna success - package-X
      lerna success - package-X
      lerna success - package-X

    `);
  });

  describe("--stream", () => {
    it("should run script on all child packages with package name prefixes", async () => {
      createEmptyDirectoryForWorkspace("lerna-run-test");
      await runCLI("init");

      await runCLI("create package-1");
      await addScriptsToPackage("package-1", {
        "print-name": "echo test-package-1",
      });
      await runCLI("create package-2");
      await addScriptsToPackage("package-2", {
        "print-name": "echo test-package-2",
      });
      await runCLI("create package-3");
      await addScriptsToPackage("package-3", {
        "print-name": "echo test-package-3",
      });

      const output = await runCLI("run print-name --stream -- --silent");

      expect(output.combinedOutput).toMatchInlineSnapshot(`
        package-X: test-package-X
        package-X: test-package-X
        package-X: test-package-X
        lerna notice cli v999.9.9-e2e.0
        lerna info Executing command in 3 packages: "npm run print-name --silent"
        lerna success run Ran npm script 'print-name' in 3 packages in X.Xs:
        lerna success - package-X
        lerna success - package-X
        lerna success - package-X

      `);
    });
  });

  describe("--parallel", () => {
    it("should run script on all child packages with package name prefixes", async () => {
      createEmptyDirectoryForWorkspace("lerna-run-test");
      await runCLI("init");

      await runCLI("create package-1");
      await addScriptsToPackage("package-1", {
        "print-name": "echo test-package-1",
      });
      await runCLI("create package-2");
      await addScriptsToPackage("package-2", {
        "print-name": "echo test-package-2",
      });
      await runCLI("create package-3");
      await addScriptsToPackage("package-3", {
        "print-name": "echo test-package-3",
      });

      const output = await runCLI("run print-name --parallel -- --silent");

      expect(output.combinedOutput).toMatchInlineSnapshot(`
        package-X: test-package-X
        package-X: test-package-X
        package-X: test-package-X
        lerna notice cli v999.9.9-e2e.0
        lerna info Executing command in 3 packages: "npm run print-name --silent"
        lerna success run Ran npm script 'print-name' in 3 packages in X.Xs:
        lerna success - package-X
        lerna success - package-X
        lerna success - package-X

      `);
    });
  });

  describe("--no-bail", () => {
    it("should run script on all child packages and throw, but not abort, on script failure", async () => {
      createEmptyDirectoryForWorkspace("lerna-run-test");
      await runCLI("init");

      await runCLI("create package-1");
      await addScriptsToPackage("package-1", {
        "print-name": "echo test-package-1",
      });
      await runCLI("create package-2");
      await addScriptsToPackage("package-2", {
        "print-name": "echo test-package-2",
      });
      await runCLI("create package-3");
      await addScriptsToPackage("package-3", {
        "print-name": "exit 100",
      });

      await expect(runCLI("run print-name --no-bail -- --silent")).rejects
        .toThrowErrorMatchingInlineSnapshot(`
              Command failed: npx --registry=http://localhost:4872/ --yes lerna@999.9.9-e2e.0 run print-name --no-bail -- --silent
              lerna notice cli v999.9.9-e2e.0
              lerna info Executing command in 3 packages: "npm run print-name --silent"
              lerna info run Ran npm script 'print-name' in 'package-X' in X.Xs:
              lerna info run Ran npm script 'print-name' in 'package-X' in X.Xs:
              lerna info run Ran npm script 'print-name' in 'package-X' in X.Xs:
              lerna ERR! Received non-zero exit code 100 during execution
              lerna success run Ran npm script 'print-name' in 3 packages in X.Xs:
              lerna success - package-X
              lerna success - package-X
              lerna success - package-X

            `);
    });
  });

  describe("--no-prefix", () => {
    describe("--parallel", () => {
      it("should run script on all child packages and suppress package name prefixes", async () => {
        createEmptyDirectoryForWorkspace("lerna-run-test");
        await runCLI("init");

        await runCLI("create package-1");
        await addScriptsToPackage("package-1", {
          "print-name": "echo test-package-1",
        });
        await runCLI("create package-2");
        await addScriptsToPackage("package-2", {
          "print-name": "echo test-package-2",
        });
        await runCLI("create package-3");
        await addScriptsToPackage("package-3", {
          "print-name": "echo test-package-3",
        });

        const output = await runCLI("run print-name --no-prefix --parallel -- --silent");

        expect(output.combinedOutput).toMatchInlineSnapshot(`
          test-package-X
          test-package-X
          test-package-X
          lerna notice cli v999.9.9-e2e.0
          lerna info Executing command in 3 packages: "npm run print-name --silent"
          lerna success run Ran npm script 'print-name' in 3 packages in X.Xs:
          lerna success - package-X
          lerna success - package-X
          lerna success - package-X

        `);
      });
    });

    describe("--stream", () => {
      it("should run script on all child packages and suppress package name prefixes", async () => {
        createEmptyDirectoryForWorkspace("lerna-run-test");
        await runCLI("init");

        await runCLI("create package-1");
        await addScriptsToPackage("package-1", {
          "print-name": "echo test-package-1",
        });
        await runCLI("create package-2");
        await addScriptsToPackage("package-2", {
          "print-name": "echo test-package-2",
        });
        await runCLI("create package-3");
        await addScriptsToPackage("package-3", {
          "print-name": "echo test-package-3",
        });

        const output = await runCLI("run print-name --no-prefix --stream -- --silent");

        expect(output.combinedOutput).toMatchInlineSnapshot(`
          test-package-X
          test-package-X
          test-package-X
          lerna notice cli v999.9.9-e2e.0
          lerna info Executing command in 3 packages: "npm run print-name --silent"
          lerna success run Ran npm script 'print-name' in 3 packages in X.Xs:
          lerna success - package-X
          lerna success - package-X
          lerna success - package-X

        `);
      });
    });
  });

  describe("--profile", () => {
    it("should run script on all child packages and create a performance profile", async () => {
      createEmptyDirectoryForWorkspace("lerna-run-test");
      await runCLI("init");

      await runCLI("create package-1");
      await addScriptsToPackage("package-1", {
        "print-name": "echo test-package-1",
      });
      await runCLI("create package-2");
      await addScriptsToPackage("package-2", {
        "print-name": "echo test-package-2",
      });
      await runCLI("create package-3");
      await addScriptsToPackage("package-3", {
        "print-name": "echo test-package-3",
      });

      const output = await runCLI("run print-name --profile -- --silent");

      expect(output.combinedOutput).toMatchInlineSnapshot(`
        test-package-X
        test-package-X
        test-package-X
        lerna notice cli v999.9.9-e2e.0
        lerna info Executing command in 3 packages: "npm run print-name --silent"
        lerna info run Ran npm script 'print-name' in 'package-X' in X.Xs:
        lerna info run Ran npm script 'print-name' in 'package-X' in X.Xs:
        lerna info run Ran npm script 'print-name' in 'package-X' in X.Xs:
        lerna info profiler Performance profile saved to /tmp/lerna-e2e/lerna-run-test/Lerna-Profile-XXXXXXXXTXXXXXX.json
        lerna success run Ran npm script 'print-name' in 3 packages in X.Xs:
        lerna success - package-X
        lerna success - package-X
        lerna success - package-X

      `);

      const lernaProfileSavedOutputLine = output.combinedOutput.split("\n")[8];

      const lernaProfileFileName = lernaProfileSavedOutputLine.split("lerna-run-test/")[1];

      expect(existsSync(tmpProjPath(lernaProfileFileName))).toBe(true);
    });
  });

  describe("--profile --profile-location", () => {
    it("should run script on all child packages and create a performance profile at provided location", async () => {
      createEmptyDirectoryForWorkspace("lerna-run-test");
      await runCLI("init");

      await runCLI("create package-1");
      await addScriptsToPackage("package-1", {
        "print-name": "echo test-package-1",
      });
      await runCLI("create package-2");
      await addScriptsToPackage("package-2", {
        "print-name": "echo test-package-2",
      });
      await runCLI("create package-3");
      await addScriptsToPackage("package-3", {
        "print-name": "echo test-package-3",
      });

      const output = await runCLI(`run print-name --profile --profile-location=profiles -- --silent`);

      expect(output.combinedOutput).toMatchInlineSnapshot(`
        test-package-X
        test-package-X
        test-package-X
        lerna notice cli v999.9.9-e2e.0
        lerna info Executing command in 3 packages: "npm run print-name --silent"
        lerna info run Ran npm script 'print-name' in 'package-X' in X.Xs:
        lerna info run Ran npm script 'print-name' in 'package-X' in X.Xs:
        lerna info run Ran npm script 'print-name' in 'package-X' in X.Xs:
        lerna info profiler Performance profile saved to /tmp/lerna-e2e/lerna-run-test/profiles/Lerna-Profile-XXXXXXXXTXXXXXX.json
        lerna success run Ran npm script 'print-name' in 3 packages in X.Xs:
        lerna success - package-X
        lerna success - package-X
        lerna success - package-X

      `);

      const lernaProfileSavedOutputLine = output.combinedOutput.split("\n")[8];

      const lernaProfileFileName = lernaProfileSavedOutputLine.split("lerna-run-test/")[1];

      expect(existsSync(tmpProjPath(lernaProfileFileName))).toBe(true);
    });
  });

  describe("--npm-client", () => {
    it("should run script on all child packages using yarn", async () => {
      createEmptyDirectoryForWorkspace("lerna-run-test");
      await runCLI("init");

      await runCLI("create package-1");
      await addScriptsToPackage("package-1", {
        "print-name": "echo test-package-1",
      });
      await runCLI("create package-2");
      await addScriptsToPackage("package-2", {
        "print-name": "echo test-package-2",
      });
      await runCLI("create package-3");
      await addScriptsToPackage("package-3", {
        "print-name": "echo test-package-3",
      });

      const output = await runCLI(`run print-name --npm-client=yarn`);

      expect(output.combinedOutput).toMatchInlineSnapshot(`
        yarn run v1.22.18
        $ echo test-package-X
        test-package-X
        Done in X.Xs.
        yarn run v1.22.18
        $ echo test-package-X
        test-package-X
        Done in X.Xs.
        yarn run v1.22.18
        $ echo test-package-X
        test-package-X
        Done in X.Xs.
        lerna notice cli v999.9.9-e2e.0
        lerna info Executing command in 3 packages: "yarn run print-name"
        lerna info run Ran npm script 'print-name' in 'package-X' in X.Xs:
        lerna info run Ran npm script 'print-name' in 'package-X' in X.Xs:
        lerna info run Ran npm script 'print-name' in 'package-X' in X.Xs:
        lerna success run Ran npm script 'print-name' in 3 packages in X.Xs:
        lerna success - package-X
        lerna success - package-X
        lerna success - package-X

      `);
    });

    it("should run script on all child packages using npm", async () => {
      createEmptyDirectoryForWorkspace("lerna-run-test");
      await runCLI("init");

      await runCLI("create package-1");
      await addScriptsToPackage("package-1", {
        "print-name": "echo test-package-1",
      });
      await runCLI("create package-2");
      await addScriptsToPackage("package-2", {
        "print-name": "echo test-package-2",
      });
      await runCLI("create package-3");
      await addScriptsToPackage("package-3", {
        "print-name": "echo test-package-3",
      });

      const output = await runCLI(`run print-name --npm-client=npm`);

      expect(output.combinedOutput).toMatchInlineSnapshot(`

        > package-X@0.0.0 print-name
        > echo test-package-X

        test-package-X

        > package-X@0.0.0 print-name
        > echo test-package-X

        test-package-X

        > package-X@0.0.0 print-name
        > echo test-package-X

        test-package-X
        lerna notice cli v999.9.9-e2e.0
        lerna info Executing command in 3 packages: "npm run print-name"
        lerna info run Ran npm script 'print-name' in 'package-X' in X.Xs:
        lerna info run Ran npm script 'print-name' in 'package-X' in X.Xs:
        lerna info run Ran npm script 'print-name' in 'package-X' in X.Xs:
        lerna success run Ran npm script 'print-name' in 3 packages in X.Xs:
        lerna success - package-X
        lerna success - package-X
        lerna success - package-X

      `);
    });
  });

  describe("useNx", () => {
    it("should run script on all child packages using nx", async () => {
      createEmptyDirectoryForWorkspace("lerna-run-test");
      await runCLI("init");
      await addNxToWorkspace();

      await runCLI("create package-1");
      await addScriptsToPackage("package-1", {
        "print-name": "echo test-package-1",
      });
      await runCLI("create package-2");
      await addScriptsToPackage("package-2", {
        "print-name": "echo test-package-2",
      });
      await runCLI("create package-3");
      await addScriptsToPackage("package-3", {
        "print-name": "echo test-package-3",
      });

      const output = await runCLI(`run print-name`);

      expect(output.combinedOutput).toMatchInlineSnapshot(`

 >  Lerna (powered by Nx)   Running target print-name for 3 project(s):

    - package-X
    - package-X
    - package-X

 

> package-X:print-name


> package-X@0.0.0 print-name
> echo test-package-X

test-package-X

> package-X:print-name


> package-X@0.0.0 print-name
> echo test-package-X

test-package-X

> package-X:print-name


> package-X@0.0.0 print-name
> echo test-package-X

test-package-X

 

 >  Lerna (powered by Nx)   Successfully ran target print-name for 3 projects


lerna notice cli v999.9.9-e2e.0

`);
    });
  });

  describe("--ci", () => {
    it("should log that ci is enabled", async () => {
      createEmptyDirectoryForWorkspace("lerna-run-test");
      await runCLI("init");

      const output = await runCLI(`run print-name --ci`);

      expect(output.combinedOutput).toContain("lerna info ci enabled");
    });
  });
});
