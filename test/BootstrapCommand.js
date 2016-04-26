import pathExists from "path-exists";
import assert from "assert";
import path from "path";
import fs from "fs";

import ChildProcessUtilities from "../src/ChildProcessUtilities";
import BootstrapCommand from "../src/commands/BootstrapCommand";
import exitWithCode from "./_exitWithCode";
import initFixture from "./_initFixture";

import assertStubbedCalls from "./_assertStubbedCalls";

describe("BootstrapCommand", () => {
  let testDir;

  beforeEach(done => {
    testDir = initFixture("BootstrapCommand/basic", done);
  });

  it("should bootstrap files", done => {
    const bootstrapCommand = new BootstrapCommand([], {});

    bootstrapCommand.runValidations();
    bootstrapCommand.runPreparations();

    assertStubbedCalls([
      [ChildProcessUtilities, "exec", { nodeCallback: true }, [
        { args: ["npm install package-1@^0.0.0", { cwd: path.join(testDir, "packages/package-4") }] }
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

        assert.equal(fs.readFileSync(path.join(testDir, "packages/package-2/node_modules/package-1/index.js")).toString(), "module.exports = require(\"" + path.join(testDir, "packages/package-1") + "\");\n");
        assert.equal(fs.readFileSync(path.join(testDir, "packages/package-2/node_modules/package-1/package.json")).toString(), "{\n  \"name\": \"package-1\",\n  \"version\": \"1.0.0\"\n}\n");

        assert.equal(fs.readFileSync(path.join(testDir, "packages/package-3/node_modules/package-2/index.js")).toString(), "module.exports = require(\"" + path.join(testDir, "packages/package-2") + "\");\n");
        assert.equal(fs.readFileSync(path.join(testDir, "packages/package-3/node_modules/package-2/package.json")).toString(), "{\n  \"name\": \"package-2\",\n  \"version\": \"1.0.0\"\n}\n");

        done();
      } catch (err) {
        done(err);
      }
    }));
  });
});
