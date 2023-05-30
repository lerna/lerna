import { formatFiles, readJson, Tree, writeJson } from "@nx/devkit";

export default async function generator(tree: Tree) {
  const lernaJson = readJson(tree, "lerna.json");

  if (lernaJson.useWorkspaces !== undefined) {
    delete lernaJson.useWorkspaces;
    writeJson(tree, "lerna.json", lernaJson);
  }

  await formatFiles(tree);
}
