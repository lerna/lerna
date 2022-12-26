import { Fixture, normalizeEnvironment } from "@lerna/e2e-utils";

expect.addSnapshotSerializer({
  serialize(str: string) {
    return normalizeEnvironment(str);
  },
  test(val: string) {
    return val != null && typeof val === "string";
  },
});

describe("lerna-version-errors", () => {
  let fixture: Fixture;

  beforeEach(async () => {
    fixture = await Fixture.create({
      e2eRoot: process.env.E2E_ROOT,
      name: "lerna-version-errors",
      packageManager: "npm",
      initializeGit: true,
      runLernaInit: true,
      installDependencies: true,
    });
  });
  afterEach(() => fixture.destroy());

  it("should error if there are no existing commits in the repository", async () => {
    const output = await fixture.lerna("version", { silenceError: true });

    expect(output.combinedOutput).toMatchInlineSnapshot(`
      lerna notice cli v999.9.9-e2e.0
      lerna info current version 0.0.0
      lerna ERR! ENOCOMMIT No commits in this repository. Please commit something before using version.

    `);
  });

  it("should error if the current branch does not yet exist on the git origin", async () => {
    await fixture.lerna("create package-a -y");
    await fixture.createInitialGitCommit();

    const output = await fixture.lerna("version", { silenceError: true });

    expect(output.combinedOutput).toMatchInlineSnapshot(`
      lerna notice cli v999.9.9-e2e.0
      lerna info current version 0.0.0
      lerna ERR! ENOREMOTEBRANCH Branch 'test-main' doesn't exist in remote 'origin'.
      lerna ERR! ENOREMOTEBRANCH If this is a new branch, please make sure you push it to the remote first.

    `);
  });
});
