import { ProjectGraph, ProjectGraphProjectNode, workspaceRoot } from "@nrwl/devkit";
import { readJson } from "fs-extra";
import { sortBy } from "lodash";
import minimatch from "minimatch";
import { join } from "path";
import { getPackageManifestPath } from "../get-package-manifest-path";
import { Package, RawManifest } from "../package";
import { getPackage, ProjectGraphWithPackages } from "../project-graph-with-packages";

export async function createProjectGraphWithPackages(
  projectGraph: ProjectGraph,
  packageConfigs: string[]
): Promise<ProjectGraphWithPackages> {
  // We respect the NX_WORKSPACE_ROOT_PATH environment variable at runtime in order to support existing unit tests
  const _workspaceRoot = process.env["NX_WORKSPACE_ROOT_PATH"] || workspaceRoot;

  const projectNodes = Object.values(projectGraph.nodes);
  const projectNodesMatchingPackageConfigs = projectNodes.filter((node) => {
    const matchesRootPath = (config: string) => minimatch(node.data.root, config);
    return packageConfigs.some(matchesRootPath);
  });
  const tuples = await Promise.all(
    projectNodesMatchingPackageConfigs.map(
      (node) =>
        new Promise<[ProjectGraphProjectNode, RawManifest | null]>((resolve) => {
          const manifestPath = getPackageManifestPath(node);
          if (manifestPath) {
            resolve(readJson(join(_workspaceRoot, manifestPath)).then((manifest) => [node, manifest]));
          } else {
            resolve([node, null]);
          }
        })
    )
  );

  // We want Object.values(projectGraph.nodes) to be sorted by root path
  const projectGraphWithOrderedNodes: ProjectGraphWithPackages = {
    ...projectGraph,
    nodes: {},
  };
  const projectLookupByPackageName: Record<string, string> = {};
  const sortedTuples = sortBy(tuples, (t) => t[0].data.root);
  sortedTuples.forEach(([node, manifest]) => {
    let pkg: Package | null = null;
    if (manifest) {
      pkg = new Package(manifest, join(_workspaceRoot, node.data.root), _workspaceRoot);
      projectLookupByPackageName[pkg.name] = node.name;
    }
    projectGraphWithOrderedNodes.nodes[node.name] = {
      ...node,
      package: pkg,
    };
  });

  // detect and add optional dependencies to the graph
  Object.values(projectGraphWithOrderedNodes.nodes).forEach((node) => {
    if (!node.package) {
      return;
    }
    const pkg = getPackage(node);
    if (!pkg.optionalDependencies) {
      return;
    }
    Object.keys(pkg.optionalDependencies).forEach((dep) => {
      if (projectLookupByPackageName[dep]) {
        projectGraphWithOrderedNodes.dependencies[node.name] = [
          ...(projectGraphWithOrderedNodes.dependencies[node.name] || []),
          { source: node.name, target: projectLookupByPackageName[dep], type: "static" },
        ];
      }
    });
  });

  return projectGraphWithOrderedNodes;
}
