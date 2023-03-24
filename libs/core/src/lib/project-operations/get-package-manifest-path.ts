import { ProjectGraphProjectNode } from "@nrwl/devkit";
import { join } from "path";

export function getPackageManifestPath(node: ProjectGraphProjectNode): string | undefined {
  return node.data.files.find((f) => f.file === join(node.data.root, "package.json"))?.file;
}
