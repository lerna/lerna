"use strict";

const os = require("os");
const path = require("path");

// file under test
const Package = require("..");

describe("Package", () => {
  const factory = json =>
    new Package(json, path.normalize(`/root/path/to/${json.name || "package"}`), path.normalize("/root"));

  describe("get .name", () => {
    it("should return the name", () => {
      const pkg = factory({ name: "get-name" });
      expect(pkg.name).toBe("get-name");
    });
  });

  describe("get .location", () => {
    it("should return the location", () => {
      const pkg = factory({ name: "get-location" });
      expect(pkg.location).toBe(path.normalize("/root/path/to/get-location"));
    });
  });

  describe("get .resolved", () => {
    it("returns npa.Result relative to rootPath, always posix", () => {
      const pkg = factory({ name: "get-resolved" });
      expect(pkg.resolved).toMatchObject({
        type: "directory",
        name: "get-resolved",
        where: path.normalize("/root"),
        // windows is so fucking ridiculous
        fetchSpec: path.resolve(os.homedir(), pkg.location),
      });
    });
  });

  describe("get .rootPath", () => {
    it("should return the rootPath", () => {
      const pkg = factory({ name: "get-rootPath" });
      expect(pkg.rootPath).toBe(path.normalize("/root"));
    });
  });

  describe("get .version", () => {
    it("should return the version", () => {
      const pkg = factory({ version: "1.0.0" });
      expect(pkg.version).toBe("1.0.0");
    });
  });

  describe("set .version", () => {
    it("should set the version", () => {
      const pkg = factory({ version: "1.0.0" });
      pkg.version = "2.0.0";
      expect(pkg.version).toBe("2.0.0");
    });
  });

  describe("get .bin", () => {
    it("should return the bin object", () => {
      const pkg = factory({
        name: "obj-bin",
        bin: { "custom-bin": "bin.js" },
      });
      expect(pkg.bin).toEqual({ "custom-bin": "bin.js" });
    });

    it("returns a normalized object when pkg.bin is a string", () => {
      const pkg = factory({
        name: "string-bin",
        bin: "bin.js",
      });
      expect(pkg.bin).toEqual({ "string-bin": "bin.js" });
    });

    it("strips scope from normalized bin name", () => {
      const pkg = factory({
        name: "@scoped/string-bin",
        bin: "bin.js",
      });
      expect(pkg.bin).toEqual({ "string-bin": "bin.js" });
    });
  });

  describe("get .dependencies", () => {
    it("should return the dependencies", () => {
      const pkg = factory({
        dependencies: { "my-dependency": "^1.0.0" },
      });
      expect(pkg.dependencies).toEqual({ "my-dependency": "^1.0.0" });
    });
  });

  describe("get .devDependencies", () => {
    it("should return the devDependencies", () => {
      const pkg = factory({
        devDependencies: { "my-dev-dependency": "^1.0.0" },
      });
      expect(pkg.devDependencies).toEqual({ "my-dev-dependency": "^1.0.0" });
    });
  });

  describe("get .optionalDependencies", () => {
    it("should return the optionalDependencies", () => {
      const pkg = factory({
        optionalDependencies: { "my-optional-dependency": "^1.0.0" },
      });
      expect(pkg.optionalDependencies).toEqual({ "my-optional-dependency": "^1.0.0" });
    });
  });

  describe("get .peerDependencies", () => {
    it("should return the peerDependencies", () => {
      const pkg = factory({
        peerDependencies: { "my-peer-dependency": ">=1.0.0" },
      });
      expect(pkg.peerDependencies).toEqual({ "my-peer-dependency": ">=1.0.0" });
    });
  });

  describe("get .scripts", () => {
    it("should return the scripts", () => {
      const pkg = factory({
        scripts: { "my-script": "echo 'hello world'" },
      });
      expect(pkg.scripts).toEqual({
        "my-script": "echo 'hello world'",
      });
    });

    it("preserves immutability of the input", () => {
      const json = {
        scripts: { "my-script": "keep" },
      };
      const pkg = factory(json);

      pkg.scripts["my-script"] = "tweaked";

      expect(pkg.scripts).toHaveProperty("my-script", "tweaked");
      expect(json.scripts).toHaveProperty("my-script", "keep");
    });
  });

  describe("get .private", () => {
    it("should indicate if the package is private", () => {
      const pkg = factory({ name: "not-private" });
      expect(pkg.private).toBe(false);
    });
  });

  describe(".toJSON()", () => {
    it("should return clone of internal package for serialization", () => {
      const json = {
        name: "is-cloned",
      };
      const pkg = factory(json);

      expect(pkg.toJSON()).not.toBe(json);
      expect(pkg.toJSON()).toEqual(json);

      const implicit = JSON.stringify(pkg, null, 2);
      const explicit = JSON.stringify(json, null, 2);

      expect(implicit).toBe(explicit);
    });
  });
});
