import { ProjectGraph, ProjectGraphProjectNode, workspaceRoot } from "@nrwl/devkit";
import { readJson } from "fs-extra";
import { sortBy } from "lodash";
import { join } from "path";
import { getPackageManifestPath } from "../get-package-manifest-path";
import { Package, RawManifest } from "../package";
import { ProjectGraphWithPackages } from "../project-graph-with-packages";

export async function createProjectGraphWithPackages(
  projectGraph: ProjectGraph
): Promise<ProjectGraphWithPackages> {
  const tuples = await Promise.all(
    Object.values(projectGraph.nodes).map(
      (node) =>
        new Promise<[ProjectGraphProjectNode, RawManifest | null]>((resolve) => {
          const manifestPath = getPackageManifestPath(node);
          if (manifestPath) {
            resolve(readJson(join(workspaceRoot, manifestPath)).then((manifest) => [node, manifest]));
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
  const sortedTuples = sortBy(tuples, (t) => t[0].data.root);
  sortedTuples.forEach(([node, manifest]) => {
    let pkg: Package | null = null;
    if (manifest) {
      pkg = new Package(manifest, join(workspaceRoot, node.data.root), workspaceRoot);
    }
    projectGraphWithOrderedNodes.nodes[node.name] = {
      ...node,
      package: pkg,
    };
  });

  return projectGraphWithOrderedNodes;
}
