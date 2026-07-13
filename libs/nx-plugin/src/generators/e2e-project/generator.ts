import { formatFiles, names, readProjectConfiguration, Tree, updateProjectConfiguration } from "@nx/devkit";
import { libraryGenerator } from "@nx/js";
import { E2eProjectGeneratorSchema } from "./schema";

interface NormalizedSchema extends E2eProjectGeneratorSchema {
  projectName: string;
  projectRoot: string;
  projectDirectory: string;
}

function normalizeOptions(_tree: Tree, options: E2eProjectGeneratorSchema): NormalizedSchema {
  const e2eRoot = "e2e";
  const projectDirectory = options.directory
    ? `${e2eRoot}/${names(options.directory).fileName}${names(options.name).fileName}`
    : `${e2eRoot}/${names(options.name).fileName}`;
  const projectRoot = projectDirectory;
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

  await libraryGenerator(tree, {
    name: normalizedOptions.projectName,
    directory: normalizedOptions.projectDirectory,
    skipTsConfig: true,
    unitTestRunner: "none",
  });

  tree.delete(`${normalizedOptions.projectRoot}/README.md`);

  tree.children(`${normalizedOptions.projectRoot}/src/lib`).forEach((file) => {
    tree.delete(`${normalizedOptions.projectRoot}/src/lib/${file}`);
  });

  const offsetToWorkspaceRoot = "../".repeat(normalizedOptions.projectRoot.split("/").length);

  // The @nx/vitest plugin registered in nx.json infers the run-e2e-tests target
  // from this config (serial execution, retries and the test-setup file all come
  // from the shared defineLernaE2eVitestConfig defaults).
  tree.write(
    `${normalizedOptions.projectRoot}/vitest.config.ts`,
    `import { defineConfig } from "vitest/config";
import { defineLernaE2eVitestConfig } from "${offsetToWorkspaceRoot}vitest.shared";

export default defineConfig(
  defineLernaE2eVitestConfig({
    projectRoot: "${normalizedOptions.projectRoot}",
  })
);
`
  );

  tree.write(
    `${normalizedOptions.projectRoot}/tsconfig.spec.json`,
    JSON.stringify(
      {
        extends: "./tsconfig.json",
        compilerOptions: {
          outDir: `${offsetToWorkspaceRoot}dist/out-tsc`,
          module: "commonjs",
          types: ["vitest/globals", "node"],
        },
        include: [
          "vitest.config.ts",
          "src/**/*.test.ts",
          "src/**/*.spec.ts",
          "src/**/*.d.ts",
          "src/test-setup.ts",
        ],
      },
      null,
      2
    )
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
              command: `E2E_ROOT=$(npx ts-node --project tools/scripts/tsconfig.e2e.json tools/scripts/set-e2e-root.ts) nx run-e2e-tests ${normalizedOptions.projectName}`,
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
              command: `E2E_ROOT=$(npx ts-node --project tools/scripts/tsconfig.e2e.json tools/scripts/set-e2e-root.ts) nx run-e2e-tests ${normalizedOptions.projectName}`,
              description:
                "This additional wrapper target exists so that we can ensure that the e2e tests run in a dedicated process with enough memory",
            },
          ],
          parallel: false,
        },
      },
      // run-e2e-tests is inferred from vitest.config.ts by the @nx/vitest plugin
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
    `// Runs before each ${options.name} e2e test file (configured via the shared e2e vitest config)
`
  );

  await formatFiles(tree);
}
