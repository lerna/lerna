import { FileData } from "@nx/devkit";
import { getPackageManifestPath } from "./get-package-manifest-path";
import { projectNode } from "./test-helpers/create-project-graph";

describe("getPackageManifestPath", () => {
  it("returns package.json path", () => {
    const node = projectNode({
      name: "package-1",
      data: {
        root: "/root/packages/package-1",
      },
    });
    const files: FileData[] = [
      {
        file: "/root/packages/package-1/index.js",
        hash: "",
      },
      {
        file: "/root/packages/package-1/package.json",
        hash: "",
      },
    ];

    expect(getPackageManifestPath(node, files)).toEqual("/root/packages/package-1/package.json");
  });

  it("returns undefined when no package.json exists", () => {
    const node = projectNode({
      name: "package-1",
      data: {
        root: "/root/packages/package-1",
      },
    });

    const files = [
      {
        file: "/root/packages/package-1/index.js",
        hash: "",
      },
    ];

    expect(getPackageManifestPath(node, files)).toBeUndefined();
  });
});
