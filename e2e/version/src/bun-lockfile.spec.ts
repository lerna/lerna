import { Fixture, normalizeCommitSHAs, normalizeEnvironment } from "@lerna/e2e-utils";
import { existsSync, statSync } from "fs-extra";

expect.addSnapshotSerializer({
  serialize(str: string) {
    return normalizeCommitSHAs(normalizeEnvironment(str));
  },
  test(val: string) {
    return val != null && typeof val === "string";
  },
});

describe("lerna-version-bun-lockfile", () => {
  let fixture: Fixture;

  beforeEach(async () => {
    fixture = await Fixture.create({
      e2eRoot: process.env.E2E_ROOT,
      name: "lerna-version-bun-lockfile",
      packageManager: "bun",
      initializeGit: true,
      lernaInit: { args: [] },
      installDependencies: true,
    });
  });

  afterEach(() => fixture.destroy());

  it("should update bun.lockb when packages are versioned", async () => {
    // Create test packages
    await fixture.lerna("create package-a -y");
    await fixture.lerna("create package-b --dependencies package-a -y");

    await fixture.install();
    await fixture.exec("git add .");
    await fixture.exec("git commit -m 'chore: add packages'");
    await fixture.exec("git push origin test-main");

    // Get the lockfile's initial modification time
    const lockfilePath = fixture.getWorkspacePath("bun.lockb");
    expect(existsSync(lockfilePath)).toBe(true);
    const initialMtime = statSync(lockfilePath).mtimeMs;

    // Wait a moment to ensure different timestamp
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Version the packages
    const output = await fixture.lerna("version 1.0.0 -y");

    expect(output.combinedOutput).toContain("lerna success version finished");

    // Verify lockfile was updated
    expect(existsSync(lockfilePath)).toBe(true);
    const updatedMtime = statSync(lockfilePath).mtimeMs;
    expect(updatedMtime).toBeGreaterThan(initialMtime);
  });

  it("should respect --ignore-scripts flag during lockfile update", async () => {
    // Override lerna config to test ignore-scripts
    await fixture.overrideLernaConfig({
      npmClient: "bun",
      command: {
        version: {
          ignoreScripts: true,
        },
      },
    });

    await fixture.lerna("create package-c -y");
    await fixture.install();
    await fixture.exec("git add .");
    await fixture.exec("git commit -m 'chore: add package-c'");
    await fixture.exec("git push origin test-main");

    const lockfilePath = fixture.getWorkspacePath("bun.lockb");
    expect(existsSync(lockfilePath)).toBe(true);

    // Version should still work with ignore-scripts
    const output = await fixture.lerna("version 2.0.0 -y");
    expect(output.combinedOutput).toContain("lerna success version finished");
    expect(existsSync(lockfilePath)).toBe(true);
  });
});
