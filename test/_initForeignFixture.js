import rimraf from "rimraf";
import child from "child_process";
import path from "path";
import cpr from "cpr";

const tmpDir = path.resolve(__dirname, "../tmp");

const createdDirectories = [];

after(() => {
  createdDirectories.map(dir => rimraf.sync(dir));
});

let uniqueId = 0;

export default function initForeignFixture(fixturePath, callback) {
  const fixtureDir = path.resolve(__dirname, "./fixtures/" + fixturePath);
  const testDir = path.resolve(tmpDir, "test-foreign-" + Date.now() + "-" + (uniqueId++));

  createdDirectories.push(testDir);

  cpr(fixtureDir, testDir, {
    confirm: true
  }, err => {
    if (err) return callback(err);
    child.execSync("git init . && git add -A && git commit -m 'Init foreign commit'", {
      cwd: testDir
    });
    callback();
  });

  return testDir;
}
