import { FileData } from "@nrwl/devkit";
import { RawManifest } from "../package";
import { createProjectGraph, projectNode } from "../test-helpers/create-project-graph";
import { createProjectGraphWithPackages } from "./create-project-graph-with-packages";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const fsExtra = require("fs-extra");

jest.mock("@nrwl/devkit", () => ({
  ...jest.requireActual("@nrwl/devkit"),
  workspaceRoot: "root",
}));

jest
  .spyOn(fsExtra, "readJson")
  .mockImplementation(
    (path): Promise<RawManifest | null> => Promise.resolve(getManifestForPath(path as string))
  );

describe("createProjectGraphWithPackages", () => {
  it("should add package objects to project graph nodes", async () => {
    const result = await createProjectGraphWithPackages(projectGraph(), ["packages/*", "other-packages/*"]);

    expect(result.nodes.projectA.package?.name).toEqual("projectA");
    expect(result.nodes.projectA.package?.version).toEqual("1.0.0");

    expect(result.nodes.projectB.package?.name).toEqual("projectB");
    expect(result.nodes.projectB.package?.version).toEqual("1.0.0");
    expect(result.nodes.projectB.package?.dependencies).toEqual({
      projectA: "1.0.0",
    });

    expect(result.nodes.otherProjectA.package?.name).toEqual("otherProjectA");
    expect(result.nodes.otherProjectA.package?.version).toEqual("1.0.0");

    expect(result.nodes.otherProjectB.package?.name).toEqual("otherProjectB");
    expect(result.nodes.otherProjectB.package?.version).toEqual("1.0.0");

    expect(result.nodes["project"].package).toBeNull();
  });

  it("should order project graph nodes by root directory", async () => {
    const result = await createProjectGraphWithPackages(projectGraph(), ["packages/*", "other-packages/*"]);
    expect(Object.keys(result.nodes)).toEqual([
      "otherProjectB",
      "otherProjectA",
      "project",
      "projectA",
      "projectB",
    ]);
  });

  it.each([
    ["other-packages/*", ["otherProjectB", "otherProjectA"]],
    ["packages/*", ["project", "projectA", "projectB"]],
  ])("should ignore projects that do not match packageConfigs glob", async (glob, expected) => {
    const result = await createProjectGraphWithPackages(projectGraph(), [glob]);
    expect(Object.keys(result.nodes)).toEqual(expected);
  });
});

const projectGraph = () =>
  createProjectGraph({
    projects: [
      projectNode({
        name: "projectB",
        type: "lib",
        data: {
          root: "packages/projectB",
          files: [{ file: "packages/projectB/package.json" } as FileData],
        },
      }),
      projectNode({
        name: "projectA",
        type: "lib",
        data: {
          root: "packages/projectA",
          files: [{ file: "packages/projectA/package.json" } as FileData],
        },
      }),
      projectNode({
        name: "otherProjectA",
        type: "lib",
        data: {
          root: "other-packages/zzzProjectA",
          files: [{ file: "other-packages/zzzProjectA/package.json" } as FileData],
        },
      }),
      projectNode({
        name: "otherProjectB",
        type: "lib",
        data: {
          root: "other-packages/projectB",
          files: [{ file: "other-packages/projectB/package.json" } as FileData],
        },
      }),
      projectNode({
        name: "project",
        type: "lib",
        data: {
          root: "packages/project",
          files: [{ file: "packages/project/package.json" } as FileData],
        },
      }),
    ],
    dependencies: [],
  });

const getManifestForPath = (path: string): RawManifest | null => {
  const packages: Record<string, RawManifest> = {
    "root/packages/projectB/package.json": {
      name: "projectB",
      version: "1.0.0",
      dependencies: {
        projectA: "1.0.0",
      },
    },
    "root/packages/projectA/package.json": {
      name: "projectA",
      version: "1.0.0",
    },
    "root/other-packages/zzzProjectA/package.json": {
      name: "otherProjectA",
      version: "1.0.0",
    },
    "root/other-packages/projectB/package.json": {
      name: "otherProjectB",
      version: "1.0.0",
    },
  };

  return packages[path] || null;
};
