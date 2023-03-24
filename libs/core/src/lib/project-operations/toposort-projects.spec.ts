import { ProjectGraphDependency, ProjectGraphProjectNode } from "@nrwl/devkit";
import { projectGraphDependency } from "./test-helpers/create-project-graph";
import { toposortProjects } from "./toposort-projects";

describe("toposortProjects", () => {
  it("should order projects by depth of the tree with leaves first", () => {
    const projects: ProjectGraphProjectNode[] = [
      {
        name: "other-with-scope",
        type: "lib",
        data: {
          root: "packages/other-with-scope",
          files: [],
        },
      },
      {
        name: "package-1",
        type: "lib",
        data: {
          root: "packages/package-1",
          files: [],
        },
      },
      {
        name: "package-base",
        type: "lib",
        data: {
          root: "packages/package-base",
          files: [],
        },
      },
      {
        name: "other-1",
        type: "lib",
        data: {
          root: "packages/other-1",
          files: [],
        },
      },
      {
        name: "package-2",
        type: "lib",
        data: {
          root: "packages/package-2",
          files: [],
        },
      },
      {
        name: "other-2",
        type: "lib",
        data: {
          root: "packages/other-2",
          files: [],
        },
      },
    ];
    const projectGraphDependencies: Record<string, ProjectGraphDependency[]> = {
      "other-with-scope": [],
      "package-base": [],
      "package-1": [
        projectGraphDependency({ source: "package-1", target: "package-base" }),
        projectGraphDependency({ source: "package-1", target: "package-2" }),
      ],
      "package-2": [projectGraphDependency({ source: "package-2", target: "package-base" })],
      "other-1": [
        projectGraphDependency({
          source: "other-1",
          target: "other-2",
        }),
      ],
      "other-2": [],
    };

    expect(toposortProjects(projects, projectGraphDependencies).map((p) => p.name)).toEqual([
      "other-with-scope",
      "package-base",
      "other-2",
      "other-1",
      "package-2",
      "package-1",
    ]);
  });
});
