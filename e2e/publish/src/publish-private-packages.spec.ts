import { Fixture, normalizeCommitSHAs, normalizeEnvironment } from "@lerna/e2e-utils";

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomVersion = () => `${randomInt(10, 89)}.${randomInt(10, 89)}.${randomInt(10, 89)}`;

expect.addSnapshotSerializer({
  serialize(str: string) {
    return normalizeCommitSHAs(normalizeEnvironment(str))
      .replaceAll(/integrity:\s*.*/g, "integrity: XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX")
      .replaceAll(/\d*B package\.json/g, "XXXB package.json")
      .replaceAll(/size:\s*\d*\s?B/g, "size: XXXB")
      .replaceAll(/\d*\.\d*\s?kB/g, "XXX.XXX kb")
      .replaceAll(/test-\d/g, "test-X");
  },
  test(val: string) {
    return val != null && typeof val === "string";
  },
});

describe("lerna-publish-private", () => {
  let fixture: Fixture;

  beforeEach(async () => {
    fixture = await Fixture.create({
      e2eRoot: process.env.E2E_ROOT,
      name: "lerna-publish",
      packageManager: "npm",
      initializeGit: true,
      runLernaInit: true,
      installDependencies: true,
    });
  });
  afterEach(() => fixture.destroy());

  describe("from-git", () => {
    it("should not publish private packages by default", async () => {
      await fixture.lerna("create test-1 --private -y");

      await fixture.createInitialGitCommit();
      await fixture.exec("git push origin test-main");

      const version = randomVersion();
      await fixture.lerna(`version ${version} -y`);

      const output = await fixture.lerna("publish from-git --registry=http://localhost:4872 -y");

      const replaceVersion = (str: string) => str.replaceAll(version, "XX.XX.XX");

      expect(replaceVersion(output.combinedOutput)).toMatchInlineSnapshot(`
        lerna notice cli v999.9.9-e2e.0
        lerna success No changed packages to publish 

      `);
    });

    describe("--include-private", () => {
      it("without args should throw", async () => {
        await fixture.lerna("create test-1 --private -y");

        await fixture.createInitialGitCommit();
        await fixture.exec("git push origin test-main");

        const version = randomVersion();
        await fixture.lerna(`version ${version} -y`);

        const output = await fixture.lerna(
          "publish from-git --include-private --registry=http://localhost:4872 -y",
          { silenceError: true }
        );

        expect(output.combinedOutput).toMatchInlineSnapshot(`
          lerna notice cli v999.9.9-e2e.0
          lerna ERR! EINCLPRIV Must specify at least one private package to include with --include-private.

        `);
      });

      it("should publish only specified private package and public packages", async () => {
        await fixture.lerna("create test-1 --private -y");
        await fixture.lerna("create test-2 --private -y");
        await fixture.lerna("create test-3 -y");
        await fixture.lerna("create test-4 --private -y");

        await fixture.createInitialGitCommit();
        await fixture.exec("git push origin test-main");

        const version = randomVersion();
        await fixture.lerna(`version ${version} -y`);

        const output = await fixture.lerna(
          "publish from-git --include-private test-1 test-2 --registry=http://localhost:4872 -y"
        );
        const unpublish = async (packageName: string) => {
          const unpublishOutput = await fixture.exec(
            `npm unpublish ${packageName}@${version} --force --registry=http://localhost:4872`
          );
          expect(replaceVersion(unpublishOutput.combinedOutput)).toContain(`${packageName}@XX.XX.XX`);
        };

        const replaceVersion = (str: string) => str.replaceAll(version, "XX.XX.XX");

        expect(replaceVersion(output.combinedOutput)).toMatchInlineSnapshot(`
          lerna notice cli v999.9.9-e2e.0
          lerna info publish Including private packages ["test-X","test-X"]

          Found 3 packages to publish:
           - test-X => XX.XX.XX (private!)
           - test-X => XX.XX.XX (private!)
           - test-X => XX.XX.XX

          lerna info auto-confirmed 
          lerna info publish Publishing packages to npm...
          lerna notice Skipping all user and access validation due to third-party registry
          lerna notice Make sure you're authenticated properly ¯\\_(ツ)_/¯
          lerna WARN ENOLICENSE Packages test-X, test-X, and test-X are missing a license.
          lerna WARN ENOLICENSE One way to fix this is to add a LICENSE.md file to the root of this repository.
          lerna WARN ENOLICENSE See https://choosealicense.com for additional guidance.
          lerna success published test-X XX.XX.XX
          lerna notice 
          lerna notice 📦  test-X@XX.XX.XX
          lerna notice === Tarball Contents === 
          lerna notice 90B  lib/test-X.js
          lerna notice XXXB package.json 
          lerna notice 110B README.md    
          lerna notice === Tarball Details === 
          lerna notice name:          test-X                                  
          lerna notice version:       XX.XX.XX                                
          lerna notice filename:      test-X-XX.XX.XX.tgz                     
          lerna notice package size: XXXB                                   
          lerna notice unpacked size: XXX.XXX kb                                  
          lerna notice shasum:        {FULL_COMMIT_SHA}
          lerna notice integrity: XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
          lerna notice total files:   3                                       
          lerna notice 
          lerna success published test-X XX.XX.XX
          lerna notice 
          lerna notice 📦  test-X@XX.XX.XX
          lerna notice === Tarball Contents === 
          lerna notice 90B  lib/test-X.js
          lerna notice XXXB package.json 
          lerna notice 110B README.md    
          lerna notice === Tarball Details === 
          lerna notice name:          test-X                                  
          lerna notice version:       XX.XX.XX                                
          lerna notice filename:      test-X-XX.XX.XX.tgz                     
          lerna notice package size: XXXB                                   
          lerna notice unpacked size: XXX.XXX kb                                  
          lerna notice shasum:        {FULL_COMMIT_SHA}
          lerna notice integrity: XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
          lerna notice total files:   3                                       
          lerna notice 
          lerna success published test-X XX.XX.XX
          lerna notice 
          lerna notice 📦  test-X@XX.XX.XX
          lerna notice === Tarball Contents === 
          lerna notice 90B  lib/test-X.js
          lerna notice XXXB package.json 
          lerna notice 110B README.md    
          lerna notice === Tarball Details === 
          lerna notice name:          test-X                                  
          lerna notice version:       XX.XX.XX                                
          lerna notice filename:      test-X-XX.XX.XX.tgz                     
          lerna notice package size: XXXB                                   
          lerna notice unpacked size: XXX.XXX kb                                  
          lerna notice shasum:        {FULL_COMMIT_SHA}
          lerna notice integrity: XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
          lerna notice total files:   3                                       
          lerna notice 
          Successfully published:
           - test-X@XX.XX.XX
           - test-X@XX.XX.XX
           - test-X@XX.XX.XX
          lerna success published 3 packages

        `);

        unpublish("test-1");
        unpublish("test-2");
        unpublish("test-3");
      });

      it("should publish all private packages if provided '*'", async () => {
        await fixture.lerna("create test-1 --private -y");
        await fixture.lerna("create test-2 --private -y");
        await fixture.lerna("create test-3 -y");

        await fixture.createInitialGitCommit();
        await fixture.exec("git push origin test-main");

        const version = randomVersion();
        await fixture.lerna(`version ${version} -y`);

        const output = await fixture.lerna(
          'publish from-git --include-private "*" --registry=http://localhost:4872 -y'
        );
        const unpublish = async (packageName: string) => {
          const unpublishOutput = await fixture.exec(
            `npm unpublish ${packageName}@${version} --force --registry=http://localhost:4872`
          );
          expect(replaceVersion(unpublishOutput.combinedOutput)).toContain(`${packageName}@XX.XX.XX`);
        };

        const replaceVersion = (str: string) => str.replaceAll(version, "XX.XX.XX");

        expect(replaceVersion(output.combinedOutput)).toMatchInlineSnapshot(`
          lerna notice cli v999.9.9-e2e.0
          lerna info publish Including private packages ["*"]

          Found 3 packages to publish:
           - test-X => XX.XX.XX (private!)
           - test-X => XX.XX.XX (private!)
           - test-X => XX.XX.XX

          lerna info auto-confirmed 
          lerna info publish Publishing packages to npm...
          lerna notice Skipping all user and access validation due to third-party registry
          lerna notice Make sure you're authenticated properly ¯\\_(ツ)_/¯
          lerna WARN ENOLICENSE Packages test-X, test-X, and test-X are missing a license.
          lerna WARN ENOLICENSE One way to fix this is to add a LICENSE.md file to the root of this repository.
          lerna WARN ENOLICENSE See https://choosealicense.com for additional guidance.
          lerna success published test-X XX.XX.XX
          lerna notice 
          lerna notice 📦  test-X@XX.XX.XX
          lerna notice === Tarball Contents === 
          lerna notice 90B  lib/test-X.js
          lerna notice XXXB package.json 
          lerna notice 110B README.md    
          lerna notice === Tarball Details === 
          lerna notice name:          test-X                                  
          lerna notice version:       XX.XX.XX                                
          lerna notice filename:      test-X-XX.XX.XX.tgz                     
          lerna notice package size: XXXB                                   
          lerna notice unpacked size: XXX.XXX kb                                  
          lerna notice shasum:        {FULL_COMMIT_SHA}
          lerna notice integrity: XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
          lerna notice total files:   3                                       
          lerna notice 
          lerna success published test-X XX.XX.XX
          lerna notice 
          lerna notice 📦  test-X@XX.XX.XX
          lerna notice === Tarball Contents === 
          lerna notice 90B  lib/test-X.js
          lerna notice XXXB package.json 
          lerna notice 110B README.md    
          lerna notice === Tarball Details === 
          lerna notice name:          test-X                                  
          lerna notice version:       XX.XX.XX                                
          lerna notice filename:      test-X-XX.XX.XX.tgz                     
          lerna notice package size: XXXB                                   
          lerna notice unpacked size: XXX.XXX kb                                  
          lerna notice shasum:        {FULL_COMMIT_SHA}
          lerna notice integrity: XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
          lerna notice total files:   3                                       
          lerna notice 
          lerna success published test-X XX.XX.XX
          lerna notice 
          lerna notice 📦  test-X@XX.XX.XX
          lerna notice === Tarball Contents === 
          lerna notice 90B  lib/test-X.js
          lerna notice XXXB package.json 
          lerna notice 110B README.md    
          lerna notice === Tarball Details === 
          lerna notice name:          test-X                                  
          lerna notice version:       XX.XX.XX                                
          lerna notice filename:      test-X-XX.XX.XX.tgz                     
          lerna notice package size: XXXB                                   
          lerna notice unpacked size: XXX.XXX kb                                  
          lerna notice shasum:        {FULL_COMMIT_SHA}
          lerna notice integrity: XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
          lerna notice total files:   3                                       
          lerna notice 
          Successfully published:
           - test-X@XX.XX.XX
           - test-X@XX.XX.XX
           - test-X@XX.XX.XX
          lerna success published 3 packages

        `);

        unpublish("test-1");
        unpublish("test-2");
        unpublish("test-3");
      });
    });
  });

  describe("from-package", () => {
    it("should not publish private packages by default", async () => {
      await fixture.lerna("create test-1 --private -y");

      await fixture.createInitialGitCommit();
      await fixture.exec("git push origin test-main");

      const version = randomVersion();
      await fixture.lerna(`version ${version} -y`);

      const output = await fixture.lerna("publish from-package --registry=http://localhost:4872 -y");

      const replaceVersion = (str: string) => str.replaceAll(version, "XX.XX.XX");

      expect(replaceVersion(output.combinedOutput)).toMatchInlineSnapshot(`
        lerna notice cli v999.9.9-e2e.0
        lerna WARN Unable to determine published version, assuming "test-X" unpublished.
        lerna notice from-package No unpublished release found
        lerna success No changed packages to publish 

      `);
    });

    describe("--include-private", () => {
      it("should publish only specified private package and public packages", async () => {
        await fixture.lerna("create test-1 --private -y");
        await fixture.lerna("create test-2 --private -y");
        await fixture.lerna("create test-3 -y");
        await fixture.lerna("create test-4 --private -y");

        await fixture.createInitialGitCommit();
        await fixture.exec("git push origin test-main");

        const version = randomVersion();
        await fixture.lerna(`version ${version} -y`);

        const output = await fixture.lerna(
          "publish from-package --include-private test-1 test-2 --registry=http://localhost:4872 -y"
        );
        const unpublish = async (packageName: string) => {
          const unpublishOutput = await fixture.exec(
            `npm unpublish ${packageName}@${version} --force --registry=http://localhost:4872`
          );
          expect(replaceVersion(unpublishOutput.combinedOutput)).toContain(`${packageName}@XX.XX.XX`);
        };

        const replaceVersion = (str: string) => str.replaceAll(version, "XX.XX.XX");

        expect(replaceVersion(output.combinedOutput)).toMatchInlineSnapshot(`
          lerna notice cli v999.9.9-e2e.0
          lerna info publish Including private packages ["test-X","test-X"]
          lerna WARN Unable to determine published version, assuming "test-X" unpublished.
          lerna WARN Unable to determine published version, assuming "test-X" unpublished.
          lerna WARN Unable to determine published version, assuming "test-X" unpublished.
          lerna WARN Unable to determine published version, assuming "test-X" unpublished.

          Found 3 packages to publish:
           - test-X => XX.XX.XX (private!)
           - test-X => XX.XX.XX (private!)
           - test-X => XX.XX.XX

          lerna info auto-confirmed 
          lerna info publish Publishing packages to npm...
          lerna notice Skipping all user and access validation due to third-party registry
          lerna notice Make sure you're authenticated properly ¯\\_(ツ)_/¯
          lerna WARN ENOLICENSE Packages test-X, test-X, and test-X are missing a license.
          lerna WARN ENOLICENSE One way to fix this is to add a LICENSE.md file to the root of this repository.
          lerna WARN ENOLICENSE See https://choosealicense.com for additional guidance.
          lerna success published test-X XX.XX.XX
          lerna notice 
          lerna notice 📦  test-X@XX.XX.XX
          lerna notice === Tarball Contents === 
          lerna notice 90B  lib/test-X.js
          lerna notice XXXB package.json 
          lerna notice 110B README.md    
          lerna notice === Tarball Details === 
          lerna notice name:          test-X                                  
          lerna notice version:       XX.XX.XX                                
          lerna notice filename:      test-X-XX.XX.XX.tgz                     
          lerna notice package size: XXXB                                   
          lerna notice unpacked size: XXX.XXX kb                                  
          lerna notice shasum:        {FULL_COMMIT_SHA}
          lerna notice integrity: XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
          lerna notice total files:   3                                       
          lerna notice 
          lerna success published test-X XX.XX.XX
          lerna notice 
          lerna notice 📦  test-X@XX.XX.XX
          lerna notice === Tarball Contents === 
          lerna notice 90B  lib/test-X.js
          lerna notice XXXB package.json 
          lerna notice 110B README.md    
          lerna notice === Tarball Details === 
          lerna notice name:          test-X                                  
          lerna notice version:       XX.XX.XX                                
          lerna notice filename:      test-X-XX.XX.XX.tgz                     
          lerna notice package size: XXXB                                   
          lerna notice unpacked size: XXX.XXX kb                                  
          lerna notice shasum:        {FULL_COMMIT_SHA}
          lerna notice integrity: XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
          lerna notice total files:   3                                       
          lerna notice 
          lerna success published test-X XX.XX.XX
          lerna notice 
          lerna notice 📦  test-X@XX.XX.XX
          lerna notice === Tarball Contents === 
          lerna notice 90B  lib/test-X.js
          lerna notice XXXB package.json 
          lerna notice 110B README.md    
          lerna notice === Tarball Details === 
          lerna notice name:          test-X                                  
          lerna notice version:       XX.XX.XX                                
          lerna notice filename:      test-X-XX.XX.XX.tgz                     
          lerna notice package size: XXXB                                   
          lerna notice unpacked size: XXX.XXX kb                                  
          lerna notice shasum:        {FULL_COMMIT_SHA}
          lerna notice integrity: XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
          lerna notice total files:   3                                       
          lerna notice 
          Successfully published:
           - test-X@XX.XX.XX
           - test-X@XX.XX.XX
           - test-X@XX.XX.XX
          lerna success published 3 packages

        `);

        unpublish("test-1");
        unpublish("test-2");
        unpublish("test-3");
      });
    });
  });

  describe("canary", () => {
    it("should not publish private packages by default", async () => {
      await fixture.lerna("create test-canary --private -y");

      await fixture.createInitialGitCommit();
      await fixture.exec("git push origin test-main");

      const output = await fixture.lerna("publish --canary major --registry=http://localhost:4872 -y");

      expect(output.combinedOutput).toMatchInlineSnapshot(`
        lerna notice cli v999.9.9-e2e.0
        lerna info canary enabled
        lerna info Assuming all packages changed
        lerna success No changed packages to publish 

      `);
    });

    describe("--include-private", () => {
      it("should publish only specified private package and public packages", async () => {
        await fixture.lerna("create test-1 --private -y");
        await fixture.lerna("create test-2 --private -y");
        await fixture.lerna("create test-3 -y");
        await fixture.lerna("create test-4 --private -y");

        await fixture.createInitialGitCommit();
        await fixture.exec("git push origin test-main");

        const output = await fixture.lerna(
          "publish --canary major --include-private test-1 test-2 --registry=http://localhost:4872 -y"
        );
        const unpublish = async (packageName: string) => {
          const unpublishOutput = await fixture.exec(
            `npm unpublish ${packageName}@1.0.0-alpha.0 --force --registry=http://localhost:4872`
          );
          expect(replaceVersion(unpublishOutput.combinedOutput)).toContain(`${packageName}@XX.XX.XX`);
        };

        const replaceVersion = (str: string) => str.replaceAll("1.0.0", "XX.XX.XX");

        expect(replaceVersion(output.combinedOutput)).toMatchInlineSnapshot(`
          lerna notice cli v999.9.9-e2e.0
          lerna info publish Including private packages ["test-X","test-X"]
          lerna info canary enabled
          lerna info Assuming all packages changed

          Found 3 packages to publish:
           - test-X => XX.XX.XX-alpha.0+{SHORT_COMMIT_SHA} (private!)
           - test-X => XX.XX.XX-alpha.0+{SHORT_COMMIT_SHA} (private!)
           - test-X => XX.XX.XX-alpha.0+{SHORT_COMMIT_SHA}

          lerna info auto-confirmed 
          lerna info publish Publishing packages to npm...
          lerna notice Skipping all user and access validation due to third-party registry
          lerna notice Make sure you're authenticated properly ¯\\_(ツ)_/¯
          lerna WARN ENOLICENSE Packages test-X, test-X, and test-X are missing a license.
          lerna WARN ENOLICENSE One way to fix this is to add a LICENSE.md file to the root of this repository.
          lerna WARN ENOLICENSE See https://choosealicense.com for additional guidance.
          lerna success published test-X XX.XX.XX-alpha.0+{SHORT_COMMIT_SHA}
          lerna notice 
          lerna notice 📦  test-X@XX.XX.XX-alpha.0+{SHORT_COMMIT_SHA}
          lerna notice === Tarball Contents === 
          lerna notice 90B  lib/test-X.js
          lerna notice XXXB package.json 
          lerna notice 110B README.md    
          lerna notice === Tarball Details === 
          lerna notice name:          test-X                                  
          lerna notice version:       XX.XX.XX-alpha.0+{SHORT_COMMIT_SHA}                   
          lerna notice filename:      test-X-XX.XX.XX-alpha.0+{SHORT_COMMIT_SHA}.tgz        
          lerna notice package size: XXXB                                   
          lerna notice unpacked size: XXX.XXX kb                                  
          lerna notice shasum:        {FULL_COMMIT_SHA}
          lerna notice integrity: XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
          lerna notice total files:   3                                       
          lerna notice 
          lerna success published test-X XX.XX.XX-alpha.0+{SHORT_COMMIT_SHA}
          lerna notice 
          lerna notice 📦  test-X@XX.XX.XX-alpha.0+{SHORT_COMMIT_SHA}
          lerna notice === Tarball Contents === 
          lerna notice 90B  lib/test-X.js
          lerna notice XXXB package.json 
          lerna notice 110B README.md    
          lerna notice === Tarball Details === 
          lerna notice name:          test-X                                  
          lerna notice version:       XX.XX.XX-alpha.0+{SHORT_COMMIT_SHA}                   
          lerna notice filename:      test-X-XX.XX.XX-alpha.0+{SHORT_COMMIT_SHA}.tgz        
          lerna notice package size: XXXB                                   
          lerna notice unpacked size: XXX.XXX kb                                  
          lerna notice shasum:        {FULL_COMMIT_SHA}
          lerna notice integrity: XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
          lerna notice total files:   3                                       
          lerna notice 
          lerna success published test-X XX.XX.XX-alpha.0+{SHORT_COMMIT_SHA}
          lerna notice 
          lerna notice 📦  test-X@XX.XX.XX-alpha.0+{SHORT_COMMIT_SHA}
          lerna notice === Tarball Contents === 
          lerna notice 90B  lib/test-X.js
          lerna notice XXXB package.json 
          lerna notice 110B README.md    
          lerna notice === Tarball Details === 
          lerna notice name:          test-X                                  
          lerna notice version:       XX.XX.XX-alpha.0+{SHORT_COMMIT_SHA}                   
          lerna notice filename:      test-X-XX.XX.XX-alpha.0+{SHORT_COMMIT_SHA}.tgz        
          lerna notice package size: XXXB                                   
          lerna notice unpacked size: XXX.XXX kb                                  
          lerna notice shasum:        {FULL_COMMIT_SHA}
          lerna notice integrity: XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
          lerna notice total files:   3                                       
          lerna notice 
          Successfully published:
           - test-X@XX.XX.XX-alpha.0+{SHORT_COMMIT_SHA}
           - test-X@XX.XX.XX-alpha.0+{SHORT_COMMIT_SHA}
           - test-X@XX.XX.XX-alpha.0+{SHORT_COMMIT_SHA}
          lerna success published 3 packages

        `);

        unpublish("test-1");
        unpublish("test-2");
        unpublish("test-3");
      });
    });
  });
});
