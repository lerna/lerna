import { Project, detectProjects as _detectProjects } from "@lerna/core";
import { workspaceRoot } from "@nx/devkit";

export async function detectProjects() {
  const project = new Project(workspaceRoot);
  return _detectProjects(project.packageConfigs);
}
