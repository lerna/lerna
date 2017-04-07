/**
Shared constants for tests
**/
import path from "path";
import pkg from "../../package.json";

export const REPO_ROOT = path.resolve(__dirname, "../..");
export const LERNA_BIN = path.resolve(REPO_ROOT, pkg.bin.lerna);
export const LERNA_VERSION = pkg.version;

// placeholder used in fixture JSON files, replaced during tests
export const __TEST_VERSION__ = "__TEST_VERSION__";
