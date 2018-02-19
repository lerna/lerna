"use strict";

// file under test
const VersionSerializer = require("../src/VersionSerializer");

describe("VersionSerializer", () => {
  describe("deserialize", () => {
    it("should not touch versions parser does not recognize", () => {
      const serializer = new VersionSerializer({
        localDependencies: new Set(["my-package-1", "my-package-2", "my-package-3"]),
        tagVersionPrefix: "v", // default
      });
      const pkg = {
        name: "my-package-1",
        dependencies: {
          "external-dep": "^1.0.0",
          "my-package-2": "^1.0.0",
          "my-package-3": "^1.0.0",
        },
      };

      expect(serializer.deserialize(pkg)).toEqual(pkg);
    });

    it("should extract versions recognized by parser", () => {
      const serializer = new VersionSerializer({
        localDependencies: new Set(["my-package-1", "my-package-2", "my-package-3"]),
      });

      expect(
        serializer.deserialize({
          name: "my-package-1",
          version: "1.0.0",
          dependencies: {
            "external-dep": "github:org/external-dep#v1.0.0",
          },
          devDependencies: {
            // shorthand
            "my-package-2": "github:user/my-package-2#v1.0.0",
            // deprecated "git scp"-style
            "my-package-3": "git@github.com:user/my-package-3#v1.0.0",
          },
          peerDependencies: {
            "my-package-3": ">=1.0.0",
          },
        })
      ).toEqual({
        name: "my-package-1",
        version: "1.0.0",
        dependencies: {
          "external-dep": "github:org/external-dep#v1.0.0",
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

    it("supports custom tag version prefix", () => {
      const serializer = new VersionSerializer({
        localDependencies: new Set(["my-package-1", "my-package-2", "my-package-3"]),
        tagVersionPrefix: "",
      });

      expect(
        serializer.deserialize({
          name: "my-package-1",
          version: "1.0.0",
          devDependencies: {
            "external-dep": "github:org/external-dep#1.0.0",
            // shorthand
            "my-package-2": "github:user/my-package-2#1.0.0",
            // deprecated "git scp"-style
            "my-package-3": "git@github.com:user/my-package-3#1.0.0",
          },
          peerDependencies: {
            "my-package-3": ">=1.0.0",
          },
        })
      ).toEqual({
        name: "my-package-1",
        version: "1.0.0",
        devDependencies: {
          "external-dep": "github:org/external-dep#1.0.0",
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
      const serializer = new VersionSerializer({
        localDependencies: new Set(["my-package-1", "my-package-2", "my-package-3"]),
        tagVersionPrefix: "v", // default
      });
      const pkg = {
        name: "my-package-1",
        version: "1.0.0",
        devDependencies: {
          "external-dep": "^1.0.0",
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
      const serializer = new VersionSerializer({
        localDependencies: new Set(["my-package-1", "my-package-2", "my-package-3"]),
      });

      // since serializer is stateful, version prefixes will be stored in its state
      serializer.deserialize({
        name: "my-package-1",
        version: "1.0.0",
        dependencies: {
          "external-dep": "github:org/external-dep#v1.0.0",
          // normalized by npm-package-arg
          "my-package-2": "git+ssh://git@github.com:user/my-package-2#v1.0.0",
        },
        devDependencies: {
          // default sshurl with optional .git suffix
          "my-package-3": "ssh://git@github.com:user/my-package-3.git#v1.0.0",
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
            "external-dep": "github:org/external-dep#v1.0.0",
            "my-package-2": "1.0.0",
          },
          devDependencies: {
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
          "external-dep": "github:org/external-dep#v1.0.0",
          "my-package-2": "git+ssh://git@github.com:user/my-package-2#v1.0.0",
        },
        devDependencies: {
          "my-package-3": "ssh://git@github.com:user/my-package-3.git#v1.0.0",
        },
        peerDependencies: {
          "my-package-3": ">=1.0.0",
        },
      });
    });

    it("supports custom tag version prefix", () => {
      const serializer = new VersionSerializer({
        localDependencies: new Set(["my-package-1", "my-package-2", "my-package-3"]),
        tagVersionPrefix: "",
      });

      // since serializer is stateful, version prefixes will be stored in its state
      serializer.deserialize({
        name: "my-package-1",
        version: "1.0.0",
        dependencies: {
          "external-dep": "github:org/external-dep#1.0.0",
          // normalized by npm-package-arg
          "my-package-2": "git+ssh://git@github.com:user/my-package-2#1.0.0",
          // default sshurl with optional .git suffix
          "my-package-3": "ssh://git@github.com:user/my-package-3.git#1.0.0",
        },
      });

      // the preserved prefixes should be written back
      expect(
        serializer.serialize({
          name: "my-package-1",
          version: "1.0.0",
          dependencies: {
            "external-dep": "github:org/external-dep#1.0.0",
            "my-package-2": "1.0.0",
            "my-package-3": "1.0.0",
          },
        })
      ).toEqual({
        name: "my-package-1",
        version: "1.0.0",
        dependencies: {
          "external-dep": "github:org/external-dep#1.0.0",
          "my-package-2": "git+ssh://git@github.com:user/my-package-2#1.0.0",
          "my-package-3": "ssh://git@github.com:user/my-package-3.git#1.0.0",
        },
      });
    });
  });
});
