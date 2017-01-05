import path from "path";

import ConfigUtilities from "../src/ConfigUtilities";
import FileSystemUtilities from "../src/FileSystemUtilities";
import GitUtilities from "../src/GitUtilities";
import NpmUtilities from "../src/NpmUtilities";
import exitWithCode from "./_exitWithCode";
import initFixture from "./_initFixture";
import CreateCommand from "../src/commands/CreateCommand";
import assertStubbedCalls from "./_assertStubbedCalls";

describe("CreateCommand", () => {
  describe("in a basic repo", () => {
    let testDir;
    beforeEach((done) => {
      testDir = initFixture("CreateCommand/basic", done);
    });

    it("should create a new package", (done) => {
      const testPackageName = "dougs-awesome";
      const testAuthor = "douglas.wade";
      const createCommand = new CreateCommand([testPackageName], {});
      const testManifest = {
        name: testPackageName,
        author: testAuthor,
        version: "1.0.0"
      };

      assertStubbedCalls([
        [NpmUtilities, "getWhoIAm", {}, [
          { args: [undefined], returns: testAuthor }
        ]],
        [ConfigUtilities, "readSync", {}, [
          { args: [testDir], returns: {} }
        ]],
        [FileSystemUtilities, "mkdirp", { valueCallback: true }, [
          { args: [path.join("packages", testPackageName)], returns: true }
        ]],
        [FileSystemUtilities, "writeFileSync", {}, [
          {
            args: [
              path.join("packages", testPackageName, "package.json"),
              JSON.stringify(testManifest)
            ],
            returns: true
          }
        ]],
        [GitUtilities, "addFile", {}, [
          { args: [path.join("packages", testPackageName, "package.json")], returns: true }
        ]],
        [GitUtilities, "commit", {}, [
          { args: [`Created package ${testPackageName}`], returns: true }
        ]],
      ]);

      createCommand.runValidations();
      createCommand.runPreparations();
      createCommand.runCommand(exitWithCode(0, done));
    });
  });

  describe("in a configurable-package-location repo", () => {
    let testDir;
    beforeEach((done) => {
      testDir = initFixture("CreateCommand/configurable-package-location", done);
    });

    it("should create a new package in a configurable package location", (done) => {
      const testPackageName = "dougs-awesome";
      const testAuthor = "douglas.wade";
      const testPackageLocation = "modules";
      const createCommand = new CreateCommand([testPackageName], {});
      const testRegistry = "http://registry.npmjs.com";
      const testManifest = {
        name: testPackageName,
        author: testAuthor,
        version: "1.0.0",
        publishConfig: { registry: testRegistry }
      };

      assertStubbedCalls([
        [NpmUtilities, "getWhoIAm", {}, [
          { args: [undefined], returns: testAuthor }
        ]],
        [ConfigUtilities, "readSync", {}, [
          { args: [testDir], returns: { packages: `${testPackageLocation}/*`, registry: testRegistry } }
        ]],
        [FileSystemUtilities, "mkdirp", { valueCallback: true }, [
          { args: [path.join(testPackageLocation, testPackageName)], returns: true }
        ]],
        [FileSystemUtilities, "writeFileSync", {}, [
          {
            args: [
              path.join(testPackageLocation, testPackageName, "package.json"),
              JSON.stringify(testManifest)
            ],
            returns: true
          }
        ]],
        [GitUtilities, "addFile", {}, [
          { args: [path.join(testPackageLocation, testPackageName, "package.json")], returns: true }
        ]],
        [GitUtilities, "commit", {}, [
          { args: [`Created package ${testPackageName}`], returns: true }
        ]],
      ]);

      createCommand.runValidations();
      createCommand.runPreparations();
      createCommand.runCommand(exitWithCode(0, done));
    });
  });

  describe("in a zero-packages repo", () => {
    let testDir;
    beforeEach((done) => {
      testDir = initFixture("CreateCommand/zero-packages", done);
    });

    it("should create a new package", (done) => {
      const testPackageName = "dougs-awesome";
      const testAuthor = "douglas.wade";
      const createCommand = new CreateCommand([testPackageName], {});
      const testManifest = {
        name: testPackageName,
        author: testAuthor,
        version: "1.0.0"
      };

      assertStubbedCalls([
        [NpmUtilities, "getWhoIAm", {}, [
          { args: [undefined], returns: testAuthor }
        ]],
        [ConfigUtilities, "readSync", {}, [
          { args: [testDir], returns: {} }
        ]],
        [FileSystemUtilities, "mkdirp", { valueCallback: true }, [
          { args: [path.join("packages", testPackageName)], returns: true }
        ]],
        [FileSystemUtilities, "writeFileSync", {}, [
          {
            args: [
              path.join("packages", testPackageName, "package.json"),
              JSON.stringify(testManifest)
            ],
            returns: true
          }
        ]],
        [GitUtilities, "addFile", {}, [
          { args: [path.join("packages", testPackageName, "package.json")], returns: true }
        ]],
        [GitUtilities, "commit", {}, [
          { args: [`Created package ${testPackageName}`], returns: true }
        ]],
      ]);

      createCommand.runValidations();
      createCommand.runPreparations();
      createCommand.runCommand(exitWithCode(0, done));
    });
  });
});
