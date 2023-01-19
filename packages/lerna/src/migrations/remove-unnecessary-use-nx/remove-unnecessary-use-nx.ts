import { formatFiles, readJson, Tree, writeJson } from "@nrwl/devkit";

export default async function generator(tree: Tree) {
  const lernaJson = readJson(tree, "lerna.json");

  if (lernaJson.useNx) {
    delete lernaJson.useNx;
    writeJson(tree, "lerna.json", lernaJson);
  }

  await formatFiles(tree);
}
