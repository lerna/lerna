import {
  formatFiles,
  installPackagesTask,
  readProjectConfiguration,
  Tree,
  updateJson,
  updateProjectConfiguration,
  moveFilesToNewDirectory,
  visitNotIgnoredFiles,
} from "@nrwl/devkit";
import { classify } from "@nrwl/workspace/src/utils/strings";
import { jestProjectGenerator } from "@nrwl/jest/src/generators/jest-project/jest-project";
import { CommandGeneratorSchema } from "./schema";
import { addPropertyToJestConfig } from "@nrwl/jest/src/utils/config/update-config";

export default async function (tree: Tree, options: CommandGeneratorSchema) {
  const commandName = options.name.replace("legacy-structure-commands-", "");

  const selectedProjectConfig = readProjectConfiguration(tree, options.name);
  const migrateToProjectConfig = readProjectConfiguration(
    tree,
    options.name.replace("legacy-structure-", "")
  );
  const lernaProjectConfig = readProjectConfiguration(tree, "lerna");

  tree.delete(`${selectedProjectConfig.root}/tsconfig.spec.json`);
  tree.delete(`${selectedProjectConfig.root}/.babelrc`);
  tree.delete(`${selectedProjectConfig.root}/.eslintrc.json`);
  tree.delete(`${selectedProjectConfig.root}/jest.config.ts`);

  tree.write(
    `${selectedProjectConfig.root}/tsconfig.json`,
    JSON.stringify({
      extends: "../../../../tsconfig.base.json",
      files: [],
      include: [],
      references: [
        {
          path: "./tsconfig.lib.json",
        },
      ],
    })
  );

  const updatedCompileConfig = selectedProjectConfig.targets.compile;

  const { additionalEntryPoints, ...rest } = updatedCompileConfig.options;

  updatedCompileConfig.options = {
    ...rest,
    bundle: false,
  };

  updateProjectConfiguration(tree, options.name, {
    ...selectedProjectConfig,
    targets: {
      build: selectedProjectConfig.targets.build,
      compile: updatedCompileConfig,
    },
  });

  const indexPath = `${selectedProjectConfig.root}/src/index.ts`;
  const indexContents = tree.read(indexPath).toString();
  const newIndexLocation = indexPath.replace(
    `${selectedProjectConfig.root}/src`,
    `packages/lerna/src/commands/${commandName}`
  );
  const updatedIndexContents = indexContents.replaceAll("index", `${commandName}Index`);

  tree.write(indexPath, updatedIndexContents.replaceAll("@lerna", "lerna"));
  tree.write(newIndexLocation, updatedIndexContents);

  const commandPath = `${selectedProjectConfig.root}/src/command.ts`;
  const newCommandLocation = commandPath.replace(
    `${selectedProjectConfig.root}/src`,
    `packages/lerna/src/commands/${commandName}`
  );
  const updatedCommandContents = `module.exports = require("@lerna/commands/${commandName}/command");
`;

  tree.write(commandPath, updatedCommandContents.replaceAll("@lerna", "lerna"));
  tree.write(newCommandLocation, updatedCommandContents);

  const updatedLernaCompileConfig = lernaProjectConfig.targets.compile;
  updatedLernaCompileConfig.options.additionalEntryPoints = [
    ...updatedLernaCompileConfig.options.additionalEntryPoints,
    newIndexLocation,
    newCommandLocation,
  ];

  const libExists = tree.exists(`${selectedProjectConfig.root}/src/lib`);

  if (libExists) {
    const entryPointsToMigrate = [];

    for (const entryPoint of additionalEntryPoints) {
      if (!entryPoint.includes("/lib/")) {
        continue;
      }
      const contents = tree.read(entryPoint).toString();
      const newLocation = entryPoint.replace(
        `${selectedProjectConfig.root}/src`,
        `packages/lerna/src/commands/${commandName}`
      );
      entryPointsToMigrate.push(newLocation);

      tree.write(entryPoint, contents.replaceAll("@lerna", "lerna"));
      tree.write(newLocation, contents);
    }

    // Update lerna compile with additional entry points

    const updatedLernaCompileConfig = lernaProjectConfig.targets.compile;
    updatedLernaCompileConfig.options.additionalEntryPoints = [
      ...updatedLernaCompileConfig.options.additionalEntryPoints,
      ...entryPointsToMigrate,
    ];

    updateJson(tree, `${lernaProjectConfig.root}/package.json`, (json) => {
      json.exports = {
        ...json.exports,
        [`./commands/${commandName}/lib/*`]: `./dist/commands/${commandName}/lib/*.js`,
      };
      return json;
    });
  }

  updatedLernaCompileConfig.options.additionalEntryPoints =
    updatedLernaCompileConfig.options.additionalEntryPoints.sort();

  updateProjectConfiguration(tree, "lerna", {
    ...lernaProjectConfig,
    targets: {
      ...lernaProjectConfig.targets,
      compile: updatedLernaCompileConfig,
    },
  });

  // Migrate the tests
  const fixturesPath = `${selectedProjectConfig.root}/__tests__/__fixtures__`;
  if (tree.exists(fixturesPath)) {
    moveFilesToNewDirectory(tree, fixturesPath, `${migrateToProjectConfig.root}/__fixtures__`);
  }

  const snapshotsPath = `${selectedProjectConfig.root}/__tests__/__snapshots__`;
  if (tree.exists(snapshotsPath)) {
    moveFilesToNewDirectory(tree, snapshotsPath, `${migrateToProjectConfig.root}/src/lib/__snapshots__`);
  }

  moveFilesToNewDirectory(
    tree,
    `${selectedProjectConfig.root}/__tests__`,
    `${migrateToProjectConfig.root}/src/lib`
  );

  await jestProjectGenerator(tree, {
    project: migrateToProjectConfig.name,
    setupFile: "none",
    skipSerializers: false,
  });

  addPropertyToJestConfig(
    tree,
    `${migrateToProjectConfig.root}/jest.config.ts`,
    "moduleFileExtensions",
    ["ts", "tsx", "js", "jsx", "json"],
    {
      valueAsString: false,
    }
  );

  updateJson(tree, `${selectedProjectConfig.root}/package.json`, (json) => {
    json.exports = {
      ".": "./dist/index.js",
      "./command": "./dist/command.js",
      "./lib/*": "./dist/lib/*.js",
    };
    json.dependencies = {
      lerna: "file:../../../lerna",
    };
    return json;
  });

  // Update references in all the .spec.ts files
  visitNotIgnoredFiles(tree, `${migrateToProjectConfig.root}/src/lib`, (file) => {
    if (!file.endsWith(".spec.ts")) {
      return;
    }
    const contents = tree.read(file).toString();
    const updatedContents = contents
      .replaceAll(`require("../src/lib/`, `require("./`)
      .replaceAll(`require("../../__mocks__/`, `require("@lerna/test-helpers/__mocks__/`)
      .replaceAll(`"../../../../../libs/commands/publish"`, `"../../../publish"`)
      .replaceAll(`@lerna/commands/version/lib`, `.`)
      .replaceAll(`commandRunner(require("../src/command"))`, `commandRunner(require("../command"))`);
    tree.write(file, updatedContents);
  });

  await formatFiles(tree);
}
