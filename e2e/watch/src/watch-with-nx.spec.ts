import { Fixture, normalizeEnvironment, wait } from "@lerna/e2e-utils";
import { createFile } from "fs-extra";

expect.addSnapshotSerializer({
  serialize(str) {
    return normalizeEnvironment(str);
  },
  test(val) {
    return val != null && typeof val === "string";
  },
});

describe("lerna-watch-with-nx", () => {
  let fixture: Fixture;

  beforeEach(async () => {
    fixture = await Fixture.create({
      e2eRoot: process.env.E2E_ROOT,
      name: "lerna-watch-with-nx",
      packageManager: "npm",
      initializeGit: true,
      runLernaInit: true,
      installDependencies: true,
    });

    await fixture.lerna("create package-a -y");
    await fixture.lerna("create package-b --dependencies package-a -y");
    await fixture.updateJson("packages/package-b/package.json", (json) => ({
      ...json,
      name: "@unknown-scope/package-b",
    }));
    await fixture.lerna("create package-c -y");
    await fixture.updateJson("packages/package-c/package.json", (json) => ({
      ...json,
      name: "@scope/package-c",
    }));

    await fixture.addNxJsonToWorkspace();
    await fixture.updateJson("nx.json", (json) => ({
      ...json,
      npmScope: "scope",
    }));

    await fixture.createInitialGitCommit();
  });

  afterAll(() => fixture.destroy());

  it("should watch all packages by default, removing nx.json's 'npmScope' from package names", async () => {
    const getWatchResult = await fixture.lernaWatch("-- echo \\$LERNA_PACKAGE_NAME: \\$LERNA_FILE_CHANGES");

    await createFile(fixture.getWorkspacePath("packages/package-a/my-file.txt"));
    await wait(200);

    await createFile(fixture.getWorkspacePath("packages/package-b/my-file.txt"));
    await wait(200);

    await createFile(fixture.getWorkspacePath("packages/package-c/my-file.txt"));
    await wait(200);

    const output = await getWatchResult();

    // package-c will be printed without its scope since Nx automatically removes it when substituting $LERNA_PACKAGE_NAME
    expect(output.combinedOutput).toMatchInlineSnapshot(`
      lerna notice cli v999.9.9-e2e.0
      lerna verb rootPath /tmp/lerna-e2e/lerna-watch-with-nx/lerna-workspace
      lerna info watch Executing command "echo $LERNA_PACKAGE_NAME: $LERNA_FILE_CHANGES" on changes in 3 packages.

       >  NX   running with args: {"command":"echo $LERNA_PACKAGE_NAME: $LERNA_FILE_CHANGES","projectNameEnvName":"LERNA_PACKAGE_NAME","fileChangesEnvName":"LERNA_FILE_CHANGES","includeDependentProjects":false,"projects":["package-a","@unknown-scope/package-b","package-c"],"verbose":true}


       >  NX   starting watch process


       >  NX   watch process waiting...


       >  NX   about to run commands with these environments: [{"LERNA_PACKAGE_NAME":"package-a","LERNA_FILE_CHANGES":"packages/package-a/my-file.txt"}]

      package-a: packages/package-a/my-file.txt

       >  NX   running complete, processing the next batch


       >  NX   no more commands to process


       >  NX   about to run commands with these environments: [{"LERNA_PACKAGE_NAME":"@unknown-scope/package-b","LERNA_FILE_CHANGES":"packages/package-b/my-file.txt"}]

      @unknown-scope/package-b: packages/package-b/my-file.txt

       >  NX   running complete, processing the next batch


       >  NX   no more commands to process


       >  NX   about to run commands with these environments: [{"LERNA_PACKAGE_NAME":"package-c","LERNA_FILE_CHANGES":"packages/package-c/my-file.txt"}]

      package-c: packages/package-c/my-file.txt

       >  NX   running complete, processing the next batch


       >  NX   no more commands to process


    `);
  });
});
