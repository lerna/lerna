import path from "path";
import cp from "recursive-copy";
import {
  fixtureNamer,
  getTempDir,
  gitInit,
  removeAll,
} from "./fixtureUtils";

const pTmpDir = getTempDir();
const getFixtureName = fixtureNamer();

const createdDirectories = [];
afterAll(() => removeAll(createdDirectories));

const originalCwd = process.cwd();
afterEach(() => process.chdir(originalCwd));

export default function initFixture(fixturePath) {
  const fixtureDir = path.resolve(__dirname, `../fixtures/${fixturePath}`);
  const fixtureName = getFixtureName(fixturePath);

  return pTmpDir.then((tmpDir) => {
    const testDir = path.join(tmpDir, fixtureName);

    createdDirectories.push(testDir);

    return cp(fixtureDir, testDir)
      .then(() => process.chdir(testDir))
      .then(() => gitInit(testDir))
      .then(() => testDir);
  });
}
