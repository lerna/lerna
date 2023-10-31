import { readJson, readProjectConfiguration, Tree } from "@nx/devkit";
import { createTreeWithEmptyWorkspace } from "@nx/devkit/testing";

import generator from "./generator";
import { E2eProjectGeneratorSchema } from "./schema";

describe("e2e-project generator", () => {
  let appTree: Tree;
  const options: E2eProjectGeneratorSchema = { name: "test" };

  beforeEach(() => {
    appTree = createTreeWithEmptyWorkspace();
  });

  it("should generate a new e2e project with appropriate config", async () => {
    await generator(appTree, options);
    const config = readProjectConfiguration(appTree, "e2e-test");
    expect(config).toMatchInlineSnapshot(`
      Object {
        "$schema": "../../node_modules/nx/schemas/project-schema.json",
        "name": "e2e-test",
        "projectType": "library",
        "root": "e2e/test",
        "sourceRoot": "e2e/test/src",
        "tags": Array [],
        "targets": Object {
          "e2e": Object {
            "executor": "nx:run-commands",
            "options": Object {
              "commands": Array [
                Object {
                  "command": "npm run e2e-start-local-registry",
                },
                Object {
                  "command": "npm run e2e-build-package-publish",
                },
                Object {
                  "command": "E2E_ROOT=$(npx ts-node tools/scripts/set-e2e-root.ts) nx run-e2e-tests e2e-test",
                },
              ],
              "parallel": false,
            },
          },
          "lint": Object {
            "executor": "@nx/eslint:eslint",
            "options": Object {
              "lintFilePatterns": Array [
                "e2e/test/**/*.ts",
              ],
            },
            "outputs": Array [
              "{options.outputFile}",
            ],
          },
          "run-e2e-tests": Object {
            "executor": "@nx/jest:jest",
            "options": Object {
              "jestConfig": "e2e/test/jest.config.ts",
              "passWithNoTests": true,
              "runInBand": true,
            },
            "outputs": Array [
              "{workspaceRoot}/coverage/e2e/test",
            ],
          },
          "run-e2e-tests-process": Object {
            "executor": "nx:run-commands",
            "options": Object {
              "commands": Array [
                Object {
                  "command": "E2E_ROOT=$(npx ts-node tools/scripts/set-e2e-root.ts) nx run-e2e-tests e2e-test",
                  "description": "This additional wrapper target exists so that we can ensure that the e2e tests run in a dedicated process with enough memory",
                },
              ],
              "parallel": false,
            },
          },
        },
      }
    `);

    expect(readJson(appTree, "e2e/test/tsconfig.spec.json")).toMatchInlineSnapshot(`
      Object {
        "compilerOptions": Object {
          "module": "commonjs",
          "outDir": "../../dist/out-tsc",
          "types": Array [
            "jest",
            "node",
          ],
        },
        "extends": "./tsconfig.json",
        "include": Array [
          "jest.config.ts",
          "src/**/*.test.ts",
          "src/**/*.spec.ts",
          "src/**/*.d.ts",
          "src/test-setup.ts",
        ],
      }
    `);

    expect(appTree.read("e2e/test/jest.config.ts").toString()).toMatchInlineSnapshot(`
      "/* eslint-disable */
      export default {
        displayName: 'e2e-test',
        preset: '../../jest.preset.js',
        transform: {
          '^.+\\\\\\\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
        },
        moduleFileExtensions: ['ts', 'js', 'html'],
        coverageDirectory: '../../coverage/e2e/test',
        maxWorkers: 1,
        testTimeout: 60000,
        setupFiles: ['<rootDir>/src/test-setup.ts'],
      };
      "
    `);

    expect(appTree.read("e2e/test/src/test-setup.ts").toString()).toMatchInlineSnapshot(`
      "jest.retryTimes(3);
      "
    `);
  });
});
