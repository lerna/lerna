import type { Project } from "@lerna/core";
import Config from "@npmcli/config";
import { Tree, joinPathFragments } from "@nrwl/devkit";
import npa from "npm-package-arg";

// TODO: import from nx?
import { camelize } from "./strings";
import path from "path";

export interface CreateGeneratorOptions {
  // dependencies: string[];
  // homepage: string;
  // keywords: string[];
  project: Project;
  name: string;
  loc: string;
  private: boolean;
  description: string;
  license: string;
  bin: boolean | string;
  esModule: boolean;
  registry?: string;
  tag?: string;
  access?: "public" | "restricted";
  homepage?: string;
}

export async function generatorImplementation(tree: Tree, options: CreateGeneratorOptions) {
  // const conf = new Config({
  //     // path to the npm module being run
  //     npmPath: resolve(__dirname, '..'),
  //     types,
  //     shorthands,
  //     defaults,
  //     // optional, defaults to process.argv
  //     argv: process.argv,
  //     // optional, defaults to process.env
  //     env: process.env,
  //     // optional, defaults to process.execPath
  //     execPath: process.execPath,
  //     // optional, defaults to process.platform
  //     platform: process.platform,
  //     // optional, defaults to process.cwd()
  //     cwd: process.cwd(),
  //   })

  options.registry = options.registry || "https://registry.npmjs.org/";

  const pkgLocation = options.loc;
  // npm-package-arg handles all the edge-cases with scopes
  const { name, scope } = npa(options.name);

  // optional scope is _not_ included in the directory name
  const dirName = scope ? name.split("/").pop() : name;
  const pkgName = name;

  //   const pkgsDir = _getPackagesDir(pkgLocation);
  const pkgsDir = "packages";

  const camelName = camelize(dirName);

  // when transpiling, src => dist; otherwise everything in lib
  const outDir = options.esModule ? "dist" : "lib";
  //   const targetDir = path.resolve(pkgsDir, dirName);
  const targetDir = dirName;

  const binDir = "bin";
  const binFileName = options.bin === true ? dirName : options.bin;

  const libDir = options.esModule ? "src" : "lib";
  const libFileName = `${dirName}.js`;

  const testDir = "__tests__";
  const testFileName = `${dirName}.test.js`;

  const packageJson: Record<string, unknown> = {
    name,
  };

  if (options.esModule) {
    packageJson["type"] = "module";
  }

  setPublishConfig({
    options,
    packageJson,
    conf: {
      root: {
        registry: "https://registry.npmjs.org/",
      },
    },
    scope,
  });

  const homepage = getHomepage({
    options,
    targetDir,
  });
  if (homepage) {
    packageJson.homepage = homepage;
  }

  if (options.private) {
    packageJson.private = true;
  }

  if (options.license) {
    packageJson.license = options.license;
  }

  const loc = "packages";

  const files = {
    "package.json": JSON.stringify(packageJson, null, 2),
    "README.md": `# ${name}`,
    [`${libDir}/${libFileName}`]: `module.exports = () => 'Hello World';`,
  };

  for (const [path, content] of Object.entries(files)) {
    tree.write(joinPathFragments(loc, dirName, path), content);
  }
}

function _getPackagesDir(pkgLocation: string) {
  return __dirname + "packages";
}

function setPublishConfig({
  options,
  packageJson,
  conf,
  scope,
}: {
  options: CreateGeneratorOptions;
  packageJson: Record<string, unknown>;
  conf: Config;
  scope: string;
}): void {
  // const registry = this.options.registry || this.conf.get(`${scope}:registry`) || this.conf.get("registry");
  const isPublicRegistry = options.registry === conf.root.registry;
  const publishConfig: {
    access?: typeof options.access;
    tag?: typeof options.tag;
    registry?: typeof options.registry;
  } = {};

  if (scope && isPublicRegistry) {
    publishConfig.access = options.access || "public";
  }

  if (options.registry && !isPublicRegistry) {
    publishConfig.registry = options.registry;
  }

  if (options.tag) {
    publishConfig.access = "public";
    publishConfig.tag = options.tag;
  }

  packageJson.publishConfig = publishConfig;
}

function getHomepage({ options, targetDir }: { options: CreateGeneratorOptions; targetDir: string }) {
  // allow --homepage override, but otherwise use root pkg.homepage, if it exists
  let { homepage = options.project.manifest.get("homepage") } = options;

  if (!homepage) {
    // normalize-package-data will backfill from hosted-git-info, if possible
    return;
  }

  // allow schemeless URLs (but don't blow up in URL constructor)
  if (homepage.indexOf("http") !== 0) {
    homepage = `http://${homepage}`;
  }

  const hurl = new URL(homepage);
  const relativeTarget = path.relative(options.project.rootPath, targetDir);

  if (hurl.hostname.match("github")) {
    hurl.pathname = path.posix.join(hurl.pathname, "tree/main", relativeTarget);
    // TODO: get actual upstream HEAD branch name
    // current remote: git rev-parse --abbrev-ref --symbolic-full-name @{u}
    // upstream HEAD: git symbolic-ref --short refs/remotes/origin/HEAD
    hurl.hash = "readme";
  } else if (!options.homepage) {
    // don't mutate an explicit --homepage value
    hurl.pathname = path.posix.join(hurl.pathname, relativeTarget);
  }

  return hurl.href;
}
