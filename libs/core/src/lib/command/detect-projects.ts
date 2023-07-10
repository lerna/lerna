import { ProjectFileMap, createProjectFileMapUsingProjectGraph, createProjectGraphAsync } from "@nx/devkit";
import { ProjectGraphWithPackages } from "../project-graph-with-packages";
import { createProjectGraphWithPackages } from "./create-project-graph-with-packages";

export async function detectProjects(packageConfigs: string[]): Promise<{
  projectGraph: ProjectGraphWithPackages;
  projectFileMap: ProjectFileMap;
}> {
  const _projectGraph = await createProjectGraphAsync();
  const projectFileMap = await createProjectFileMapUsingProjectGraph(_projectGraph);
  const projectGraph = await createProjectGraphWithPackages(_projectGraph, projectFileMap, packageConfigs);

  return {
    projectGraph,
    projectFileMap,
  };
}
