import { execPackageManager as _execPackageManager } from "@lerna/core";
import fs from "fs";
import os from "os";
import path from "path";
import { updateBunLockfile } from "./update-bun-lockfile";

jest.mock("@lerna/core", () => ({
  ...jest.requireActual("@lerna/core"),
  execPackageManager: jest.fn(),
}));

require("@lerna/test-helpers/src/lib/silence-logging");

const execPackageManager = _execPackageManager as jest.MockedFunction<typeof _execPackageManager>;

// Deliberately not valid utf8 so any accidental string round-trip corrupts it.
const binaryLockfileContent = Buffer.from([0x62, 0x75, 0x6e, 0x00, 0xff, 0xfe, 0x01, 0x80]);

describe("updateBunLockfile", () => {
  let rootPath: string;
  const execOpts = {} as Parameters<typeof updateBunLockfile>[0]["execOpts"];

  beforeEach(() => {
    rootPath = fs.mkdtempSync(path.join(os.tmpdir(), "lerna-update-bun-lockfile-"));
    execPackageManager.mockReset();
  });

  afterEach(() => {
    fs.rmSync(rootPath, { recursive: true, force: true });
  });

  function lockfilePath(name: string): string {
    return path.join(rootPath, name);
  }

  it("does not invoke bun and returns no files when no lockfile exists", async () => {
    const changedFiles = await updateBunLockfile({ rootPath, npmClientArgs: [], execOpts });

    expect(changedFiles).toEqual([]);
    expect(execPackageManager).not.toHaveBeenCalled();
  });

  it("regenerates the lockfile and returns the paths to stage", async () => {
    fs.writeFileSync(lockfilePath("bun.lockb"), binaryLockfileContent);
    execPackageManager.mockImplementation(async () => {
      // Simulate bun >= 1.2 migrating the binary lockfile to the text format.
      fs.writeFileSync(lockfilePath("bun.lock"), "regenerated");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return undefined as any;
    });

    const changedFiles = await updateBunLockfile({ rootPath, npmClientArgs: [], execOpts });

    expect(execPackageManager).toHaveBeenCalledWith(
      "bun",
      ["install", "--lockfile-only", "--ignore-scripts"],
      execOpts
    );
    // The stale bun.lockb (now deleted) and the regenerated bun.lock must both be staged.
    expect(changedFiles).toEqual([lockfilePath("bun.lockb"), lockfilePath("bun.lock")]);
    expect(fs.existsSync(lockfilePath("bun.lockb"))).toBe(false);
    expect(fs.readFileSync(lockfilePath("bun.lock"), "utf8")).toBe("regenerated");
    expect(fs.readdirSync(rootPath).filter((f) => f.includes("lerna-backup"))).toEqual([]);
  });

  it("passes npmClientArgs and omits --ignore-scripts when runScriptsOnLockfileUpdate is set", async () => {
    fs.writeFileSync(lockfilePath("bun.lock"), "stale");
    execPackageManager.mockImplementation(async () => {
      fs.writeFileSync(lockfilePath("bun.lock"), "regenerated");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return undefined as any;
    });

    await updateBunLockfile({
      rootPath,
      npmClientArgs: ["--registry=http://localhost:4872"],
      runScriptsOnLockfileUpdate: true,
      execOpts,
    });

    expect(execPackageManager).toHaveBeenCalledWith(
      "bun",
      ["install", "--lockfile-only", "--registry=http://localhost:4872"],
      execOpts
    );
  });

  it("keeps an on-disk backup while bun runs so an interrupted process cannot destroy the lockfile", async () => {
    fs.writeFileSync(lockfilePath("bun.lockb"), binaryLockfileContent);
    let backupsDuringInstall: string[] = [];
    execPackageManager.mockImplementation(async () => {
      backupsDuringInstall = fs.readdirSync(rootPath).filter((f) => f.includes("lerna-backup"));
      fs.writeFileSync(lockfilePath("bun.lock"), "regenerated");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return undefined as any;
    });

    await updateBunLockfile({ rootPath, npmClientArgs: [], execOpts });

    // While bun install runs, the original lockfile must still exist on disk (as a backup),
    // not merely in process memory, so a killed process leaves it recoverable.
    expect(backupsDuringInstall).toEqual(["bun.lockb.lerna-backup"]);
  });

  it("restores the original lockfiles byte-for-byte and rethrows when bun install fails", async () => {
    fs.writeFileSync(lockfilePath("bun.lockb"), binaryLockfileContent);
    fs.writeFileSync(lockfilePath("bun.lock"), "stale text lockfile");
    const installError = new Error("bun install failed");
    execPackageManager.mockImplementation(async () => {
      // Simulate a partially written lockfile before the failure.
      fs.writeFileSync(lockfilePath("bun.lock"), "partial garbage");
      throw installError;
    });

    await expect(updateBunLockfile({ rootPath, npmClientArgs: [], execOpts })).rejects.toBe(installError);

    expect(fs.readFileSync(lockfilePath("bun.lockb")).equals(binaryLockfileContent)).toBe(true);
    expect(fs.readFileSync(lockfilePath("bun.lock"), "utf8")).toBe("stale text lockfile");
    expect(fs.readdirSync(rootPath).filter((f) => f.includes("lerna-backup"))).toEqual([]);
  });

  it("rethrows the original install error even when restoring the backup fails", async () => {
    fs.writeFileSync(lockfilePath("bun.lockb"), binaryLockfileContent);
    const installError = new Error("bun install failed");
    execPackageManager.mockRejectedValue(installError);

    const realRenameSync = fs.renameSync;
    const renameSpy = jest.spyOn(fs, "renameSync").mockImplementation((oldPath, newPath) => {
      if (String(newPath).endsWith("bun.lockb")) {
        throw new Error("EPERM: operation not permitted");
      }
      return realRenameSync(oldPath, newPath);
    });

    try {
      await expect(updateBunLockfile({ rootPath, npmClientArgs: [], execOpts })).rejects.toBe(installError);
      // The backup could not be restored, but it must still exist on disk for manual recovery.
      expect(fs.existsSync(lockfilePath("bun.lockb.lerna-backup"))).toBe(true);
    } finally {
      renameSpy.mockRestore();
    }
  });
});
