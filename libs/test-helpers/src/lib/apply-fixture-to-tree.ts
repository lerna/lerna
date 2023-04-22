import { Tree } from "@nrwl/devkit";
import fs from "fs";
import path from "path";

/**
 * Used to take a fixture directory on disk and apply it to a Tree for testing
 * within the context of an Nx generator.
 */
export function applyFixtureToTree(tree: Tree, fixturePath: string) {
  function createEntryInTree(dir: string) {
    fs.readdirSync(dir).forEach((file) => {
      const filePath = path.join(dir, file);
      const relativePath = path.relative(fixturePath, filePath);
      if (fs.statSync(filePath).isDirectory()) {
        createEntryInTree(filePath);
      } else {
        tree.write(relativePath, fs.readFileSync(filePath).toString());
      }
    });
  }
  createEntryInTree(fixturePath);
}
