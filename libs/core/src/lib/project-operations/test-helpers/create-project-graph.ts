import { ProjectGraph, ProjectGraphDependency, ProjectGraphProjectNode } from "@nrwl/devkit";
import { Package, RawManifest } from "../../package";
import { ProjectGraphProjectNodeWithPackage, ProjectGraphWithPackages } from "../project-graph-with-packages";

export function projectNode(projectNode: Partial<ProjectGraphProjectNode>): ProjectGraphProjectNode {
  return projectNode as ProjectGraphProjectNode;
}

export function projectNodeWithPackage(
  projectNode: Partial<ProjectGraphProjectNode>,
  pkg: Partial<RawManifest>
): ProjectGraphProjectNodeWithPackage {
  return {
    ...(projectNode as ProjectGraphProjectNode),
    package: new Package(pkg as RawManifest, `/test/packages/${pkg.name}`, "/test"),
  };
}

export function projectGraphDependency(dep: Partial<ProjectGraphDependency>): ProjectGraphDependency {
  return dep as ProjectGraphDependency;
}

export function createProjectGraph<T extends ProjectGraphProjectNode>({
  projects,
  dependencies,
}: {
  projects: T[];
  dependencies: ProjectGraphDependency[];
}): T extends ProjectGraphProjectNodeWithPackage ? ProjectGraphWithPackages : ProjectGraph {
  return {
    nodes: projects.reduce((acc, project) => ({ ...acc, [project.name]: project }), {}),
    dependencies: dependencies.reduce(
      (prev, next) => ({
        ...prev,
        [next.source]: [...(prev[next.source] || []), next],
      }),
      {} as Record<string, ProjectGraphDependency[]>
    ),
  };
}
