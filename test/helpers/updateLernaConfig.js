import fs from "fs-extra";
import path from "path";

/**
 * Update a fixture lerna.json inside a test case.
 *
 * This method does not use load-json-file or write-json-file
 * to avoid any mocks that may be in use on those modules.
 *
 * @param {String} testDir where target lerna.json exists
 * @param {Object} updates mixed into existing JSON via Object.assign
 */
export default async function updateLernaConfig(testDir, updates) {
  const lernaJsonLocation = path.join(testDir, "lerna.json");
  const lernaJson = await fs.readJson(lernaJsonLocation);
  Object.assign(lernaJson, updates);
  await fs.writeJson(lernaJsonLocation, lernaJson, { spaces: 2 });
}
