import { ProjectGraphProjectNode } from "@nrwl/devkit";
import { join, resolve } from "path";

export function getPackageManifestPath(node: ProjectGraphProjectNode): string | undefined {
  const pkgJsonPath = resolve(join(node.data.root, "package.json"));
  return node.data.files.find((f) => resolve(f.file) === pkgJsonPath)?.file;
}
