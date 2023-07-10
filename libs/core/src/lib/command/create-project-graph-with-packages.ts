import { ProjectFileMap, ProjectGraph, ProjectGraphProjectNode, workspaceRoot } from "@nx/devkit";
import { readJson } from "fs-extra";
import { reduce, sortBy } from "lodash";
import minimatch from "minimatch";
import { resolve } from "npm-package-arg";
import { join } from "path";
import { satisfies } from "semver";
import { getPackageManifestPath } from "../get-package-manifest-path";
import { ExtendedNpaResult, Package, RawManifest } from "../package";
import {
  ProjectGraphWithPackages,
  ProjectGraphWorkspacePackageDependency,
  getPackage,
  isExternalNpmDependency,
} from "../project-graph-with-packages";

export async function createProjectGraphWithPackages(
  projectGraph: ProjectGraph,
  projectFileMap: ProjectFileMap,
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
          const manifestPath = getPackageManifestPath(node, projectFileMap[node.name] || []);
          if (manifestPath) {
            const fullManifestPath = join(_workspaceRoot, manifestPath);
            resolve(readJson(fullManifestPath).then((manifest) => [node, manifest]));
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
    localPackageDependencies: {},
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

  // order dependencies to create consistent results when iterating over them
  projectGraphWithOrderedNodes.dependencies = reduce(
    sortBy(Object.keys(projectGraphWithOrderedNodes.dependencies)),
    (prev, next) => ({ ...prev, [next]: projectGraphWithOrderedNodes.dependencies[next] }),
    {}
  );

  // populate local npm package dependencies
  Object.values(projectGraphWithOrderedNodes.dependencies).forEach((projectDeps) => {
    const workspaceDeps = projectDeps.filter(
      (dep) => !isExternalNpmDependency(dep.target) && !isExternalNpmDependency(dep.source)
    );
    for (const dep of workspaceDeps) {
      const source = projectGraphWithOrderedNodes.nodes[dep.source];
      const target = projectGraphWithOrderedNodes.nodes[dep.target];
      if (!source || !source.package || !target || !target.package) {
        // only relevant for dependencies between two workspace projects with Package objects
        continue;
      }

      const sourcePkg = getPackage(source);
      const targetPkg = getPackage(target);
      const sourceNpmDependency = sourcePkg.getLocalDependency(targetPkg.name);
      if (!sourceNpmDependency) {
        continue;
      }

      const workspaceDep = dep as ProjectGraphWorkspacePackageDependency;
      const resolvedTarget = resolvePackage(
        targetPkg.name,
        targetPkg.version,
        sourceNpmDependency.spec,
        sourcePkg.location
      );
      const targetMatchesRequirement =
        resolvedTarget.fetchSpec === targetPkg.location ||
        satisfies(
          targetPkg.version,
          (resolvedTarget.gitCommittish || resolvedTarget.gitRange || resolvedTarget.fetchSpec) as string
        );

      workspaceDep.dependencyCollection = sourceNpmDependency.collection;
      workspaceDep.targetResolvedNpaResult = resolvedTarget;
      workspaceDep.targetVersionMatchesDependencyRequirement = targetMatchesRequirement;

      if (workspaceDep.targetVersionMatchesDependencyRequirement) {
        // track only local package dependencies that are satisfied by the target's version
        projectGraphWithOrderedNodes.localPackageDependencies[dep.source] = [
          ...(projectGraphWithOrderedNodes.localPackageDependencies[dep.source] || []),
          workspaceDep,
        ];
      }
    }
  });

  return projectGraphWithOrderedNodes;
}

export const resolvePackage = (
  name: string,
  version: string,
  spec: string,
  location?: string
): ExtendedNpaResult => {
  // Yarn decided to ignore https://github.com/npm/npm/pull/15900 and implemented "link:"
  // As they apparently have no intention of being compatible, we have to do it for them.
  // @see https://github.com/yarnpkg/yarn/issues/4212
  spec = spec.replace(/^link:/, "file:");

  // Support workspace: protocol for pnpm and yarn 2+ (https://pnpm.io/workspaces#workspace-protocol-workspace)
  const isWorkspaceSpec = /^workspace:/.test(spec);

  let fullWorkspaceSpec;
  let workspaceAlias;
  if (isWorkspaceSpec) {
    fullWorkspaceSpec = spec;
    spec = spec.replace(/^workspace:/, "");

    // replace aliases (https://pnpm.io/workspaces#referencing-workspace-packages-through-aliases)
    if (spec === "*" || spec === "^" || spec === "~") {
      workspaceAlias = spec;
      if (version) {
        const prefix = spec === "*" ? "" : spec;
        spec = `${prefix}${version}`;
      } else {
        spec = "*";
      }
    }
  }

  const resolved = resolve(name, spec, location) as ExtendedNpaResult;
  resolved.workspaceSpec = fullWorkspaceSpec;
  resolved.workspaceAlias = workspaceAlias;

  return resolved;
};
