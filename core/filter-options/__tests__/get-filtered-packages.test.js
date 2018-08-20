"use strict";

// we're actually testing integration with git
jest.unmock("@lerna/collect-updates");

const path = require("path");
const execa = require("execa");
const touch = require("touch");
const yargs = require("yargs/yargs");

const initFixture = require("@lerna-test/init-fixture")(path.resolve(__dirname, "../../command"));
const gitAdd = require("@lerna-test/git-add");
const gitCommit = require("@lerna-test/git-commit");
const gitTag = require("@lerna-test/git-tag");
const PackageGraph = require("@lerna/package-graph");
const { getPackages } = require("@lerna/project");

const getFilteredPackages = require("../lib/get-filtered-packages");
const filterOptions = require("..");

async function buildGraph(cwd) {
  const packages = await getPackages(cwd);
  return new PackageGraph(packages);
}

function parseOptions(...args) {
  return filterOptions(yargs()).parse(args);
}

test("--scope filters packages by glob", async () => {
  const cwd = await initFixture("filtering");
  const packageGraph = await buildGraph(cwd);
  const execOpts = { cwd };
  const options = parseOptions("--scope", "package-2", "--scope", "*-4");

  const result = await getFilteredPackages(packageGraph, execOpts, options);

  expect(result).toHaveLength(2);
  expect(result[0].name).toBe("package-2");
  expect(result[1].name).toBe("package-4");
});

test("--since returns all packages if no tag is found", async () => {
  const cwd = await initFixture("filtering");
  const packageGraph = await buildGraph(cwd);
  const execOpts = { cwd };
  const options = parseOptions("--since");

  const result = await getFilteredPackages(packageGraph, execOpts, options);

  expect(result).toHaveLength(5);
});

test("--since returns packages updated since the last tag", async () => {
  const cwd = await initFixture("filtering");
  const packageGraph = await buildGraph(cwd);
  const execOpts = { cwd };
  const options = parseOptions("--since");

  await gitTag(cwd, "v1.0.0");
  await touch(path.join(cwd, "packages/package-2/random-file"));
  await gitAdd(cwd, "-A");
  await gitCommit(cwd, "test");

  const result = await getFilteredPackages(packageGraph, execOpts, options);

  expect(result).toHaveLength(2);
  expect(result[0].name).toBe("package-2");
  expect(result[1].name).toBe("package-3");
});

test("--since <ref> should return packages updated since <ref>", async () => {
  const cwd = await initFixture("filtering");
  const packageGraph = await buildGraph(cwd);
  const execOpts = { cwd };
  const options = parseOptions("--since", "master");

  // We first tag, then modify master to ensure that specifying --since will override checking against
  // the latest tag.
  await gitTag(cwd, "v1.0.0");

  await touch(path.join(cwd, "packages/package-1/random-file"));
  await gitAdd(cwd, "-A");
  await gitCommit(cwd, "test");

  // Then we can checkout a new branch, update and commit.
  await execa("git", ["checkout", "-b", "test"], execOpts);

  await touch(path.join(cwd, "packages/package-2/random-file"));
  await gitAdd(cwd, "-A");
  await gitCommit(cwd, "test");

  const result = await getFilteredPackages(packageGraph, execOpts, options);

  expect(result).toHaveLength(2);
  expect(result[0].name).toBe("package-2");
  expect(result[1].name).toBe("package-3");
});

test("--scope package-{2,3,4} --since master", async () => {
  const cwd = await initFixture("filtering");
  const packageGraph = await buildGraph(cwd);
  const execOpts = { cwd };
  const options = parseOptions("--scope", "package-{2,3,4}", "--since", "master");

  await execa("git", ["checkout", "-b", "test"], execOpts);
  await touch(path.join(cwd, "packages/package-4/random-file"));
  await gitAdd(cwd, "-A");
  await gitCommit(cwd, "test");

  const result = await getFilteredPackages(packageGraph, execOpts, options);

  expect(result).toHaveLength(1);
  expect(result[0].name).toBe("package-4");
});

test("--include-filtered-dependents", async () => {
  const cwd = await initFixture("filtering");
  const packageGraph = await buildGraph(cwd);
  const execOpts = { cwd };
  const options = parseOptions("--scope", "package-1", "--include-filtered-dependents");

  const result = await getFilteredPackages(packageGraph, execOpts, options);

  expect(result.map(pkg => pkg.name)).toEqual(["package-1", "package-2", "package-5", "package-3"]);
});

test("--include-filtered-dependencies", async () => {
  const cwd = await initFixture("filtering");
  const packageGraph = await buildGraph(cwd);
  const execOpts = { cwd };
  const options = parseOptions("--scope", "package-3", "--include-filtered-dependencies");

  const result = await getFilteredPackages(packageGraph, execOpts, options);

  expect(result.map(pkg => pkg.name)).toEqual(["package-3", "package-2", "package-1"]);
});
