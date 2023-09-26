jest.mock("../describe-ref");
jest.mock("./has-tags");
jest.mock("./make-diff-predicate");

// mocked modules
import { describeRefSync } from "../describe-ref";
import { hasTags } from "./has-tags";
import { makeDiffPredicate } from "./make-diff-predicate";

// file under test
import { ProjectGraphWithPackages } from "../project-graph-with-packages";
import {
  createProjectGraph,
  projectGraphDependency,
  projectNode,
} from "../test-helpers/create-project-graph";
import { collectProjectUpdates } from "./collect-project-updates";

// default mock implementations
(describeRefSync as jest.Mock).mockReturnValue({
  lastTagName: "v1.0.0",
  lastVersion: "1.0.0",
  refCount: "1",
  sha: "deadbeef",
  isDirty: false,
});

(hasTags as jest.Mock).mockReturnValue(true);

const changedPackages = new Set();
const hasDiff = jest
  .fn()
  .mockName("hasDiff")
  .mockImplementation((node) => changedPackages.has(node.name));

(makeDiffPredicate as jest.Mock).mockImplementation(() => hasDiff);

// matcher constants
const ALL_NODES = Object.freeze([
  expect.objectContaining({ name: "package-cycle-1" }),
  expect.objectContaining({ name: "package-cycle-2" }),
  expect.objectContaining({ name: "package-cycle-extraneous-1" }),
  expect.objectContaining({ name: "package-cycle-extraneous-2" }),
  expect.objectContaining({ name: "package-dag-1" }),
  expect.objectContaining({ name: "package-dag-2a" }),
  expect.objectContaining({ name: "package-dag-2b" }),
  expect.objectContaining({ name: "package-dag-3" }),
  expect.objectContaining({ name: "package-standalone" }),
  expect.objectContaining({ name: "package-dag-5" }),
]);

