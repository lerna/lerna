import { ProjectGraphProjectNode } from "@nx/devkit";
import {
  ProjectGraphProjectNodeWithPackage,
  ProjectGraphWorkspacePackageDependency,
} from "./project-graph-with-packages";
import { runProjectsTopologically } from "./run-projects-topologically";
import { createProjectGraph, projectGraphDependency, projectNode } from "./test-helpers/create-project-graph";

describe("runProjectsTopologically", () => {
  it("should run projects in order by depth of tree with leaves first", async () => {
    const projects: ProjectGraphProjectNodeWithPackage[] = [
      // the order of this array is by root path
      // this simulates Object.values(...) on projectGraph.nodes
      // see ./command/create-project-graph-with-packages for details
      projectNode({
        name: "ppp2",
        type: "lib",
        data: {
          root: "packages-other/eee2",
        },
      }),
      projectNode({
        name: "ooo1",
        type: "lib",
        data: {
          root: "packages-other/ooo1",
        },
      }),
      projectNode({
        name: "ooo2",
        type: "lib",
        data: {
          root: "packages-other/ooo2",
        },
      }),
      projectNode({
        name: "other-1",
        type: "lib",
        data: {
          root: "packages/other-1",
        },
      }),
      projectNode({
        name: "other-2",
        type: "lib",
        data: {
          root: "packages/other-2",
        },
      }),
      projectNode({
        name: "other-with-scope",
        type: "lib",
        data: {
          root: "packages/other-with-scope",
        },
      }),
      projectNode({
        name: "package-1",
        type: "lib",
        data: {
          root: "packages/package-1",
        },
      }),
      projectNode({
        name: "package-2",
        type: "lib",
        data: {
          root: "packages/package-2",
        },
      }),
      projectNode({
        name: "package-base",
        type: "lib",
        data: {
          root: "packages/package-base",
        },
      }),
    ];
    const dependencies: ProjectGraphWorkspacePackageDependency[] = [
      projectGraphDependency({
        source: "other-1",
        target: "other-2",
        targetVersionMatchesDependencyRequirement: true,
      }),
      projectGraphDependency({
        source: "package-1",
        target: "package-2",
        targetVersionMatchesDependencyRequirement: true,
      }),
      projectGraphDependency({
        source: "package-1",
        target: "package-base",
        targetVersionMatchesDependencyRequirement: true,
      }),
      projectGraphDependency({
        source: "package-2",
        target: "package-base",
        targetVersionMatchesDependencyRequirement: true,
      }),
      projectGraphDependency({
        source: "ooo1",
        target: "ooo2",
        targetVersionMatchesDependencyRequirement: true,
      }),
      projectGraphDependency({
        source: "ooo1",
        target: "ppp2",
        targetVersionMatchesDependencyRequirement: true,
      }),
    ];

    const projectGraph = createProjectGraph({ projects, dependencies });

    const result: string[] = [];
    const runner = (node: ProjectGraphProjectNode) => {
      result.push(node.name);
      return Promise.resolve();
    };

    await runProjectsTopologically(projects, projectGraph, runner, { concurrency: 4 });

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

  it("should order projects by depth of the tree with leaves first, ignoring dependencies of projects that are not provided", async () => {
    const projects: ProjectGraphProjectNodeWithPackage[] = [
      // the order of this array is by root path
      // this simulates Object.values(...) on projectGraph.nodes
      // see ./command/create-project-graph-with-packages for details
      projectNode({
        name: "package-1",
        type: "lib",
        data: {
          root: "packages/package-1",
        },
      }),
      projectNode({
        name: "package-2",
        type: "lib",
        data: {
          root: "packages/package-2",
        },
      }),
      projectNode({
        name: "package-3",
        type: "lib",
        data: {
          root: "packages/package-3",
        },
      }),
      projectNode({
        name: "package-4",
        type: "lib",
        data: {
          root: "packages/package-4",
        },
      }),
      projectNode({
        name: "package-5",
        type: "lib",
        data: {
          root: "packages/package-5",
        },
      }),
      projectNode({
        name: "package-6",
        type: "lib",
        data: {
          root: "packages/package-6",
        },
      }),
    ];
    const dependencies: ProjectGraphWorkspacePackageDependency[] = [
      projectGraphDependency({
        source: "package-1",
        target: "package-2",
        targetVersionMatchesDependencyRequirement: true,
      }),
      projectGraphDependency({
        source: "package-2",
        target: "package-3",
        targetVersionMatchesDependencyRequirement: true,
      }),
      projectGraphDependency({
        source: "package-3",
        target: "package-4",
        targetVersionMatchesDependencyRequirement: true,
      }),
      projectGraphDependency({
        source: "package-4",
        target: "package-5",
        targetVersionMatchesDependencyRequirement: true,
      }),
      projectGraphDependency({
        source: "package-5",
        target: "package-6",
        targetVersionMatchesDependencyRequirement: true,
      }),
    ];

    const projectGraph = createProjectGraph({ projects, dependencies });

    const projectsToRun = [
      projectGraph.nodes["package-2"],
      projectGraph.nodes["package-3"],
      projectGraph.nodes["package-4"],
    ];

    const result: string[] = [];
    const runner = (node: ProjectGraphProjectNode) => {
      result.push(node.name);
      return Promise.resolve();
    };

    await runProjectsTopologically(projectsToRun, projectGraph, runner, { concurrency: 4 });

    expect(result).toEqual(["package-4", "package-3", "package-2"]);
  });

  it("should order projects by depth of the tree with leaves first, ignoring and skipping dependencies of projects that are not provided", async () => {
    const projects: ProjectGraphProjectNodeWithPackage[] = [
      // the order of this array is by root path
      // this simulates Object.values(...) on projectGraph.nodes
      // see ./command/create-project-graph-with-packages for details
      projectNode({
        name: "package-1",
        type: "lib",
        data: {
          root: "packages/package-1",
        },
      }),
      projectNode({
        name: "package-2",
        type: "lib",
        data: {
          root: "packages/package-2",
        },
      }),
      projectNode({
        name: "package-3",
        type: "lib",
        data: {
          root: "packages/package-3",
        },
      }),
      projectNode({
        name: "package-4",
        type: "lib",
        data: {
          root: "packages/package-4",
        },
      }),
      projectNode({
        name: "package-5",
        type: "lib",
        data: {
          root: "packages/package-5",
        },
      }),
      projectNode({
        name: "package-6",
        type: "lib",
        data: {
          root: "packages/package-6",
        },
      }),
    ];
    const dependencies: ProjectGraphWorkspacePackageDependency[] = [
      projectGraphDependency({
        source: "package-1",
        target: "package-2",
        targetVersionMatchesDependencyRequirement: true,
      }),
      projectGraphDependency({
        source: "package-2",
        target: "package-3",
        targetVersionMatchesDependencyRequirement: true,
      }),
      projectGraphDependency({
        source: "package-3",
        target: "package-4",
        targetVersionMatchesDependencyRequirement: true,
      }),
      projectGraphDependency({
        source: "package-4",
        target: "package-5",
        targetVersionMatchesDependencyRequirement: true,
      }),
      projectGraphDependency({
        source: "package-5",
        target: "package-6",
        targetVersionMatchesDependencyRequirement: true,
      }),
    ];

    const projectGraph = createProjectGraph({ projects, dependencies });

    const projectsToRun = [projectGraph.nodes["package-2"], projectGraph.nodes["package-4"]];

    const result: string[] = [];
    const runner = (node: ProjectGraphProjectNode) => {
      result.push(node.name);
      return Promise.resolve();
    };

    await runProjectsTopologically(projectsToRun, projectGraph, runner, { concurrency: 4 });

    // lerna does not recognize the dependency chain of package-2 -> package-3 -> package-4
    // because package-3 is not in the set of projects to run.
    expect(result).toEqual(["package-2", "package-4"]);
  });

  it("should handle cycles", async () => {
    const projects: ProjectGraphProjectNodeWithPackage[] = [
      // the order of this array is by root path
      // this simulates Object.values(...) on projectGraph.nodes
      // see ./command/create-project-graph-with-packages for details
      projectNode({
        name: "ppp2",
        type: "lib",
        data: {
          root: "packages-other/eee2",
        },
      }),
      projectNode({
        name: "ooo1",
        type: "lib",
        data: {
          root: "packages-other/ooo1",
        },
      }),
      projectNode({
        name: "ooo2",
        type: "lib",
        data: {
          root: "packages-other/ooo2",
        },
      }),
      projectNode({
        name: "cycle-1",
        type: "lib",
        data: {
          root: "packages/cycle-1",
        },
      }),
      projectNode({
        name: "cycle-2",
        type: "lib",
        data: {
          root: "packages/cycle-2",
        },
      }),
      projectNode({
        name: "cycle-3",
        type: "lib",
        data: {
          root: "packages/cycle-3",
        },
      }),
      projectNode({
        name: "other-1",
        type: "lib",
        data: {
          root: "packages/other-1",
        },
      }),
      projectNode({
        name: "other-2",
        type: "lib",
        data: {
          root: "packages/other-2",
        },
      }),
      projectNode({
        name: "other-with-scope",
        type: "lib",
        data: {
          root: "packages/other-with-scope",
        },
      }),
      projectNode({
        name: "package-1",
        type: "lib",
        data: {
          root: "packages/package-1",
        },
      }),
      projectNode({
        name: "package-2",
        type: "lib",
        data: {
          root: "packages/package-2",
        },
      }),
      projectNode({
        name: "package-base",
        type: "lib",
        data: {
          root: "packages/package-base",
        },
      }),
    ];
    const dependencies: ProjectGraphWorkspacePackageDependency[] = [
      projectGraphDependency({
        source: "cycle-1",
        target: "cycle-2",
        targetVersionMatchesDependencyRequirement: true,
      }),
      projectGraphDependency({
        source: "cycle-1",
        target: "ooo1",
        targetVersionMatchesDependencyRequirement: true,
      }),
      projectGraphDependency({
        source: "cycle-2",
        target: "cycle-3",
        targetVersionMatchesDependencyRequirement: true,
      }),
      projectGraphDependency({
        source: "cycle-2",
        target: "ooo1",
        targetVersionMatchesDependencyRequirement: true,
      }),
      projectGraphDependency({
        source: "cycle-3",
        target: "cycle-1",
        targetVersionMatchesDependencyRequirement: true,
      }),
      projectGraphDependency({
        source: "other-1",
        target: "other-2",
        targetVersionMatchesDependencyRequirement: true,
      }),
      projectGraphDependency({
        source: "package-1",
        target: "package-2",
        targetVersionMatchesDependencyRequirement: true,
      }),
      projectGraphDependency({
        source: "package-1",
        target: "package-base",
        targetVersionMatchesDependencyRequirement: true,
      }),
      projectGraphDependency({
        source: "package-2",
        target: "package-base",
        targetVersionMatchesDependencyRequirement: true,
      }),
      projectGraphDependency({
        source: "package-2",
        target: "cycle-1",
        targetVersionMatchesDependencyRequirement: true,
      }),
      projectGraphDependency({
        source: "ooo1",
        target: "ooo2",
        targetVersionMatchesDependencyRequirement: true,
      }),
      projectGraphDependency({
        source: "ooo1",
        target: "ppp2",
        targetVersionMatchesDependencyRequirement: true,
      }),
    ];

    const projectGraph = createProjectGraph({ projects, dependencies });

    const result: string[] = [];
    const runner = (node: ProjectGraphProjectNode) => {
      result.push(node.name);
      return Promise.resolve();
    };

    await runProjectsTopologically(projects, projectGraph, runner, { concurrency: 4 });

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

  // https://github.com/lerna/lerna/issues/3803
  it("should gracefully ignore cycles outside the scope of projects to run", async () => {
    const projects: ProjectGraphProjectNodeWithPackage[] = [
      projectNode({
        name: "ppp2",
        type: "lib",
        data: {
          root: "packages-other/eee2",
        },
      }),
      projectNode({
        name: "ooo1",
        type: "lib",
        data: {
          root: "packages-other/ooo1",
        },
      }),
      projectNode({
        name: "ooo2",
        type: "lib",
        data: {
          root: "packages-other/ooo2",
        },
      }),
      projectNode({
        name: "cycle-1",
        type: "lib",
        data: {
          root: "packages/cycle-1",
        },
      }),
      projectNode({
        name: "cycle-2",
        type: "lib",
        data: {
          root: "packages/cycle-2",
        },
      }),
      projectNode({
        name: "cycle-3",
        type: "lib",
        data: {
          root: "packages/cycle-3",
        },
      }),
      projectNode({
        name: "other-1",
        type: "lib",
        data: {
          root: "packages/other-1",
        },
      }),
      projectNode({
        name: "other-2",
        type: "lib",
        data: {
          root: "packages/other-2",
        },
      }),
      projectNode({
        name: "other-with-scope",
        type: "lib",
        data: {
          root: "packages/other-with-scope",
        },
      }),
      projectNode({
        name: "package-1",
        type: "lib",
        data: {
          root: "packages/package-1",
        },
      }),
      projectNode({
        name: "package-2",
        type: "lib",
        data: {
          root: "packages/package-2",
        },
      }),
      projectNode({
        name: "package-base",
        type: "lib",
        data: {
          root: "packages/package-base",
        },
      }),
    ];
    const dependencies: ProjectGraphWorkspacePackageDependency[] = [
      projectGraphDependency({
        source: "cycle-1",
        target: "cycle-2",
        targetVersionMatchesDependencyRequirement: true,
      }),
      projectGraphDependency({
        source: "cycle-1",
        target: "ooo1",
        targetVersionMatchesDependencyRequirement: true,
      }),
      projectGraphDependency({
        source: "cycle-2",
        target: "cycle-3",
        targetVersionMatchesDependencyRequirement: true,
      }),
      projectGraphDependency({
        source: "cycle-2",
        target: "ooo1",
        targetVersionMatchesDependencyRequirement: true,
      }),
      projectGraphDependency({
        source: "cycle-3",
        target: "cycle-1",
        targetVersionMatchesDependencyRequirement: true,
      }),
      projectGraphDependency({
        source: "other-1",
        target: "other-2",
        targetVersionMatchesDependencyRequirement: true,
      }),
      projectGraphDependency({
        source: "package-1",
        target: "package-2",
        targetVersionMatchesDependencyRequirement: true,
      }),
      projectGraphDependency({
        source: "package-1",
        target: "package-base",
        targetVersionMatchesDependencyRequirement: true,
      }),
      projectGraphDependency({
        source: "package-2",
        target: "package-base",
        targetVersionMatchesDependencyRequirement: true,
      }),
      projectGraphDependency({
        source: "package-2",
        target: "cycle-1",
        targetVersionMatchesDependencyRequirement: true,
      }),
      projectGraphDependency({
        source: "ooo1",
        target: "ooo2",
        targetVersionMatchesDependencyRequirement: true,
      }),
      projectGraphDependency({
        source: "ooo1",
        target: "ppp2",
        targetVersionMatchesDependencyRequirement: true,
      }),

      // these projects are not passed to runProjectsTopologically
      projectGraphDependency({
        source: "cycle-1a",
        target: "cycle-2a",
        targetVersionMatchesDependencyRequirement: true,
      }),
      projectGraphDependency({
        source: "cycle-2a",
        target: "cycle-3a",
        targetVersionMatchesDependencyRequirement: true,
      }),
      projectGraphDependency({
        source: "cycle-3a",
        target: "cycle-1a",
        targetVersionMatchesDependencyRequirement: true,
      }),
    ];

    const projectGraph = createProjectGraph({ projects, dependencies });

    const result: string[] = [];
    const runner = (node: ProjectGraphProjectNode) => {
      result.push(node.name);
      return Promise.resolve();
    };

    await runProjectsTopologically(projects, projectGraph, runner, { concurrency: 4 });

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
    const projects: ProjectGraphProjectNodeWithPackage[] = [
      // the order of this array is by root path
      // this simulates Object.values(...) on projectGraph.nodes
      // see ./command/create-project-graph-with-packages for details
      projectNode({
        name: "package-1",
        type: "lib",
        data: {
          root: "packages/package-1",
        },
      }),
      projectNode({
        name: "package-2",
        type: "lib",
        data: {
          root: "packages/package-2",
        },
      }),
      projectNode({
        name: "package-3",
        type: "lib",
        data: {
          root: "packages/package-3",
        },
      }),
      projectNode({
        name: "package-4",
        type: "lib",
        data: {
          root: "packages/package-4",
        },
      }),
      projectNode({
        name: "package-5",
        type: "lib",
        data: {
          root: "packages/package-5",
        },
      }),
      projectNode({
        name: "package-6",
        type: "lib",
        data: {
          root: "packages/package-6",
        },
      }),
      projectNode({
        name: "package-7",
        type: "lib",
        data: {
          root: "packages/package-7",
        },
      }),
      projectNode({
        name: "package-8",
        type: "lib",
        data: {
          root: "packages/package-8",
        },
      }),
      projectNode({
        name: "package-9",
        type: "lib",
        data: {
          root: "packages/package-9",
        },
      }),
    ];
    const dependencies: ProjectGraphWorkspacePackageDependency[] = [
      projectGraphDependency({
        source: "package-1",
        target: "package-2",
        targetVersionMatchesDependencyRequirement: true,
      }),
      projectGraphDependency({
        source: "package-1",
        target: "package-7",
        targetVersionMatchesDependencyRequirement: true,
      }),
      projectGraphDependency({
        source: "package-2",
        target: "package-3",
        targetVersionMatchesDependencyRequirement: true,
      }),
      projectGraphDependency({
        source: "package-3",
        target: "package-4",
        targetVersionMatchesDependencyRequirement: true,
      }),
      projectGraphDependency({
        source: "package-3",
        target: "package-5",
        targetVersionMatchesDependencyRequirement: true,
      }),
      projectGraphDependency({
        source: "package-4",
        target: "package-2",
        targetVersionMatchesDependencyRequirement: true,
      }),
      projectGraphDependency({
        source: "package-5",
        target: "package-6",
        targetVersionMatchesDependencyRequirement: true,
      }),
      projectGraphDependency({
        source: "package-6",
        target: "package-3",
        targetVersionMatchesDependencyRequirement: true,
      }),
      projectGraphDependency({
        source: "package-7",
        target: "package-5",
        targetVersionMatchesDependencyRequirement: true,
      }),
      projectGraphDependency({
        source: "package-8",
        target: "package-9",
        targetVersionMatchesDependencyRequirement: true,
      }),
    ];

    const projectGraph = createProjectGraph({ projects, dependencies });

    const result: string[] = [];
    const runner = (node: ProjectGraphProjectNode) => {
      result.push(node.name);
      return Promise.resolve();
    };

    await runProjectsTopologically(projects, projectGraph, runner, { concurrency: 4 });

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

  it("should handle cycles with dependencies", async () => {
    // these projects mimic the 'cycle-separate' fixture
    const projects: ProjectGraphProjectNodeWithPackage[] = [
      projectNode({
        name: "a",
      }),
      projectNode({
        name: "b",
      }),
      projectNode({
        name: "c",
      }),
      projectNode({
        name: "d",
      }),
      projectNode({
        name: "e",
      }),
      projectNode({
        name: "f",
      }),
      projectNode({
        name: "g",
      }),
      projectNode({
        name: "h",
      }),
    ];
    const dependencies: ProjectGraphWorkspacePackageDependency[] = [
      projectGraphDependency({
        source: "a",
        target: "b",
        targetVersionMatchesDependencyRequirement: true,
      }),
      projectGraphDependency({
        source: "a",
        target: "h",
        targetVersionMatchesDependencyRequirement: true,
      }),
      projectGraphDependency({
        source: "b",
        target: "c",
        targetVersionMatchesDependencyRequirement: true,
      }),
      projectGraphDependency({
        source: "c",
        target: "d",
        targetVersionMatchesDependencyRequirement: true,
      }),
      projectGraphDependency({
        source: "d",
        target: "b",
        targetVersionMatchesDependencyRequirement: true,
      }),
      projectGraphDependency({
        source: "h",
        target: "e",
        targetVersionMatchesDependencyRequirement: true,
      }),
      projectGraphDependency({
        source: "d",
        target: "g",
        targetVersionMatchesDependencyRequirement: true,
      }),
      projectGraphDependency({
        source: "g",
        target: "e",
        targetVersionMatchesDependencyRequirement: true,
      }),
      projectGraphDependency({
        source: "e",
        target: "f",
        targetVersionMatchesDependencyRequirement: true,
      }),
      projectGraphDependency({
        source: "f",
        target: "g",
        targetVersionMatchesDependencyRequirement: true,
      }),
    ];

    const projectGraph = createProjectGraph({ projects, dependencies });

    const result: string[] = [];
    const runner = (node: ProjectGraphProjectNode) => {
      result.push(node.name);
      return Promise.resolve();
    };

    await runProjectsTopologically(projects, projectGraph, runner, { concurrency: 4 });

    expect(result).toEqual(["g", "e", "f", "b", "c", "d", "h", "a"]);
  });

  it("should run projects in order by depth of tree with leaves first, ignoring incompatible dependencies", async () => {
    const projects: ProjectGraphProjectNodeWithPackage[] = [
      // the order of this array is by root path
      // this simulates Object.values(...) on projectGraph.nodes
      // see ./command/create-project-graph-with-packages for details
      projectNode({
        name: "ppp2",
        type: "lib",
        data: {
          root: "packages-other/eee2",
        },
      }),
      projectNode({
        name: "ooo1",
        type: "lib",
        data: {
          root: "packages-other/ooo1",
        },
      }),
      projectNode({
        name: "ooo2",
        type: "lib",
        data: {
          root: "packages-other/ooo2",
        },
      }),
      projectNode({
        name: "other-1",
        type: "lib",
        data: {
          root: "packages/other-1",
        },
      }),
      projectNode({
        name: "other-2",
        type: "lib",
        data: {
          root: "packages/other-2",
        },
      }),
      projectNode({
        name: "other-with-scope",
        type: "lib",
        data: {
          root: "packages/other-with-scope",
        },
      }),
      projectNode({
        name: "package-1",
        type: "lib",
        data: {
          root: "packages/package-1",
        },
      }),
      projectNode({
        name: "package-2",
        type: "lib",
        data: {
          root: "packages/package-2",
        },
      }),
      projectNode({
        name: "package-base",
        type: "lib",
        data: {
          root: "packages/package-base",
        },
      }),
    ];
    const dependencies: ProjectGraphWorkspacePackageDependency[] = [
      projectGraphDependency({
        source: "other-1",
        target: "other-2",
        targetVersionMatchesDependencyRequirement: false,
      }),
      projectGraphDependency({
        source: "package-1",
        target: "package-2",
        targetVersionMatchesDependencyRequirement: true,
      }),
      projectGraphDependency({
        source: "package-1",
        target: "package-base",
        targetVersionMatchesDependencyRequirement: true,
      }),
      projectGraphDependency({
        source: "package-2",
        target: "package-base",
        targetVersionMatchesDependencyRequirement: false,
      }),
      projectGraphDependency({
        source: "ooo1",
        target: "ooo2",
        targetVersionMatchesDependencyRequirement: true,
      }),
      projectGraphDependency({
        source: "ooo1",
        target: "ppp2",
        targetVersionMatchesDependencyRequirement: true,
      }),
    ];

    const projectGraph = createProjectGraph({ projects, dependencies });

    const result: string[] = [];
    const runner = (node: ProjectGraphProjectNode) => {
      result.push(node.name);
      return Promise.resolve();
    };

    await runProjectsTopologically(projects, projectGraph, runner, { concurrency: 4 });

    expect(result).toEqual([
      "ppp2",
      "ooo2",
      "other-1",
      "other-2",
      "other-with-scope",
      "package-2",
      "package-base",
      "ooo1",
      "package-1",
    ]);
  });

  // https://github.com/lerna/lerna/issues/3798#issuecomment-1705306211
  // test case recreated from this repo: https://github.com/cheminfo/mass-tools/tree/test3
  // at this exact commit: abd464912df5a1e1b0293f7784d5d010eee79c2a
  it("should not traverse cycles not included in projects list", async () => {
    const projects: ProjectGraphProjectNodeWithPackage[] = [
      projectNode({
        name: "a",
      }),
      projectNode({
        name: "b",
      }),
      projectNode({
        name: "c",
      }),
      projectNode({
        name: "d",
      }),
      projectNode({
        name: "e",
      }),
      projectNode({
        name: "f",
      }),
      projectNode({
        name: "g",
      }),
    ];
    const dependencies: ProjectGraphWorkspacePackageDependency[] = [
      projectGraphDependency({
        source: "c",
        target: "b",
        targetVersionMatchesDependencyRequirement: true,
      }),
      projectGraphDependency({
        source: "c",
        target: "a",
        targetVersionMatchesDependencyRequirement: true,
      }),
      projectGraphDependency({
        source: "c",
        target: "e",
        targetVersionMatchesDependencyRequirement: true,
      }),
      projectGraphDependency({
        source: "c",
        target: "g",
        targetVersionMatchesDependencyRequirement: true,
      }),
      projectGraphDependency({
        source: "c",
        target: "f",
        targetVersionMatchesDependencyRequirement: true,
      }),
      projectGraphDependency({
        source: "c",
        target: "h",
        targetVersionMatchesDependencyRequirement: true,
      }),
      projectGraphDependency({
        source: "c",
        target: "i",
        targetVersionMatchesDependencyRequirement: true,
      }),
      projectGraphDependency({
        source: "b",
        target: "h",
        targetVersionMatchesDependencyRequirement: true,
      }),
      projectGraphDependency({
        source: "a",
        target: "b",
        targetVersionMatchesDependencyRequirement: true,
      }),
      projectGraphDependency({
        source: "a",
        target: "f",
        targetVersionMatchesDependencyRequirement: true,
      }),
      projectGraphDependency({
        source: "a",
        target: "h",
        targetVersionMatchesDependencyRequirement: true,
      }),
      projectGraphDependency({
        source: "a",
        target: "i",
        targetVersionMatchesDependencyRequirement: true,
      }),
      projectGraphDependency({
        source: "e",
        target: "f",
        targetVersionMatchesDependencyRequirement: true,
      }),
      projectGraphDependency({
        source: "d",
        target: "a",
        targetVersionMatchesDependencyRequirement: true,
      }),
      projectGraphDependency({
        source: "d",
        target: "f",
        targetVersionMatchesDependencyRequirement: true,
      }),
      projectGraphDependency({
        source: "d",
        target: "h",
        targetVersionMatchesDependencyRequirement: true,
      }),
      projectGraphDependency({
        source: "g",
        target: "f",
        targetVersionMatchesDependencyRequirement: true,
      }),
      projectGraphDependency({
        source: "g",
        target: "h",
        targetVersionMatchesDependencyRequirement: true,
      }),
      projectGraphDependency({
        source: "g",
        target: "i",
        targetVersionMatchesDependencyRequirement: true,
      }),
      projectGraphDependency({
        source: "f",
        target: "a",
        targetVersionMatchesDependencyRequirement: true,
      }),
      projectGraphDependency({
        source: "f",
        target: "h",
        targetVersionMatchesDependencyRequirement: true,
      }),
      projectGraphDependency({
        source: "f",
        target: "i",
        targetVersionMatchesDependencyRequirement: true,
      }),
      projectGraphDependency({
        source: "h",
        target: "i",
        targetVersionMatchesDependencyRequirement: true,
      }),
      projectGraphDependency({
        source: "i",
        target: "h",
        targetVersionMatchesDependencyRequirement: true,
      }),
    ];

    const projectGraph = createProjectGraph({ projects, dependencies });

    const result: string[] = [];
    const runner = (node: ProjectGraphProjectNode) => {
      result.push(node.name);
      return Promise.resolve();
    };

    await runProjectsTopologically(projects, projectGraph, runner, { concurrency: 4 });

    expect(result).toEqual(["b", "a", "f", "d", "e", "g", "c"]);
  });
});
