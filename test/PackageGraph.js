import log from "npmlog";

// file under test
import Package from "../src/Package";
import PackageGraph from "../src/PackageGraph";

// silence logs
log.level = "silent";

describe("PackageGraph", () => {
  function createPackages(version, dependencyVersion = version) {
    return [
      new Package(
        {
          name: "my-package-1",
          version,
          bin: "bin.js",
          scripts: { "my-script": "echo 'hello world'" },
          dependencies: { "my-dependency": "^1.0.0" },
          devDependencies: { "my-dev-dependency": "^1.0.0" },
        },
        "/path/to/package1"
      ),
      new Package(
        {
          name: "my-package-2",
          version,
          bin: "bin.js",
          scripts: { "my-script": "echo 'hello world'" },
          dependencies: { "my-dependency": "^1.0.0" },
          devDependencies: { "my-package-1": dependencyVersion },
          peerDependencies: { "my-package-1": ">=1.0.0" },
        },
        "/path/to/package2"
      ),
    ];
  }

  describe(".get()", () => {
    it("should return dependencies", () => {
      const [pkg1, pkg2] = createPackages("0.0.1");
      const graph = new PackageGraph([pkg1, pkg2]);

      expect(graph.get(pkg1.name).dependencies).toEqual([]);
      expect(graph.get(pkg2.name).dependencies).toEqual([pkg1.name]);
    });

    it("should not return the dependencies for unrecognized versions", () => {
      const [pkg1, pkg2] = createPackages("0.0.1", "github:user-foo/project-foo#v0.0.1");
      const graph = new PackageGraph([pkg1, pkg2]);

      expect(graph.get(pkg1.name).dependencies).toEqual([]);
      expect(graph.get(pkg2.name).dependencies).toEqual([]);
    });

    it("should return the dependencies for parsed versions", () => {
      const [pkg1, pkg2] = createPackages("0.0.1", "github:user-foo/project-foo#v0.0.1");

      const mockParser = {
        parseVersion: jest.fn().mockReturnValue({
          prefix: "github:user-foo/project-foo#v",
          version: "0.0.1",
        }),
      };

      const graph = new PackageGraph([pkg1, pkg2], false, mockParser);

      expect(graph.get(pkg1.name).dependencies).toEqual([]);
      expect(graph.get(pkg2.name).dependencies).toEqual([pkg1.name]);
    });
  });
});
