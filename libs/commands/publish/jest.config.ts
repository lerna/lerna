import { workspaceRoot } from "@nx/devkit";
import { join } from "node:path";
import { pathsToModuleNameMapper } from "ts-jest";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const compilerOptions = require(join(workspaceRoot, "tsconfig.base.json")).compilerOptions;

export default {
  displayName: "commands-publish",
  preset: "../../../jest.preset.js",
  coverageDirectory: "../../../coverage/libs/commands/publish",
  // Needed to add "json" to avoid issue resolving spdx-license-ids
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  testTimeout: 120e3,
  //to have all paths available for mocking
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, { prefix: "<rootDir>/../../../" }),
  transform: {
    "^.+\\.[tj]sx?$": [
      "ts-jest",
      {
        tsconfig: "<rootDir>/tsconfig.spec.json",
        isolatedModules: true,
      },
    ],
  },
};
