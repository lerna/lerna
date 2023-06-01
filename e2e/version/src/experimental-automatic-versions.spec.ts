import { Fixture, normalizeEnvironment } from "@lerna/e2e-utils";

expect.addSnapshotSerializer({
  serialize(str: string) {
    return normalizeEnvironment(str)
      .replaceAll(/Author: .* <\w*@\w*\.\w*>/g, "Author: <author>")
      .replaceAll(/"author": ".* <\w*@\w*\.\w*>"/g, '"author": <author>')
      .replaceAll(/Date: .* [+-]\d{4}/g, "Date: <date>")
      .replaceAll(/commit [a-z0-9]{40}/g, "commit <hash>")
      .replaceAll(/index [a-z0-9]{7}\.\.[a-z0-9]{7} \d{6}/g, "index <hash>..<hash> <mode>");
  },
  test(val: string) {
    return val != null && typeof val === "string";
  },
});

describe("lerna-version-experimental-automatic-versions", () => {
  let fixture: Fixture;

  beforeEach(async () => {
    fixture = await Fixture.create({
      e2eRoot: process.env.E2E_ROOT,
      name: "lerna-version-experimental-automatic-versions",
      packageManager: "npm",
      initializeGit: true,
      lernaInit: true,
      installDependencies: true,
    });

    await fixture.lerna("create from-remote-1 -y");
    await fixture.lerna("create from-remote-2 -y");
    await fixture.lerna("create from-remote-3 -y");

    await fixture.createInitialGitCommit();
    await fixture.exec("git push origin test-main");
  });

  afterEach(() => fixture.destroy());

  describe("experimental automatic versions", () => {
    it("should not commit changes", async () => {
      await fixture.updatePackageVersion({ packagePath: "packages/from-remote-1", newVersion: "1.2.4" });
      await fixture.updatePackageVersion({ packagePath: "packages/from-remote-2", newVersion: "1.2.4" });
      await fixture.updatePackageVersion({ packagePath: "packages/from-remote-3", newVersion: "1.2.4" });
      await fixture.exec("git add .");
      await fixture.exec("git commit -m 'chore: set version to 1.2.4'");

      // publish packages at version 1.2.4, then reset the local changes.
      await fixture.lerna("publish from-package -y --registry http://localhost:4872");
      await fixture.exec("git reset --hard HEAD~1");

      await fixture.overrideLernaConfig({
        __experimentalAutomaticVersions: {
          referencePackage: "from-remote-1",
        },
      });
      await fixture.exec("git add .");
      await fixture.exec("git commit -m 'chore: override lerna config'");
      await fixture.exec("git push origin test-main");

      const result = await fixture.lerna("version patch --registry http://localhost:4872 -y", {
        allowNetworkRequests: true,
      });

      expect(result.combinedOutput).toMatchInlineSnapshot(`
        lerna notice cli v999.9.9-e2e.0
        lerna WARN versioning experimental automatic versions enabled
        lerna info current version 1.2.4
        lerna info Assuming all packages changed

        Changes:
         - from-remote-1: 0.0.0 => 1.2.5
         - from-remote-2: 0.0.0 => 1.2.5
         - from-remote-3: 0.0.0 => 1.2.5

        lerna info auto-confirmed 
        lerna info execute Skipping releases
        lerna info execute Skipping git commit
        lerna info git Pushing tags...
        lerna success version finished

      `);

      const gitCommit = await fixture.exec("git show");
      expect(gitCommit.combinedOutput).toMatchInlineSnapshot(`
        commit <hash>
        Author: <author>
        Date: <date>

            chore: override lerna config

        diff --git a/lerna.json b/lerna.json
        index <hash>..<hash> <mode>
        --- a/lerna.json
        +++ b/lerna.json
        @@ -1,4 +1,7 @@
         {
           "$schema": "node_modules/lerna/schemas/lerna-schema.json",
        -  "version": "0.0.0"
        +  "version": "0.0.0",
        +  "__experimentalAutomaticVersions": {
        +    "referencePackage": "from-remote-1"
        +  }
         }

      `);

      const tags = await fixture.exec("git tag --list --points-at HEAD");
      expect(tags.combinedOutput).toMatchInlineSnapshot(`
        v1.2.5

      `);
    });
  });
});
