import { formatFiles, readJson, Tree, writeJson } from "@nx/devkit";

export default async function generator(tree: Tree) {
  const lernaJson = readJson(tree, "lerna.json");

  if (!lernaJson.$schema) {
    lernaJson.$schema = "node_modules/lerna/schemas/lerna-schema.json";
    writeJson(tree, "lerna.json", lernaJson);
  }

  await formatFiles(tree);
}
