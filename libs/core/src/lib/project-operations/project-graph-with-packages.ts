import { ProjectGraph, ProjectGraphProjectNode } from "@nrwl/devkit";
import { Package } from "../package";

export interface ProjectGraphProjectNodeWithPackage extends ProjectGraphProjectNode {
  package: Package | null;
}

export interface ProjectGraphWithPackages extends ProjectGraph {
  nodes: Record<string, ProjectGraphProjectNodeWithPackage>;
}

export function getPackage(project: ProjectGraphProjectNodeWithPackage): Package {
  if (!project.package) {
    throw new Error(`Failed attempting to find package for project ${project.name}`);
  }
  return project.package;
}
