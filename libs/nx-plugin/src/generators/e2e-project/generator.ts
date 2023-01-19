import {
  formatFiles,
  names,
  readProjectConfiguration,
  Tree,
  updateJson,
  updateProjectConfiguration,
} from "@nrwl/devkit";
import { addPropertyToJestConfig } from "@nrwl/jest/src/utils/config/update-config";
import { projectGenerator } from "@nrwl/js/src/generators/library/library";
import { resolve } from "path";
import { E2eProjectGeneratorSchema } from "./schema";

interface NormalizedSchema extends E2eProjectGeneratorSchema {
  projectName: string;
  projectRoot: string;
  projectDirectory: string;
}

function normalizeOptions(_tree: Tree, options: E2eProjectGeneratorSchema): NormalizedSchema {
  const e2eRoot = "e2e";
  const projectDirectory = options.directory ? `${e2eRoot}/${names(options.directory).fileName}` : e2eRoot;
  const projectRoot = `${projectDirectory}/${names(options.name).fileName}`;
  const projectName = `${e2eRoot}${options.directory ? `-${options.directory}` : ""}-${
    names(options.name).fileName
  }`;

  return {
    ...options,
    projectName,
    projectRoot,
    projectDirectory,
  };
}

export default async function (tree: Tree, options: E2eProjectGeneratorSchema) {
  const normalizedOptions = normalizeOptions(tree, options);

  await projectGenerator(
    tree,
    {
      name: normalizedOptions.name,
      directory: normalizedOptions.projectDirectory,
      skipTsConfig: true,
    },
    "./",
    resolve("node_modules/@nrwl/js/src/generators/library/files")
  );

  tree.delete(`${normalizedOptions.projectRoot}/README.md`);

  tree.children(`${normalizedOptions.projectRoot}/src/lib`).forEach((file) => {
    tree.delete(`${normalizedOptions.projectRoot}/src/lib/${file}`);
  });

  addPropertyToJestConfig(tree, `${normalizedOptions.projectRoot}/jest.config.ts`, "maxWorkers", 1, {
    valueAsString: false,
  });
  addPropertyToJestConfig(tree, `${normalizedOptions.projectRoot}/jest.config.ts`, "testTimeout", 60000, {
    valueAsString: false,
  });
  addPropertyToJestConfig(
    tree,
    `${normalizedOptions.projectRoot}/jest.config.ts`,
    "setupFiles",
    ["<rootDir>/src/test-setup.ts"],
    {
      valueAsString: false,
    }
  );

  const projectConfig = readProjectConfiguration(tree, normalizedOptions.projectName);

  updateProjectConfiguration(tree, normalizedOptions.projectName, {
    ...projectConfig,
    targets: {
      e2e: {
        executor: "nx:run-commands",
        options: {
          commands: [
            {
              command: "npm run e2e-start-local-registry",
            },
            {
              command: "npm run e2e-build-package-publish",
            },
            {
              command: `E2E_ROOT=$(npx ts-node tools/scripts/set-e2e-root.ts) nx run-e2e-tests ${normalizedOptions.projectName}`,
            },
          ],
          parallel: false,
        },
      },
      "run-e2e-tests-process": {
        executor: "nx:run-commands",
        options: {
          commands: [
            {
              command: `E2E_ROOT=$(npx ts-node tools/scripts/set-e2e-root.ts) nx run-e2e-tests ${normalizedOptions.projectName}`,
              description:
                "This additional wrapper target exists so that we can ensure that the e2e tests run in a dedicated process with enough memory",
            },
          ],
          parallel: false,
        },
      },
      "run-e2e-tests": {
        executor: "@nrwl/jest:jest",
        options: {
          jestConfig: `${normalizedOptions.projectRoot}/jest.config.ts`,
          passWithNoTests: true,
          runInBand: true,
        },
        outputs: [`{workspaceRoot}/coverage/${normalizedOptions.projectRoot}`],
      },
      lint: projectConfig.targets.lint,
      // Don't keep the original unit test target
    },
  });

  tree.write(
    `${normalizedOptions.projectRoot}/src/index.ts`,
    `// Add e2e tests for ${options.name} in this file
`
  );

  tree.rename(
    `${normalizedOptions.projectRoot}/src/index.ts`,
    `${normalizedOptions.projectRoot}/src/${options.name}.spec.ts`
  );

  tree.write(
    `${normalizedOptions.projectRoot}/src/test-setup.ts`,
    `jest.retryTimes(3);
`
  );

  updateJson(tree, `${normalizedOptions.projectRoot}/tsconfig.spec.json`, (json) => {
    json.include = json.include ?? [];
    json.include.push("src/test-setup.ts");
    return json;
  });

  await formatFiles(tree);
}
