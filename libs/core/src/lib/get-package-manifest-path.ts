import { FileData, ProjectGraphProjectNode } from "@nx/devkit";
import { join, resolve } from "path";

export function getPackageManifestPath(node: ProjectGraphProjectNode, files: FileData[]): string | undefined {
  const pkgJsonPath = resolve(join(node.data.root, "package.json"));
  return files.find((f) => resolve(f.file) === pkgJsonPath)?.file;
}
