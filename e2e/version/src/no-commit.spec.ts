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

describe("lerna-version-no-commit", () => {
  let fixture: Fixture;

  beforeEach(async () => {
    fixture = await Fixture.create({
      e2eRoot: process.env.E2E_ROOT,
      name: "lerna-version-no-commit",
      packageManager: "npm",
      initializeGit: true,
      runLernaInit: true,
      installDependencies: true,
    });

    await fixture.lerna("create from-remote-1 -y");
    await fixture.lerna("create from-remote-2 -y");
    await fixture.lerna("create from-remote-3 -y");

    await fixture.createInitialGitCommit();
    await fixture.exec("git push origin test-main");
  });

  afterEach(() => fixture.destroy());

  describe("in normal mode", () => {
    it("should not commit changes", async () => {
      await fixture.overrideLernaConfig({
        version: "1.1.2",
      });

      await fixture.exec("git add .");
      await fixture.exec("git commit -m 'chore: set version to 1.1.2'");
      await fixture.exec("git push origin test-main");

      const result = await fixture.lerna("version patch --no-commit -y");

      expect(result.combinedOutput).toMatchInlineSnapshot(`
        lerna notice cli v999.9.9-e2e.0
        lerna info current version 1.1.2
        lerna info Assuming all packages changed

        Changes:
         - from-remote-1: 0.0.0 => 1.1.3
         - from-remote-2: 0.0.0 => 1.1.3
         - from-remote-3: 0.0.0 => 1.1.3

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

            chore: set version to 1.1.2

        diff --git a/lerna.json b/lerna.json
        index <hash>..<hash> <mode>
        --- a/lerna.json
        +++ b/lerna.json
        @@ -1,7 +1,7 @@
         {
           "$schema": "node_modules/lerna/schemas/lerna-schema.json",
           "useWorkspaces": false,
        -  "version": "0.0.0",
        +  "version": "1.1.2",
           "packages": [
             "packages/*"
           ]

      `);

      const tags = await fixture.exec("git tag --list --points-at HEAD");
      expect(tags.combinedOutput).toMatchInlineSnapshot(`
        v1.1.3

      `);
    });
  });

  describe("in fixed mode", () => {
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
        version: "fixed",
        fixedVersionReferencePackage: "from-remote-1",
      });
      await fixture.exec("git add .");
      await fixture.exec("git commit -m 'chore: override lerna config'");
      await fixture.exec("git push origin test-main");

      const result = await fixture.lerna("version patch --no-commit --registry http://localhost:4872 -y", {
        allowNetworkRequests: true,
      });

      expect(result.combinedOutput).toMatchInlineSnapshot(`
        lerna notice cli v999.9.9-e2e.0
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
        @@ -1,8 +1,9 @@
         {
           "$schema": "node_modules/lerna/schemas/lerna-schema.json",
           "useWorkspaces": false,
        -  "version": "0.0.0",
        +  "version": "fixed",
           "packages": [
             "packages/*"
        -  ]
        +  ],
        +  "fixedVersionReferencePackage": "from-remote-1"
         }

      `);

      const tags = await fixture.exec("git tag --list --points-at HEAD");
      expect(tags.combinedOutput).toMatchInlineSnapshot(`
        v1.2.5

      `);
    });

    it("without package.json version numbers, should not commit changes", async () => {
      await fixture.updatePackageVersion({ packagePath: "packages/from-remote-1", newVersion: "1.2.4" });
      await fixture.updatePackageVersion({ packagePath: "packages/from-remote-2", newVersion: "1.2.4" });
      await fixture.updatePackageVersion({ packagePath: "packages/from-remote-3", newVersion: "1.2.4" });
      await fixture.exec("git add .");
      await fixture.exec("git commit -m 'chore: set version to 1.2.4'");

      // publish packages at version 1.2.4, then reset the local changes.
      await fixture.lerna("publish from-package -y --registry http://localhost:4872");
      await fixture.exec("git reset --hard HEAD~1");

      await fixture.overrideLernaConfig({
        version: "fixed",
        fixedVersionReferencePackage: "from-remote-1",
      });
      await fixture.updateJson("packages/from-remote-1/package.json", (json) => {
        delete json.version;
        return json;
      });
      await fixture.updateJson("packages/from-remote-2/package.json", (json) => {
        delete json.version;
        return json;
      });
      await fixture.updateJson("packages/from-remote-3/package.json", (json) => {
        delete json.version;
        return json;
      });

      await fixture.exec("git add .");
      await fixture.exec("git commit -m 'chore: override lerna config and remove version numbers'");
      await fixture.exec("git push origin test-main");

      const result = await fixture.lerna("version patch --no-commit --registry http://localhost:4872 -y", {
        allowNetworkRequests: true,
      });

      expect(result.combinedOutput).toMatchInlineSnapshot(`
        lerna notice cli v999.9.9-e2e.0
        lerna info current version 1.2.4
        lerna info Assuming all packages changed

        Changes:
         - from-remote-1: 1.2.4 => 1.2.5
         - from-remote-2: 1.2.4 => 1.2.5
         - from-remote-3: 1.2.4 => 1.2.5

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

            chore: override lerna config and remove version numbers

        diff --git a/lerna.json b/lerna.json
        index <hash>..<hash> <mode>
        --- a/lerna.json
        +++ b/lerna.json
        @@ -1,8 +1,9 @@
         {
           "$schema": "node_modules/lerna/schemas/lerna-schema.json",
           "useWorkspaces": false,
        -  "version": "0.0.0",
        +  "version": "fixed",
           "packages": [
             "packages/*"
        -  ]
        +  ],
        +  "fixedVersionReferencePackage": "from-remote-1"
         }
        diff --git a/packages/from-remote-1/package.json b/packages/from-remote-1/package.json
        index <hash>..<hash> <mode>
        --- a/packages/from-remote-1/package.json
        +++ b/packages/from-remote-1/package.json
        @@ -1,6 +1,5 @@
         {
           "name": "from-remote-1",
        -  "version": "0.0.0",
           "description": "Now I’m the model of a modern major general / The venerated Virginian veteran whose men are all / Lining up, to put me up on a pedestal / Writin’ letters to relatives / Embellishin’ my elegance and eloquence / But the elephant is in the room / The truth is in ya face when ya hear the British cannons go / BOOM",
           "keywords": [],
           "author": <author>,
        diff --git a/packages/from-remote-2/package.json b/packages/from-remote-2/package.json
        index <hash>..<hash> <mode>
        --- a/packages/from-remote-2/package.json
        +++ b/packages/from-remote-2/package.json
        @@ -1,6 +1,5 @@
         {
           "name": "from-remote-2",
        -  "version": "0.0.0",
           "description": "Now I’m the model of a modern major general / The venerated Virginian veteran whose men are all / Lining up, to put me up on a pedestal / Writin’ letters to relatives / Embellishin’ my elegance and eloquence / But the elephant is in the room / The truth is in ya face when ya hear the British cannons go / BOOM",
           "keywords": [],
           "author": <author>,
        diff --git a/packages/from-remote-3/package.json b/packages/from-remote-3/package.json
        index <hash>..<hash> <mode>
        --- a/packages/from-remote-3/package.json
        +++ b/packages/from-remote-3/package.json
        @@ -1,6 +1,5 @@
         {
           "name": "from-remote-3",
        -  "version": "0.0.0",
           "description": "Now I’m the model of a modern major general / The venerated Virginian veteran whose men are all / Lining up, to put me up on a pedestal / Writin’ letters to relatives / Embellishin’ my elegance and eloquence / But the elephant is in the room / The truth is in ya face when ya hear the British cannons go / BOOM",
           "keywords": [],
           "author": <author>,

      `);

      const tags = await fixture.exec("git tag --list --points-at HEAD");
      expect(tags.combinedOutput).toMatchInlineSnapshot(`
        v1.2.5

      `);
    });
  });
});
