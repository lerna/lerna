import { Fixture, normalizeCommandOutput, normalizeEnvironment } from "@lerna/e2e-utils";
import { existsSync } from "fs-extra";

expect.addSnapshotSerializer({
  serialize(str: string) {
    return normalizeCommandOutput(normalizeEnvironment(str));
  },
  test(val: string) {
    return val != null && typeof val === "string";
  },
});

describe("lerna-exec", () => {
  let fixture: Fixture;

  beforeAll(async () => {
    fixture = await Fixture.create({
      e2eRoot: process.env.E2E_ROOT,
      name: "lerna-exec",
      packageManager: "npm",
      initializeGit: true,
      runLernaInit: true,
      installDependencies: true,
      /**
       * Because lerna exec involves spawning further child processes, the tests would be too flaky
       * if we didn't force deterministic terminal output by appending stderr to stdout instead
       * of interleaving them.
       */
      forceDeterministicTerminalOutput: true,
    });

    await fixture.lerna("create package-1 -y");
    await fixture.addScriptsToPackage({
      packagePath: "packages/package-1",
      scripts: {
        "print-name": "echo test-package-1",
      },
    });
    await fixture.lerna("create package-2 -y");
    await fixture.addScriptsToPackage({
      packagePath: "packages/package-2",
      scripts: {
        "print-name": "echo test-package-2",
      },
    });
    await fixture.lerna("create package-3 -y");
    await fixture.addScriptsToPackage({
      packagePath: "packages/package-3",
      scripts: {
        "print-name": "echo test-package-3",
      },
    });
  });
  afterAll(() => fixture.destroy());

  it("should run command on all child packages", async () => {
    const output = await fixture.lerna("exec --concurrency 1 npm run print-name");

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
    const output = await fixture.lerna("exec npm run print-name -- --silent");

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
      const output = await fixture.lerna("exec --stream npm run print-name -- --silent");

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
      const output = await fixture.lerna("exec --parallel npm run print-name -- --silent");

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
        const output = await fixture.lerna("exec --no-prefix --parallel npm run print-name -- --silent");

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
        const output = await fixture.lerna("exec --no-prefix --stream npm run print-name -- --silent");

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
      const output = await fixture.lerna("exec --profile npm run print-name -- --silent");

      expect(output.combinedOutput).toMatchInlineSnapshot(`
        test-package-X
        test-package-X
        test-package-X
        lerna notice cli v999.9.9-e2e.0
        lerna info Executing command in 3 packages: "npm run print-name --silent"
        lerna info profiler Performance profile saved to /tmp/lerna-e2e/lerna-exec/lerna-workspace/Lerna-Profile-XXXXXXXXTXXXXXX.json
        lerna success exec Executed command in 3 packages: "npm run print-name --silent"

      `);

      const lernaProfileSavedOutputLine = output.combinedOutput.split("\n")[5];

      const lernaProfileFileName = lernaProfileSavedOutputLine.split("lerna-exec/lerna-workspace/")[1];

      expect(existsSync(fixture.getWorkspacePath(lernaProfileFileName))).toBe(true);
    });
  });

  describe("--profile --profile-location", () => {
    it("should run command on all child packages and create a performance profile at provided location", async () => {
      const output = await fixture.lerna(
        `exec --profile --profile-location=profiles npm run print-name -- --silent`
      );

      expect(output.combinedOutput).toMatchInlineSnapshot(`
        test-package-X
        test-package-X
        test-package-X
        lerna notice cli v999.9.9-e2e.0
        lerna info Executing command in 3 packages: "npm run print-name --silent"
        lerna info profiler Performance profile saved to /tmp/lerna-e2e/lerna-exec/lerna-workspace/profiles/Lerna-Profile-XXXXXXXXTXXXXXX.json
        lerna success exec Executed command in 3 packages: "npm run print-name --silent"

      `);

      const lernaProfileSavedOutputLine = output.combinedOutput.split("\n")[5];

      const lernaProfileFileName = lernaProfileSavedOutputLine.split("lerna-exec/lerna-workspace/")[1];

      expect(existsSync(fixture.getWorkspacePath(lernaProfileFileName))).toBe(true);
    });
  });
});

describe("lerna exec --no-bail", () => {
  let fixture: Fixture;

  beforeAll(async () => {
    fixture = await Fixture.create({
      e2eRoot: process.env.E2E_ROOT,
      name: "lerna-exec-no-bail",
      packageManager: "npm",
      initializeGit: true,
      runLernaInit: true,
      installDependencies: true,
      /**
       * Because lerna exec involves spawning further child processes, the tests would be too flaky
       * if we didn't force deterministic terminal output by appending stderr to stdout instead
       * of interleaving them.
       */
      forceDeterministicTerminalOutput: true,
    });

    await fixture.lerna("create package-1 -y");
    await fixture.addScriptsToPackage({
      packagePath: "packages/package-1",
      scripts: {
        "print-name": "echo test-package-1",
      },
    });
    await fixture.lerna("create package-2 -y");
    await fixture.addScriptsToPackage({
      packagePath: "packages/package-2",
      scripts: {
        "print-name": "echo test-package-2",
      },
    });
    await fixture.lerna("create package-3 -y");
    await fixture.addScriptsToPackage({
      packagePath: "packages/package-3",
      scripts: {
        "print-name": "exit 100",
      },
    });
  });
  afterAll(() => fixture.destroy());

  it("should run command on all child packages", async () => {
    await expect(fixture.lerna("exec --no-bail npm run print-name -- --silent")).rejects
      .toThrowErrorMatchingInlineSnapshot(`
            Command failed: npx --offline --no lerna exec --no-bail npm run print-name -- --silent
            lerna notice cli v999.9.9-e2e.0
            lerna info Executing command in 3 packages: "npm run print-name --silent"
            lerna ERR! Received non-zero exit code 100 during execution
            lerna success exec Executed command in 3 packages: "npm run print-name --silent"

          `);
  });
});
