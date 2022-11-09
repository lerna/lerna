// @ts-check
const { writeJson, readJson, formatFiles } = require("@nrwl/devkit");

exports.default = async function generator(tree) {
  const lernaJson = readJson(tree, "lerna.json");

  if (lernaJson.useNx) {
    delete lernaJson.useNx;
    writeJson(tree, "lerna.json", lernaJson);
  }

  await formatFiles(tree);
};
