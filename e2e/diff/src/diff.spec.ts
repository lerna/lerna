import { Fixture, normalizeEnvironment } from "@lerna/e2e-utils";

expect.addSnapshotSerializer({
  serialize(str) {
    return normalizeEnvironment(str.replaceAll(/index .{7}\.\..{7} \d{6}/g, "index XXXXXXX..XXXXXXX XXXXXX"));
  },
  test(val) {
    return val != null && typeof val === "string";
  },
});

describe("lerna-diff", () => {
  let fixture: Fixture;

  beforeAll(async () => {
    fixture = await Fixture.create({
      e2eRoot: process.env.E2E_ROOT,
      name: "lerna-diff",
      packageManager: "npm",
      initializeGit: true,
      runLernaInit: true,
      installDependencies: true,
    });

    await fixture.lerna("create package-a -y");
    await fixture.lerna("create package-b -y");

    await fixture.createInitialGitCommit();
  });
  afterAll(() => fixture.destroy());

  it("should output diff for all packages", async () => {
    await fixture.addDependencyToPackage({
      packagePath: "packages/package-a",
      dependencyName: "package-b",
      version: "0.0.0",
    });
    await fixture.addDependencyToPackage({
      packagePath: "packages/package-b",
      dependencyName: "package-a",
      version: "0.0.0",
    });

    const output = await fixture.lerna("diff");

    expect(output.combinedOutput).toMatchInlineSnapshot(`
      lerna notice cli v999.9.9-e2e.0
      diff --git a/packages/package-a/package.json b/packages/package-a/package.json
      index XXXXXXX..XXXXXXX XXXXXX
      --- a/packages/package-a/package.json
      +++ b/packages/package-a/package.json
      @@ -19,5 +19,8 @@
         },
         "scripts": {
           "test": "node ./__tests__/package-a.test.js"
      +  },
      +  "dependencies": {
      +    "package-b": "0.0.0"
         }
       }
      diff --git a/packages/package-b/package.json b/packages/package-b/package.json
      index XXXXXXX..XXXXXXX XXXXXX
      --- a/packages/package-b/package.json
      +++ b/packages/package-b/package.json
      @@ -19,5 +19,8 @@
         },
         "scripts": {
           "test": "node ./__tests__/package-b.test.js"
      +  },
      +  "dependencies": {
      +    "package-a": "0.0.0"
         }
       }

    `);
  });

  it("should output diff for single packages", async () => {
    await fixture.addDependencyToPackage({
      packagePath: "packages/package-a",
      dependencyName: "package-b",
      version: "0.0.0",
    });
    await fixture.addDependencyToPackage({
      packagePath: "packages/package-b",
      dependencyName: "package-a",
      version: "0.0.0",
    });

    const output = await fixture.lerna("diff package-a");

    expect(output.combinedOutput).toMatchInlineSnapshot(`
      lerna notice cli v999.9.9-e2e.0
      diff --git a/packages/package-a/package.json b/packages/package-a/package.json
      index XXXXXXX..XXXXXXX XXXXXX
      --- a/packages/package-a/package.json
      +++ b/packages/package-a/package.json
      @@ -19,5 +19,8 @@
         },
         "scripts": {
           "test": "node ./__tests__/package-a.test.js"
      +  },
      +  "dependencies": {
      +    "package-b": "0.0.0"
         }
       }

    `);
  });
});
