import log from "npmlog";

// file under test
import VersionSerializer from "../src/VersionSerializer";

// silence logs
log.level = "silent";

describe("VersionSerializer", () => {
  let serializer;

  beforeEach(() => {
    const parser = {
      parseVersion(version) {
        const chunks = version.split("#");
        return {
          prefix: chunks.length > 1 ? `${chunks[0]}#` : null,
          version: chunks.length > 1 ? chunks[1] : version,
        };
      },
    };
    serializer = new VersionSerializer({
      graphDependencies: ["my-package-1", "my-package-2", "my-package-3"],
      versionParser: parser,
    });
  });

  describe("deserialize", () => {
    it("should use version parser for inter-package dependencies only", () => {
      const mockParser = {
        parseVersion: jest.fn().mockReturnValue({
          prefix: null,
          version: "0.0.1",
        }),
      };

      serializer = new VersionSerializer({
        graphDependencies: ["my-package-1", "my-package-2", "my-package-3"],
        versionParser: mockParser,
      });

      const pkg = {
        name: "my-package-1",
        version: "1.0.0",
        dependencies: {
          "my-dependency": "^1.0.0",
        },
        devDependencies: {
          "my-package-2": "^1.0.0",
          "my-package-3": "^1.0.0",
        },
        peerDependencies: {
          "my-package-3": ">=1.0.0",
        },
      };

      serializer.deserialize(pkg);
      expect(mockParser.parseVersion).toHaveBeenCalledTimes(2);
    });

    it("should not touch versions parser does not recognize", () => {
      const pkg = {
        name: "my-package-1",
        dependencies: {
          "my-dependency": "^1.0.0",
        },
        devDependencies: {
          "my-package-2": "^1.0.0",
          "my-package-3": "^1.0.0",
        },
        peerDependencies: {
          "my-package-3": ">=1.0.0",
        },
      };

      expect(serializer.deserialize(pkg)).toEqual(pkg);
    });

    it("should extract versions recognized by parser", () => {
      expect(
        serializer.deserialize({
          name: "my-package-1",
          version: "1.0.0",
          dependencies: {
            "my-dependency": "dont-touch-this#1.0.0",
          },
          devDependencies: {
            "my-package-2": "bbb#1.0.0",
            "my-package-3": "ccc#1.0.0",
          },
          peerDependencies: {
            "my-package-3": ">=1.0.0",
          },
        })
      ).toEqual({
        name: "my-package-1",
        version: "1.0.0",
        dependencies: {
          "my-dependency": "dont-touch-this#1.0.0",
        },
        devDependencies: {
          "my-package-2": "1.0.0",
          "my-package-3": "1.0.0",
        },
        peerDependencies: {
          "my-package-3": ">=1.0.0",
        },
      });
    });
  });

  describe("serialize", () => {
    it("should not touch versions parser does not recognize", () => {
      const pkg = {
        name: "my-package-1",
        version: "1.0.0",
        dependencies: {
          "my-dependency": "^1.0.0",
        },
        devDependencies: {
          "my-package-2": "^1.0.0",
          "my-package-3": "^1.0.0",
        },
        peerDependencies: {
          "my-package-3": ">=1.0.0",
        },
      };

      expect(serializer.serialize(pkg)).toEqual(pkg);
    });

    it("should write back version strings transformed by deserialize", () => {
      // since serializer is stateful, version prefixes will be stored in its state
      serializer.deserialize({
        name: "my-package-1",
        version: "1.0.0",
        dependencies: {
          "my-dependency": "dont-touch-this#1.0.0",
        },
        devDependencies: {
          "my-package-2": "bbb#1.0.0",
          "my-package-3": "ccc#1.0.0",
        },
        peerDependencies: {
          "my-package-3": ">=1.0.0",
        },
      });

      // the preserved prefixes should be written back
      expect(
        serializer.serialize({
          name: "my-package-1",
          version: "1.0.0",
          dependencies: {
            "my-dependency": "dont-touch-this#1.0.0",
          },
          devDependencies: {
            "my-package-2": "1.0.0",
            "my-package-3": "1.0.0",
          },
          peerDependencies: {
            "my-package-3": ">=1.0.0",
          },
        })
      ).toEqual({
        name: "my-package-1",
        version: "1.0.0",
        dependencies: {
          "my-dependency": "dont-touch-this#1.0.0",
        },
        devDependencies: {
          "my-package-2": "bbb#1.0.0",
          "my-package-3": "ccc#1.0.0",
        },
        peerDependencies: {
          "my-package-3": ">=1.0.0",
        },
      });
    });
  });
});
