import path from "path";
import {
  cp,
  fixtureNamer,
  getTempDir,
  gitInit,
  removeAll,
} from "./fixtureUtils";

const getFixtureName = fixtureNamer();

const createdDirectories = [];
afterAll(() => removeAll(createdDirectories));

export default function initExternalFixture(fixturePath) {
  const fixtureDir = path.resolve(__dirname, `../fixtures/${fixturePath}`);
  const fixtureName = getFixtureName(fixturePath);

  return getTempDir(fixtureName).then((testDir) => {
    createdDirectories.push(testDir);

    return cp(fixtureDir, testDir)
      .then(() => gitInit(testDir, "Init external commit"))
      .then(() => testDir);
  });
}
