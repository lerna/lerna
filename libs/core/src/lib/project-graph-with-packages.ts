import { ProjectGraph, ProjectGraphDependency, ProjectGraphProjectNode } from "@nrwl/devkit";
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
}

export const isExternalNpmDependency = (dep: string): boolean => dep.startsWith("npm:");

export const isWorkspacePackageDependency = (
  dep: ProjectGraphDependency
): dep is ProjectGraphWorkspacePackageDependency =>
  (dep as Partial<ProjectGraphWorkspacePackageDependency>).targetVersionMatchesDependencyRequirement !==
  undefined;

export function getPackage(project: ProjectGraphProjectNodeWithPackage): Package {
  if (!project.package) {
    throw new Error(`Failed attempting to find package for project ${project.name}`);
  }
  return project.package;
}
