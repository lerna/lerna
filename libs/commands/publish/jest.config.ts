import { pathsToModuleNameMapper } from "ts-jest";
import fs from "fs";

const compilerOptions = JSON.parse(fs.readFileSync("tsconfig.base.json", "utf8")).compilerOptions;
/* eslint-disable */
export default {
  displayName: "commands-publish",
  preset: "../../../jest.preset.js",
  coverageDirectory: "../../../coverage/libs/commands/publish",
  // Needed to add "json" to avoid issue resolving spdx-license-ids
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  testTimeout: 45e3,
  //to have all paths available for mocking
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, { prefix: "<rootDir>/../../../" }),
};
