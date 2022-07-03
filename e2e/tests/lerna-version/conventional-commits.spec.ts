import { Fixture } from "../../utils/fixture";
import { normalizeCommitSHAs, normalizeEnvironment } from "../../utils/snapshot-serializer-utils";

expect.addSnapshotSerializer({
  serialize(str: string) {
    return normalizeCommitSHAs(
      normalizeEnvironment(str.replaceAll(/\(\d\d\d\d-\d\d-\d\d\)/g, "({YYYY}-{MM}-{DD})"))
    );
  },
  test(val: string) {
    return val != null && typeof val === "string";
  },
});

describe("lerna version", () => {
  let fixture: Fixture;

  beforeEach(async () => {
    fixture = await Fixture.create({
      name: "lerna-version-conventional-commits",
      packageManager: "npm",
      initializeGit: true,
      runLernaInit: true,
      installDependencies: true,
    });
  });
  afterEach(() => fixture.destroy());

  it("should correctly generate changelog and version information after a `feat` commit", async () => {
    await fixture.createInitialGitCommit();
    await fixture.lerna("create package-a -y");

    await fixture.exec("git add --all");
    await fixture.exec("git commit -m 'feat: add package-a'");
    await fixture.exec("git push origin test-main");

    const output = await fixture.lerna("version --conventional-commits -y", { silenceError: true });

    expect(output.combinedOutput).toMatchInlineSnapshot(`

        Changes:
         - package-a: 0.0.0 => 0.1.0

        lerna notice cli v999.9.9-e2e.0
        lerna info current version 0.0.0
        lerna info Assuming all packages changed
        lerna info getChangelogConfig Successfully resolved preset "conventional-changelog-angular"
        lerna info auto-confirmed 
        lerna info execute Skipping releases
        lerna info git Pushing tags...
        lerna success version finished

    `);

    const checkTagIsPresentLocally = await fixture.exec("git describe --abbrev=0");
    expect(checkTagIsPresentLocally.combinedOutput).toMatchInlineSnapshot(`
      v0.1.0

    `);

    const checkTagIsPresentOnRemote = await fixture.exec("git ls-remote origin refs/tags/v0.1.0");
    expect(checkTagIsPresentOnRemote.combinedOutput).toMatchInlineSnapshot(`
      {FULL_COMMIT_SHA}	refs/tags/v0.1.0

    `);

    expect(JSON.parse(await fixture.readWorkspaceFile("lerna.json")).version).toMatchInlineSnapshot("0.1.0");

    expect(JSON.parse(await fixture.readWorkspaceFile("packages/package-a/package.json")).version).toEqual(
      "0.1.0"
    );

    expect(await fixture.readWorkspaceFile("CHANGELOG.md")).toMatchInlineSnapshot(`
      # Change Log

      All notable changes to this project will be documented in this file.
      See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

      # 0.1.0 ({YYYY}-{MM}-{DD})


      ### Features

      * add package-a ([{SHORT_COMMIT_SHA}](tmp/lerna-e2e/lerna-version-conventional-commits/origin/commits/{FULL_COMMIT_SHA}))

    `);

    expect(await fixture.readWorkspaceFile("packages/package-a/CHANGELOG.md")).toMatchInlineSnapshot(`
      # Change Log

      All notable changes to this project will be documented in this file.
      See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

      # 0.1.0 ({YYYY}-{MM}-{DD})


      ### Features

      * add package-a ([{SHORT_COMMIT_SHA}](tmp/lerna-e2e/lerna-version-conventional-commits/origin/commits/{FULL_COMMIT_SHA}))

    `);
  });
});
