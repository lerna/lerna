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

    it.each(["npm", "yarn", "bun"])("invokes %s directly", (npmClient) => {
      execPackageManager(npmClient, ["install"], opts);
      expect(childProcess.exec).toHaveBeenCalledWith(npmClient, ["install"], opts);
    });

    it("invokes pnpm directly with strictDepBuilds disabled for pnpm 12+", () => {
      execPackageManager("pnpm", ["install"], opts);
      expect(childProcess.exec).toHaveBeenCalledWith("pnpm", ["install"], {
        ...opts,
        env: expect.objectContaining({
          PNPM_CONFIG_STRICT_DEP_BUILDS: "false",
          PNPM_CONFIG_LINK_WORKSPACE_PACKAGES: "true",
          PNPM_CONFIG_PREFER_WORKSPACE_PACKAGES: "true",
          npm_config_link_workspace_packages: "true",
          npm_config_prefer_workspace_packages: "true",
        }),
      });
    });
  });

  describe("when corepack is enabled", () => {
    beforeEach(() => {
      process.env["COREPACK_ROOT"] = "/usr/local/lib/corepack";
    });

    it.each(["npm", "yarn"])("wraps %s in corepack", (npmClient) => {
      execPackageManager(npmClient, ["install", "--lockfile-only"], opts);
      expect(childProcess.exec).toHaveBeenCalledWith(
        "corepack",
        [npmClient, "install", "--lockfile-only"],
        opts
      );
    });

    it("wraps pnpm in corepack with strictDepBuilds disabled for pnpm 12+", () => {
      execPackageManager("pnpm", ["install", "--lockfile-only"], opts);
      expect(childProcess.exec).toHaveBeenCalledWith("corepack", ["pnpm", "install", "--lockfile-only"], {
        ...opts,
        env: expect.objectContaining({
          PNPM_CONFIG_STRICT_DEP_BUILDS: "false",
          PNPM_CONFIG_LINK_WORKSPACE_PACKAGES: "true",
          PNPM_CONFIG_PREFER_WORKSPACE_PACKAGES: "true",
          npm_config_link_workspace_packages: "true",
          npm_config_prefer_workspace_packages: "true",
        }),
      });
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
