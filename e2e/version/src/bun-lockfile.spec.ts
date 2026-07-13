import { Fixture, normalizeCommitSHAs, normalizeEnvironment } from "@lerna/e2e-utils";
import { existsSync, outputFile } from "fs-extra";

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
      lernaInit: { args: [`--packages="packages/*"`] },
      installDependencies: true,
    });
  });

  afterEach(() => fixture.destroy());

  it("should update bun lockfile when packages are versioned", async () => {
    await fixture.lerna("create package-a -y");
    await fixture.lerna("create package-b --dependencies package-a -y");

    await fixture.install();
    await fixture.createInitialGitCommit();
    await fixture.exec("git push origin test-main");

    const output = await fixture.lerna("version 1.0.0 -y");

    expect(output.combinedOutput).toContain("lerna success version finished");

    const gitLogOutput = await fixture.exec("git log -1 --name-only --oneline");
    expect(gitLogOutput.combinedOutput).toMatch(/bun\.lock(b)?/);
  });

  it("should respect --ignore-scripts flag during lockfile update", async () => {
    await fixture.overrideLernaConfig({
      command: {
        version: {
          ignoreScripts: true,
        },
      },
    });

    await fixture.lerna("create package-c -y");

    await fixture.addScriptsToPackage({
      packagePath: "packages/package-c",
      scripts: {
        preinstall: "node -e \"require('fs').writeFileSync('preinstall-ran.txt', 'true')\"",
      },
    });

    await fixture.install();
    await fixture.exec("rm -f packages/package-c/preinstall-ran.txt");
    await fixture.createInitialGitCommit();
    await fixture.exec("git push origin test-main");

    const output = await fixture.lerna("version 2.0.0 -y");
    expect(output.combinedOutput).toContain("lerna success version finished");

    const sentinelPath = fixture.getWorkspacePath("packages/package-c/preinstall-ran.txt");
    expect(existsSync(sentinelPath)).toBe(false);
  });

  it("should replace and stage all existing bun lockfile formats", async () => {
    await fixture.lerna("create package-a -y");
    await fixture.install();

    const textLockfilePath = fixture.getWorkspacePath("bun.lock");
    const generatedLockfileName = existsSync(textLockfilePath) ? "bun.lock" : "bun.lockb";
    const additionalLockfileName = generatedLockfileName === "bun.lock" ? "bun.lockb" : "bun.lock";
    const generatedLockfilePath = fixture.getWorkspacePath(generatedLockfileName);
    const additionalLockfilePath = fixture.getWorkspacePath(additionalLockfileName);
    await outputFile(additionalLockfilePath, "stale additional lockfile");

    expect(existsSync(generatedLockfilePath)).toBe(true);
    expect(existsSync(additionalLockfilePath)).toBe(true);

    await fixture.createInitialGitCommit();
    await fixture.exec("git push origin test-main");

    const output = await fixture.lerna("version 1.0.0 -y");
    expect(output.combinedOutput).toContain("lerna success version finished");

    expect(existsSync(generatedLockfilePath)).toBe(true);
    expect(existsSync(additionalLockfilePath)).toBe(false);

    const committedFiles = await fixture.exec("git show --name-status --format=");
    expect(committedFiles.combinedOutput).toContain(`M\t${generatedLockfileName}`);
    expect(committedFiles.combinedOutput).toContain(`D\t${additionalLockfileName}`);
  });
});
