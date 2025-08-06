import { Fixture, normalizeCommitSHAs, normalizeEnvironment } from "@lerna/e2e-utils";

expect.addSnapshotSerializer({
  serialize(str: string) {
    return normalizeCommitSHAs(normalizeEnvironment(str));
  },
  test(val: string) {
    return val != null && typeof val === "string";
  },
});

describe("lerna-version-dry-run", () => {
  let fixture: Fixture;

  beforeEach(async () => {
    fixture = await Fixture.create({
      e2eRoot: process.env.E2E_ROOT,
      name: "lerna-version-dry-run",
      packageManager: "npm",
      initializeGit: true,
      lernaInit: { args: [`--packages="packages/*"`] },
      installDependencies: true,
    });
    await fixture.lerna("create package-a -y");
    await fixture.createInitialGitCommit();
    await fixture.exec("git push origin test-main");
  });
  afterEach(() => fixture.destroy());

  it("should show version changes without making any actual changes", async () => {
    const output = await fixture.lerna("version patch --dry-run");

    expect(output.combinedOutput).toMatchInlineSnapshot(`
      lerna notice cli v999.9.9-e2e.0
      lerna info current version 0.0.0
      lerna info Assuming all packages changed

      Changes:
       - package-a: 0.0.0 => 0.0.1

      lerna info dry-run Executing in dry-run mode - no changes will be made
      lerna info dry-run 
      lerna info dry-run Skipping releases
      lerna info dry-run The following package versions would be updated:
      lerna info dry-run   package-a: 0.0.0 => 0.0.1
      lerna info dry-run 
      lerna info dry-run The following files would be modified:
      lerna info dry-run   /tmp/lerna-e2e/lerna-version-dry-run/lerna-workspace/packages/package-a/package.json
      lerna info dry-run   /tmp/lerna-e2e/lerna-version-dry-run/lerna-workspace/package-lock.json
      lerna info dry-run   /tmp/lerna-e2e/lerna-version-dry-run/lerna-workspace/lerna.json
      lerna info dry-run 
      lerna info dry-run The following lifecycle scripts would be executed:
      lerna info dry-run   root preversion
      lerna info dry-run   root version
      lerna info dry-run   package-a preversion
      lerna info dry-run   package-a version
      lerna info dry-run 
      lerna info dry-run The following git operations would be performed:
      lerna info dry-run   git add <modified files>
      lerna info dry-run   git commit -m "v0.0.1"
      lerna info dry-run   git tag v0.0.1 -m v0.0.1
      lerna info dry-run 
      lerna info dry-run The following postversion lifecycle scripts would be executed:
      lerna info dry-run   package-a postversion
      lerna info dry-run   root postversion
      lerna info dry-run Would push to remote: git push origin test-main --follow-tags
      lerna info dry-run 
      lerna success version dry-run finished - no changes were made

    `);

    // Verify no actual changes were made
    const lernaJson = JSON.parse(await fixture.readWorkspaceFile("lerna.json"));
    expect(lernaJson.version).toBe("0.0.0");

    const packageJson = JSON.parse(await fixture.readWorkspaceFile("packages/package-a/package.json"));
    expect(packageJson.version).toBe("0.0.0");

    // Verify no git tags were created
    const gitTagOutput = await fixture.exec("git tag");
    expect(gitTagOutput.combinedOutput.trim()).toBe("");
  });

  it("should work with --conventional-commits in dry-run mode", async () => {
    // Make a conventional commit to test with
    await fixture.exec("echo 'feat: add new feature' > packages/package-a/feature.txt");
    await fixture.exec("git add --all");
    await fixture.exec("git commit -m 'feat: add new feature'");

    const output = await fixture.lerna("version --conventional-commits --dry-run");

    expect(output.combinedOutput).toMatchInlineSnapshot(`
      lerna notice cli v999.9.9-e2e.0
      lerna info current version 0.0.0
      lerna info Assuming all packages changed
      lerna info getChangelogConfig Successfully resolved preset "conventional-changelog-angular"

      Changes:
       - package-a: 0.0.0 => 0.1.0

      lerna info dry-run Executing in dry-run mode - no changes will be made
      lerna info dry-run 
      lerna info dry-run Skipping releases
      lerna info dry-run The following package versions would be updated:
      lerna info dry-run   package-a: 0.0.0 => 0.1.0
      lerna info dry-run 
      lerna info dry-run The following files would be modified:
      lerna info dry-run   /tmp/lerna-e2e/lerna-version-dry-run/lerna-workspace/packages/package-a/package.json
      lerna info dry-run   /tmp/lerna-e2e/lerna-version-dry-run/lerna-workspace/package-lock.json
      lerna info dry-run   /tmp/lerna-e2e/lerna-version-dry-run/lerna-workspace/CHANGELOG.md
      lerna info dry-run   /tmp/lerna-e2e/lerna-version-dry-run/lerna-workspace/lerna.json
      lerna info dry-run 
      lerna info dry-run The following lifecycle scripts would be executed:
      lerna info dry-run   root preversion
      lerna info dry-run   root version
      lerna info dry-run   package-a preversion
      lerna info dry-run   package-a version
      lerna info dry-run 
      lerna info dry-run The following git operations would be performed:
      lerna info dry-run   git add <modified files>
      lerna info dry-run   git commit -m "v0.1.0"
      lerna info dry-run   git tag v0.1.0 -m v0.1.0
      lerna info dry-run 
      lerna info dry-run The following postversion lifecycle scripts would be executed:
      lerna info dry-run   package-a postversion
      lerna info dry-run   root postversion
      lerna info dry-run Would push to remote: git push origin test-main --follow-tags
      lerna info dry-run 
      lerna success version dry-run finished - no changes were made

    `);

    // Verify no changelog files were created
    await expect(fixture.readWorkspaceFile("CHANGELOG.md")).rejects.toThrow();
    await expect(fixture.readWorkspaceFile("packages/package-a/CHANGELOG.md")).rejects.toThrow();
  });

  it("should show skipped operations when using --no-git-tag-version", async () => {
    const output = await fixture.lerna("version patch --dry-run --no-git-tag-version");

    expect(output.combinedOutput).toMatchInlineSnapshot(`
      lerna notice cli v999.9.9-e2e.0
      lerna info current version 0.0.0
      lerna notice FYI git repository validation has been skipped, please ensure your version bumps are correct
      lerna info Assuming all packages changed
      lerna WARN version Skipping working tree validation, proceed at your own risk

      Changes:
       - package-a: 0.0.0 => 0.0.1

      lerna info dry-run Executing in dry-run mode - no changes will be made
      lerna info dry-run 
      lerna info dry-run Skipping git tag/commit (--no-git-tag-version)
      lerna info dry-run Skipping git push (--no-push)
      lerna info dry-run Skipping releases
      lerna info dry-run The following package versions would be updated:
      lerna info dry-run   package-a: 0.0.0 => 0.0.1
      lerna info dry-run 
      lerna info dry-run The following files would be modified:
      lerna info dry-run   /tmp/lerna-e2e/lerna-version-dry-run/lerna-workspace/packages/package-a/package.json
      lerna info dry-run   /tmp/lerna-e2e/lerna-version-dry-run/lerna-workspace/package-lock.json
      lerna info dry-run   /tmp/lerna-e2e/lerna-version-dry-run/lerna-workspace/lerna.json
      lerna info dry-run 
      lerna info dry-run The following lifecycle scripts would be executed:
      lerna info dry-run   root preversion
      lerna info dry-run   root version
      lerna info dry-run   package-a preversion
      lerna info dry-run   package-a version
      lerna info dry-run 
      lerna success version dry-run finished - no changes were made

    `);
  });

  it("should show skipped push when using --no-push", async () => {
    const output = await fixture.lerna("version patch --dry-run --no-push");

    expect(output.combinedOutput).toMatchInlineSnapshot(`
      lerna notice cli v999.9.9-e2e.0
      lerna info current version 0.0.0
      lerna info Assuming all packages changed

      Changes:
       - package-a: 0.0.0 => 0.0.1

      lerna info dry-run Executing in dry-run mode - no changes will be made
      lerna info dry-run 
      lerna info dry-run Skipping git push (--no-push)
      lerna info dry-run Skipping releases
      lerna info dry-run The following package versions would be updated:
      lerna info dry-run   package-a: 0.0.0 => 0.0.1
      lerna info dry-run 
      lerna info dry-run The following files would be modified:
      lerna info dry-run   /tmp/lerna-e2e/lerna-version-dry-run/lerna-workspace/packages/package-a/package.json
      lerna info dry-run   /tmp/lerna-e2e/lerna-version-dry-run/lerna-workspace/package-lock.json
      lerna info dry-run   /tmp/lerna-e2e/lerna-version-dry-run/lerna-workspace/lerna.json
      lerna info dry-run 
      lerna info dry-run The following lifecycle scripts would be executed:
      lerna info dry-run   root preversion
      lerna info dry-run   root version
      lerna info dry-run   package-a preversion
      lerna info dry-run   package-a version
      lerna info dry-run 
      lerna info dry-run The following git operations would be performed:
      lerna info dry-run   git add <modified files>
      lerna info dry-run   git commit -m "v0.0.1"
      lerna info dry-run   git tag v0.0.1 -m v0.0.1
      lerna info dry-run 
      lerna info dry-run The following postversion lifecycle scripts would be executed:
      lerna info dry-run   package-a postversion
      lerna info dry-run   root postversion
      lerna info dry-run 
      lerna success version dry-run finished - no changes were made

    `);
  });

  it("should work with specific version in dry-run mode", async () => {
    const output = await fixture.lerna("version 1.2.3 --dry-run");

    expect(output.combinedOutput).toMatchInlineSnapshot(`
      lerna notice cli v999.9.9-e2e.0
      lerna info current version 0.0.0
      lerna info Assuming all packages changed

      Changes:
       - package-a: 0.0.0 => 1.2.3

      lerna info dry-run Executing in dry-run mode - no changes will be made
      lerna info dry-run 
      lerna info dry-run Skipping releases
      lerna info dry-run The following package versions would be updated:
      lerna info dry-run   package-a: 0.0.0 => 1.2.3
      lerna info dry-run 
      lerna info dry-run The following files would be modified:
      lerna info dry-run   /tmp/lerna-e2e/lerna-version-dry-run/lerna-workspace/packages/package-a/package.json
      lerna info dry-run   /tmp/lerna-e2e/lerna-version-dry-run/lerna-workspace/package-lock.json
      lerna info dry-run   /tmp/lerna-e2e/lerna-version-dry-run/lerna-workspace/lerna.json
      lerna info dry-run 
      lerna info dry-run The following lifecycle scripts would be executed:
      lerna info dry-run   root preversion
      lerna info dry-run   root version
      lerna info dry-run   package-a preversion
      lerna info dry-run   package-a version
      lerna info dry-run 
      lerna info dry-run The following git operations would be performed:
      lerna info dry-run   git add <modified files>
      lerna info dry-run   git commit -m "v1.2.3"
      lerna info dry-run   git tag v1.2.3 -m v1.2.3
      lerna info dry-run 
      lerna info dry-run The following postversion lifecycle scripts would be executed:
      lerna info dry-run   package-a postversion
      lerna info dry-run   root postversion
      lerna info dry-run Would push to remote: git push origin test-main --follow-tags
      lerna info dry-run 
      lerna success version dry-run finished - no changes were made

    `);

    // Verify version wasn't actually changed
    const packageJson = JSON.parse(await fixture.readWorkspaceFile("packages/package-a/package.json"));
    expect(packageJson.version).toBe("0.0.0");
  });

  describe("with multiple packages", () => {
    beforeEach(async () => {
      await fixture.lerna("create package-b -y");
      await fixture.exec("git add --all");
      await fixture.exec("git commit -m 'feat: add package-b'");
      await fixture.exec("git push origin test-main");
    });

    it("should show version changes for all packages", async () => {
      const output = await fixture.lerna("version minor --dry-run");

      expect(output.combinedOutput).toMatchInlineSnapshot(`
        lerna notice cli v999.9.9-e2e.0
        lerna info current version 0.0.0
        lerna info Assuming all packages changed

        Changes:
         - package-a: 0.0.0 => 0.1.0
         - package-b: 0.0.0 => 0.1.0

        lerna info dry-run Executing in dry-run mode - no changes will be made
        lerna info dry-run 
        lerna info dry-run Skipping releases
        lerna info dry-run The following package versions would be updated:
        lerna info dry-run   package-a: 0.0.0 => 0.1.0
        lerna info dry-run   package-b: 0.0.0 => 0.1.0
        lerna info dry-run 
        lerna info dry-run The following files would be modified:
        lerna info dry-run   /tmp/lerna-e2e/lerna-version-dry-run/lerna-workspace/packages/package-a/package.json
        lerna info dry-run   /tmp/lerna-e2e/lerna-version-dry-run/lerna-workspace/packages/package-b/package.json
        lerna info dry-run   /tmp/lerna-e2e/lerna-version-dry-run/lerna-workspace/package-lock.json
        lerna info dry-run   /tmp/lerna-e2e/lerna-version-dry-run/lerna-workspace/lerna.json
        lerna info dry-run 
        lerna info dry-run The following lifecycle scripts would be executed:
        lerna info dry-run   root preversion
        lerna info dry-run   root version
        lerna info dry-run   package-a preversion
        lerna info dry-run   package-a version
        lerna info dry-run   package-b preversion
        lerna info dry-run   package-b version
        lerna info dry-run 
        lerna info dry-run The following git operations would be performed:
        lerna info dry-run   git add <modified files>
        lerna info dry-run   git commit -m "v0.1.0"
        lerna info dry-run   git tag v0.1.0 -m v0.1.0
        lerna info dry-run 
        lerna info dry-run The following postversion lifecycle scripts would be executed:
        lerna info dry-run   package-a postversion
        lerna info dry-run   package-b postversion
        lerna info dry-run   root postversion
        lerna info dry-run Would push to remote: git push origin test-main --follow-tags
        lerna info dry-run 
        lerna success version dry-run finished - no changes were made

      `);
    });
  });

  describe("independent versioning", () => {
    beforeEach(async () => {
      fixture.updateJson("lerna.json", (json) => {
        json.version = "independent";
        return json;
      });
      await fixture.exec("git add lerna.json");
      await fixture.exec("git commit -m 'chore: set version to independent'");
      await fixture.exec("git push origin test-main");
    });

    it("should work with independent versioning in dry-run mode", async () => {
      const output = await fixture.lerna("version patch --dry-run");

      expect(output.combinedOutput).toMatchInlineSnapshot(`
        lerna notice cli v999.9.9-e2e.0
        lerna info versioning independent
        lerna info Assuming all packages changed

        Changes:
         - package-a: 0.0.0 => 0.0.1

        lerna info dry-run Executing in dry-run mode - no changes will be made
        lerna info dry-run 
        lerna info dry-run Skipping releases
        lerna info dry-run The following package versions would be updated:
        lerna info dry-run   package-a: 0.0.0 => 0.0.1
        lerna info dry-run 
        lerna info dry-run The following files would be modified:
        lerna info dry-run   /tmp/lerna-e2e/lerna-version-dry-run/lerna-workspace/packages/package-a/package.json
        lerna info dry-run   /tmp/lerna-e2e/lerna-version-dry-run/lerna-workspace/package-lock.json
        lerna info dry-run 
        lerna info dry-run The following lifecycle scripts would be executed:
        lerna info dry-run   root preversion
        lerna info dry-run   root version
        lerna info dry-run   package-a preversion
        lerna info dry-run   package-a version
        lerna info dry-run 
        lerna info dry-run The following git operations would be performed:
        lerna info dry-run   git add <modified files>
        lerna info dry-run   git commit -m "Publish\\\\n\\\\n - package-a@0.0.1"
        lerna info dry-run   git tag package-a@0.0.1 -m package-a@0.0.1
        lerna info dry-run 
        lerna info dry-run The following postversion lifecycle scripts would be executed:
        lerna info dry-run   package-a postversion
        lerna info dry-run   root postversion
        lerna info dry-run Would push to remote: git push origin test-main --follow-tags
        lerna info dry-run 
        lerna success version dry-run finished - no changes were made

      `);
    });
  });
});
