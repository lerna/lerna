import { ProjectGraph, ProjectGraphDependency, ProjectGraphProjectNode } from "@nx/devkit";
import { ExtendedNpaResult, Package } from "./package";

export interface ProjectGraphProjectNodeWithPackage extends ProjectGraphProjectNode {
  package: Package | null;
}

export interface ProjectGraphWorkspacePackageDependency extends ProjectGraphDependency {
  targetVersionMatchesDependencyRequirement: boolean;
  targetResolvedNpaResult: ExtendedNpaResult;
  dependencyCollection: "dependencies" | "devDependencies" | "optionalDependencies"; // lerna doesn't manage peer dependencies
}

export interface ProjectGraphWithPackages extends ProjectGraph {
  nodes: Record<string, ProjectGraphProjectNodeWithPackage>;
  localPackageDependencies: Record<string, ProjectGraphWorkspacePackageDependency[]>;
}

export const isExternalNpmDependency = (dep: string): boolean => dep.startsWith("npm:");

/**
 * Get the package for a given project graph node with a package.
 * This should be preferred over directly accessing `node.package`,
 * since this function will throw an error if the package is not found.
 * @param project the project graph node to get the package for
 * @returns the package for the given project
 */
export function getPackage(project: ProjectGraphProjectNodeWithPackage): Package {
  if (!project.package) {
    // This function should only ever be called on project graph nodes
    // that should have a package, so if the package is not found,
    // we want to know immediately in order to track down the issue.
    throw new Error(`Failed attempting to find package for project ${project.name}`);
  }
  return project.package;
}
