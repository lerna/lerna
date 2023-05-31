import { Fixture, normalizeCommitSHAs, normalizeEnvironment } from "@lerna/e2e-utils";
import { ensureDir, writeFile } from "fs-extra";
import globby from "globby";

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomVersion = () => `${randomInt(10, 89)}.${randomInt(10, 89)}.${randomInt(10, 89)}`;

expect.addSnapshotSerializer({
  serialize(str: string) {
    return normalizeCommitSHAs(normalizeEnvironment(str))
      .replaceAll(/integrity:\s*.*/g, "integrity: XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX")
      .replaceAll(/\d*B package\.json/g, "XXXB package.json")
      .replaceAll(/size:\s*\d*\s?B/g, "size: XXXB")
      .replaceAll(/\d*\.\d*\s?kB/g, "XXX.XXX kb")
      .replaceAll(/session\s\w{16}/g, "session XXXXXXXX")
      .replaceAll(/"vXX\.XX\.XX-0-g[a-f0-9]{7}"/g, '"vXX.XX.XX-0-gXXXXXXXX"');
  },
  test(val: string) {
    return val != null && typeof val === "string";
  },
});

describe("lerna-publish-custom-publish-directories", () => {
  let fixture: Fixture;

  beforeEach(async () => {
    fixture = await Fixture.create({
      e2eRoot: process.env.E2E_ROOT,
      name: "lerna-publish-custom-publish-directories",
      packageManager: "npm",
      initializeGit: true,
      lernaInit: true,
      installDependencies: true,
    });
  });
  afterEach(() => fixture.destroy());

  describe("from-git", () => {
    it("should publish to the remote registry, including appropriate assets", async () => {
      await fixture.lerna("create package-1 -y");
      await fixture.updateJson("packages/package-1/package.json", (pkg) => ({
        ...pkg,
        main: "main.js",
        scripts: { build: "cp ./lib/package-1.js ../../dist/packages/package-1/lib/main.js" },
        lerna: { publish: { directory: "../../dist/packages/package-1" } },
      }));

      await fixture.lerna("create package-2 -y");
      await fixture.updateJson("packages/package-2/package.json", (pkg) => ({
        ...pkg,
        main: "main.js",
        scripts: { build: "cp ./lib/package-2.js ../../dist/packages/package-2/lib/main.js" },
        lerna: {
          publish: {
            directory: "../../dist/packages/package-2",
            assets: [
              "package.json",
              "docs/*.md",
              {
                from: "static/images/*",
                to: "assets",
              },
              {
                from: "../../CONTRIBUTING.md",
                to: "./",
              },
            ],
          },
        },
      }));

      await fixture.lerna("create package-3 -y");

      await ensureDir(fixture.getWorkspacePath("packages/package-2/docs"));
      await writeFile(fixture.getWorkspacePath("packages/package-2/docs/doc-1.md"), "doc 1");
      await writeFile(fixture.getWorkspacePath("packages/package-2/docs/doc-2.md"), "doc 2");
      await writeFile(fixture.getWorkspacePath("packages/package-2/docs/not-a-doc.txt"), "not a doc");
      await ensureDir(fixture.getWorkspacePath("packages/package-2/static/images"));
      await writeFile(fixture.getWorkspacePath("packages/package-2/static/images/image-1.png"), "image 1");
      await writeFile(fixture.getWorkspacePath("packages/package-2/static/images/image-2.png"), "image 2");
      await writeFile(fixture.getWorkspacePath("CONTRIBUTING.md"), "Contributing guide");

      await fixture.exec("git checkout -b test-main");
      await writeFile(fixture.getWorkspacePath(".gitignore"), "node_modules\n.DS_Store\ndist");
      await fixture.exec("git add .gitignore");
      await fixture.exec("git add .");
      await fixture.exec('git commit -m "initial-commit"');
      await fixture.exec("git push origin test-main");

      await ensureDir(fixture.getWorkspacePath("dist/packages/package-1/lib"));
      await ensureDir(fixture.getWorkspacePath("dist/packages/package-2/lib"));
      await fixture.lerna("run build");

      const version = randomVersion();
      await fixture.lerna(`version ${version} -y`);

      const output = await fixture.lerna(
        "publish from-git --registry=http://localhost:4872 --loglevel verbose --concurrency 1 -y"
      );
      await fixture.exec(`npm unpublish --force package-1@${version} --registry=http://localhost:4872`);
      await fixture.exec(`npm unpublish --force package-2@${version} --registry=http://localhost:4872`);
      await fixture.exec(`npm unpublish --force package-3@${version} --registry=http://localhost:4872`);

      const replaceVersion = (str: string) => str.replaceAll(version, "XX.XX.XX");

      expect(replaceVersion(output.combinedOutput)).toMatchInlineSnapshot(`
        lerna notice cli v999.9.9-e2e.0
        lerna verb packageConfigs Resolving packages based on package.json "workspaces" configuration.
        lerna verb rootPath /tmp/lerna-e2e/lerna-publish-custom-publish-directories/lerna-workspace
        lerna verb session XXXXXXXX
        lerna verb user-agent lerna/999.9.9-e2e.0/node@v18.15.0+arm64 (darwin)
        lerna verb git-describe undefined => "vXX.XX.XX-0-gXXXXXXXX"

        Found 3 packages to publish:
         - package-1 => XX.XX.XX
         - package-2 => XX.XX.XX
         - package-3 => XX.XX.XX

        lerna info auto-confirmed 
        lerna info publish Publishing packages to npm...
        lerna notice Skipping all user and access validation due to third-party registry
        lerna notice Make sure you're authenticated properly ¯\\_(ツ)_/¯
        lerna WARN ENOLICENSE Packages package-1, package-2, and package-3 are missing a license.
        lerna WARN ENOLICENSE One way to fix this is to add a LICENSE.md file to the root of this repository.
        lerna WARN ENOLICENSE See https://choosealicense.com for additional guidance.
        lerna verb getCurrentSHA {FULL_COMMIT_SHA}
        lerna verb publish Expanded asset glob package.json into files ["package.json"]
        lerna verb publish Expanded asset glob README.md into files ["README.md"]
        lerna verb publish Copying asset /tmp/lerna-e2e/lerna-publish-custom-publish-directories/lerna-workspace/packages/package-1/package.json to /tmp/lerna-e2e/lerna-publish-custom-publish-directories/lerna-workspace/dist/packages/package-1/package.json
        lerna verb publish Copying asset /tmp/lerna-e2e/lerna-publish-custom-publish-directories/lerna-workspace/packages/package-1/README.md to /tmp/lerna-e2e/lerna-publish-custom-publish-directories/lerna-workspace/dist/packages/package-1/README.md
        lerna verb pack-directory dist/packages/package-1
        lerna verb packed dist/packages/package-1
        lerna verb publish Expanded asset glob package.json into files ["package.json"]
        lerna verb publish Expanded asset glob docs/*.md into files ["docs/doc-1.md","docs/doc-2.md"]
        lerna verb publish Expanded asset glob static/images/* into files ["static/images/image-1.png","static/images/image-2.png"]
        lerna verb publish Expanded asset glob ../../CONTRIBUTING.md into files ["../../CONTRIBUTING.md"]
        lerna verb publish Copying asset /tmp/lerna-e2e/lerna-publish-custom-publish-directories/lerna-workspace/packages/package-2/package.json to /tmp/lerna-e2e/lerna-publish-custom-publish-directories/lerna-workspace/dist/packages/package-2/package.json
        lerna verb publish Copying asset /tmp/lerna-e2e/lerna-publish-custom-publish-directories/lerna-workspace/packages/package-2/docs/doc-1.md to /tmp/lerna-e2e/lerna-publish-custom-publish-directories/lerna-workspace/dist/packages/package-2/docs/doc-1.md
        lerna verb publish Copying asset /tmp/lerna-e2e/lerna-publish-custom-publish-directories/lerna-workspace/packages/package-2/docs/doc-2.md to /tmp/lerna-e2e/lerna-publish-custom-publish-directories/lerna-workspace/dist/packages/package-2/docs/doc-2.md
        lerna verb publish Copying asset /tmp/lerna-e2e/lerna-publish-custom-publish-directories/lerna-workspace/packages/package-2/static/images/image-1.png to /tmp/lerna-e2e/lerna-publish-custom-publish-directories/lerna-workspace/dist/packages/package-2/assets/image-1.png
        lerna verb publish Copying asset /tmp/lerna-e2e/lerna-publish-custom-publish-directories/lerna-workspace/packages/package-2/static/images/image-2.png to /tmp/lerna-e2e/lerna-publish-custom-publish-directories/lerna-workspace/dist/packages/package-2/assets/image-2.png
        lerna verb publish Copying asset /tmp/lerna-e2e/lerna-publish-custom-publish-directories/lerna-workspace/CONTRIBUTING.md to /tmp/lerna-e2e/lerna-publish-custom-publish-directories/lerna-workspace/dist/packages/package-2/CONTRIBUTING.md
        lerna verb pack-directory dist/packages/package-2
        lerna verb packed dist/packages/package-2
        lerna verb pack-directory packages/package-3
        lerna verb packed packages/package-3
        lerna verb publish package-1
        lerna success published package-1 XX.XX.XX
        lerna notice 
        lerna notice 📦  package-1@XX.XX.XX
        lerna notice === Tarball Contents === 
        lerna notice 99B  lib/main.js 
        lerna notice XXXB package.json
        lerna notice 119B README.md   
        lerna notice === Tarball Details === 
        lerna notice name:          package-1                               
        lerna notice version:       XX.XX.XX                                
        lerna notice filename:      package-1-XX.XX.XX.tgz                  
        lerna notice package size: XXXB                                   
        lerna notice unpacked size: XXX.XXX kb                                  
        lerna notice shasum:        {FULL_COMMIT_SHA}
        lerna notice integrity: XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
        lerna notice total files:   3                                       
        lerna notice 
        lerna verb publish package-2
        lerna success published package-2 XX.XX.XX
        lerna notice 
        lerna notice 📦  package-2@XX.XX.XX
        lerna notice === Tarball Contents === 
        lerna notice 99B   lib/main.js 
        lerna notice 1.2kXXXB package.json
        lerna notice === Tarball Details === 
        lerna notice name:          package-2                               
        lerna notice version:       XX.XX.XX                                
        lerna notice filename:      package-2-XX.XX.XX.tgz                  
        lerna notice package size: XXXB                                   
        lerna notice unpacked size: XXX.XXX kb                                  
        lerna notice shasum:        {FULL_COMMIT_SHA}
        lerna notice integrity: XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
        lerna notice total files:   2                                       
        lerna notice 
        lerna verb publish package-3
        lerna success published package-3 XX.XX.XX
        lerna notice 
        lerna notice 📦  package-3@XX.XX.XX
        lerna notice === Tarball Contents === 
        lerna notice 99B  lib/package-3.js
        lerna notice XXXB package.json    
        lerna notice 119B README.md       
        lerna notice === Tarball Details === 
        lerna notice name:          package-3                               
        lerna notice version:       XX.XX.XX                                
        lerna notice filename:      package-3-XX.XX.XX.tgz                  
        lerna notice package size: XXXB                                   
        lerna notice unpacked size: XXX.XXX kb                                  
        lerna notice shasum:        {FULL_COMMIT_SHA}
        lerna notice integrity: XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
        lerna notice total files:   3                                       
        lerna notice 
        Successfully published:
         - package-1@XX.XX.XX
         - package-2@XX.XX.XX
         - package-3@XX.XX.XX
        lerna success published 3 packages

      `);

      const files = await globby("**/*", {
        cwd: fixture.getWorkspacePath("dist"),
        onlyFiles: false,
        onlyDirectories: false,
      });
      expect(files.sort().join("\n")).toMatchInlineSnapshot(`
        packages
        packages/package-1
        packages/package-1/README.md
        packages/package-1/lib
        packages/package-1/lib/main.js
        packages/package-1/package.json
        packages/package-2
        packages/package-2/CONTRIBUTING.md
        packages/package-2/assets
        packages/package-2/assets/image-1.png
        packages/package-2/assets/image-2.png
        packages/package-2/docs
        packages/package-2/docs/doc-1.md
        packages/package-2/docs/doc-2.md
        packages/package-2/lib
        packages/package-2/lib/main.js
        packages/package-2/package.json
      `);
    });
  });
});
