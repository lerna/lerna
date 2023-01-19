import { getPackages, PackageGraph } from "@lerna/core";
import { initFixtureFactory } from "@lerna/test-helpers";
import _pacote from "pacote";

jest.mock("pacote");

const initFixture = initFixtureFactory(__dirname);

// file under test
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { getUnpublishedPackages } = require("./get-unpublished-packages");

const pacote = jest.mocked(_pacote);

// TODO: refactor to address type issues
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
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
