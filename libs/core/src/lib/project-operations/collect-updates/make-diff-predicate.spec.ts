jest.mock("@lerna/child-process");

// mocked modules
// eslint-disable-next-line @typescript-eslint/no-var-requires
const childProcess = require("@lerna/child-process");

import { basename } from "path";
import { Package } from "../../package";
import { ProjectGraphProjectNodeWithPackage } from "../project-graph-with-packages";
// file under test
import { makeDiffPredicate } from "./make-diff-predicate";

function setup(changes: string[]) {
  const baseChanges: string[] = [];
  // mock git diff to return the provided changes
  childProcess.execSync.mockReturnValueOnce(baseChanges.concat(changes).join("\n"));
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
      ["diff", "--name-only", "v1.0.0", "--", "packages/pkg-1"],
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
    expect(childProcess.execSync).toHaveBeenLastCalledWith("git", ["diff", "--name-only", "deadbeef"], {
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
});

const nodeWithPackage = (pkg: { location: string }): ProjectGraphProjectNodeWithPackage =>
  ({ name: basename(pkg.location), package: pkg as Package } as ProjectGraphProjectNodeWithPackage);
