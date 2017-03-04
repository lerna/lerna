import rimraf from "rimraf";
import child from "child_process";
import path from "path";
import pify from "pify";
import cp from "recursive-copy";
import mkdirTemp from "./mkdirTemp";

const rimrafAsync = pify(rimraf);
const execAsync = pify(child.exec);

const realTmpDir = mkdirTemp();
const originalCwd = process.cwd();
const createdDirectories = [];

const GIT_INIT_COMMANDS = [
  "git init .",
  "git add -A",
  "git commit -m \"Init commit\"",
];

const gitInitInDir = (testDir) => {
  const opts = { cwd: testDir };
  let chain = Promise.resolve();

  GIT_INIT_COMMANDS.forEach((cmd) => {
    chain = chain.then(execAsync(cmd, opts));
  });

  return chain;
};

afterAll(() =>
  Promise.all(createdDirectories.map(rimrafAsync))
);

afterEach(() => {
  process.chdir(originalCwd);
});

let uniqueId = 0;

export default function initFixture(fixturePath) {
  const fixtureDir = path.resolve(__dirname, "../fixtures/" + fixturePath);

  return realTmpDir.then((tmpDir) => {
    const testDir = path.join(tmpDir, "test-" + Date.now() + "-" + (uniqueId++));

    createdDirectories.push(testDir);

    return cp(fixtureDir, testDir)
      .then(() => process.chdir(testDir))
      .then(() => gitInitInDir(testDir))
      .then(() => testDir);
  });
}
