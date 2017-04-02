import {
  fixtureNamer,
  getTempDir,
} from "./fixtureUtils";

const getFixtureName = fixtureNamer();

export default function initDirName(fixturePath) {
  return getTempDir(getFixtureName(fixturePath));
}
