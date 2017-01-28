import rimraf from "rimraf";
import child from "child_process";
import syncExec from "sync-exec";
import path from "path";
import fse from "fs-extra";

const tmpDir = path.resolve(__dirname, "../tmp");

const createdDirectories = [];

after(() => {
  createdDirectories.map((dir) => rimraf.sync(dir));
});

let uniqueId = 0;

export default function initExternalFixture(fixturePath, callback) {
  const fixtureDir = path.resolve(__dirname, "./fixtures/" + fixturePath);
  const testDir = path.resolve(tmpDir, "test-external-" + Date.now() + "-" + (uniqueId++));

  createdDirectories.push(testDir);

  fse.copy(fixtureDir, testDir, (err) => {
    if (err) return callback(err);
    (child.execSync || syncExec)("git init . && git add -A && git commit -m \"Init external commit\"", {
      cwd: testDir
    });
    callback();
  });

  return testDir;
}
