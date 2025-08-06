import { log } from "@lerna/core";
import fs from "fs";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { detectLockfiles, getPrimaryLockfile, getModifiedLockfilePaths } from "./lockfile-utils";

jest.mock("fs");
jest.mock("@lerna/core", () => ({
  log: {
    verbose: jest.fn(),
  },
}));

const mockFs = fs as jest.Mocked<typeof fs>;
const mockLog = log as jest.Mocked<typeof log>;

describe("lockfile-utils", () => {
  const testRootPath = "/test/project";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("detectLockfiles", () => {
    it("should detect npm lockfile when present", () => {
      mockFs.existsSync.mockImplementation((path) => path === "/test/project/package-lock.json");

      const lockfiles = detectLockfiles(testRootPath);
      const npmLockfile = lockfiles.find((lf) => lf.type === "npm");

      expect(npmLockfile?.exists).toBe(true);
      expect(npmLockfile?.path).toBe("/test/project/package-lock.json");
      expect(mockLog.verbose).toHaveBeenCalledWith(
        "lockfile",
        "Found npm lockfile at /test/project/package-lock.json"
      );
    });

    it("should detect yarn lockfile when present", () => {
      mockFs.existsSync.mockImplementation((path) => path === "/test/project/yarn.lock");

      const lockfiles = detectLockfiles(testRootPath);
      const yarnLockfile = lockfiles.find((lf) => lf.type === "yarn");

      expect(yarnLockfile?.exists).toBe(true);
      expect(yarnLockfile?.path).toBe("/test/project/yarn.lock");
      expect(mockLog.verbose).toHaveBeenCalledWith(
        "lockfile",
        "Found yarn lockfile at /test/project/yarn.lock"
      );
    });

    it("should detect pnpm lockfile when present", () => {
      mockFs.existsSync.mockImplementation((path) => path === "/test/project/pnpm-lock.yaml");

      const lockfiles = detectLockfiles(testRootPath);
      const pnpmLockfile = lockfiles.find((lf) => lf.type === "pnpm");

      expect(pnpmLockfile?.exists).toBe(true);
      expect(pnpmLockfile?.path).toBe("/test/project/pnpm-lock.yaml");
      expect(mockLog.verbose).toHaveBeenCalledWith(
        "lockfile",
        "Found pnpm lockfile at /test/project/pnpm-lock.yaml"
      );
    });

    it("should detect multiple lockfiles when present", () => {
      mockFs.existsSync.mockImplementation(
        (path) => path === "/test/project/package-lock.json" || path === "/test/project/yarn.lock"
      );

      const lockfiles = detectLockfiles(testRootPath);
      const existingLockfiles = lockfiles.filter((lf) => lf.exists);

      expect(existingLockfiles).toHaveLength(2);
      expect(existingLockfiles.some((lf) => lf.type === "npm")).toBe(true);
      expect(existingLockfiles.some((lf) => lf.type === "yarn")).toBe(true);
      expect(mockLog.verbose).toHaveBeenCalledTimes(2);
    });

    it("should handle missing lockfiles gracefully", () => {
      mockFs.existsSync.mockReturnValue(false);

      const lockfiles = detectLockfiles(testRootPath);
      const existingLockfiles = lockfiles.filter((lf) => lf.exists);

      expect(existingLockfiles).toHaveLength(0);
      expect(lockfiles).toHaveLength(3); // All supported lockfile types should be returned
      expect(mockLog.verbose).not.toHaveBeenCalled();
    });

    it("should handle errors when checking lockfile existence", () => {
      const error = new Error("Permission denied");
      mockFs.existsSync.mockImplementation(() => {
        throw error;
      });

      const lockfiles = detectLockfiles(testRootPath);
      const existingLockfiles = lockfiles.filter((lf) => lf.exists);

      expect(existingLockfiles).toHaveLength(0);
      expect(mockLog.verbose).toHaveBeenCalledWith(
        "lockfile",
        "Error checking npm lockfile: Permission denied"
      );
      expect(mockLog.verbose).toHaveBeenCalledWith(
        "lockfile",
        "Error checking yarn lockfile: Permission denied"
      );
      expect(mockLog.verbose).toHaveBeenCalledWith(
        "lockfile",
        "Error checking pnpm lockfile: Permission denied"
      );
    });

    it("should use correct paths for different root directories", () => {
      const customRootPath = "/custom/project/path";
      mockFs.existsSync.mockReturnValue(false);

      const lockfiles = detectLockfiles(customRootPath);

      expect(lockfiles[0].path).toBe("/custom/project/path/package-lock.json");
      expect(lockfiles[1].path).toBe("/custom/project/path/yarn.lock");
      expect(lockfiles[2].path).toBe("/custom/project/path/pnpm-lock.yaml");
    });
  });

  describe("getPrimaryLockfile", () => {
    it("should prefer npmClient-specific lockfile when specified and exists", () => {
      mockFs.existsSync.mockImplementation(
        (path) => path === "/test/project/yarn.lock" || path === "/test/project/package-lock.json"
      );

      const result = getPrimaryLockfile(testRootPath, "yarn");

      expect(result?.type).toBe("yarn");
      expect(result?.exists).toBe(true);
    });

    it("should fallback to priority order when npmClient lockfile doesn't exist", () => {
      mockFs.existsSync.mockImplementation((path) => path === "/test/project/pnpm-lock.yaml");

      const result = getPrimaryLockfile(testRootPath, "yarn");

      expect(result?.type).toBe("pnpm");
      expect(result?.exists).toBe(true);
    });

    it("should return null when no lockfiles exist", () => {
      mockFs.existsSync.mockReturnValue(false);

      const result = getPrimaryLockfile(testRootPath, "npm");

      expect(result).toBeNull();
    });

    it("should use priority order when npmClient not specified", () => {
      mockFs.existsSync.mockImplementation(
        (path) => path === "/test/project/pnpm-lock.yaml" || path === "/test/project/yarn.lock"
      );

      const result = getPrimaryLockfile(testRootPath);

      // Should prefer yarn over pnpm according to priority
      expect(result?.type).toBe("yarn");
      expect(result?.exists).toBe(true);
    });

    it("should prefer npm over all others when multiple exist", () => {
      mockFs.existsSync.mockReturnValue(true);

      const result = getPrimaryLockfile(testRootPath);

      expect(result?.type).toBe("npm");
      expect(result?.exists).toBe(true);
    });

    it("should return first available lockfile if no priority matches", () => {
      mockFs.existsSync.mockImplementation((path) => path === "/test/project/yarn.lock");

      const result = getPrimaryLockfile(testRootPath);

      expect(result?.type).toBe("yarn");
      expect(result?.exists).toBe(true);
    });

    it("should handle npmClient case variations", () => {
      mockFs.existsSync.mockImplementation((path) => path === "/test/project/pnpm-lock.yaml");

      const result = getPrimaryLockfile(testRootPath, "PNPM");

      // Should not match due to case sensitivity
      expect(result?.type).toBe("pnpm");
      expect(result?.exists).toBe(true);
    });
  });

  describe("getModifiedLockfilePaths", () => {
    it("should return pnpm lockfile path for pnpm client", () => {
      mockFs.existsSync.mockImplementation((path) => path === "/test/project/pnpm-lock.yaml");

      const paths = getModifiedLockfilePaths(testRootPath, "pnpm");

      expect(paths).toContain("/test/project/pnpm-lock.yaml");
      expect(paths).toHaveLength(1);
    });

    it("should return yarn lockfile path for yarn client", () => {
      mockFs.existsSync.mockImplementation((path) => path === "/test/project/yarn.lock");

      const paths = getModifiedLockfilePaths(testRootPath, "yarn");

      expect(paths).toContain("/test/project/yarn.lock");
      expect(paths).toHaveLength(1);
    });

    it("should return npm lockfile path for npm client when it exists", () => {
      mockFs.existsSync.mockImplementation((path) => path === "/test/project/package-lock.json");

      const paths = getModifiedLockfilePaths(testRootPath, "npm");

      expect(paths).toContain("/test/project/package-lock.json");
      expect(paths).toHaveLength(1);
    });

    it("should return npm lockfile path for default/undefined client", () => {
      mockFs.existsSync.mockImplementation((path) => path === "/test/project/package-lock.json");

      const paths = getModifiedLockfilePaths(testRootPath);

      expect(paths).toContain("/test/project/package-lock.json");
      expect(paths).toHaveLength(1);
    });

    it("should return empty array when npm lockfile doesn't exist and no client specified", () => {
      mockFs.existsSync.mockReturnValue(false);

      const paths = getModifiedLockfilePaths(testRootPath);

      expect(paths).toHaveLength(0);
    });

    it("should include lockfile path even when it doesn't exist for non-npm clients", () => {
      mockFs.existsSync.mockReturnValue(false);

      const pnpmPaths = getModifiedLockfilePaths(testRootPath, "pnpm");
      const yarnPaths = getModifiedLockfilePaths(testRootPath, "yarn");

      expect(pnpmPaths).toContain("/test/project/pnpm-lock.yaml");
      expect(yarnPaths).toContain("/test/project/yarn.lock");
    });

    it("should handle multiple lockfiles correctly", () => {
      mockFs.existsSync.mockReturnValue(true);

      const npmPaths = getModifiedLockfilePaths(testRootPath, "npm");
      const yarnPaths = getModifiedLockfilePaths(testRootPath, "yarn");

      expect(npmPaths).toHaveLength(1);
      expect(yarnPaths).toHaveLength(1);
      expect(npmPaths[0]).not.toBe(yarnPaths[0]);
    });
  });
});
