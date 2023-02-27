import { updateJson, joinPathFragments, workspaceRoot, Tree, generateFiles } from "@nrwl/devkit";
import { stringUtils } from "@lerna/core";
import { Generator } from "nx/src/config/misc-interfaces";

export interface CreateGeneratorOptions {
  // loc: string;
  // access: "public" | "restricted";
  // dependencies: string[];
  // esModule: boolean;
  // homepage: string;
  // keywords: string[];
  // registry: string;
  // tag: string;
  name: string;
  private: boolean;
  description: string;
  license: string;
  binDir: string;
  binFileName: string;
}

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

export function generatorFactory(lernaLogger): Generator {
  return async function generatorImplementation(tree: Tree, options: CreateGeneratorOptions) {
    generateFiles(tree, process.env.LERNA_CREATE_GENERATOR_FILES_PATH, "", {
      tmpl: "",
      packageNameDashCase: stringUtils.dasherize(options.name),
      packageNameCamelCase: stringUtils.camelize(options.name),
    });

    const packageJson: Record<string, unknown> = {};

    packageJson.name = options.name;
    packageJson.version = "1.0.0";
    packageJson.description = options.description;

    if (options.binFileName) {
        tree.write(options.binFileName, ")
        chain = chain.then(() => Promise.all([this.writeBinFile(), this.writeCliFile(), this.writeCliTest()]));
      }
      

    console.log({ packageJson });
    // tree.write("package.json", JSON.stringify(packageJson, null, 2));
  };
}
