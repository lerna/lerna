import { ProjectGraphProjectNode } from "@nrwl/devkit";
import { addDependencies } from "./add-dependencies";
import { createProjectGraph, projectGraphDependency, projectNode } from "./test-helpers/create-project-graph";

describe("addDependencies", () => {
  it("should add dependencies", () => {
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
    ];
    const projectGraph = createProjectGraph({
      projects,
      dependencies: [
        projectGraphDependency({ source: "depends-on-a", target: "base-lib-a" }),
        projectGraphDependency({ source: "depends-on-b", target: "base-lib-b" }),
        projectGraphDependency({ source: "depends-on-a-and-b", target: "base-lib-a" }),
        projectGraphDependency({ source: "depends-on-a-and-b", target: "base-lib-b" }),
        projectGraphDependency({ source: "depends-on-c", target: "base-lib-c" }),
        projectGraphDependency({ source: "depends-on-depends-on-c", target: "depends-on-c" }),
        projectGraphDependency({ source: "top-lib", target: "depends-on-depends-on-c" }),
        projectGraphDependency({ source: "top-lib", target: "depends-on-a-and-b" }),
        projectGraphDependency({ source: "cycle-1", target: "cycle-2" }),
        projectGraphDependency({ source: "cycle-2", target: "cycle-1" }),
        projectGraphDependency({ source: "cycle-leaf", target: "cycle-2" }),
      ],
    });

    const subsetOfProjects = [
      projectNode({ name: "depends-on-a-and-b" }),
      projectNode({ name: "depends-on-a" }),
      projectNode({ name: "top-lib" }),
      projectNode({ name: "base-lib-b" }),
      projectNode({ name: "cycle-leaf" }),
    ];

    const result = addDependencies(subsetOfProjects, projectGraph);
    expect(result).toEqual([
      projectNode({ name: "depends-on-a-and-b" }),
      projectNode({ name: "depends-on-a" }),
      projectNode({ name: "top-lib" }),
      projectNode({ name: "base-lib-b" }),
      projectNode({ name: "cycle-leaf" }),
      projectNode({ name: "base-lib-a" }),
      projectNode({ name: "depends-on-depends-on-c" }),
      projectNode({ name: "depends-on-c" }),
      projectNode({ name: "base-lib-c" }),
      projectNode({ name: "cycle-2" }),
      projectNode({ name: "cycle-1" }),
    ]);
  });
});
