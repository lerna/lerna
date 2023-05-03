import { getPackages, ProjectGraphProjectNodeWithPackage } from "@lerna/core";
import { initFixtureFactory } from "@lerna/test-helpers";
import _pacote from "pacote";
import { join } from "path";

jest.mock("pacote");

const initFixture = initFixtureFactory(__dirname);

import { getProjectsWithUnpublishedPackages } from "./get-projects-with-unpublished-packages";

const pacote = jest.mocked(_pacote);

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
    } as any;
  }

  throw new Error("package does not exist");
});

test("getProjectsWithUnpublishedPackages", async () => {
  const cwd = await initFixture("licenses-names");
  const packages = await getPackages(cwd);
  const projectNodes = packages.map(
    (pkg): ProjectGraphProjectNodeWithPackage => ({
      name: pkg.name,
      type: "lib",
      data: { root: pkg.location, files: [{ file: join(pkg.location, "package.json"), hash: "" }] },
      package: pkg,
    })
  );

  const opts = {};
  const pkgs = await getProjectsWithUnpublishedPackages(projectNodes, opts);

  expect(pacote.packument).toHaveBeenCalledWith("package-1", opts);
  expect(pkgs).toEqual([
    expect.objectContaining({
      name: "package-1",
    }),
    expect.objectContaining({
      name: "package-3",
    }),
    expect.objectContaining({
      name: "package-4",
    }),
    expect.objectContaining({
      name: "package-5",
    }),
  ]);
});

test("getProjectsWithUnpublishedPackages with private package", async () => {
  const cwd = await initFixture("public-private");
  const packages = await getPackages(cwd);
  const projectNodes = packages.map(
    (pkg): ProjectGraphProjectNodeWithPackage => ({
      name: pkg.name,
      type: "lib",
      data: { root: pkg.location, files: [{ file: join(pkg.location, "package.json"), hash: "" }] },
      package: pkg,
    })
  );

  const opts = {};
  const pkgs = await getProjectsWithUnpublishedPackages(projectNodes, opts);

  expect(pacote.packument).toHaveBeenCalledWith("package-1", opts);
  expect(pkgs).toEqual([
    expect.objectContaining({
      name: "package-1",
    }),
  ]);
});
