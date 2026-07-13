import { execPackageManager, execPackageManagerSync } from "./exec-package-manager";

vi.mock("@lerna/child-process");

// eslint-disable-next-line @typescript-eslint/no-var-requires
import * as childProcess from "@lerna/child-process";

describe("execPackageManager", () => {
  const originalCorepackRoot = process.env["COREPACK_ROOT"];
  const opts = { cwd: "/test" };

  afterEach(() => {
    if (originalCorepackRoot === undefined) {
      delete process.env["COREPACK_ROOT"];
    } else {
      process.env["COREPACK_ROOT"] = originalCorepackRoot;
    }
    vi.clearAllMocks();
  });

  describe("when corepack is not enabled", () => {
    beforeEach(() => {
      delete process.env["COREPACK_ROOT"];
    });

    it.each(["npm", "yarn", "pnpm", "bun"])("invokes %s directly", (npmClient) => {
      execPackageManager(npmClient, ["install"], opts);
      expect(childProcess.exec).toHaveBeenCalledWith(npmClient, ["install"], opts);
    });
  });

  describe("when corepack is enabled", () => {
    beforeEach(() => {
      process.env["COREPACK_ROOT"] = "/usr/local/lib/corepack";
    });

    it.each(["npm", "yarn", "pnpm"])("wraps %s in corepack", (npmClient) => {
      execPackageManager(npmClient, ["install", "--lockfile-only"], opts);
      expect(childProcess.exec).toHaveBeenCalledWith(
        "corepack",
        [npmClient, "install", "--lockfile-only"],
        opts
      );
    });

    it("bypasses corepack for bun, which corepack does not support", () => {
      execPackageManager("bun", ["install", "--lockfile-only"], opts);
      expect(childProcess.exec).toHaveBeenCalledWith("bun", ["install", "--lockfile-only"], opts);
    });

    it("bypasses corepack for bun in the sync variant", () => {
      execPackageManagerSync("bun", ["--version"], opts);
      expect(childProcess.execSync).toHaveBeenCalledWith("bun", ["--version"], opts);
    });

    it("wraps yarn in corepack in the sync variant", () => {
      execPackageManagerSync("yarn", ["--version"], opts);
      expect(childProcess.execSync).toHaveBeenCalledWith("corepack", ["yarn", "--version"], opts);
    });
  });
});
