"use strict";

const log = require("npmlog");

// mocked modules
const NpmUtilities = require("../src/NpmUtilities");

// helpers
const callsBack = require("./helpers/callsBack");
const loggingOutput = require("./helpers/loggingOutput");

// file under test
const Package = require("../src/Package");

jest.mock("../src/NpmUtilities");

// silence logs
log.level = "silent";

describe("Package", () => {
  const factory = json => new Package(json, `/root/path/to/${json.name || "package"}`, "/root");

  describe("get .name", () => {
    it("should return the name", () => {
      const pkg = factory({ name: "get-name" });
      expect(pkg.name).toBe("get-name");
    });
  });

  describe("get .location", () => {
    it("should return the location", () => {
      const pkg = factory({ name: "get-location" });
      expect(pkg.location).toBe("/root/path/to/get-location");
    });
  });

  describe("get .resolved", () => {
    it("returns npa.Result relative to rootPath", () => {
      const pkg = factory({ name: "get-resolved" });
      expect(pkg.resolved).toMatchObject({
        type: "directory",
        where: "/root",
        name: "get-resolved",
        fetchSpec: pkg.location,
      });
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

  describe("get .peerDependencies", () => {
    it("should return the peerDependencies", () => {
      const pkg = factory({
        peerDependencies: { "my-peer-dependency": ">=1.0.0" },
      });
      expect(pkg.peerDependencies).toEqual({ "my-peer-dependency": ">=1.0.0" });
    });
  });

  describe("get .allDependencies", () => {
    it("should return the combined dependencies", () => {
      const pkg = factory({
        dependencies: { "my-dependency": "^1.0.0" },
        devDependencies: { "my-dev-dependency": "^1.0.0" },
        peerDependencies: { "my-peer-dependency": ">=1.0.0" },
      });
      expect(pkg.allDependencies).toEqual({
        "my-dependency": "^1.0.0",
        "my-dev-dependency": "^1.0.0",
      });
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

  describe(".set versionSerializer", () => {
    it("should call 'deserialize' method of serializer'", () => {
      const pkg = factory({ name: "serialized-version" });
      const mockSerializer = {
        serialize: jest.fn(obj => obj),
        deserialize: jest.fn(obj => obj),
      };

      pkg.versionSerializer = mockSerializer;

      expect(mockSerializer.deserialize).toBeCalled();
      expect(mockSerializer.deserialize).toBeCalledWith(pkg.json);
      expect(mockSerializer.serialize).not.toBeCalled();
    });
  });

  describe(".toJSON()", () => {
    it("should return clone of internal package for serialization", () => {
      const pkg = factory({
        name: "is-cloned",
      });

      expect(pkg.toJSON()).not.toBe(pkg.json);
      expect(pkg.toJSON()).toEqual(pkg.json);

      const implicit = JSON.stringify(pkg, null, 2);
      const explicit = JSON.stringify(pkg.json, null, 2);

      expect(implicit).toBe(explicit);
    });

    it("should not change internal package with versionSerializer", () => {
      const pkg = factory({
        name: "is-idempotent",
      });
      const mockSerializer = {
        serialize: jest.fn(obj => {
          obj.state = "serialized";
          return obj;
        }),
        deserialize: jest.fn(obj => {
          obj.state = "deserialized";
          return obj;
        }),
      };

      pkg.json.state = "serialized";

      const serializedPkg = Object.assign({}, pkg.json, { state: "serialized" });
      const deserializedPkg = Object.assign({}, pkg.json, { state: "deserialized" });

      pkg.versionSerializer = mockSerializer;
      expect(mockSerializer.deserialize).toBeCalled();
      expect(pkg.json).toEqual(deserializedPkg);

      const serializedResult = pkg.toJSON();
      expect(pkg.json).toEqual(deserializedPkg);
      expect(serializedResult).toEqual(serializedPkg);

      expect(mockSerializer.serialize).toBeCalled();
    });

    it("should use versionSerializer.serialize on internal package before return", () => {
      const pkg = factory({
        name: "is-serialized",
      });
      const mockSerializer = {
        serialize: jest.fn(obj => obj),
        deserialize: jest.fn(obj => obj),
      };

      pkg.versionSerializer = mockSerializer;

      expect(pkg.toJSON()).toEqual(pkg.json);

      expect(mockSerializer.deserialize).toBeCalled();
      expect(mockSerializer.serialize).toBeCalled();
      expect(mockSerializer.serialize).toBeCalledWith(pkg.json);
    });
  });

  describe(".runScript()", () => {
    it("should run the script", done => {
      NpmUtilities.runScriptInDir = jest.fn(callsBack());

      const pkg = factory({
        scripts: { "my-script": "echo 'hello world'" },
      });

      pkg.runScript("my-script", () => {
        try {
          expect(NpmUtilities.runScriptInDir).lastCalledWith(
            "my-script",
            {
              args: [],
              directory: pkg.location,
              npmClient: "npm",
            },
            expect.any(Function)
          );

          done();
        } catch (ex) {
          done.fail(ex);
        }
      });
    });
  });

  describe(".runScriptSync()", () => {
    it("should run the script", () => {
      NpmUtilities.runScriptInDirSync = jest.fn(callsBack());

      const pkg = factory({
        scripts: { "my-script": "echo 'hello world'" },
      });

      pkg.runScriptSync("my-script", () => {});

      expect(NpmUtilities.runScriptInDirSync).lastCalledWith(
        "my-script",
        {
          args: [],
          directory: pkg.location,
          npmClient: "npm",
        },
        expect.any(Function)
      );
    });
  });

  describe(".hasMatchingDependency()", () => {
    const pkg = factory({
      name: "has-matching",
      dependencies: { "my-dependency": "^1.0.0" },
      devDependencies: { "my-dev-dependency": "^1.0.0" },
      peerDependencies: { "my-peer-dependency": ">=1.0.0" },
    });

    it("should match included dependency", () => {
      expect(
        pkg.hasMatchingDependency({
          name: "my-dependency",
          version: "1.1.3",
        })
      ).toBe(true);
    });

    it("should not match missing dependency", () => {
      expect(pkg.hasMatchingDependency({ name: "missing", version: "1.0.0" })).toBe(false);
      expect(loggingOutput()).toEqual([]);
    });

    it("should not match included dependency", () => {
      const result = pkg.hasMatchingDependency(
        {
          name: "my-dev-dependency",
          version: "2.0.7",
        },
        true
      );

      expect(result).toBe(false);
      expect(loggingOutput()).toMatchSnapshot();
    });
  });
});
