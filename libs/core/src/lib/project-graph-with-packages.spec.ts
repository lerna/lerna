import { ProjectGraphDependency } from "@nrwl/devkit";
import { ExtendedNpaResult } from "./package";
import {
  getPackage,
  isExternalNpmDependency,
  isWorkspacePackageDependency,
  ProjectGraphProjectNodeWithPackage,
  ProjectGraphWorkspacePackageDependency,
} from "./project-graph-with-packages";
import { projectNode, projectNodeWithPackage } from "./test-helpers/create-project-graph";

describe("isExternalNpmDependency", () => {
  it("returns true if dep starts with npm:", () => {
    expect(isExternalNpmDependency("npm:foo")).toBe(true);
  });

  it("returns false if dep does not start with npm:", () => {
    expect(isExternalNpmDependency("foo")).toBe(false);
  });
});

describe("isWorkspacePackageDependency", () => {
  it("returns true if dependency has targetVersionMatchesDependencyRequirement property", () => {
    const dep: ProjectGraphWorkspacePackageDependency = {
      source: "foo",
      target: "bar",
      type: "static",
      targetVersionMatchesDependencyRequirement: true,
      targetResolvedNpaResult: {} as ExtendedNpaResult,
      dependencyCollection: "dependencies",
    };
    const result = isWorkspacePackageDependency(dep);

    expect(result).toBe(true);
  });

  it("returns true if dependency has targetVersionMatchesDependencyRequirement property, but it is false", () => {
    const dep: ProjectGraphWorkspacePackageDependency = {
      source: "foo",
      target: "bar",
      type: "static",
      targetVersionMatchesDependencyRequirement: false,
      targetResolvedNpaResult: {} as ExtendedNpaResult,
      dependencyCollection: "dependencies",
    };
    const result = isWorkspacePackageDependency(dep);

    expect(result).toBe(true);
  });

  it("returns false if dependency does not have targetVersionMatchesDependencyRequirement property", () => {
    const dep: ProjectGraphDependency = {
      source: "foo",
      target: "bar",
      type: "static",
    };
    const result = isWorkspacePackageDependency(dep);

    expect(result).toBe(false);
  });
});

describe("getPackage", () => {
  it("should return package when it exists on the project node", () => {
    const node: ProjectGraphProjectNodeWithPackage = projectNodeWithPackage(
      {
        name: "foo",
      },
      {
        name: "foo",
      }
    );

    const result = getPackage(node);

    expect(result).toBe(node.package);
  });

  it("should throw if node has no package", () => {
    const node: ProjectGraphProjectNodeWithPackage = projectNode({
      name: "foo",
    }) as ProjectGraphProjectNodeWithPackage;

    expect(() => getPackage(node)).toThrowError("Failed attempting to find package for project foo");
  });
});
