import { Fixture, normalizeEnvironment } from "@lerna/e2e-utils";
import { writeFile } from "fs-extra";

expect.addSnapshotSerializer({
  serialize(str: string) {
    return normalizeEnvironment(str).replaceAll(/"author": ".*"/g, 'author: "XXXX"');
  },
  test(val: string) {
    return val != null && typeof val === "string";
  },
});

describe("lerna-version-formatting", () => {
  let fixture: Fixture;

  beforeEach(async () => {
    fixture = await Fixture.create({
      e2eRoot: process.env.E2E_ROOT,
      name: "lerna-version-formatting",
      packageManager: "npm",
      initializeGit: true,
      runLernaInit: true,
      installDependencies: false,
    });

    await fixture.updateJson("package.json", (json: { devDependencies: Record<string, unknown> }) => ({
      ...json,
      devDependencies: {
        ...json.devDependencies,
        prettier: "^2.2.1",
      },
    }));
    await fixture.install();

    await writeFile(
      fixture.getWorkspacePath(".prettierrc"),
      JSON.stringify({
        tabWidth: 6,
      })
    );
    await writeFile(fixture.getWorkspacePath(".prettierignore"), "node_modules");

    await fixture.lerna("create package-a -y");

    await fixture.createInitialGitCommit();
    await fixture.exec("git push origin test-main");
  });
  afterEach(() => fixture.destroy());

  it("should format file if not in .prettierignore.", async () => {
    await fixture.lerna("version patch -y");

    const packageJson = await fixture.readWorkspaceFile("packages/package-a/package.json");

    expect(packageJson).toMatchInlineSnapshot(`
        {
              "name": "package-a",
              "version": "0.0.1",
              "description": "Now I’m the model of a modern major general / The venerated Virginian veteran whose men are all / Lining up, to put me up on a pedestal / Writin’ letters to relatives / Embellishin’ my elegance and eloquence / But the elephant is in the room / The truth is in ya face when ya hear the British cannons go / BOOM",
              "keywords": [],
              author: "XXXX",
              "license": "ISC",
              "main": "lib/package-a.js",
              "directories": {
                    "lib": "lib",
                    "test": "__tests__"
              },
              "files": [
                    "lib"
              ],
              "repository": {
                    "type": "git",
                    "url": "/tmp/lerna-e2e/lerna-version-formatting/origin.git"
              },
              "scripts": {
                    "test": "node ./__tests__/package-a.test.js"
              }
        }

      `);
  });

  it("should not format file if is in .prettierignore.", async () => {
    await writeFile(
      fixture.getWorkspacePath(".prettierignore"),
      "node_modules\npackages/package-a/package.json"
    );
    await fixture.exec("git add .prettierignore");
    await fixture.exec("git commit -m 'chore: add package-lock.json to .prettierignore'");

    await fixture.lerna("version patch -y");

    const packageJson = await fixture.readWorkspaceFile("packages/package-a/package.json");

    expect(packageJson).toMatchInlineSnapshot(`
        {
          "name": "package-a",
          "version": "0.0.1",
          "description": "Now I’m the model of a modern major general / The venerated Virginian veteran whose men are all / Lining up, to put me up on a pedestal / Writin’ letters to relatives / Embellishin’ my elegance and eloquence / But the elephant is in the room / The truth is in ya face when ya hear the British cannons go / BOOM",
          "keywords": [],
          author: "XXXX",
          "license": "ISC",
          "main": "lib/package-a.js",
          "directories": {
            "lib": "lib",
            "test": "__tests__"
          },
          "files": [
            "lib"
          ],
          "repository": {
            "type": "git",
            "url": "/tmp/lerna-e2e/lerna-version-formatting/origin.git"
          },
          "scripts": {
            "test": "node ./__tests__/package-a.test.js"
          }
        }

      `);
  });
});
