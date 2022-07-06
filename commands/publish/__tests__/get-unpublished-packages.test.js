"use strict";

jest.mock("pacote");

// mocked module(s)
const pacote = require("pacote");

// helpers
const { PackageGraph } = require("@lerna/package-graph");
const { getPackages } = require("@lerna/project");
const initFixture = require("@lerna-test/init-fixture")(__dirname);

// file under test
const { getUnpublishedPackages } = require("../lib/get-unpublished-packages");

pacote.packument.mockImplementation(async (pkg) => {
  if (pkg === "package-1") {
    return {
      versions: {},
    };
  }

  if (pkg === "package-2") {
    return {
      versions: {
        "1.0.0": {},
      },
    };
  }

  throw new Error("package does not exist");
});

test("getUnpublishedPackages", async () => {
  const cwd = await initFixture("licenses-names");
  const packages = await getPackages(cwd);
  const packageGraph = new PackageGraph(packages);

  const opts = {};
  const pkgs = await getUnpublishedPackages(packageGraph, opts);

  expect(pacote.packument).toHaveBeenCalledWith("package-1", opts);
  expect(pkgs).toMatchInlineSnapshot(`
Array [
  PackageGraphNode {
    "externalDependencies": Map {},
    "localDependencies": Map {},
    "localDependents": Map {},
    "name": "package-1",
  },
  PackageGraphNode {
    "externalDependencies": Map {},
    "localDependencies": Map {},
    "localDependents": Map {},
    "name": "package-3",
  },
  PackageGraphNode {
    "externalDependencies": Map {},
    "localDependencies": Map {},
    "localDependents": Map {},
    "name": "package-4",
  },
  PackageGraphNode {
    "externalDependencies": Map {},
    "localDependencies": Map {},
    "localDependents": Map {},
    "name": "package-5",
  },
]
`);
});

test("getUnpublishedPackages with private package", async () => {
  const cwd = await initFixture("public-private");
  const packages = await getPackages(cwd);
  const packageGraph = new PackageGraph(packages);

  const opts = {};
  const pkgs = await getUnpublishedPackages(packageGraph, opts);

  expect(pacote.packument).toHaveBeenCalledWith("package-1", opts);
  expect(pkgs).toMatchInlineSnapshot(`
Array [
  PackageGraphNode {
    "externalDependencies": Map {},
    "localDependencies": Map {},
    "localDependents": Map {},
    "name": "package-1",
  },
]
`);
});
