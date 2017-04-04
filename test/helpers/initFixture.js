import path from "path";
import fs from "fs-promise";
import {
  fixtureNamer,
  getTempDir,
  gitInit,
  removeAll,
} from "./fixtureUtils";

const getFixtureName = fixtureNamer();

const createdDirectories = [];
afterAll(() => removeAll(createdDirectories));

export default function initFixture(fixturePath) {
  const fixtureDir = path.resolve(__dirname, `../fixtures/${fixturePath}`);
  const fixtureName = getFixtureName(fixturePath);

  return getTempDir(fixtureName).then((testDir) => {
    createdDirectories.push(testDir);

    return fs.copy(fixtureDir, testDir)
      .then(() => gitInit(testDir))
      .then(() => testDir);
  });
}
