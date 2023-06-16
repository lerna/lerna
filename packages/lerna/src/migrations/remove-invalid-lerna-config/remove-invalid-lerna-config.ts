import { formatFiles, readJson, Tree, writeJson } from "@nx/devkit";

export default async function generator(tree: Tree) {
  const lernaJson = readJson(tree, "lerna.json");

  if (lernaJson.lerna !== undefined) {
    delete lernaJson.lerna;
    writeJson(tree, "lerna.json", lernaJson);
  }

  await formatFiles(tree);
}
