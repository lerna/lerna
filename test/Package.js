// mocked modules
import NpmUtilities from "../src/NpmUtilities";

// helpers
import callsBack from "./helpers/callsBack";

// file under test
import Package from "../src/Package";

jest.mock("../src/NpmUtilities");

describe("Package", () => {
  let pkg;

  beforeEach(() => {
    pkg = new Package(
      {
        name: "my-package",
        version: "1.0.0",
        bin: "bin.js",
        scripts: { "my-script": "echo 'hello world'" },
        dependencies: { "my-dependency": "^1.0.0" },
        devDependencies: { "my-dev-dependency": "^1.0.0" },
        peerDependencies: { "my-peer-dependency": "^1.0.0" }
      },
      "/path/to/package"
    );
  });

  describe("get .name", () => {
    it("should return the name", () => {
      expect(pkg.name).toBe("my-package");
    });
  });

  describe("get .location", () => {
    it("should return the location", () => {
      expect(pkg.location).toBe("/path/to/package");
    });
  });

  describe("get .version", () => {
    it("should return the version", () => {
      expect(pkg.version).toBe("1.0.0");
    });
  });

  describe("set .version", () => {
    it("should return the version", () => {
      pkg.version = "2.0.0";
      expect(pkg.version).toBe("2.0.0");
    });
  });

  describe("get .bin", () => {
    it("should return the bin", () => {
      expect(pkg.bin).toBe("bin.js");
    });
  });

  describe("get .dependencies", () => {
    it("should return the dependencies", () => {
      expect(pkg.dependencies).toEqual({ "my-dependency": "^1.0.0" });
    });
  });

  describe("get .devDependencies", () => {
    it("should return the devDependencies", () => {
      expect(pkg.devDependencies).toEqual({ "my-dev-dependency": "^1.0.0" });
    });
  });

  describe("get .peerDependencies", () => {
    it("should return the peerDependencies", () => {
      expect(pkg.peerDependencies).toEqual({ "my-peer-dependency": "^1.0.0" });
    });
  });

  describe("get .allDependencies", () => {
    it("should return the combined dependencies", () => {
      expect(pkg.allDependencies).toEqual({
        "my-dependency": "^1.0.0",
        "my-dev-dependency": "^1.0.0"
      });
    });
  });

  describe("get .scripts", () => {
    it("should return the scripts", () => {
      expect(pkg.scripts).toEqual({
        "my-script": "echo 'hello world'"
      });
    });
  });

  describe(".isPrivate()", () => {
    it("should return if the package is private", () => {
      expect(pkg.isPrivate()).toBe(false);
    });
  });

  describe(".toJSON()", () => {
    it("should return internal package for serialization", () => {
      expect(pkg.toJSON()).toBe(pkg._package);

      const implicit = JSON.stringify(pkg, null, 2);
      const explicit = JSON.stringify(pkg._package, null, 2);

      expect(implicit).toBe(explicit);
    });
  });

  describe(".runScript()", () => {
    it("should run the script", (done) => {
      NpmUtilities.runScriptInDir = jest.fn(callsBack());

      pkg.runScript("my-script", () => {
        try {
          expect(NpmUtilities.runScriptInDir).lastCalledWith(
            "my-script",
            [],
            pkg.location,
            expect.any(Function)
          );

          done();
        } catch (ex) {
          done.fail(ex);
        }
      });
    });
  });

  describe(".hasMatchingDependency()", () => {
    it("should match included dependency", () => {
      expect(pkg.hasMatchingDependency({
        name: "my-dependency",
        version: "1.1.3"
      })).toBe(true);
    });

    it("should not match missing dependency", () => {
      expect(pkg.hasMatchingDependency({ name: "missing", version: "1.0.0" })).toBe(false);
    });

    it("should not match included dependency", () => {
      const logger = {
        warn: jest.fn(),
      };
      const result = pkg.hasMatchingDependency({
        name: "my-dev-dependency",
        version: "2.0.7"
      }, logger);

      expect(result).toBe(false);
      expect(logger.warn).toBeCalled();
    });
  });
});
