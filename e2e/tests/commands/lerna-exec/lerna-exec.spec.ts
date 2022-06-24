import { existsSync } from "fs-extra";
import {
  addScriptsToPackage,
  createEmptyDirectoryForWorkspace,
  e2eRoot,
  removeWorkspace,
  runCLI,
  runLernaInit,
  runNpmInstall,
  tmpProjPath,
} from "../../../utils";

jest.setTimeout(60000);

expect.addSnapshotSerializer({
  serialize(str) {
    return str
      .replaceAll(/package-\d/g, "package-X")
      .replaceAll(/\d\.(\d{1,2})s/g, "X.Xs")
      .replaceAll(/Lerna-Profile-\d{8}T\d{6}\.json/g, "Lerna-Profile-XXXXXXXXTXXXXXX.json")
      .replaceAll(/\/private\/tmp\//g, "/tmp/")
      .replaceAll(e2eRoot, "/tmp/lerna-e2e")
      .replaceAll(/lerna info ci enabled\n/g, "");
  },
  test(val) {
    return val != null && typeof val === "string";
  },
});

describe("lerna exec", () => {
  beforeAll(async () => {
    createEmptyDirectoryForWorkspace("lerna-exec-test");
    await runLernaInit();
    await runNpmInstall();

    await runCLI("create package-1 -y");
    await addScriptsToPackage("package-1", {
      "print-name": "echo test-package-1",
    });
    await runCLI("create package-2 -y");
    await addScriptsToPackage("package-2", {
      "print-name": "echo test-package-2",
    });
    await runCLI("create package-3 -y");
    await addScriptsToPackage("package-3", {
      "print-name": "echo test-package-3",
    });
  });

  afterAll(() => removeWorkspace());

  it("should run command on all child packages", async () => {
    const output = await runCLI("exec --concurrency 1 npm run print-name");

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
      lerna success exec Executed command in 3 packages: "npm run print-name"

    `);
  });

  it("should run command on all child packages and suppress npm output", async () => {
    const output = await runCLI("exec npm run print-name -- --silent");

    expect(output.combinedOutput).toMatchInlineSnapshot(`
      test-package-X
      test-package-X
      test-package-X
      lerna notice cli v999.9.9-e2e.0
      lerna info Executing command in 3 packages: "npm run print-name --silent"
      lerna success exec Executed command in 3 packages: "npm run print-name --silent"

    `);
  });

  describe("--stream", () => {
    it("should run command on all child packages", async () => {
      const output = await runCLI("exec --stream npm run print-name -- --silent");

      expect(output.combinedOutput).toMatchInlineSnapshot(`
        package-X: test-package-X
        package-X: test-package-X
        package-X: test-package-X
        lerna notice cli v999.9.9-e2e.0
        lerna info Executing command in 3 packages: "npm run print-name --silent"
        lerna success exec Executed command in 3 packages: "npm run print-name --silent"

      `);
    });
  });

  describe("--parallel", () => {
    it("should run command on all child packages", async () => {
      const output = await runCLI("exec --parallel npm run print-name -- --silent");

      expect(output.combinedOutput).toMatchInlineSnapshot(`
        package-X: test-package-X
        package-X: test-package-X
        package-X: test-package-X
        lerna notice cli v999.9.9-e2e.0
        lerna info Executing command in 3 packages: "npm run print-name --silent"
        lerna success exec Executed command in 3 packages: "npm run print-name --silent"

      `);
    });
  });

  describe("--no-prefix", () => {
    describe("--parallel", () => {
      it("should run command on all child packages and suppress package name prefixes", async () => {
        const output = await runCLI("exec --no-prefix --parallel npm run print-name -- --silent");

        expect(output.combinedOutput).toMatchInlineSnapshot(`
          test-package-X
          test-package-X
          test-package-X
          lerna notice cli v999.9.9-e2e.0
          lerna info Executing command in 3 packages: "npm run print-name --silent"
          lerna success exec Executed command in 3 packages: "npm run print-name --silent"

        `);
      });
    });

    describe("--stream", () => {
      it("should run command on all child packages and suppress package name prefixes", async () => {
        const output = await runCLI("exec --no-prefix --stream npm run print-name -- --silent");

        expect(output.combinedOutput).toMatchInlineSnapshot(`
          test-package-X
          test-package-X
          test-package-X
          lerna notice cli v999.9.9-e2e.0
          lerna info Executing command in 3 packages: "npm run print-name --silent"
          lerna success exec Executed command in 3 packages: "npm run print-name --silent"

        `);
      });
    });
  });

  describe("--profile", () => {
    it("should run command on all child packages and create a performance profile", async () => {
      const output = await runCLI("exec --profile npm run print-name -- --silent");

      expect(output.combinedOutput).toMatchInlineSnapshot(`
        test-package-X
        test-package-X
        test-package-X
        lerna notice cli v999.9.9-e2e.0
        lerna info Executing command in 3 packages: "npm run print-name --silent"
        lerna info profiler Performance profile saved to /tmp/lerna-e2e/lerna-exec-test/Lerna-Profile-XXXXXXXXTXXXXXX.json
        lerna success exec Executed command in 3 packages: "npm run print-name --silent"

      `);

      const lernaProfileSavedOutputLine = output.combinedOutput.split("\n")[5];

      const lernaProfileFileName = lernaProfileSavedOutputLine.split("lerna-exec-test/")[1];

      expect(existsSync(tmpProjPath(lernaProfileFileName))).toBe(true);
    });
  });

  describe("--profile --profile-location", () => {
    it("should run command on all child packages and create a performance profile at provided location", async () => {
      const output = await runCLI(
        `exec --profile --profile-location=profiles npm run print-name -- --silent`
      );

      expect(output.combinedOutput).toMatchInlineSnapshot(`
        test-package-X
        test-package-X
        test-package-X
        lerna notice cli v999.9.9-e2e.0
        lerna info Executing command in 3 packages: "npm run print-name --silent"
        lerna info profiler Performance profile saved to /tmp/lerna-e2e/lerna-exec-test/profiles/Lerna-Profile-XXXXXXXXTXXXXXX.json
        lerna success exec Executed command in 3 packages: "npm run print-name --silent"

      `);

      const lernaProfileSavedOutputLine = output.combinedOutput.split("\n")[5];

      const lernaProfileFileName = lernaProfileSavedOutputLine.split("lerna-exec-test/")[1];

      expect(existsSync(tmpProjPath(lernaProfileFileName))).toBe(true);
    });
  });
});

describe("lerna exec --no-bail", () => {
  beforeAll(async () => {
    createEmptyDirectoryForWorkspace("lerna-exec-test");
    await runLernaInit();
    await runNpmInstall();

    await runCLI("create package-1 -y");
    await addScriptsToPackage("package-1", {
      "print-name": "echo test-package-1",
    });
    await runCLI("create package-2 -y");
    await addScriptsToPackage("package-2", {
      "print-name": "echo test-package-2",
    });
    await runCLI("create package-3 -y");
    await addScriptsToPackage("package-3", {
      "print-name": "exit 100",
    });
  });

  afterAll(() => removeWorkspace());

  it("should run command on all child packages", async () => {
    await expect(runCLI("exec --no-bail npm run print-name -- --silent")).rejects
      .toThrowErrorMatchingInlineSnapshot(`
            Command failed: npx --offline --no lerna exec --no-bail npm run print-name -- --silent
            lerna notice cli v999.9.9-e2e.0
            lerna info Executing command in 3 packages: "npm run print-name --silent"
            lerna ERR! Received non-zero exit code 100 during execution
            lerna success exec Executed command in 3 packages: "npm run print-name --silent"

          `);
  });
});
