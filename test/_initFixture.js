import rimraf from "rimraf";
import child from "child_process";
import path from "path";
import cpr from "cpr";

import "./_ensureGitUser";

const tmpDir = path.resolve(__dirname, "../tmp");
const originalCwd = process.cwd();

const createdDirectories = [];

afterEach(() => {
  process.chdir(originalCwd);
});

after(() => {
  createdDirectories.map(dir => rimraf.sync(dir));
});

export default function initFixture(fixturePath, callback) {
  const fixtureDir = path.resolve(__dirname, "./fixtures/" + fixturePath);
  const testDir = path.resolve(tmpDir, "test-" + Date.now());

  cpr(fixtureDir, testDir, {}, err => {
    if (err) return callback(err);
    process.chdir(testDir);
    child.execSync("git init . && git add -A && git commit -m 'Init commit'");
    callback();
  });

  return testDir;
}
