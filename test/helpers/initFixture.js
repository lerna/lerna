import path from "path";
import cp from "recursive-copy";
import {
  fixtureNamer,
  getTempDir,
  gitInit,
  removeAll,
} from "./fixtureUtils";

const getFixtureName = fixtureNamer();

const createdDirectories = [];
afterAll(() => removeAll(createdDirectories));

const originalCwd = process.cwd();
afterEach((done) => {
  process.chdir(originalCwd);
  process.nextTick(done);
});

export default function initFixture(fixturePath) {
  const fixtureDir = path.resolve(__dirname, `../fixtures/${fixturePath}`);
  const fixtureName = getFixtureName(fixturePath);

  return getTempDir(fixtureName).then((testDir) => {
    createdDirectories.push(testDir);

    return cp(fixtureDir, testDir)
      .then(() => gitInit(testDir))
      .then(() => {
        process.chdir(testDir);
        return testDir;
      });
  });
}
