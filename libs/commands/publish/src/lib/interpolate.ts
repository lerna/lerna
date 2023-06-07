import { workspaceRoot } from "@nx/devkit";

// Modified from https://github.com/nrwl/nx/blob/ef63dcb69b4f7806a2e47174804f59a19a6b3919/packages/nx/src/tasks-runner/utils.ts#L197
export function interpolate(template: string, data: any): string {
  const _workspaceRoot = process.env["NX_WORKSPACE_ROOT_PATH"] || workspaceRoot;

  if (template.includes("{workspaceRoot}", 1)) {
    throw new Error(
      `Config '${template}' is invalid. {workspaceRoot} can only be used at the beginning of the expression.`
    );
  }

  if (data.projectRoot == "." && template.includes("{projectRoot}", 1)) {
    throw new Error(
      `Config '${template}' is invalid. When {projectRoot} is '.', it can only be used at the beginning of the expression.`
    );
  }

  let res = template.replace("{workspaceRoot}", _workspaceRoot);

  if (data.projectRoot == ".") {
    res = res.replace("{projectRoot}/", "");
  }

  return res.replace(/{([\s\S]+?)}/g, (match: string) => {
    let value = data;
    const path = match.slice(1, -1).trim().split(".");
    for (let idx = 0; idx < path.length; idx++) {
      if (!value[path[idx]]) {
        return match;
      }
      value = value[path[idx]];
    }
    return value;
  });
}
