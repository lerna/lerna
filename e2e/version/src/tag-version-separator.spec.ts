import { Fixture, normalizeCommitSHAs, normalizeEnvironment } from "@lerna/e2e-utils";

expect.addSnapshotSerializer({
  serialize(str: string) {
    return normalizeCommitSHAs(normalizeEnvironment(str));
  },
  test(val: string) {
    return val != null && typeof val === "string";
  },
});

describe("lerna-version-tag-version-separator qqqq", () => {
  let fixture: Fixture;

  beforeEach(async () => {
    fixture = await Fixture.create({
      e2eRoot: process.env.E2E_ROOT,
      name: "lerna-version-tag-version-separator",
      packageManager: "npm",
      initializeGit: true,
      lernaInit: { args: [`--packages="packages/*" --independent`] },
      installDependencies: true,
    });
    await fixture.lerna("create package-a -y");
    await fixture.lerna("create package-b -y");
    await fixture.updateJson("lerna.json", (json) => ({
      ...json,
      command: {
        version: {
          tagVersionSeparator: "__",
        },
      },
    }));
    await fixture.createInitialGitCommit();
    await fixture.exec("git push origin test-main");
  });
  afterEach(() => fixture.destroy());

  it("should create and read tags based on the custom tag-version-separator", async () => {
    await fixture.lerna("version 3.3.3 -y");

    // It should create one tag for each independently versioned package using the custom separator
    const checkPackageTagsArePresentLocally = await fixture.exec("git describe --abbrev=0");
    expect(checkPackageTagsArePresentLocally.combinedOutput).toMatchInlineSnapshot(`
        package-a__3.3.3

      `);

    const checkPackageATagIsPresentOnRemote = await fixture.exec(
      "git ls-remote origin refs/tags/package-a__3.3.3"
    );
    expect(checkPackageATagIsPresentOnRemote.combinedOutput).toMatchInlineSnapshot(`
        {FULL_COMMIT_SHA}	refs/tags/package-a__3.3.3

      `);
    const checkPackageBTagIsPresentOnRemote = await fixture.exec(
      "git ls-remote origin refs/tags/package-b__3.3.3"
    );
    expect(checkPackageBTagIsPresentOnRemote.combinedOutput).toMatchInlineSnapshot(`
        {FULL_COMMIT_SHA}	refs/tags/package-b__3.3.3

      `);

    // Update package-a and version using conventional commits (to read from the tag)
    await fixture.updateJson("packages/package-a/package.json", (json) => {
      return {
        ...json,
        description: json.description + "...with an update!",
      };
    });
    await fixture.exec("git add packages/package-a/package.json");
    await fixture.exec("git commit -m 'feat: update package-a'");
    await fixture.exec("git push origin test-main");

    const output = await fixture.lerna("version --conventional-commits -y", { silenceError: true });
    expect(output.combinedOutput).toMatchInlineSnapshot(`
      lerna notice cli v999.9.9-e2e.0
      lerna info versioning independent
      lerna info Looking for changed packages since package-a__3.3.3
      lerna info getChangelogConfig Successfully resolved preset "conventional-changelog-angular"

      Changes:
       - package-a: 3.3.3 => 3.4.0

      lerna info auto-confirmed 
      lerna info execute Skipping releases
      lerna info git Pushing tags...
      lerna success version finished

    `);
  });
});
