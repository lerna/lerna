import rimraf from "rimraf";
import child from "child_process";
import path from "path";
import pify from "pify";
import cp from "recursive-copy";
import mkdirTemp from "./mkdirTemp";

const rimrafAsync = pify(rimraf);
const execAsync = pify(child.exec);

const realTmpDir = mkdirTemp();
const createdDirectories = [];

const GIT_INIT_COMMANDS = [
  "git init .",
  "git add -A",
  "git commit -m \"Init external commit\"",
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

let uniqueId = 0;

export default function initExternalFixture(fixturePath) {
  const fixtureDir = path.resolve(__dirname, "../fixtures/" + fixturePath);

  return realTmpDir.then((tmpDir) => {
    const testDir = path.join(tmpDir, "test-external-" + Date.now() + "-" + (uniqueId++));

    createdDirectories.push(testDir);

    return cp(fixtureDir, testDir)
      .then(() => gitInitInDir(testDir))
      .then(() => testDir);
  });
}