describe("collectProjectUpdates", () => {
  beforeEach(() => {
    // isolate each test
    changedPackages.clear();
  });

  it("returns node with changes", () => {
    changedPackages.add("package-standalone");

    const graph = buildGraph();
    const nodes = Object.values(graph.nodes);
    const execOpts = { cwd: "/test" };

    const updates = collectProjectUpdates(nodes, graph, execOpts, {});

    expect(updates).toEqual([
      expect.objectContaining({
        name: "package-standalone",
      }),
    ]);
    expect(hasTags).toHaveBeenLastCalledWith(execOpts);
    expect(describeRefSync).toHaveBeenLastCalledWith(execOpts, undefined);
    expect(makeDiffPredicate).toHaveBeenLastCalledWith("v1.0.0", execOpts, undefined);
  });

  it("returns changed node and their dependents", () => {
    changedPackages.add("package-dag-1");

    const graph = buildGraph();
    const nodes = Object.values(graph.nodes);
    const execOpts = { cwd: "/test" };

    const updates = collectProjectUpdates(nodes, graph, execOpts, {});

    expect(updates).toEqual([
      expect.objectContaining({ name: "package-dag-1" }),
      expect.objectContaining({ name: "package-dag-2a" }),
      expect.objectContaining({ name: "package-dag-2b" }),
      expect.objectContaining({ name: "package-dag-3" }),
    ]);
  });

  it("constrains results by excluded dependents", () => {
    changedPackages.add("package-dag-1");

    const graph = buildGraph();
    const nodes = Object.values(graph.nodes);
    const execOpts = { cwd: "/test" };

    const updates = collectProjectUpdates(nodes, graph, execOpts, {
      excludeDependents: true,
    });

    expect(updates).toEqual([
      expect.objectContaining({ name: "package-dag-1" }),
      // collectDependents() is skipped
    ]);
  });

  it("constrains results by filtered packages", () => {
    changedPackages.add("package-dag-2a");
    changedPackages.add("package-dag-3");

    const graph = buildGraph();
    const nodes = Object.values(graph.nodes).filter((pkg) => pkg.name !== "package-dag-3");
    const execOpts = { cwd: "/test" };

    const updates = collectProjectUpdates(nodes, graph, execOpts, {});

    expect(updates).toEqual([
      expect.objectContaining({ name: "package-dag-2a" }),
      // despite having changed, package-dag-3 was ignored
    ]);
  });

  it("overrules dependents with filtered packages", () => {
    changedPackages.add("package-dag-1");

    const graph = buildGraph();
    const nodes = Object.values(graph.nodes).filter((pkg) => pkg.name !== "package-dag-2a");
    const execOpts = { cwd: "/test" };

    const updates = collectProjectUpdates(nodes, graph, execOpts, {});

    expect(updates).toEqual([
      expect.objectContaining({ name: "package-dag-1" }),
      // despite having a changed dependency, package-dag-2a was ignored
      expect.objectContaining({ name: "package-dag-2b" }),
      expect.objectContaining({ name: "package-dag-3" }),
    ]);
  });

  it("skips change detection when current revision is already released", () => {
    changedPackages.add("package-dag-1");

    (describeRefSync as jest.Mock).mockReturnValueOnce({
      refCount: "0",
    });

    const graph = buildGraph();
    const nodes = Object.values(graph.nodes);
    const execOpts = { cwd: "/test" };

    const updates = collectProjectUpdates(nodes, graph, execOpts, {});

    expect(updates).toEqual([]);
  });

  it("returns all nodes when no tag is found", () => {
    (hasTags as jest.Mock).mockReturnValueOnce(false);

    const graph = buildGraph();
    const nodes = Object.values(graph.nodes);
    const execOpts = { cwd: "/test" };

    const updates = collectProjectUpdates(nodes, graph, execOpts, {});

    expect(updates).toEqual(ALL_NODES);
  });

  it("returns all nodes with --force-publish", () => {
    const graph = buildGraph();
    const nodes = Object.values(graph.nodes);
    const execOpts = { cwd: "/test" };

    const updates = collectProjectUpdates(nodes, graph, execOpts, {
      forcePublish: true,
    });

    expect(updates).toEqual(ALL_NODES);
  });

  it("returns all nodes with --force-publish *", () => {
    const graph = buildGraph();
    const nodes = Object.values(graph.nodes);
    const execOpts = { cwd: "/test" };

    const updates = collectProjectUpdates(nodes, graph, execOpts, {
      forcePublish: "*",
    });

    expect(updates).toEqual(ALL_NODES);
  });

  it("always includes nodes targeted by --force-publish <pkg>", () => {
    changedPackages.add("package-dag-3");

    const graph = buildGraph();
    const nodes = Object.values(graph.nodes);
    const execOpts = { cwd: "/test" };

    const updates = collectProjectUpdates(nodes, graph, execOpts, {
      forcePublish: "package-standalone",
    });

    expect(updates).toEqual([
      expect.objectContaining({ name: "package-dag-3" }),
      expect.objectContaining({ name: "package-standalone" }),
    ]);
  });

  it("always includes nodes targeted by --force-publish <pkg>,<pkg>", () => {
    changedPackages.add("package-dag-3");

    const graph = buildGraph();
    const nodes = Object.values(graph.nodes);
    const execOpts = { cwd: "/test" };

    const updates = collectProjectUpdates(nodes, graph, execOpts, {
      forcePublish: "package-standalone,package-dag-2b",
    });

    expect(updates).toEqual([
      expect.objectContaining({ name: "package-dag-2b" }),
      expect.objectContaining({ name: "package-dag-3" }),
      expect.objectContaining({ name: "package-standalone" }),
    ]);
  });

  it("always includes nodes targeted by --force-publish <pkg> --force-publish <pkg>", () => {
    changedPackages.add("package-dag-3");

    const graph = buildGraph();
    const nodes = Object.values(graph.nodes);
    const execOpts = { cwd: "/test" };

    const updates = collectProjectUpdates(nodes, graph, execOpts, {
      forcePublish: ["package-standalone", "package-dag-2b"],
    });

    expect(updates).toEqual([
      expect.objectContaining({ name: "package-dag-2b" }),
      expect.objectContaining({ name: "package-dag-3" }),
      expect.objectContaining({ name: "package-standalone" }),
    ]);
  });

  it("returns all prereleased nodes with --conventional-graduate", () => {
    const graph = buildGraph();
    setPrereleaseVersions(graph);

    const nodes = Object.values(graph.nodes);
    const execOpts = { cwd: "/test" };

    const updates = collectProjectUpdates(nodes, graph, execOpts, {
      conventionalCommits: true,
      conventionalGraduate: true,
    });

    expect(updates).toEqual(ALL_NODES);
  });

  it("returns all prereleased nodes with --conventional-graduate *", () => {
    const graph = buildGraph();
    setPrereleaseVersions(graph);
    const nodes = Object.values(graph.nodes);
    const execOpts = { cwd: "/test" };

    const updates = collectProjectUpdates(nodes, graph, execOpts, {
      conventionalCommits: true,
      conventionalGraduate: "*",
    });

    expect(updates).toEqual(ALL_NODES);
  });

  it("always includes prereleased nodes targeted by --conventional-graduate <pkg>", () => {
    changedPackages.add("package-dag-3");

    const graph = buildGraph();
    setPrereleaseVersions(graph, ["package-dag-3", "package-standalone"]);
    const nodes = Object.values(graph.nodes);
    const execOpts = { cwd: "/test" };

    const updates = collectProjectUpdates(nodes, graph, execOpts, {
      conventionalCommits: true,
      conventionalGraduate: "package-standalone",
    });

    expect(updates).toEqual([
      expect.objectContaining({ name: "package-dag-3" }),
      expect.objectContaining({ name: "package-standalone" }),
    ]);
  });

  it("always includes prereleased nodes targeted by --conventional-graduate <pkg>,<pkg>", () => {
    changedPackages.add("package-dag-3");

    const graph = buildGraph();
    setPrereleaseVersions(graph, ["package-dag-3", "package-standalone", "package-dag-2b"]);
    const nodes = Object.values(graph.nodes);
    const execOpts = { cwd: "/test" };

    const updates = collectProjectUpdates(nodes, graph, execOpts, {
      forcePublish: "package-standalone,package-dag-2b",
    });

    expect(updates).toEqual([
      expect.objectContaining({ name: "package-dag-2b" }),
      expect.objectContaining({ name: "package-dag-3" }),
      expect.objectContaining({ name: "package-standalone" }),
    ]);
  });

  it("always includes prereleased nodes targeted by --conventional-graduate <pkg> --conventional-graduate <pkg>", () => {
    changedPackages.add("package-dag-3");

    const graph = buildGraph();
    setPrereleaseVersions(graph, ["package-dag-3", "package-standalone", "package-dag-2b"]);
    const nodes = Object.values(graph.nodes);
    const execOpts = { cwd: "/test" };

    const updates = collectProjectUpdates(nodes, graph, execOpts, {
      forcePublish: ["package-standalone", "package-dag-2b"],
    });

    expect(updates).toEqual([
      expect.objectContaining({ name: "package-dag-2b" }),
      expect.objectContaining({ name: "package-dag-3" }),
      expect.objectContaining({ name: "package-standalone" }),
    ]);
  });

  it("always includes all nodes targeted by --conventional-graduate = pkg despite having no prerelease version when having -froce-convention-graduate set", () => {
    changedPackages.add("package-dag-3");

    const graph = buildGraph();
    const nodes = Object.values(graph.nodes);
    const execOpts = { cwd: "/test" };
    setPrereleaseVersions(graph, ["package-standalone"]);

    const updates = collectProjectUpdates(nodes, graph, execOpts, {
      forceConventionalGraduate: true,
      conventionalCommits: true,
      conventionalGraduate: "package-dag-2b,package-dag-3",
    });

    expect(updates).toEqual([
      expect.objectContaining({ name: "package-dag-2b" }),
      expect.objectContaining({ name: "package-dag-3" }),
    ]);
  });

  it("always includes all nodes targeted by --conventional-graduate = * despite having no prerelease version when having -froce-convention-graduate set", () => {
    changedPackages.add("package-dag-3");

    const graph = buildGraph();
    const nodes = Object.values(graph.nodes);
    const execOpts = { cwd: "/test" };

    const updates = collectProjectUpdates(nodes, graph, execOpts, {
      forceConventionalGraduate: true,
      conventionalCommits: true,
      conventionalGraduate: "*",
    });

    expect(updates).toEqual(ALL_NODES);
  });

  it("uses revision range with --canary", () => {
    changedPackages.add("package-dag-2a");

    const graph = buildGraph();
    const nodes = Object.values(graph.nodes);
    const execOpts = { cwd: "/test" };

    const updates = collectProjectUpdates(nodes, graph, execOpts, {
      canary: true,
    });

    expect(updates).toEqual([
      expect.objectContaining({ name: "package-dag-2a" }),
      expect.objectContaining({ name: "package-dag-3" }),
    ]);
    expect(makeDiffPredicate).toHaveBeenLastCalledWith("deadbeef^..deadbeef", execOpts, undefined);
  });

  it("uses revision provided by --since <ref>", () => {
    const graph = buildGraph();
    const nodes = Object.values(graph.nodes);
    const execOpts = { cwd: "/test" };

    collectProjectUpdates(nodes, graph, execOpts, {
      since: "beefcafe",
    });

    expect(makeDiffPredicate).toHaveBeenLastCalledWith("beefcafe", execOpts, undefined);
  });

  it("does not exit early on tagged release when --since <ref> is passed", () => {
    changedPackages.add("package-dag-1");

    (describeRefSync as jest.Mock).mockReturnValueOnce({
      refCount: "0",
    });

    const graph = buildGraph();
    const nodes = Object.values(graph.nodes);
    const execOpts = { cwd: "/test" };

    const updates = collectProjectUpdates(nodes, graph, execOpts, {
      since: "deadbeef",
    });

    expect(updates).toEqual([
      expect.objectContaining({ name: "package-dag-1" }),
      expect.objectContaining({ name: "package-dag-2a" }),
      expect.objectContaining({ name: "package-dag-2b" }),
      expect.objectContaining({ name: "package-dag-3" }),
    ]);
  });

  it("ignores changes matched by --ignore-changes", () => {
    const graph = buildGraph();
    const nodes = Object.values(graph.nodes);
    const execOpts = { cwd: "/test" };

    collectProjectUpdates(nodes, graph, execOpts, {
      ignoreChanges: ["**/README.md"],
    });

    expect(makeDiffPredicate).toHaveBeenLastCalledWith("v1.0.0", execOpts, ["**/README.md"]);
  });
});

