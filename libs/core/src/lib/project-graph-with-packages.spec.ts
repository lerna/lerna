import {
  getPackage,
  isExternalNpmDependency,
  ProjectGraphProjectNodeWithPackage,
} from "./project-graph-with-packages";
import { projectNode } from "./test-helpers/create-project-graph";

describe("isExternalNpmDependency", () => {
  it("returns true if dep starts with npm:", () => {
    expect(isExternalNpmDependency("npm:foo")).toBe(true);
  });

  it("returns false if dep does not start with npm:", () => {
    expect(isExternalNpmDependency("foo")).toBe(false);
  });
});

describe("getPackage", () => {
  it("should return package when it exists on the project node", () => {
    const node: ProjectGraphProjectNodeWithPackage = projectNode(
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

    expect(() => getPackage(node)).toThrow("Failed attempting to find package for project foo");
  });
});
