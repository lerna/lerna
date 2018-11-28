"use strict";

jest.mock("pacote");

const pacote = require("pacote");
const Project = require("@lerna/project");
const initFixture = require("@lerna-test/init-fixture")(__dirname);
const getUnpublishedPackages = require("../lib/get-unpublished-packages");

pacote.packument.mockImplementation(async pkg => {
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
  const project = new Project(cwd);

  const pkgs = await getUnpublishedPackages(project, {});
  expect(pkgs.map(p => p.name)).toEqual(["package-1", "package-3", "package-4", "package-5"]);
});
