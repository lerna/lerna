import { updateJson, joinPathFragments, workspaceRoot, Tree, generateFiles } from "@nrwl/devkit";
import { stringUtils } from "@lerna/core";

export function generatorFactory(lernaLogger) {
  return async function generatorImplementation(tree: Tree, options) {
    lernaLogger.success("create", "Ran the generator!");

    console.log({ options });
    tree.write("foo.txt", "bar");

    generateFiles(tree, joinPathFragments(__dirname, "files"), tree.root, {
      tmpl: "",
      packageNameDashCase: stringUtils.dasherize(options.name),
      packageNameCamelCase: stringUtils.camelize(options.name),
    });
  };
}
