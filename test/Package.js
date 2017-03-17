import assert from "assert";

import Package from "../src/Package";
import ChildProcessUtilities from "../src/ChildProcessUtilities";
import assertStubbedCalls from "./helpers/assertStubbedCalls";

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
        optionalDependencies: { "my-optional-dependency": "^1.0.0" },
        peerDependencies: { "my-peer-dependency": "^1.0.0" }
      },
      "/path/to/package"
    );
  });

  describe("get .name", () => {
    it("should return the name", () => {
      assert.equal(pkg.name, "my-package");
    });
  });

  describe("get .location", () => {
    it("should return the location", () => {
      assert.equal(pkg.location, "/path/to/package");
    });
  });

  describe("get .version", () => {
    it("should return the version", () => {
      assert.equal(pkg.version, "1.0.0");
    });
  });

  describe("set .version", () => {
    it("should return the version", () => {
      pkg.version = "2.0.0";
      assert.equal(pkg.version, "2.0.0");
    });
  });

  describe("get .bin", () => {
    it("should return the bin", () => {
      assert.equal(pkg.bin, "bin.js");
    });
  });

  describe("get .dependencies", () => {
    it("should return the dependencies", () => {
      assert.deepEqual(pkg.dependencies, { "my-dependency": "^1.0.0" });
    });
  });

  describe("get .devDependencies", () => {
    it("should return the devDependencies", () => {
      assert.deepEqual(pkg.devDependencies, { "my-dev-dependency": "^1.0.0" });
    });
  });

  describe("get .peerDependencies", () => {
    it("should return the peerDependencies", () => {
      assert.deepEqual(pkg.peerDependencies, { "my-peer-dependency": "^1.0.0" });
    });
  });

  describe("get .optionalDependencies", () => {
    it("should return the optionalDependencies", () => {
      assert.deepEqual(pkg.optionalDependencies, { "my-optional-dependency": "^1.0.0" });
    });
  });

  describe("get .allDependencies", () => {
    it("should return the combined dependencies", () => {
      assert.deepEqual(pkg.allDependencies, {
        "my-dependency": "^1.0.0",
        "my-dev-dependency": "^1.0.0",
        "my-optional-dependency": "^1.0.0"
      });
    });
  });

  describe("get .scripts", () => {
    it("should return the scripts", () => {
      assert.deepEqual(pkg.scripts, {
        "my-script": "echo 'hello world'"
      });
    });
  });

  describe(".isPrivate()", () => {
    it("should return if the package is private", () => {
      assert.equal(pkg.isPrivate(), false);
    });
  });

  describe(".runScript()", () => {
    it("should run the script", (done) => {
      assertStubbedCalls([
        [ChildProcessUtilities, "exec", { nodeCallback: true }, [
          {
            args: [
              "npm run my-script ",
              {
                cwd: "/path/to/package",
                env: process.env
              }
            ]
          }
        ]]
      ]);
      pkg.runScript("my-script", () => {
        done();
      });
    });
  });

  describe(".hasMatchingDependency()", () => {
    it("should match included dependency", () => {
      assert.equal(pkg.hasMatchingDependency({
        name: "my-dependency",
        version: "1.1.3"
      }), true);
    });
    it("should not match included dependency", () => {
      let called;
      const logger = {
        warn(msg) {
          called = msg;
        }
      };
      assert.equal(pkg.hasMatchingDependency({
        name: "my-dev-dependency",
        version: "2.0.7"
      }, logger), false);
      assert.ok(called);
    });
  });
});