const buildGraph = (): ProjectGraphWithPackages =>
  createProjectGraph({
    projects: [
      projectNode(
        {
          name: "package-cycle-1",
        },
        {
          name: "package-cycle-1",
          version: "1.0.0",
        }
      ),
      projectNode(
        {
          name: "package-cycle-2",
        },
        {
          name: "package-cycle-2",
          version: "1.0.0",
        }
      ),
      projectNode(
        {
          name: "package-cycle-extraneous-1",
        },
        {
          name: "package-cycle-extraneous-1",
          version: "1.0.0",
          description: "This package is used to break ties between package-cycle-{1,2}.",
        }
      ),
      projectNode(
        {
          name: "package-cycle-extraneous-2",
        },
        {
          name: "package-cycle-extraneous-2",
          version: "1.0.0",
          description: "This package is used to break ties between package-cycle-{1,2}.",
        }
      ),
      projectNode(
        {
          name: "package-dag-1",
        },
        {
          name: "package-dag-1",
          version: "1.0.0",
        }
      ),
      projectNode(
        {
          name: "package-dag-2a",
        },
        {
          name: "package-dag-2a",
          version: "1.0.0",
        }
      ),
      projectNode(
        {
          name: "package-dag-2b",
        },
        {
          name: "package-dag-2b",
          version: "1.0.0",
        }
      ),
      projectNode(
        {
          name: "package-dag-3",
        },
        {
          name: "package-dag-3",
          version: "1.0.0",
        }
      ),
      projectNode(
        {
          name: "package-standalone",
        },
        {
          name: "package-standalone",
          version: "1.0.0",
        }
      ),
      projectNode(
        {
          name: "package-dag-5",
        },
        {
          name: "package-dag-1",
          version: "1.0.0",
        }
      ),
    ],
    dependencies: [
      projectGraphDependency({
        source: "package-cycle-1",
        target: "package-cycle-2",
        targetVersionMatchesDependencyRequirement: true,
      }),
      projectGraphDependency({
        source: "package-cycle-2",
        target: "package-cycle-1",
        targetVersionMatchesDependencyRequirement: true,
      }),
      projectGraphDependency({
        source: "package-cycle-extraneous-1",
        target: "package-cycle-1",
        targetVersionMatchesDependencyRequirement: true,
      }),
      projectGraphDependency({
        source: "package-cycle-extraneous-2",
        target: "package-cycle-1",
        targetVersionMatchesDependencyRequirement: true,
      }),
      projectGraphDependency({
        source: "package-cycle-extraneous-2",
        target: "package-cycle-2",
        targetVersionMatchesDependencyRequirement: true,
      }),
      projectGraphDependency({
        source: "package-dag-2a",
        target: "package-dag-1",
        targetVersionMatchesDependencyRequirement: true,
      }),
      projectGraphDependency({
        source: "package-dag-2b",
        target: "package-dag-1",
        targetVersionMatchesDependencyRequirement: true,
      }),
      projectGraphDependency({
        source: "package-dag-3",
        target: "package-dag-2a",
        targetVersionMatchesDependencyRequirement: true,
      }),
      projectGraphDependency({
        source: "package-dag-3",
        target: "package-dag-1",
        targetVersionMatchesDependencyRequirement: true,
      }),
      projectGraphDependency({
        source: "package-dag-5",
        target: "package-dag-1",
        targetVersionMatchesDependencyRequirement: false,
      }),
    ],
  });

const setPrereleaseVersions = (graph: ProjectGraphWithPackages, projectNames?: string[]): void => {
  Object.values(graph.nodes).forEach((node) => {
    if (!projectNames || projectNames.includes(node.name)) {
      if (!node.package) {
        throw new Error(`Expected project ${node.name} to have a package object`);
      }
      node.package.version = `${node.package.version}-alpha.0`;
    }
  });
};
