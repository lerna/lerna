import tempy from "tempy";
import copyFixture from "./copyFixture";
import gitInit from "./gitInit";

export default initFixture;

async function initFixture(fixturePath, commitMessage = "Init commit") {
  const testDir = await tempy.directoryAsync();
  await copyFixture(testDir, fixturePath);
  await gitInit(testDir, commitMessage);
  return testDir;
}
