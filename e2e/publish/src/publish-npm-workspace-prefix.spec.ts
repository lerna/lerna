import { Fixture, normalizeCommitSHAs, normalizeEnvironment } from "@lerna/e2e-utils";
import { writeJsonFile } from "@nrwl/devkit";

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomVersion = () => `${randomInt(10, 89)}.${randomInt(10, 89)}.${randomInt(10, 89)}`;

expect.addSnapshotSerializer({
  serialize(str: string) {
    return normalizeCommitSHAs(normalizeEnvironment(str))
      .replaceAll(/integrity:\s*.*/g, "integrity: XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX")
      .replaceAll(/\d*\.?\d+\s?[KMGTkmgt]?B/g, "XXXB");
  },
  test(val: string) {
    return val != null && typeof val === "string";
  },
});

describe("lerna-publish-workspace-prefix", () => {
  let fixture: Fixture;

  beforeEach(async () => {
    fixture = await Fixture.create({
      e2eRoot: process.env.E2E_ROOT,
      name: "lerna-publish-workspace-prefix",
      packageManager: "npm",
      initializeGit: true,
      runLernaInit: true,
      installDependencies: true,
    });
  });
  afterEach(() => fixture.destroy());

  describe("from-git", () => {
    it("should publish to the remote registry, removing workspace: prefix from dependencies", async () => {
      await fixture.lerna("create test-workspace-alias-star -y");
      await fixture.lerna("create test-workspace-alias-tilde -y");
      await fixture.lerna("create test-workspace-alias-caret -y");
      await fixture.lerna("create test-workspace-exact -y");
      await fixture.lerna("create test-workspace-compat -y");
      await fixture.lerna("create test-workspace-approx -y");
      await fixture.lerna("create test-no-workspace-prefix -y");
      await fixture.lerna("create test-main -y");

      await fixture.updateJson(`packages/test-main/package.json`, (json) => ({
        ...json,
        dependencies: {
          ...(json.dependencies as Record<string, string>),
          "test-workspace-alias-star": "workspace:*",
          "test-workspace-alias-tilde": "workspace:~",
          "test-workspace-alias-caret": "workspace:^",
          "test-workspace-exact": `workspace:0.0.0`,
          "test-workspace-compat": `workspace:^0.0.0`,
          "test-workspace-approx": `workspace:~0.0.0`,
          "test-no-workspace-prefix": `^0.0.0`,
        },
      }));

      const version = randomVersion();
      await fixture.createInitialGitCommit();
      await fixture.exec("git push origin test-main");

      await fixture.lerna(`version ${version} -y`);

      const output = await fixture.lerna(
        "publish from-git --registry=http://localhost:4872 -y --concurrency 1"
      );

      const replaceVersion = (str: string) => str.replaceAll(version, "XX.XX.XX");

      const unpublish = async (packageName: string) => {
        const unpublishOutput = await fixture.exec(
          `npm unpublish ${packageName}@${version} --force --registry=http://localhost:4872`
        );
        expect(replaceVersion(unpublishOutput.combinedOutput)).toContain(`${packageName}@XX.XX.XX`);
      };

      expect(replaceVersion(output.combinedOutput)).toMatchInlineSnapshot(`
        lerna notice cli v999.9.9-e2e.0

        Found 8 packages to publish:
         - test-main => XX.XX.XX
         - test-no-workspace-prefix => XX.XX.XX
         - test-workspace-alias-caret => XX.XX.XX
         - test-workspace-alias-star => XX.XX.XX
         - test-workspace-alias-tilde => XX.XX.XX
         - test-workspace-approx => XX.XX.XX
         - test-workspace-compat => XX.XX.XX
         - test-workspace-exact => XX.XX.XX

        lerna info auto-confirmed 
        lerna info publish Publishing packages to npm...
        lerna notice Skipping all user and access validation due to third-party registry
        lerna notice Make sure you're authenticated properly ¯\\_(ツ)_/¯
        lerna WARN ENOLICENSE Packages test-main, test-no-workspace-prefix, test-workspace-alias-caret, test-workspace-alias-star, test-workspace-alias-tilde, test-workspace-approx, test-workspace-compat, and test-workspace-exact are missing a license.
        lerna WARN ENOLICENSE One way to fix this is to add a LICENSE.md file to the root of this repository.
        lerna WARN ENOLICENSE See https://choosealicense.com for additional guidance.
        lerna success published test-no-workspace-prefix XX.XX.XX
        lerna notice 
        lerna notice 📦  test-no-workspace-prefix@XX.XX.XX
        lerna notice === Tarball Contents === 
        lerna notice XXXB lib/test-no-workspace-prefix.js
        lerna notice XXXB package.json                   
        lerna notice XXXB README.md                      
        lerna notice === Tarball Details === 
        lerna notice name:          test-no-workspace-prefix                
        lerna notice version:       XX.XX.XX                                
        lerna notice filename:      test-no-workspace-prefix-XX.XX.XX.tgz   
        lerna notice package size:  XXXB                                   
        lerna notice unpacked size: XXXB                                  
        lerna notice shasum:        {FULL_COMMIT_SHA}
        lerna notice integrity: XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
        lerna notice total files:   3                                       
        lerna notice 
        lerna success published test-workspace-alias-caret XX.XX.XX
        lerna notice 
        lerna notice 📦  test-workspace-alias-caret@XX.XX.XX
        lerna notice === Tarball Contents === 
        lerna notice XXXB lib/test-workspace-alias-caret.js
        lerna notice XXXB package.json                     
        lerna notice XXXB README.md                        
        lerna notice === Tarball Details === 
        lerna notice name:          test-workspace-alias-caret              
        lerna notice version:       XX.XX.XX                                
        lerna notice filename:      test-workspace-alias-caret-XX.XX.XX.tgz 
        lerna notice package size:  XXXB                                   
        lerna notice unpacked size: XXXB                                  
        lerna notice shasum:        {FULL_COMMIT_SHA}
        lerna notice integrity: XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
        lerna notice total files:   3                                       
        lerna notice 
        lerna success published test-workspace-alias-star XX.XX.XX
        lerna notice 
        lerna notice 📦  test-workspace-alias-star@XX.XX.XX
        lerna notice === Tarball Contents === 
        lerna notice XXXB lib/test-workspace-alias-star.js
        lerna notice XXXB package.json                    
        lerna notice XXXB README.md                       
        lerna notice === Tarball Details === 
        lerna notice name:          test-workspace-alias-star               
        lerna notice version:       XX.XX.XX                                
        lerna notice filename:      test-workspace-alias-star-XX.XX.XX.tgz  
        lerna notice package size:  XXXB                                   
        lerna notice unpacked size: XXXB                                  
        lerna notice shasum:        {FULL_COMMIT_SHA}
        lerna notice integrity: XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
        lerna notice total files:   3                                       
        lerna notice 
        lerna success published test-workspace-alias-tilde XX.XX.XX
        lerna notice 
        lerna notice 📦  test-workspace-alias-tilde@XX.XX.XX
        lerna notice === Tarball Contents === 
        lerna notice XXXB lib/test-workspace-alias-tilde.js
        lerna notice XXXB package.json                     
        lerna notice XXXB README.md                        
        lerna notice === Tarball Details === 
        lerna notice name:          test-workspace-alias-tilde              
        lerna notice version:       XX.XX.XX                                
        lerna notice filename:      test-workspace-alias-tilde-XX.XX.XX.tgz 
        lerna notice package size:  XXXB                                   
        lerna notice unpacked size: XXXB                                  
        lerna notice shasum:        {FULL_COMMIT_SHA}
        lerna notice integrity: XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
        lerna notice total files:   3                                       
        lerna notice 
        lerna success published test-workspace-approx XX.XX.XX
        lerna notice 
        lerna notice 📦  test-workspace-approx@XX.XX.XX
        lerna notice === Tarball Contents === 
        lerna notice XXXB lib/test-workspace-approx.js
        lerna notice XXXB package.json                
        lerna notice XXXB README.md                   
        lerna notice === Tarball Details === 
        lerna notice name:          test-workspace-approx                   
        lerna notice version:       XX.XX.XX                                
        lerna notice filename:      test-workspace-approx-XX.XX.XX.tgz      
        lerna notice package size:  XXXB                                   
        lerna notice unpacked size: XXXB                                  
        lerna notice shasum:        {FULL_COMMIT_SHA}
        lerna notice integrity: XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
        lerna notice total files:   3                                       
        lerna notice 
        lerna success published test-workspace-compat XX.XX.XX
        lerna notice 
        lerna notice 📦  test-workspace-compat@XX.XX.XX
        lerna notice === Tarball Contents === 
        lerna notice XXXB lib/test-workspace-compat.js
        lerna notice XXXB package.json                
        lerna notice XXXB README.md                   
        lerna notice === Tarball Details === 
        lerna notice name:          test-workspace-compat                   
        lerna notice version:       XX.XX.XX                                
        lerna notice filename:      test-workspace-compat-XX.XX.XX.tgz      
        lerna notice package size:  XXXB                                   
        lerna notice unpacked size: XXXB                                  
        lerna notice shasum:        {FULL_COMMIT_SHA}
        lerna notice integrity: XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
        lerna notice total files:   3                                       
        lerna notice 
        lerna success published test-workspace-exact XX.XX.XX
        lerna notice 
        lerna notice 📦  test-workspace-exact@XX.XX.XX
        lerna notice === Tarball Contents === 
        lerna notice XXXB lib/test-workspace-exact.js
        lerna notice XXXB package.json               
        lerna notice XXXB README.md                  
        lerna notice === Tarball Details === 
        lerna notice name:          test-workspace-exact                    
        lerna notice version:       XX.XX.XX                                
        lerna notice filename:      test-workspace-exact-XX.XX.XX.tgz       
        lerna notice package size:  XXXB                                   
        lerna notice unpacked size: XXXB                                  
        lerna notice shasum:        {FULL_COMMIT_SHA}
        lerna notice integrity: XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
        lerna notice total files:   3                                       
        lerna notice 
        lerna success published test-main XX.XX.XX
        lerna notice 
        lerna notice 📦  test-main@XX.XX.XX
        lerna notice === Tarball Contents === 
        lerna notice XXXB   lib/test-main.js
        lerna notice XXXB package.json    
        lerna notice XXXB  README.md       
        lerna notice === Tarball Details === 
        lerna notice name:          test-main                               
        lerna notice version:       XX.XX.XX                                
        lerna notice filename:      test-main-XX.XX.XX.tgz                  
        lerna notice package size:  XXXB                                   
        lerna notice unpacked size: XXXB                                  
        lerna notice shasum:        {FULL_COMMIT_SHA}
        lerna notice integrity: XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
        lerna notice total files:   3                                       
        lerna notice 
        Successfully published:
         - test-main@XX.XX.XX
         - test-no-workspace-prefix@XX.XX.XX
         - test-workspace-alias-caret@XX.XX.XX
         - test-workspace-alias-star@XX.XX.XX
         - test-workspace-alias-tilde@XX.XX.XX
         - test-workspace-approx@XX.XX.XX
         - test-workspace-compat@XX.XX.XX
         - test-workspace-exact@XX.XX.XX
        lerna success published 8 packages

      `);

      await fixture.exec("mkdir test-install-published-packages");
      writeJsonFile(fixture.getWorkspacePath("test-install-published-packages/package.json"), {
        name: "test-install-published-packages",
        dependencies: {
          "test-main": version,
        },
      });

      // ensure that the published packages can be installed
      // this verifies the validity of the updated package.json file that was published by `lerna publish`
      await fixture.exec(
        "npm --prefix ./test-install-published-packages install --registry=http://localhost:4872"
      );

      await unpublish("test-workspace-alias-star");
      await unpublish("test-workspace-alias-tilde");
      await unpublish("test-workspace-alias-caret");
      await unpublish("test-workspace-exact");
      await unpublish("test-workspace-compat");
      await unpublish("test-workspace-approx");
      await unpublish("test-no-workspace-prefix");
      await unpublish("test-main");
    });
  });
});
