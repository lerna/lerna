import { ProjectFileMap, createProjectFileMapUsingProjectGraph, createProjectGraphAsync } from "@nx/devkit";
import { ProjectGraphWithPackages } from "../project-graph-with-packages";
import { createProjectGraphWithPackages } from "./create-project-graph-with-packages";

export async function detectProjects(packageConfigs: string[]): Promise<{
  projectGraph: ProjectGraphWithPackages;
  projectFileMap: ProjectFileMap;
}> {
  const _projectGraph = await createProjectGraphAsync();

  let projectFileMap: ProjectFileMap;

  // if we are using Nx >= 16.3.1, we can use the helper function to create the file map
  // otherwise, we need to use the old "files" property on the node data
  if (createProjectFileMapUsingProjectGraph) {
    projectFileMap = await createProjectFileMapUsingProjectGraph(_projectGraph);
  } else {
    projectFileMap = Object.entries(_projectGraph.nodes).reduce(
      (map, [key, node]) => ({
        ...map,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [key]: (node.data as any).files,
      }),
      {}
    );
  }

  const projectGraph = await createProjectGraphWithPackages(_projectGraph, projectFileMap, packageConfigs);

  return {
    projectGraph,
    projectFileMap,
  };
}
