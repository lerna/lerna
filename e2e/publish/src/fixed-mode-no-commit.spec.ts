import { Fixture, normalizeEnvironment } from "@lerna/e2e-utils";

expect.addSnapshotSerializer({
  serialize(str: string) {
    return normalizeEnvironment(str)
      .replaceAll(/[a-z0-9]{40}/g, "<shasum>")
      .replaceAll(/sha512-[a-zA-Z0-9+\-/]{13}\[\.\.\.\][a-zA-Z0-9+\-/]{13}==/g, "<integrity>")
      .replaceAll(/\d{3}B/g, "<file size>")
      .replaceAll(/\d{3} B/g, "<package size>");
  },
  test(val: string) {
    return val != null && typeof val === "string";
  },
});

describe("lerna-publish-fixed-mode-no-commit", () => {
  let fixture: Fixture;

  beforeEach(async () => {
    fixture = await Fixture.create({
      e2eRoot: process.env.E2E_ROOT,
      name: "lerna-publish-fixed-mode-no-commit",
      packageManager: "npm",
      initializeGit: true,
      runLernaInit: true,
      installDependencies: true,
    });

    await fixture.lerna("create from-remote-1 -y");
    await fixture.lerna("create from-remote-2 -y");
    await fixture.lerna("create from-remote-3 -y");
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

    await fixture.createInitialGitCommit();
    await fixture.exec("git push origin test-main");

    await fixture.exec(`npm unpublish --force from-remote-1 --registry=http://localhost:4872`, {
      silenceError: true,
    });
    await fixture.exec(`npm unpublish --force from-remote-2 --registry=http://localhost:4872`, {
      silenceError: true,
    });
    await fixture.exec(`npm unpublish --force from-remote-3 --registry=http://localhost:4872`, {
      silenceError: true,
    });
  });

  // afterEach(() => fixture.destroy());

  it("publishes from-git", async () => {
    await fixture.updatePackageVersion({ packagePath: "packages/from-remote-1", newVersion: "1.2.4" });
    await fixture.updatePackageVersion({ packagePath: "packages/from-remote-2", newVersion: "1.2.4" });
    await fixture.updatePackageVersion({ packagePath: "packages/from-remote-3", newVersion: "1.2.4" });
    await fixture.exec("git add .");
    await fixture.exec("git commit -m 'chore: set version to 1.2.4'");

    // publish packages at version 1.2.4, then reset the local changes.
    await fixture.lerna("publish from-package -y --registry http://localhost:4872");
    await fixture.exec("git reset --hard HEAD~1");

    const versionResult = await fixture.lerna(
      "version patch --no-commit --registry http://localhost:4872 -y",
      {
        allowNetworkRequests: true,
      }
    );

    expect(versionResult.combinedOutput).toMatchInlineSnapshot(`
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

    const tags = await fixture.exec("git tag --list --points-at HEAD");
    expect(tags.combinedOutput).toMatchInlineSnapshot(`
        v1.2.5

      `);

    const result = await fixture.lerna(
      "publish from-git --registry http://localhost:4872 --concurrency 1 -y",
      {
        allowNetworkRequests: true,
      }
    );

    expect(result.combinedOutput).toMatchInlineSnapshot(`
      lerna notice cli v999.9.9-e2e.0

      Found 3 packages to publish:
       - from-remote-1 => 1.2.5
       - from-remote-2 => 1.2.5
       - from-remote-3 => 1.2.5

      lerna info auto-confirmed 
      lerna info publish Publishing packages to npm...
      lerna notice Skipping all user and access validation due to third-party registry
      lerna notice Make sure you're authenticated properly ¯\\_(ツ)_/¯
      lerna WARN ENOLICENSE Packages from-remote-1, from-remote-2, and from-remote-3 are missing a license.
      lerna WARN ENOLICENSE One way to fix this is to add a LICENSE.md file to the root of this repository.
      lerna WARN ENOLICENSE See https://choosealicense.com for additional guidance.
      lerna success published from-remote-1 1.2.5
      lerna notice 
      lerna notice 📦  from-remote-1@1.2.5
      lerna notice === Tarball Contents === 
      lerna notice <file size> lib/from-remote-1.js
      lerna notice <file size> package.json        
      lerna notice <file size> README.md           
      lerna notice === Tarball Details === 
      lerna notice name:          from-remote-1                           
      lerna notice version:       1.2.5                                   
      lerna notice filename:      from-remote-1-1.2.5.tgz                 
      lerna notice package size:  <package size>                                   
      lerna notice unpacked size: 1.1 kB                                  
      lerna notice shasum:        <shasum>
      lerna notice integrity:     <integrity>
      lerna notice total files:   3                                       
      lerna notice 
      lerna success published from-remote-2 1.2.5
      lerna notice 
      lerna notice 📦  from-remote-2@1.2.5
      lerna notice === Tarball Contents === 
      lerna notice <file size> lib/from-remote-2.js
      lerna notice <file size> package.json        
      lerna notice <file size> README.md           
      lerna notice === Tarball Details === 
      lerna notice name:          from-remote-2                           
      lerna notice version:       1.2.5                                   
      lerna notice filename:      from-remote-2-1.2.5.tgz                 
      lerna notice package size:  <package size>                                   
      lerna notice unpacked size: 1.1 kB                                  
      lerna notice shasum:        <shasum>
      lerna notice integrity:     <integrity>
      lerna notice total files:   3                                       
      lerna notice 
      lerna success published from-remote-3 1.2.5
      lerna notice 
      lerna notice 📦  from-remote-3@1.2.5
      lerna notice === Tarball Contents === 
      lerna notice <file size> lib/from-remote-3.js
      lerna notice <file size> package.json        
      lerna notice <file size> README.md           
      lerna notice === Tarball Details === 
      lerna notice name:          from-remote-3                           
      lerna notice version:       1.2.5                                   
      lerna notice filename:      from-remote-3-1.2.5.tgz                 
      lerna notice package size:  <package size>                                   
      lerna notice unpacked size: 1.1 kB                                  
      lerna notice shasum:        <shasum>
      lerna notice integrity:     <integrity>
      lerna notice total files:   3                                       
      lerna notice 
      Successfully published:
       - from-remote-1@1.2.5
       - from-remote-2@1.2.5
       - from-remote-3@1.2.5
      lerna success published 3 packages

    `);

    const versionResult2 = await fixture.lerna(
      "version minor --force-publish --no-commit --registry http://localhost:4872 -y",
      {
        allowNetworkRequests: true,
      }
    );
    expect(versionResult2.combinedOutput).toMatchInlineSnapshot(`
      lerna notice cli v999.9.9-e2e.0
      lerna info current version 1.2.5
      lerna WARN force-publish all packages
      lerna info Assuming all packages changed

      Changes:
       - from-remote-1: 1.2.5 => 1.3.0
       - from-remote-2: 1.2.5 => 1.3.0
       - from-remote-3: 1.2.5 => 1.3.0

      lerna info auto-confirmed 
      lerna info execute Skipping releases
      lerna info execute Skipping git commit
      lerna info git Pushing tags...
      lerna success version finished

    `);

    const tags2 = await fixture.exec("git tag --list --points-at HEAD");
    expect(tags2.combinedOutput).toMatchInlineSnapshot(`
      v1.2.5
      v1.3.0

    `);

    const result2 = await fixture.lerna(
      "publish from-git --registry http://localhost:4872 --concurrency 1 -y",
      {
        allowNetworkRequests: true,
      }
    );

    await fixture.exec(`npm unpublish --force from-remote-1@1.2.5 --registry=http://localhost:4872`);
    await fixture.exec(`npm unpublish --force from-remote-2@1.2.5 --registry=http://localhost:4872`);
    await fixture.exec(`npm unpublish --force from-remote-3@1.2.5 --registry=http://localhost:4872`);
    await fixture.exec(`npm unpublish --force from-remote-1@1.3.0 --registry=http://localhost:4872`);
    await fixture.exec(`npm unpublish --force from-remote-2@1.3.0 --registry=http://localhost:4872`);
    await fixture.exec(`npm unpublish --force from-remote-3@1.3.0 --registry=http://localhost:4872`);

    expect(result2.combinedOutput).toMatchInlineSnapshot(`
      lerna notice cli v999.9.9-e2e.0

      Found 3 packages to publish:
       - from-remote-1 => 1.3.0
       - from-remote-2 => 1.3.0
       - from-remote-3 => 1.3.0

      lerna info auto-confirmed 
      lerna info publish Publishing packages to npm...
      lerna notice Skipping all user and access validation due to third-party registry
      lerna notice Make sure you're authenticated properly ¯\\_(ツ)_/¯
      lerna WARN ENOLICENSE Packages from-remote-1, from-remote-2, and from-remote-3 are missing a license.
      lerna WARN ENOLICENSE One way to fix this is to add a LICENSE.md file to the root of this repository.
      lerna WARN ENOLICENSE See https://choosealicense.com for additional guidance.
      lerna success published from-remote-1 1.3.0
      lerna notice 
      lerna notice 📦  from-remote-1@1.3.0
      lerna notice === Tarball Contents === 
      lerna notice <file size> lib/from-remote-1.js
      lerna notice <file size> package.json        
      lerna notice <file size> README.md           
      lerna notice === Tarball Details === 
      lerna notice name:          from-remote-1                           
      lerna notice version:       1.3.0                                   
      lerna notice filename:      from-remote-1-1.3.0.tgz                 
      lerna notice package size:  <package size>                                   
      lerna notice unpacked size: 1.1 kB                                  
      lerna notice shasum:        <shasum>
      lerna notice integrity:     <integrity>
      lerna notice total files:   3                                       
      lerna notice 
      lerna success published from-remote-2 1.3.0
      lerna notice 
      lerna notice 📦  from-remote-2@1.3.0
      lerna notice === Tarball Contents === 
      lerna notice <file size> lib/from-remote-2.js
      lerna notice <file size> package.json        
      lerna notice <file size> README.md           
      lerna notice === Tarball Details === 
      lerna notice name:          from-remote-2                           
      lerna notice version:       1.3.0                                   
      lerna notice filename:      from-remote-2-1.3.0.tgz                 
      lerna notice package size:  <package size>                                   
      lerna notice unpacked size: 1.1 kB                                  
      lerna notice shasum:        <shasum>
      lerna notice integrity:     <integrity>
      lerna notice total files:   3                                       
      lerna notice 
      lerna success published from-remote-3 1.3.0
      lerna notice 
      lerna notice 📦  from-remote-3@1.3.0
      lerna notice === Tarball Contents === 
      lerna notice <file size> lib/from-remote-3.js
      lerna notice <file size> package.json        
      lerna notice <file size> README.md           
      lerna notice === Tarball Details === 
      lerna notice name:          from-remote-3                           
      lerna notice version:       1.3.0                                   
      lerna notice filename:      from-remote-3-1.3.0.tgz                 
      lerna notice package size:  <package size>                                   
      lerna notice unpacked size: 1.1 kB                                  
      lerna notice shasum:        <shasum>
      lerna notice integrity:     <integrity>
      lerna notice total files:   3                                       
      lerna notice 
      Successfully published:
       - from-remote-1@1.3.0
       - from-remote-2@1.3.0
       - from-remote-3@1.3.0
      lerna success published 3 packages

    `);
  });
});
