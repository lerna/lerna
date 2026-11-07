vi.mock("@lerna/child-process");

// mocked modules

import * as childProcess from "@lerna/child-process";

/* eslint-disable @nx/enforce-module-boundaries */
// nx-ignore-next-line
import { gitAdd, gitCommit, initFixtureFactory } from "@lerna/test-helpers";
import { execFileSync } from "child_process";
import fs from "fs-extra";
import { basename, join } from "path";
import { Package } from "../package";
import { ProjectGraphProjectNodeWithPackage } from "../project-graph-with-packages";
// file under test
import { makeDiffPredicate } from "./make-diff-predicate";

const initFixture = initFixtureFactory(__dirname);

function setup(changes: string[]) {
  const baseChanges: string[] = [];
  // mock git diff to return the provided changes
  childProcess.execSync.mockReturnValueOnce(baseChanges.concat(changes).join("\0"));
}

describe("makeDiffPredicate", () => {
  it("git diff call", () => {
    setup([
      "packages/pkg-1/__tests__/index.test.js",
      "packages/pkg-1/index.js",
      "packages/pkg-1/package.json",
      "packages/pkg-1/README.md",
    ]);

    const hasDiff = makeDiffPredicate("v1.0.0", { cwd: "/test" });
    const result = hasDiff(
      nodeWithPackage({
        location: "/test/packages/pkg-1",
      })
    );

    expect(result).toBe(true);
    expect(childProcess.execSync).toHaveBeenLastCalledWith(
      "git",
      ["diff", "--name-only", "-z", "v1.0.0", "--", "packages/pkg-1"],
      { cwd: "/test" }
    );
  });

  it("empty diff", () => {
    setup([""]);

    const hasDiff = makeDiffPredicate("v1.0.0", { cwd: "/test" });
    const result = hasDiff(
      nodeWithPackage({
        location: "/test/packages/pkg-1",
      })
    );

    expect(result).toBe(false);
  });

  it("rooted package", () => {
    setup(["package.json"]);

    const hasDiff = makeDiffPredicate("deadbeef", { cwd: "/test" });
    const result = hasDiff(
      nodeWithPackage({
        location: "/test",
      })
    );

    expect(result).toBe(true);
    expect(childProcess.execSync).toHaveBeenLastCalledWith("git", ["diff", "--name-only", "-z", "deadbeef"], {
      cwd: "/test",
    });
  });

  it("ignore changes (globstars)", () => {
    setup([
      "packages/pkg-2/examples/.eslintrc.yaml",
      "packages/pkg-2/examples/do-a-thing/index.js",
      "packages/pkg-2/examples/and-another-thing/package.json",
    ]);

    const hasDiff = makeDiffPredicate("v1.0.0", { cwd: "/test" }, ["**/examples/**", "*.md"]);
    const result = hasDiff(
      nodeWithPackage({
        location: "/test/packages/pkg-2",
      })
    );

    expect(result).toBe(false);
  });

  it("ignore changes (match base)", () => {
    setup(["packages/pkg-3/README.md"]);

    const hasDiff = makeDiffPredicate("v1.0.0", { cwd: "/test" }, ["*.md"]);
    const result = hasDiff(
      nodeWithPackage({
        location: "/test/packages/pkg-3",
      })
    );

    expect(result).toBe(false);
  });

  it("ignore changes (non-ASCII file names)", async () => {
    // run the real git, which quotes non-ASCII paths in its default output
    const actual = await vi.importActual<typeof childProcess>("@lerna/child-process");
    vi.mocked(childProcess.execSync).mockImplementationOnce(actual.execSync);

    const cwd = await initFixture("basic");
    // git's default, set explicitly so a user-level `core.quotePath=false` can't hide the problem
    execFileSync("git", ["config", "core.quotePath", "true"], { cwd });
    await fs.outputFile(join(cwd, "packages/pkg-4/docs/使い方.md"), "# docs\n");
    await gitAdd(cwd, "-A");
    await gitCommit(cwd, "docs");

    const hasDiff = makeDiffPredicate("HEAD~1", { cwd }, ["*.md"]);
    const result = hasDiff(
      nodeWithPackage({
        location: join(cwd, "packages/pkg-4"),
      })
    );

    expect(result).toBe(false);
  });
});

const nodeWithPackage = (pkg: { location: string }): ProjectGraphProjectNodeWithPackage =>
  ({ name: basename(pkg.location), package: pkg as Package }) as ProjectGraphProjectNodeWithPackage;
