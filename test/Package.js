import assert from "assert";

import Package from "../src/Package";

describe("Package", () => {
  let pkg;

  beforeEach(() => {
    pkg = new Package(
      {
        name: "my-package",
        version: "1.0.0",
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

  describe("get .allDependencies", () => {
    it("should return the combined dependencies", () => {
      assert.deepEqual(pkg.allDependencies, {
        "my-dependency": "^1.0.0",
        "my-dev-dependency": "^1.0.0",
        "my-peer-dependency": "^1.0.0"
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
});
