import {
  Project,
  ProjectGraphWithPackages,
  createProjectGraphWithPackages as _createProjectGraphWithPackages,
} from "@lerna/core";
import { ProjectFileMap, createProjectFileMapUsingProjectGraph, createProjectGraphAsync } from "@nx/devkit";

/**
 * @async
 * @function createProjectGraphWithPackages
 * Creates a project graph with package metadata and returns it along with a corresponding mapping of projects to files.
 *
 * @param {Project} [project=new Project(process.cwd())] - The Lerna Project instance for which the graph is being generated. If not provided, a new project is created using the current working directory.
 * @returns {Promise<{projectGraph: ProjectGraphWithPackages, projectFileMap: ProjectFileMap}>}
 */

export async function createProjectGraphWithPackages(project: Project = new Project(process.cwd())): Promise<{
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

  const projectGraph = await _createProjectGraphWithPackages(
    _projectGraph,
    projectFileMap,
    project.packageConfigs
  );

  return {
    projectGraph,
    projectFileMap,
  };
}
