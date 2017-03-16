import path from "path";
import cp from "recursive-copy";
import {
  fixtureNamer,
  getTempDir,
  gitInit,
  removeAll,
} from "./fixtureUtils";

const pTmpDir = getTempDir("external");
const getFixtureName = fixtureNamer();

const createdDirectories = [];
afterAll(() => removeAll(createdDirectories));

export default function initExternalFixture(fixturePath) {
  const fixtureDir = path.resolve(__dirname, `../fixtures/${fixturePath}`);
  const fixtureName = getFixtureName(fixturePath);

  return pTmpDir.then((tmpDir) => {
    const testDir = path.join(tmpDir, fixtureName);

    createdDirectories.push(testDir);

    return cp(fixtureDir, testDir)
      .then(() => gitInit(testDir, "Init external commit"))
      .then(() => testDir);
  });
}
