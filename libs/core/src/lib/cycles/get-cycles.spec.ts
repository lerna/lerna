import { ProjectGraphDependency } from "@nx/devkit";
import { projectGraphDependency } from "../test-helpers/create-project-graph";
import { getCycles } from "./get-cycles";

describe("getCycles", () => {
  it("should find a single cycle", () => {
    const projectGraphDependencies: Record<string, ProjectGraphDependency[]> = {
      "package-1": [projectGraphDependency({ source: "package-1", target: "package-2" })],
      "package-2": [projectGraphDependency({ source: "package-2", target: "package-3" })],
      "package-3": [projectGraphDependency({ source: "package-3", target: "package-2" })],
    };

    expect(getCycles(projectGraphDependencies)).toEqual([["package-2", "package-3"]]);
  });

  it("should find two independent cycles", () => {
    const projectGraphDependencies: Record<string, ProjectGraphDependency[]> = {
      "package-a": [projectGraphDependency({ source: "package-a", target: "package-b" })],
      "package-b": [projectGraphDependency({ source: "package-b", target: "package-c" })],
      "package-c": [projectGraphDependency({ source: "package-c", target: "package-a" })],
      "package-1": [projectGraphDependency({ source: "package-1", target: "package-2" })],
      "package-2": [projectGraphDependency({ source: "package-2", target: "package-3" })],
      "package-3": [projectGraphDependency({ source: "package-3", target: "package-1" })],
      "package-x": [projectGraphDependency({ source: "package-x", target: "package-xx" })],
      "package-xx": [
        projectGraphDependency({ source: "package-xx", target: "package-b" }),
        projectGraphDependency({ source: "package-xx", target: "package-3" }),
      ],
    };

    expect(getCycles(projectGraphDependencies)).toEqual([
      ["package-a", "package-b", "package-c"],
      ["package-1", "package-2", "package-3"],
    ]);
  });

  it("should find two cycles with overlapping nodes", () => {
    const projectGraphDependencies: Record<string, ProjectGraphDependency[]> = {
      "package-1": [
        projectGraphDependency({ source: "package-1", target: "package-2" }),
        projectGraphDependency({ source: "package-1", target: "package-7" }),
      ],
      "package-2": [projectGraphDependency({ source: "package-2", target: "package-3" })],
      "package-3": [
        projectGraphDependency({ source: "package-3", target: "package-4" }),
        projectGraphDependency({ source: "package-3", target: "package-5" }),
      ],
      "package-4": [projectGraphDependency({ source: "package-4", target: "package-2" })],
      "package-5": [projectGraphDependency({ source: "package-5", target: "package-6" })],
      "package-6": [projectGraphDependency({ source: "package-6", target: "package-3" })],
      "package-7": [projectGraphDependency({ source: "package-7", target: "package-5" })],
    };

    expect(getCycles(projectGraphDependencies)).toEqual([
      ["package-2", "package-3", "package-4"],
      ["package-3", "package-5", "package-6"],
    ]);
  });
});
