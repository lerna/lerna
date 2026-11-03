import { ProjectGraphProjectNodeWithPackage } from "@lerna/core";
/* eslint-disable @nx/enforce-module-boundaries */
// nx-ignore-next-line
import { gitAdd, gitCommit, initFixtureFactory } from "@lerna/test-helpers";
import { execFileSync } from "child_process";
import fs from "fs-extra";
import { join } from "path";

const initFixture = initFixtureFactory(__dirname);

// file under test
import { getProjectsWithTaggedPackages } from "./get-projects-with-tagged-packages";

describe("getProjectsWithTaggedPackages", () => {
  it("finds packages with non-ASCII paths changed in the release commit", async () => {
    const cwd = await initFixture("normal");
    // git's default, set explicitly so a user-level `core.quotePath=false` can't hide the problem
    execFileSync("git", ["config", "core.quotePath", "true"], { cwd });
    await fs.outputJSON(join(cwd, "packages/パッケージ/package.json"), { name: "pkg-ja", version: "1.0.1" });
    await gitAdd(cwd, "-A");
    await gitCommit(cwd, "release");

    const projectNodes = [{ name: "pkg-ja" }, { name: "package-1" }] as ProjectGraphProjectNodeWithPackage[];
    const projectFileMap = {
      "pkg-ja": [{ file: "packages/パッケージ/package.json", hash: "" }],
      "package-1": [{ file: "packages/package-1/package.json", hash: "" }],
    };

    const result = await getProjectsWithTaggedPackages(projectNodes, projectFileMap, { cwd });

    expect(result.map((node) => node.name)).toEqual(["pkg-ja"]);
  });
});
