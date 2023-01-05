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

describe("lerna-watch", () => {
  let fixture: Fixture;

  beforeEach(async () => {
    fixture = await Fixture.create({
      e2eRoot: process.env.E2E_ROOT,
      name: "lerna-watch",
      packageManager: "npm",
      initializeGit: true,
      runLernaInit: true,
      installDependencies: true,
    });

    await fixture.lerna("create package-a -y");
    await fixture.lerna("create package-b --dependencies package-a -y");
    await fixture.lerna("create package-c -y");
    await fixture.updateJson("packages/package-c/package.json", (json) => ({
      ...json,
      name: "@scope/package-c",
    }));

    await fixture.createInitialGitCommit();
  });

  afterAll(() => fixture.destroy());

  it("should watch all packages by default", async () => {
    const getWatchResult = await fixture.lernaWatch('-- "echo watch triggered"');

    await createFile(fixture.getWorkspacePath("packages/package-a/my-file.txt"));
    await wait(200);

    await createFile(fixture.getWorkspacePath("packages/package-b/my-file.txt"));
    await wait(200);

    await createFile(fixture.getWorkspacePath("packages/package-c/my-file.txt"));
    await wait(200);

    const output = await getWatchResult();

    expect(output.combinedOutput).toMatchInlineSnapshot(`
      lerna notice cli v999.9.9-e2e.0
      lerna verb rootPath /tmp/lerna-e2e/lerna-watch/lerna-workspace
      lerna info watch Executing command "echo watch triggered" on changes in 3 packages.

       >  NX   running with args: {"command":"echo watch triggered","projectNameEnvName":"LERNA_PACKAGE_NAME","fileChangesEnvName":"LERNA_FILE_CHANGES","includeDependentProjects":false,"projects":["package-a","package-b","@scope/package-c"],"verbose":true}


       >  NX   starting watch process


       >  NX   watch process waiting...


       >  NX   about to run commands with these environments: [{"LERNA_PACKAGE_NAME":"","LERNA_FILE_CHANGES":"packages/package-a/my-file.txt"}]

      watch triggered

       >  NX   running complete, processing the next batch


       >  NX   no more commands to process


       >  NX   about to run commands with these environments: [{"LERNA_PACKAGE_NAME":"","LERNA_FILE_CHANGES":"packages/package-b/my-file.txt"}]

      watch triggered

       >  NX   running complete, processing the next batch


       >  NX   no more commands to process


       >  NX   about to run commands with these environments: [{"LERNA_PACKAGE_NAME":"","LERNA_FILE_CHANGES":"packages/package-c/my-file.txt"}]

      watch triggered

       >  NX   running complete, processing the next batch


       >  NX   no more commands to process


    `);
  });

  describe("with --scope", () => {
    it("should watch only specified packages", async () => {
      const getWatchResult = await fixture.lernaWatch(
        '--scope="package-a" --scope="@scope/package-c" -- "echo watch triggered"'
      );

      await createFile(fixture.getWorkspacePath("packages/package-a/my-file.txt"));
      await wait(200);

      await createFile(fixture.getWorkspacePath("packages/package-b/my-file.txt"));
      await wait(200);

      await createFile(fixture.getWorkspacePath("packages/package-c/my-file.txt"));
      await wait(200);

      const output = await getWatchResult();

      expect(output.combinedOutput).toMatchInlineSnapshot(`
        lerna notice cli v999.9.9-e2e.0
        lerna verb rootPath /tmp/lerna-e2e/lerna-watch/lerna-workspace
        lerna notice filter including ["package-a","@scope/package-c"]
        lerna info filter [ 'package-a', '@scope/package-c' ]
        lerna info watch Executing command "echo watch triggered" on changes in 2 packages.

         >  NX   running with args: {"command":"echo watch triggered","projectNameEnvName":"LERNA_PACKAGE_NAME","fileChangesEnvName":"LERNA_FILE_CHANGES","includeDependentProjects":false,"projects":["package-a","@scope/package-c"],"verbose":true}


         >  NX   starting watch process


         >  NX   watch process waiting...


         >  NX   about to run commands with these environments: [{"LERNA_PACKAGE_NAME":"","LERNA_FILE_CHANGES":"packages/package-a/my-file.txt"}]

        watch triggered

         >  NX   running complete, processing the next batch


         >  NX   no more commands to process


         >  NX   about to run commands with these environments: [{"LERNA_PACKAGE_NAME":"","LERNA_FILE_CHANGES":"packages/package-c/my-file.txt"}]

        watch triggered

         >  NX   running complete, processing the next batch


         >  NX   no more commands to process


      `);
    });
    describe("and --include-dependencies", () => {
      it("should watch one package and its dependencies", async () => {
        const getWatchResult = await fixture.lernaWatch(
          '--scope="package-b" --include-dependencies -- "echo watch triggered"'
        );

        await createFile(fixture.getWorkspacePath("packages/package-a/my-file.txt"));
        await wait(200);

        await createFile(fixture.getWorkspacePath("packages/package-b/my-file.txt"));
        await wait(200);

        await createFile(fixture.getWorkspacePath("packages/package-c/my-file.txt"));
        await wait(200);

        const output = await getWatchResult();

        expect(output.combinedOutput).toMatchInlineSnapshot(`
          lerna notice cli v999.9.9-e2e.0
          lerna verb rootPath /tmp/lerna-e2e/lerna-watch/lerna-workspace
          lerna notice filter including "package-b"
          lerna notice filter including dependencies
          lerna info filter [ 'package-b' ]
          lerna info watch Executing command "echo watch triggered" on changes in 2 packages.

           >  NX   running with args: {"command":"echo watch triggered","projectNameEnvName":"LERNA_PACKAGE_NAME","fileChangesEnvName":"LERNA_FILE_CHANGES","includeDependentProjects":false,"projects":["package-b","package-a"],"verbose":true}


           >  NX   starting watch process


           >  NX   watch process waiting...


           >  NX   about to run commands with these environments: [{"LERNA_PACKAGE_NAME":"","LERNA_FILE_CHANGES":"packages/package-a/my-file.txt"}]

          watch triggered

           >  NX   running complete, processing the next batch


           >  NX   no more commands to process


           >  NX   about to run commands with these environments: [{"LERNA_PACKAGE_NAME":"","LERNA_FILE_CHANGES":"packages/package-b/my-file.txt"}]

          watch triggered

           >  NX   running complete, processing the next batch


           >  NX   no more commands to process


        `);
      });
    });
  });

  it("should replace package name and changed file names", async () => {
    const getWatchResult = await fixture.lernaWatch("-- echo \\$LERNA_PACKAGE_NAME: \\$LERNA_FILE_CHANGES");

    await createFile(fixture.getWorkspacePath("packages/package-a/my-file.txt"));
    await wait(200);

    await createFile(fixture.getWorkspacePath("packages/package-b/my-file.txt"));
    await wait(200);

    await createFile(fixture.getWorkspacePath("packages/package-c/my-file.txt"));
    await wait(200);

    const output = await getWatchResult();

    expect(output.combinedOutput).toMatchInlineSnapshot(`
      lerna notice cli v999.9.9-e2e.0
      lerna verb rootPath /tmp/lerna-e2e/lerna-watch/lerna-workspace
      lerna info watch Executing command "echo $LERNA_PACKAGE_NAME: $LERNA_FILE_CHANGES" on changes in 3 packages.

       >  NX   running with args: {"command":"echo $LERNA_PACKAGE_NAME: $LERNA_FILE_CHANGES","projectNameEnvName":"LERNA_PACKAGE_NAME","fileChangesEnvName":"LERNA_FILE_CHANGES","includeDependentProjects":false,"projects":["package-a","package-b","@scope/package-c"],"verbose":true}


       >  NX   starting watch process


       >  NX   watch process waiting...


       >  NX   about to run commands with these environments: [{"LERNA_PACKAGE_NAME":"package-a","LERNA_FILE_CHANGES":"packages/package-a/my-file.txt"}]

      package-a: packages/package-a/my-file.txt

       >  NX   running complete, processing the next batch


       >  NX   no more commands to process


       >  NX   about to run commands with these environments: [{"LERNA_PACKAGE_NAME":"package-b","LERNA_FILE_CHANGES":"packages/package-b/my-file.txt"}]

      package-b: packages/package-b/my-file.txt

       >  NX   running complete, processing the next batch


       >  NX   no more commands to process


       >  NX   about to run commands with these environments: [{"LERNA_PACKAGE_NAME":"@scope/package-c","LERNA_FILE_CHANGES":"packages/package-c/my-file.txt"}]

      @scope/package-c: packages/package-c/my-file.txt

       >  NX   running complete, processing the next batch


       >  NX   no more commands to process


    `);
  });
});
