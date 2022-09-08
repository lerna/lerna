import { Fixture } from "../../utils/fixture";
import { normalizeCommandOutput, normalizeEnvironment } from "../../utils/snapshot-serializer-utils";

expect.addSnapshotSerializer({
  serialize(str: string) {
    return normalizeCommandOutput(normalizeEnvironment(str))
      .replaceAll(/package-X\w/g, "package-X")
      .replaceAll(/lerna-run-pnpm-\d*\//g, "lerna-run-pnpm-XXXXXXXX/");
  },
  test(val: string) {
    return val != null && typeof val === "string";
  },
});

describe("lerna-run-nx", () => {
  let fixture: Fixture;

  beforeAll(async () => {
    fixture = await Fixture.create({
      name: "lerna-run",
      packageManager: "pnpm",
      initializeGit: true,
      runLernaInit: true,
      installDependencies: true,
      /**
       * Because lerna run involves spawning further child processes, the tests would be too flaky
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

    await fixture.lerna("create package-4 -y");
    await fixture.addScriptsToPackage({
      packagePath: "packages/package-4",
      scripts: {
        "print-name": "echo test-package-4",
      },
    });

    await fixture.lerna("create package-4a -y");
    await fixture.addScriptsToPackage({
      packagePath: "packages/package-4a",
      scripts: {
        "print-name": "echo test-package-4a",
      },
    });

    await fixture.lerna("create package-4b -y");
    await fixture.addScriptsToPackage({
      packagePath: "packages/package-4b",
      scripts: {
        "print-name": "echo test-package-4b",
      },
    });

    await fixture.lerna("create package-5 -y");
    await fixture.addScriptsToPackage({
      packagePath: "packages/package-5",
      scripts: {
        "print-name": "echo test-package-5",
      },
    });

    await fixture.lerna("create package-6 -y");
    await fixture.addScriptsToPackage({
      packagePath: "packages/package-6",
      scripts: {
        "print-name": "echo test-package-6",
      },
    });

    await fixture.lerna("create package-7 -y");
    await fixture.addScriptsToPackage({
      packagePath: "packages/package-7",
      scripts: {
        "print-name": "echo test-package-7",
      },
    });

    await fixture.lerna("create package-8 -y");
    await fixture.addScriptsToPackage({
      packagePath: "packages/package-8",
      scripts: {
        "print-name": "echo test-package-8",
      },
    });

    await fixture.lerna("create package-9 -y");
    await fixture.addScriptsToPackage({
      packagePath: "packages/package-9",
      scripts: {
        "print-name": "echo test-package-9",
      },
    });

    await fixture.lerna("create package-app -y");
    await fixture.addScriptsToPackage({
      packagePath: "packages/package-app",
      scripts: {
        "print-name": "echo test-package-app",
      },
    });

    await fixture.createInitialGitCommit();
    await fixture.exec("git push --set-upstream origin test-main");
    await fixture.lerna("version 1.0.0 -y");

    await fixture.addDependencyToPackage({
      packagePath: "packages/package-app",
      dependencyName: "package-1",
      version: "^1.0.0",
    });
    await fixture.addDependencyToPackage({
      packagePath: "packages/package-app",
      dependencyName: "package-2",
      version: "~1.0.0",
    });
    await fixture.addDependencyToPackage({
      packagePath: "packages/package-app",
      dependencyName: "package-3",
      version: "1.0.0",
    });
    await fixture.addDependencyToPackage({
      packagePath: "packages/package-app",
      dependencyName: "package-4",
      version: "workspace:^1.0.0",
    });
    await fixture.addDependencyToPackage({
      packagePath: "packages/package-4",
      dependencyName: "package-4a",
      version: "workspace:^1.0.0",
    });
    await fixture.addDependencyToPackage({
      packagePath: "packages/package-4",
      dependencyName: "package-4b",
      version: "workspace:*",
    });
    await fixture.addDependencyToPackage({
      packagePath: "packages/package-app",
      dependencyName: "package-5",
      version: "workspace:~1.0.0",
    });
    await fixture.addDependencyToPackage({
      packagePath: "packages/package-app",
      dependencyName: "package-6",
      version: "workspace:1.0.0",
    });
    await fixture.addDependencyToPackage({
      packagePath: "packages/package-app",
      dependencyName: "package-7",
      version: "workspace:*",
    });
    await fixture.addDependencyToPackage({
      packagePath: "packages/package-app",
      dependencyName: "package-8",
      version: "workspace:^",
    });
    await fixture.addDependencyToPackage({
      packagePath: "packages/package-app",
      dependencyName: "package-9",
      version: "workspace:~",
    });
  });
  afterAll(() => fixture.destroy());

  it("should run script on all child packages", async () => {
    const output = await fixture.lerna("run print-name");

    expect(output.combinedOutput).toMatchInlineSnapshot(`

 >  Lerna (powered by Nx)   Running target print-name for 12 project(s):

    - package-X
    - package-X
    - package-X
    - package-X
    - package-X
    - package-X
    - package-X
    - package-X
    - package-X
    - package-X
    - package-X
    - package-app

 

> package-X:print-name


> package-X@1.0.0 print-name /tmp/lerna-e2e/lerna-run-pnpm-XXXXXXXX/lerna-workspace/packages/package-X
> echo test-package-X

test-package-X

> package-X:print-name


> package-X@1.0.0 print-name /tmp/lerna-e2e/lerna-run-pnpm-XXXXXXXX/lerna-workspace/packages/package-X
> echo test-package-X

test-package-X

> package-X:print-name


> package-X@1.0.0 print-name /tmp/lerna-e2e/lerna-run-pnpm-XXXXXXXX/lerna-workspace/packages/package-X
> echo test-package-X

test-package-X

> package-X:print-name


> package-X@1.0.0 print-name /tmp/lerna-e2e/lerna-run-pnpm-XXXXXXXX/lerna-workspace/packages/package-X
> echo test-package-X

test-package-X

> package-X:print-name


> package-X@1.0.0 print-name /tmp/lerna-e2e/lerna-run-pnpm-XXXXXXXX/lerna-workspace/packages/package-X
> echo test-package-X

test-package-X

> package-X:print-name


> package-X@1.0.0 print-name /tmp/lerna-e2e/lerna-run-pnpm-XXXXXXXX/lerna-workspace/packages/package-X
> echo test-package-X

test-package-X

> package-X:print-name


> package-X@1.0.0 print-name /tmp/lerna-e2e/lerna-run-pnpm-XXXXXXXX/lerna-workspace/packages/package-X
> echo test-package-X

test-package-X

> package-X:print-name


> package-X@1.0.0 print-name /tmp/lerna-e2e/lerna-run-pnpm-XXXXXXXX/lerna-workspace/packages/package-X
> echo test-package-X

test-package-X

> package-X:print-name


> package-X@1.0.0 print-name /tmp/lerna-e2e/lerna-run-pnpm-XXXXXXXX/lerna-workspace/packages/package-X
> echo test-package-X

test-package-X

> package-X:print-name


> package-X@1.0.0 print-name /tmp/lerna-e2e/lerna-run-pnpm-XXXXXXXX/lerna-workspace/packages/package-X
> echo test-package-X

test-package-X

> package-X:print-name


> package-X@1.0.0 print-name /tmp/lerna-e2e/lerna-run-pnpm-XXXXXXXX/lerna-workspace/packages/package-X
> echo test-package-X

test-package-X

> package-app:print-name


> package-app@1.0.0 print-name /tmp/lerna-e2e/lerna-run-pnpm-XXXXXXXX/lerna-workspace/packages/package-app
> echo test-package-app

test-package-app

 

 >  Lerna (powered by Nx)   Successfully ran target print-name for 12 projects


lerna notice cli v999.9.9-e2e.0

`);
  });
});
