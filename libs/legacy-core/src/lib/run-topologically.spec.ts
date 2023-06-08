import { Package, RawManifest } from "@lerna/core";
import { runTopologically } from "./run-topologically";

describe("runTopologically", () => {
  it("should run packages in order by depth of tree with leaves first", async () => {
    const manifests: RawManifest[] = [
      {
        name: "ppp2",
        version: "1.0.0",
      },
      {
        name: "ooo1",
        version: "1.0.0",
        dependencies: {
          ooo2: "1.0.0",
          ppp2: "1.0.0",
        },
      },
      {
        name: "ooo2",
        version: "1.0.0",
      },
      {
        name: "other-1",
        version: "1.0.0",
        dependencies: {
          "other-2": "1.0.0",
        },
      },
      {
        name: "other-2",
        version: "1.0.0",
      },
      {
        name: "other-with-scope",
        version: "1.0.0",
      },
      {
        name: "package-1",
        version: "1.0.0",
        dependencies: {
          "package-2": "1.0.0",
          "package-base": "1.0.0",
        },
      },
      {
        name: "package-2",
        version: "1.0.0",
        dependencies: {
          "package-base": "1.0.0",
        },
      },
      {
        name: "package-base",
        version: "1.0.0",
      },
    ];
    const packages = manifests.map((p) => new Package(p, `/test/packages/${p.name}`, "/test"));

    const result: string[] = [];
    const runner = (pkg: Package) => {
      result.push(pkg.name);
      return Promise.resolve();
    };

    await runTopologically(packages, runner, { concurrency: 4 });

    expect(result).toEqual([
      "ppp2",
      "ooo2",
      "other-2",
      "other-with-scope",
      "package-base",
      "ooo1",
      "other-1",
      "package-2",
      "package-1",
    ]);
  });

  it("should handle cycles", async () => {
    const manifests: RawManifest[] = [
      {
        name: "ppp2",
        version: "1.0.0",
      },
      {
        name: "ooo1",
        version: "1.0.0",
        dependencies: {
          ooo2: "1.0.0",
          ppp2: "1.0.0",
        },
      },
      {
        name: "ooo2",
        version: "1.0.0",
      },
      {
        name: "cycle-1",
        version: "1.0.0",
        dependencies: {
          "cycle-2": "1.0.0",
        },
      },
      {
        name: "cycle-2",
        version: "1.0.0",
        dependencies: {
          "cycle-1": "1.0.0",
        },
      },
      {
        name: "other-1",
        version: "1.0.0",
        dependencies: {
          "other-2": "1.0.0",
        },
      },
      {
        name: "other-2",
        version: "1.0.0",
      },
      {
        name: "other-with-scope",
        version: "1.0.0",
      },
      {
        name: "package-1",
        version: "1.0.0",
        dependencies: {
          "package-2": "1.0.0",
          "package-base": "1.0.0",
        },
      },
      {
        name: "package-2",
        version: "1.0.0",
        dependencies: {
          "package-base": "1.0.0",
          "cycle-1": "1.0.0",
        },
      },
      {
        name: "package-base",
        version: "1.0.0",
      },
    ];
    const packages = manifests.map((p) => new Package(p, `/test/packages/${p.name}`, "/test"));

    const result: string[] = [];
    const runner = (pkg: Package) => {
      result.push(pkg.name);
      return Promise.resolve();
    };

    await runTopologically(packages, runner, { concurrency: 4 });

    expect(result).toEqual([
      "ppp2",
      "ooo2",
      "other-2",
      "other-with-scope",
      "package-base",
      "ooo1",
      "other-1",
      "cycle-1",
      "cycle-2",
      "package-2",
      "package-1",
    ]);
  });

  it("should handle nested cycles", async () => {
    const manifests: RawManifest[] = [
      {
        name: "package-1",
        version: "1.0.0",
        dependencies: {
          "package-2": "1.0.0",
          "package-7": "1.0.0",
        },
      },
      {
        name: "package-2",
        version: "1.0.0",
        dependencies: {
          "package-3": "1.0.0",
        },
      },
      {
        name: "package-3",
        version: "1.0.0",
        dependencies: {
          "package-4": "1.0.0",
          "package-5": "1.0.0",
        },
      },
      {
        name: "package-4",
        version: "1.0.0",
        dependencies: {
          "package-2": "1.0.0",
        },
      },
      {
        name: "package-5",
        version: "1.0.0",
        dependencies: {
          "package-6": "1.0.0",
        },
      },
      {
        name: "package-6",
        version: "1.0.0",
        dependencies: {
          "package-3": "1.0.0",
        },
      },
      {
        name: "package-7",
        version: "1.0.0",
        dependencies: {
          "package-5": "1.0.0",
        },
      },
      {
        name: "package-8",
        version: "1.0.0",
        dependencies: {
          "package-9": "1.0.0",
        },
      },
      {
        name: "package-9",
        version: "1.0.0",
      },
    ];
    const packages = manifests.map((p) => new Package(p, `/test/packages/${p.name}`, "/test"));

    const result: string[] = [];
    const runner = (pkg: Package) => {
      result.push(pkg.name);
      return Promise.resolve();
    };

    await runTopologically(packages, runner, { concurrency: 4 });

    expect(result).toEqual([
      "package-9",
      "package-8",
      "package-5",
      "package-2",
      "package-4",
      "package-3",
      "package-6",
      "package-7",
      "package-1",
    ]);
  });
});
