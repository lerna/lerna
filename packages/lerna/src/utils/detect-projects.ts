import { Project, detectProjects as _detectProjects } from "@lerna/core";
import { workspaceRoot } from "@nx/devkit";

export async function detectProjects(rootDir = workspaceRoot) {
  const project = new Project(rootDir);
  return _detectProjects(project.packageConfigs);
}
