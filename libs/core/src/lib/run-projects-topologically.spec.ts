import { ProjectGraphDependency, ProjectGraphProjectNode } from "@nrwl/devkit";
import { runProjectsTopologically } from "./run-projects-topologically";
import { projectGraphDependency } from "./test-helpers/create-project-graph";

describe("runProjectsTopologically", () => {
  it("should run projects in order by depth of tree with leaves first", async () => {
    const projects: ProjectGraphProjectNode[] = [
      // the order of this array is by root path
      // this simulates Object.values(...) on projectGraph.nodes
      // see ./command/create-project-graph-with-packages for details
      {
        name: "ppp2",
        type: "lib",
        data: {
          root: "packages-other/eee2",
          files: [],
        },
      },
      {
        name: "ooo1",
        type: "lib",
        data: {
          root: "packages-other/ooo1",
          files: [],
        },
      },
      {
        name: "ooo2",
        type: "lib",
        data: {
          root: "packages-other/ooo2",
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
        name: "other-2",
        type: "lib",
        data: {
          root: "packages/other-2",
          files: [],
        },
      },
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
        name: "package-2",
        type: "lib",
        data: {
          root: "packages/package-2",
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
    ];
    const projectGraphDependencies: Record<string, ProjectGraphDependency[]> = {
      "other-1": [
        projectGraphDependency({
          source: "other-1",
          target: "other-2",
        }),
      ],
      "package-1": [
        projectGraphDependency({ source: "package-1", target: "package-2" }),
        projectGraphDependency({ source: "package-1", target: "package-base" }),
      ],
      "package-2": [projectGraphDependency({ source: "package-2", target: "package-base" })],
      ooo1: [
        projectGraphDependency({ source: "ooo1", target: "ooo2" }),
        projectGraphDependency({ source: "ooo1", target: "ppp2" }),
      ],
    };

    const result: string[] = [];
    const runner = (node: ProjectGraphProjectNode) => {
      result.push(node.name);
      return Promise.resolve();
    };

    await runProjectsTopologically(projects, projectGraphDependencies, runner, { concurrency: 4 });

    expect(result).toEqual([
      "ppp2",
      "ooo2",
      "other-2",
      "other-with-scope",
      "package-base",
      "ooo1",
      "other-1",
      "package-2",
      "package-1",
    ]);
  });

  it("should handle cycles", async () => {
    const projects: ProjectGraphProjectNode[] = [
      // the order of this array is by root path
      // this simulates Object.values(...) on projectGraph.nodes
      // see ./command/create-project-graph-with-packages for details
      {
        name: "ppp2",
        type: "lib",
        data: {
          root: "packages-other/eee2",
          files: [],
        },
      },
      {
        name: "ooo1",
        type: "lib",
        data: {
          root: "packages-other/ooo1",
          files: [],
        },
      },
      {
        name: "ooo2",
        type: "lib",
        data: {
          root: "packages-other/ooo2",
          files: [],
        },
      },
      {
        name: "cycle-1",
        type: "lib",
        data: {
          root: "packages/cycle-1",
          files: [],
        },
      },
      {
        name: "cycle-2",
        type: "lib",
        data: {
          root: "packages/cycle-2",
          files: [],
        },
      },
      {
        name: "cycle-3",
        type: "lib",
        data: {
          root: "packages/cycle-3",
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
        name: "other-2",
        type: "lib",
        data: {
          root: "packages/other-2",
          files: [],
        },
      },
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
        name: "package-2",
        type: "lib",
        data: {
          root: "packages/package-2",
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
    ];
    const projectGraphDependencies: Record<string, ProjectGraphDependency[]> = {
      "cycle-1": [
        projectGraphDependency({ source: "cycle-1", target: "cycle-2" }),
        projectGraphDependency({ source: "cycle-1", target: "ooo1" }),
      ],
      "cycle-2": [
        projectGraphDependency({ source: "cycle-2", target: "cycle-3" }),
        projectGraphDependency({ source: "cycle-2", target: "ooo1" }),
      ],
      "cycle-3": [projectGraphDependency({ source: "cycle-3", target: "cycle-1" })],
      "other-1": [
        projectGraphDependency({
          source: "other-1",
          target: "other-2",
        }),
      ],
      "package-1": [
        projectGraphDependency({ source: "package-1", target: "package-2" }),
        projectGraphDependency({ source: "package-1", target: "package-base" }),
      ],
      "package-2": [
        projectGraphDependency({ source: "package-2", target: "package-base" }),
        projectGraphDependency({ source: "package-2", target: "cycle-1" }),
      ],
      ooo1: [
        projectGraphDependency({ source: "ooo1", target: "ooo2" }),
        projectGraphDependency({ source: "ooo1", target: "ppp2" }),
      ],
    };

    const result: string[] = [];
    const runner = (node: ProjectGraphProjectNode) => {
      result.push(node.name);
      return Promise.resolve();
    };

    await runProjectsTopologically(projects, projectGraphDependencies, runner, { concurrency: 4 });

    expect(result).toEqual([
      "ppp2",
      "ooo2",
      "other-2",
      "other-with-scope",
      "package-base",
      "ooo1",
      "other-1",
      "cycle-1",
      "cycle-2",
      "cycle-3",
      "package-2",
      "package-1",
    ]);
  });

  it("should handle nested cycles", async () => {
    const projects: ProjectGraphProjectNode[] = [
      // the order of this array is by root path
      // this simulates Object.values(...) on projectGraph.nodes
      // see ./command/create-project-graph-with-packages for details
      {
        name: "package-1",
        type: "lib",
        data: {
          root: "packages/package-1",
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
        name: "package-3",
        type: "lib",
        data: {
          root: "packages/package-3",
          files: [],
        },
      },
      {
        name: "package-4",
        type: "lib",
        data: {
          root: "packages/package-4",
          files: [],
        },
      },
      {
        name: "package-5",
        type: "lib",
        data: {
          root: "packages/package-5",
          files: [],
        },
      },
      {
        name: "package-6",
        type: "lib",
        data: {
          root: "packages/package-6",
          files: [],
        },
      },
      {
        name: "package-7",
        type: "lib",
        data: {
          root: "packages/package-7",
          files: [],
        },
      },
      {
        name: "package-8",
        type: "lib",
        data: {
          root: "packages/package-8",
          files: [],
        },
      },
      {
        name: "package-9",
        type: "lib",
        data: {
          root: "packages/package-9",
          files: [],
        },
      },
    ];
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
      "package-8": [projectGraphDependency({ source: "package-8", target: "package-9" })],
    };

    const result: string[] = [];
    const runner = (node: ProjectGraphProjectNode) => {
      result.push(node.name);
      return Promise.resolve();
    };

    await runProjectsTopologically(projects, projectGraphDependencies, runner, { concurrency: 4 });

    expect(result).toEqual([
      "package-9",
      "package-8",
      "package-2",
      "package-3",
      "package-4",
      "package-5",
      "package-6",
      "package-7",
      "package-1",
    ]);
  });
});
