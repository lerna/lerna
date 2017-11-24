import tempy from "tempy";
import copyFixture from "./copyFixture";
import gitInit from "./gitInit";

module.exports = initFixture;

async function initFixture(fixturePath, commitMessage = "Init commit") {
  const testDir = tempy.directory();
  await copyFixture(testDir, fixturePath);
  await gitInit(testDir, commitMessage);
  return testDir;
}
