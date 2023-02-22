import { updateJson, joinPathFragments, workspaceRoot, Tree, generateFiles } from "@nrwl/devkit";
import { stringUtils } from "@lerna/core";

/**
 * A quirk of our current backwards-compatible bundling approach in v6 is that we need to account for the
 * files/ dir being in a different relative location when the code runs here in the library (i.e. for tests)
 * vs where it will be when it runs via the lerna cli.
 *
 * We leverage esbuild to replace the value of process.env.LERNA_CREATE_GENERATOR_FILES_PATH with
 * BUILT_LERNA_CREATE_GENERATOR_FILES_PATH at build time
 */
process.env.LERNA_CREATE_GENERATOR_FILES_PATH = joinPathFragments(__dirname, "files");
// This is NOT unused, see note above
const BUILT_LERNA_CREATE_GENERATOR_FILES_PATH = joinPathFragments(
  __dirname,
  "commands/create/lib/generators/default/files"
);

export function generatorFactory(lernaLogger) {
  return async function generatorImplementation(tree: Tree, options) {
    lernaLogger.success("create", "Ran the generator!");

    generateFiles(tree, process.env.LERNA_CREATE_GENERATOR_FILES_PATH, tree.root, {
      tmpl: "",
      packageNameDashCase: stringUtils.dasherize(options.name),
      packageNameCamelCase: stringUtils.camelize(options.name),
    });
  };
}
