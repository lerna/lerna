// eslint-disable-next-line @nx/enforce-module-boundaries
import { windowsPathSerializer } from "@lerna/test-helpers";
import { FileData } from "@nx/devkit";
import { join } from "path";
import { RawManifest } from "../package";
import { createProjectGraph, projectNode } from "../test-helpers/create-project-graph";
import { createProjectGraphWithPackages, resolvePackage } from "./create-project-graph-with-packages";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const fsExtra = require("fs-extra");

jest.mock("@nx/devkit", () => ({
  ...jest.requireActual("@nx/devkit"),
  workspaceRoot: "root",
}));

jest
  .spyOn(fsExtra, "readJson")
  .mockImplementation(
    (path): Promise<RawManifest | null> => Promise.resolve(getManifestForPath(path as string))
  );

expect.addSnapshotSerializer(windowsPathSerializer);
expect.addSnapshotSerializer({
  serialize: (val: string) => {
    return val.replace("C:/", "/");
  },
  test: (val: unknown) => {
    return typeof val === "string";
  },
});

describe("createProjectGraphWithPackages", () => {
  it("should add package objects to project graph nodes", async () => {
    const result = await createProjectGraphWithPackages(projectGraph(), ["packages/*", "other-packages/*"]);

    expect(result.nodes.projectA.package?.name).toEqual("projectA");
    expect(result.nodes.projectA.package?.version).toEqual("1.0.0");

    expect(result.nodes.projectB.package?.name).toEqual("projectB");
    expect(result.nodes.projectB.package?.version).toEqual("1.0.0");
    expect(result.nodes.projectB.package?.dependencies).toEqual({
      otherProjectB: "0.0.0",
      projectA: "1.0.0",
      yargs: "3.0.0",
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

  it("should augment dependency metadata", async () => {
    const result = await createProjectGraphWithPackages(projectGraph(), ["packages/*", "other-packages/*"]);
    expect(result.dependencies).toEqual({
      projectA: [
        {
          source: "projectA",
          target: "otherProjectA",
          type: "static",
          dependencyCollection: "optionalDependencies",
          targetResolvedNpaResult: expect.objectContaining({
            name: "otherProjectA",
          }),
          targetVersionMatchesDependencyRequirement: false,
        },
        {
          source: "projectA",
          target: "otherProjectB",
          type: "static",
          dependencyCollection: "optionalDependencies",
          targetResolvedNpaResult: expect.objectContaining({
            name: "otherProjectB",
          }),
          targetVersionMatchesDependencyRequirement: true,
        },
      ],
      projectB: [
        {
          source: "projectB",
          target: "projectA",
          type: "static",
          dependencyCollection: "dependencies",
          targetResolvedNpaResult: expect.objectContaining({
            name: "projectA",
          }),
          targetVersionMatchesDependencyRequirement: true,
        },
        {
          source: "projectB",
          target: "npm:yargs",
          type: "static",
        },
        {
          source: "projectB",
          target: "otherProjectB",
          type: "static",
          dependencyCollection: "dependencies",
          targetResolvedNpaResult: expect.objectContaining({
            name: "otherProjectB",
          }),
          targetVersionMatchesDependencyRequirement: false,
        },
      ],
    });
    expect(result.localPackageDependencies).toEqual({
      projectA: [
        {
          source: "projectA",
          target: "otherProjectB",
          type: "static",
          dependencyCollection: "optionalDependencies",
          targetResolvedNpaResult: expect.objectContaining({
            name: "otherProjectB",
          }),
          targetVersionMatchesDependencyRequirement: true,
        },
      ],
      projectB: [
        {
          source: "projectB",
          target: "projectA",
          type: "static",
          dependencyCollection: "dependencies",
          targetResolvedNpaResult: expect.objectContaining({
            name: "projectA",
          }),
          targetVersionMatchesDependencyRequirement: true,
        },
      ],
    });
  });
});

describe("resolvePackage", () => {
  it("for specific name and spec should return npa result", () => {
    const result = resolvePackage("projectA", "1.0.4", "^1.0.0", "/test/packages/packageB");
    expect(result).toEqual({
      escapedName: "projectA",
      fetchSpec: "^1.0.0",
      gitCommittish: undefined,
      gitRange: undefined,
      name: "projectA",
      raw: "projectA@^1.0.0",
      rawSpec: "^1.0.0",
      registry: true,
      saveSpec: null,
      scope: undefined,
      type: "range",
      where: undefined,
      workspaceAlias: undefined,
      workspaceSpec: undefined,
    });
  });

  it("for workspace spec should return npa result with workspace data", () => {
    const result = resolvePackage("projectA", "1.0.4", "workspace:^1.0.0", "/test/packages/packageB");
    expect(result).toEqual({
      escapedName: "projectA",
      fetchSpec: "^1.0.0",
      gitCommittish: undefined,
      gitRange: undefined,
      name: "projectA",
      raw: "projectA@^1.0.0",
      rawSpec: "^1.0.0",
      registry: true,
      saveSpec: null,
      scope: undefined,
      type: "range",
      where: undefined,
      workspaceAlias: undefined,
      workspaceSpec: "workspace:^1.0.0",
    });
  });

  describe("with a workspace alias", () => {
    it("should return a npa result with workspace data with * alias", () => {
      const result = resolvePackage("projectA", "1.0.4", "workspace:*", "/test/packages/packageB");
      expect(result).toEqual({
        escapedName: "projectA",
        fetchSpec: "1.0.4",
        gitCommittish: undefined,
        gitRange: undefined,
        name: "projectA",
        raw: "projectA@1.0.4",
        rawSpec: "1.0.4",
        registry: true,
        saveSpec: null,
        scope: undefined,
        type: "version",
        where: undefined,
        workspaceAlias: "*",
        workspaceSpec: "workspace:*",
      });
    });

    it("should return a npa result with workspace data with ^ alias", () => {
      const result = resolvePackage("projectA", "1.0.4", "workspace:^", "/test/packages/packageB");
      expect(result).toEqual({
        escapedName: "projectA",
        fetchSpec: "^1.0.4",
        gitCommittish: undefined,
        gitRange: undefined,
        name: "projectA",
        raw: "projectA@^1.0.4",
        rawSpec: "^1.0.4",
        registry: true,
        saveSpec: null,
        scope: undefined,
        type: "range",
        where: undefined,
        workspaceAlias: "^",
        workspaceSpec: "workspace:^",
      });
    });

    it("should return a npa result with workspace data with ~ alias", () => {
      const result = resolvePackage("projectA", "1.0.4", "workspace:~", "/test/packages/packageB");
      expect(result).toEqual({
        escapedName: "projectA",
        fetchSpec: "~1.0.4",
        gitCommittish: undefined,
        gitRange: undefined,
        name: "projectA",
        raw: "projectA@~1.0.4",
        rawSpec: "~1.0.4",
        registry: true,
        saveSpec: null,
        scope: undefined,
        type: "range",
        where: undefined,
        workspaceAlias: "~",
        workspaceSpec: "workspace:~",
      });
    });
  });

  it("for a file reference should return npa result", async () => {
    const result = resolvePackage("projectA", "1.0.0", "file:../projectB", "/packages/projectB");
    expect(result).toEqual({
      escapedName: "projectA",
      fetchSpec: expect.stringContaining(join("/packages/projectB")),
      gitCommittish: undefined,
      gitRange: undefined,
      name: "projectA",
      raw: "projectA@file:../projectB",
      rawSpec: "file:../projectB",
      registry: undefined,
      saveSpec: "file:",
      scope: undefined,
      type: "directory",
      where: "/packages/projectB",
      workspaceAlias: undefined,
      workspaceSpec: undefined,
    });
  });

  it("for a link reference should return a file npa result", async () => {
    const result = resolvePackage("projectA", "1.0.0", "link:../projectB", "/packages/projectB");
    expect(result).toEqual({
      escapedName: "projectA",
      fetchSpec: expect.stringContaining(join("/packages/projectB")),
      gitCommittish: undefined,
      gitRange: undefined,
      name: "projectA",
      raw: "projectA@file:../projectB",
      rawSpec: "file:../projectB",
      registry: undefined,
      saveSpec: "file:",
      scope: undefined,
      type: "directory",
      where: "/packages/projectB",
      workspaceAlias: undefined,
      workspaceSpec: undefined,
    });
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
    dependencies: [
      {
        source: "projectA",
        target: "otherProjectA",
        type: "static",
      },
      {
        source: "projectA",
        target: "otherProjectB",
        type: "static",
      },
      {
        source: "projectB",
        target: "projectA",
        type: "static",
      },
      {
        source: "projectB",
        target: "npm:yargs",
        type: "static",
      },
      {
        source: "projectB",
        target: "otherProjectB",
        type: "static",
      },
    ],
  });

const getManifestForPath = (path: string): RawManifest | null => {
  const packages: Record<string, RawManifest> = {
    "root/packages/projectB/package.json": {
      name: "projectB",
      version: "1.0.0",
      dependencies: {
        projectA: "1.0.0",
        otherProjectB: "0.0.0",
        yargs: "3.0.0",
      },
    },
    "root/packages/projectA/package.json": {
      name: "projectA",
      version: "1.0.0",
      optionalDependencies: {
        otherProjectA: "0.0.0",
        otherProjectB: "workspace:*",
      },
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

  return (
    Object.entries(packages).find(([key]) => {
      // When on windows, the path will have \\ instead of /
      // this normalizes the key of the packages object above to match
      // whatever path.join will return on the system
      const resolvedKey = join(key);
      return resolvedKey === path;
    })?.[1] || null
  );
};
