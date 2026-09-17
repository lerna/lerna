import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";

function packageDir(name: string): string {
  let dir = import.meta.dirname;

  while (dir !== dirname(dir)) {
    const pkgPath = join(dir, "node_modules", ...name.split("/"), "package.json");
    if (existsSync(pkgPath)) {
      return dirname(pkgPath);
    }
    dir = dirname(dir);
  }

  throw new Error(`Cannot find package directory for ${name}`);
}

function copyPackage(nodeModulesDir: string, name: string) {
  const dest = join(nodeModulesDir, name);
  mkdirSync(dirname(dest), { recursive: true });
  // Copy rather than symlink so Node's ESM resolver cannot realpath back into
  // the workspace node_modules and pick up hoisted optional peers.
  cpSync(packageDir(name), dest, { recursive: true });
}

describe("conventional-changelog dependency closure (#4427)", () => {
  it("declares conventional-commits-filter so @conventional-changelog/git-client can resolve it", () => {
    const changelogPkg = JSON.parse(
      readFileSync(join(packageDir("conventional-changelog"), "package.json"), "utf8")
    );

    expect(changelogPkg.dependencies["conventional-commits-filter"]).toBeDefined();
  });

  it("does not throw ERR_MODULE_NOT_FOUND for conventional-commits-filter when git-client is nested under conventional-changelog", () => {
    const changelogPkg = JSON.parse(
      readFileSync(join(packageDir("conventional-changelog"), "package.json"), "utf8")
    );
    const isolated = mkdtempSync(join(tmpdir(), "lerna-4427-"));

    try {
      // Mimic npm --install-strategy=nested: git-client lives under
      // conventional-changelog/node_modules and can only see packages declared
      // by conventional-changelog itself (not optional peers of git-client).
      const nestedNodeModules = join(isolated, "node_modules", "conventional-changelog", "node_modules");
      mkdirSync(nestedNodeModules, { recursive: true });
      copyPackage(nestedNodeModules, "@conventional-changelog/git-client");

      if (changelogPkg.dependencies["conventional-commits-filter"]) {
        copyPackage(nestedNodeModules, "conventional-commits-filter");
      }

      const gitClientDist = join(nestedNodeModules, "@conventional-changelog/git-client/dist");
      const probe = join(gitClientDist, "probe-conventional-commits-filter.mjs");
      writeFileSync(probe, `await import("conventional-commits-filter");\nconsole.log("ok");\n`);

      const output = execFileSync(process.execPath, [probe], { encoding: "utf8" });

      expect(output.trim()).toBe("ok");
    } finally {
      rmSync(isolated, { recursive: true, force: true });
    }
  });
});
