import rimraf from "rimraf";
import child from "child_process";
import path from "path";
import fse from "fs-extra";
import syncExec from "sync-exec";

const tmpDir = path.resolve(__dirname, "../tmp");
const originalCwd = process.cwd();

const createdDirectories = [];

afterEach(() => {
  process.chdir(originalCwd);
});

after(() => {
  createdDirectories.map((dir) => rimraf.sync(dir));
});

let uniqueId = 0;

export default function initFixture(fixturePath, callback) {
  const fixtureDir = path.resolve(__dirname, "./fixtures/" + fixturePath);
  const testDir = path.resolve(tmpDir, "test-" + Date.now() + "-" + (uniqueId++));

  createdDirectories.push(testDir);

  fse.copy(fixtureDir, testDir, (err) => {
    if (err) return callback(err);
    process.chdir(testDir);
    (child.execSync || syncExec)("git init . && git add -A && git commit -m \"Init commit\"");
    callback();
  });

  return testDir;
}
