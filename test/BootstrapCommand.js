import pathExists from "path-exists";
import assert from "assert";
import path from "path";
import fs from "fs";

import ChildProcessUtilities from "../src/ChildProcessUtilities";
import BootstrapCommand from "../src/commands/BootstrapCommand";
import exitWithCode from "./_exitWithCode";
import initFixture from "./_initFixture";
import stub from "./_stub";

import assertStubbedCalls from "./_assertStubbedCalls";

const STDIO_OPT = ["ignore", "ignore", "pipe"];

describe("BootstrapCommand", () => {

  describe("dependencies between packages in the repo", () => {
    let testDir;

    beforeEach(done => {
      testDir = initFixture("BootstrapCommand/basic", done);
    });

    it("should bootstrap files", done => {
      const bootstrapCommand = new BootstrapCommand([], {});

      bootstrapCommand.runValidations();
      bootstrapCommand.runPreparations();

      assertStubbedCalls([
        [ChildProcessUtilities, "spawn", { nodeCallback: true }, [
          { args: ["npm", ["install", "package-1@^0.0.0"], { cwd: path.join(testDir, "packages/package-4"), stdio: STDIO_OPT }] }
        ]]
      ]);

      bootstrapCommand.runCommand(exitWithCode(0, err => {
        if (err) return done(err);

        try {
          assert.ok(!pathExists.sync(path.join(testDir, "lerna-debug.log")), "lerna-debug.log should not exist");

          assert.ok(pathExists.sync(path.join(testDir, "packages/package-1/node_modules")));
          assert.ok(pathExists.sync(path.join(testDir, "packages/package-2/node_modules")));
          assert.ok(pathExists.sync(path.join(testDir, "packages/package-3/node_modules")));
          assert.ok(pathExists.sync(path.join(testDir, "packages/package-4/node_modules")));

          assert.ok(pathExists.sync(path.join(testDir, "packages/package-2/node_modules/package-1")));
          assert.ok(pathExists.sync(path.join(testDir, "packages/package-2/node_modules/package-1/index.js")));
          assert.ok(pathExists.sync(path.join(testDir, "packages/package-2/node_modules/package-1/package.json")));

          assert.ok(pathExists.sync(path.join(testDir, "packages/package-3/node_modules/package-2")));
          assert.ok(pathExists.sync(path.join(testDir, "packages/package-3/node_modules/package-2/index.js")));
          assert.ok(pathExists.sync(path.join(testDir, "packages/package-3/node_modules/package-2/package.json")));

          // Should not exist because mis-matched version
          assert.ok(!pathExists.sync(path.join(testDir, "packages/package-4/node_modules/package-1")));

          assert.equal(fs.readFileSync(path.join(testDir, "packages/package-2/node_modules/package-1/index.js")).toString(), "/**\n * @prefix\n */\nmodule.exports = require(\"" + path.join(testDir, "packages/package-1") + "\");\n");
          assert.equal(fs.readFileSync(path.join(testDir, "packages/package-2/node_modules/package-1/package.json")).toString(), "{\n  \"name\": \"package-1\",\n  \"version\": \"1.0.0\"\n}\n");

          assert.equal(fs.readFileSync(path.join(testDir, "packages/package-3/node_modules/package-2/index.js")).toString(), "/**\n * @prefix\n */\nmodule.exports = require(\"" + path.join(testDir, "packages/package-2") + "\");\n");
          assert.equal(fs.readFileSync(path.join(testDir, "packages/package-3/node_modules/package-2/package.json")).toString(), "{\n  \"name\": \"package-2\",\n  \"version\": \"1.0.0\",\n  \"main\": \"lib/index.js\"\n}\n");

          done();
        } catch (err) {
          done(err);
        }
      }));
    });

    it("should not bootstrap an ignored package", done => {
      const bootstrapCommand = new BootstrapCommand([], {
        ignore: "package-2"
      });

      bootstrapCommand.runValidations();
      bootstrapCommand.runPreparations();

      assertStubbedCalls([
        [ChildProcessUtilities, "spawn", { nodeCallback: true }, [
          { args: ["npm", ["install", "package-1@^0.0.0"], { cwd: path.join(testDir, "packages/package-4"), stdio: STDIO_OPT }] }
        ]]
      ]);

      bootstrapCommand.runCommand(exitWithCode(0, err => {
        if (err) return done(err);

        try {
          assert.ok(!pathExists.sync(path.join(testDir, "lerna-debug.log")), "lerna-debug.log should not exist");
          assert.ok(!pathExists.sync(path.join(testDir, "packages/package-2/node_modules/package-1")));
          done();
        } catch (err) {
          done(err);
        }
      }));
    });

    it("should not bootstrap ignored packages", done => {
      const bootstrapCommand = new BootstrapCommand([], {
        ignore: "package-@(3|4)"
      });

      bootstrapCommand.runValidations();
      bootstrapCommand.runPreparations();

      bootstrapCommand.runCommand(exitWithCode(0, err => {
        if (err) return done(err);

        try {
          assert.ok(!pathExists.sync(path.join(testDir, "lerna-debug.log")), "lerna-debug.log should not exist");
          assert.ok(!pathExists.sync(path.join(testDir, "packages/package-3/node_modules/package-2")));
          done();
        } catch (err) {
          done(err);
        }
      }));
    });
  });

  describe("external dependencies that haven't been installed", () => {
    let testDir;

    beforeEach(done => {
      testDir = initFixture("BootstrapCommand/cold", done);
    });

    it("should get installed", done => {
      const bootstrapCommand = new BootstrapCommand([], {});

      bootstrapCommand.runValidations();
      bootstrapCommand.runPreparations();

      let installed = false;
      stub(ChildProcessUtilities, "spawn", (command, args, options, callback) => {
        assert.deepEqual(args, ["install", "external@^1.0.0"])
        assert.deepEqual(options, { cwd: path.join(testDir, "packages/package-1"), stdio: STDIO_OPT })
        installed = true;
        callback();
      });

      bootstrapCommand.runCommand(exitWithCode(0, err => {
        if (err) return done(err);

        try {
          assert.ok(!pathExists.sync(path.join(testDir, "lerna-debug.log")), "lerna-debug.log should not exist");
          assert.ok(installed, "The external dependency was installed");

          done();
        } catch (err) {
          done(err);
        }
      }));
    });
  });

  describe("external dependencies that have already been installed", () => {
    let testDir;

    beforeEach(done => {
      testDir = initFixture("BootstrapCommand/warm", done);
    });

    it("should not get re-installed", done => {
      const bootstrapCommand = new BootstrapCommand([], {});

      bootstrapCommand.runValidations();
      bootstrapCommand.runPreparations();

      let installed = false;
      stub(ChildProcessUtilities, "spawn", (command, args, options, callback) => {
        installed = true;
        callback();
      });

      bootstrapCommand.runCommand(exitWithCode(0, err => {
        if (err) return done(err);

        try {
          assert.ok(!pathExists.sync(path.join(testDir, "lerna-debug.log")), "lerna-debug.log should not exist");
          assert.ok(!installed, "The external dependency was not installed");

          done();
        } catch (err) {
          done(err);
        }
      }));
    });
  });
});
