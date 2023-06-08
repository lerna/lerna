import { ProjectGraphProjectNode } from "@nx/devkit";
import { addDependents } from "./add-dependents";
import { createProjectGraph, projectGraphDependency, projectNode } from "./test-helpers/create-project-graph";

describe("addDependents", () => {
  it("should add dependents", () => {
    const projects: ProjectGraphProjectNode[] = [
      projectNode({ name: "base-lib-a" }),
      projectNode({ name: "base-lib-b" }),
      projectNode({ name: "base-lib-c" }),
      projectNode({ name: "depends-on-a" }),
      projectNode({ name: "depends-on-b" }),
      projectNode({ name: "depends-on-a-and-b" }),
      projectNode({ name: "depends-on-c" }),
      projectNode({ name: "depends-on-depends-on-c" }),
      projectNode({ name: "top-lib" }),
      projectNode({ name: "cycle-1" }),
      projectNode({ name: "cycle-2" }),
      projectNode({ name: "cycle-leaf" }),
      projectNode({ name: "depends-on-other-version-of-a" }),
    ];
    const projectGraph = createProjectGraph({
      projects,
      dependencies: [
        projectGraphDependency({
          source: "depends-on-a",
          target: "base-lib-a",
          targetVersionMatchesDependencyRequirement: true,
        }),
        projectGraphDependency({
          source: "depends-on-b",
          target: "base-lib-b",
          targetVersionMatchesDependencyRequirement: true,
        }),
        projectGraphDependency({
          source: "depends-on-a-and-b",
          target: "base-lib-a",
          targetVersionMatchesDependencyRequirement: true,
        }),
        projectGraphDependency({
          source: "depends-on-a-and-b",
          target: "base-lib-b",
          targetVersionMatchesDependencyRequirement: true,
        }),
        projectGraphDependency({
          source: "depends-on-c",
          target: "base-lib-c",
          targetVersionMatchesDependencyRequirement: true,
        }),
        projectGraphDependency({
          source: "depends-on-depends-on-c",
          target: "depends-on-c",
          targetVersionMatchesDependencyRequirement: true,
        }),
        projectGraphDependency({
          source: "top-lib",
          target: "depends-on-depends-on-c",
          targetVersionMatchesDependencyRequirement: true,
        }),
        projectGraphDependency({
          source: "top-lib",
          target: "depends-on-a-and-b",
          targetVersionMatchesDependencyRequirement: true,
        }),
        projectGraphDependency({
          source: "cycle-1",
          target: "cycle-2",
          targetVersionMatchesDependencyRequirement: true,
        }),
        projectGraphDependency({
          source: "cycle-2",
          target: "cycle-1",
          targetVersionMatchesDependencyRequirement: true,
        }),
        projectGraphDependency({
          source: "cycle-leaf",
          target: "cycle-2",
          targetVersionMatchesDependencyRequirement: true,
        }),
        projectGraphDependency({
          source: "depends-on-other-version-of-a",
          target: "base-lib-a",
          targetVersionMatchesDependencyRequirement: false,
        }),
      ],
    });

    const subsetOfProjects = [
      projectNode({ name: "base-lib-a" }),
      projectNode({ name: "depends-on-a" }),
      projectNode({ name: "base-lib-b" }),
      projectNode({ name: "cycle-1" }),
    ];

    const result = addDependents(subsetOfProjects, projectGraph);
    expect(result).toEqual([
      projectNode({ name: "base-lib-a" }),
      projectNode({ name: "depends-on-a" }),
      projectNode({ name: "base-lib-b" }),
      projectNode({ name: "cycle-1" }),
      projectNode({ name: "depends-on-a-and-b" }),
      projectNode({ name: "top-lib" }),
      projectNode({ name: "depends-on-b" }),
      projectNode({ name: "cycle-2" }),
      projectNode({ name: "cycle-leaf" }),
    ]);
  });
});
