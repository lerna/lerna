import { joinPathFragments } from "@nrwl/devkit";
import { ensureDirSync } from "fs-extra";
import isCI from "is-ci";
import { dirSync } from "tmp";

const E2E_ROOT = isCI ? dirSync({ prefix: "lerna-e2e-" }).name : joinPathFragments("/tmp", "lerna-e2e");

ensureDirSync(E2E_ROOT);

// Log the fixture's root path so that it can be captured in exec.sh
console.log(E2E_ROOT);
