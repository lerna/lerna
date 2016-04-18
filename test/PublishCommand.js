import pathExists from "path-exists";
import assert from "assert";
import path from "path";
import fs from "fs";

import ChildProcessUtilities from "../src/ChildProcessUtilities";
import PromptUtilities from "../src/PromptUtilities";
import PublishCommand from "../src/commands/PublishCommand";
import initFixture from "./_initFixture";
import stub from "./_stub";

describe("PublishCommand", () => {
  let testDir;

  beforeEach(done => {
    testDir = initFixture("PublishCommand/basic", done);
  });

  it("should publish the changed packages", done => {
    const publishCommand = new PublishCommand([], {});

    publishCommand.runPreparations();

    stub(PromptUtilities, "select", (message, options, callback) => {
      callback(options.choices[0].value); // Patch
    });

    stub(PromptUtilities, "confirm", (message, callback) => {
      callback(true); // Confirm version
    });

    let calls = 0;

    stub(ChildProcessUtilities, "execSync", (command) => {
      let returns;

      try {
        if (calls === 0) assert.equal(command, "git tag")
        if (calls === 1) assert.equal(command, "git add " + path.join(testDir, "VERSION"));
        if (calls === 2) assert.equal(command, "git add " + path.join(testDir, "packages/package-1/package.json"));
        if (calls === 3) assert.equal(command, "git add " + path.join(testDir, "packages/package-2/package.json"));
        if (calls === 4) assert.equal(command, "git add " + path.join(testDir, "packages/package-3/package.json"));
        if (calls === 5) assert.equal(command, "git add " + path.join(testDir, "packages/package-4/package.json"));
        if (calls === 6) assert.equal(command, "git commit -m \"$(echo \"v1.0.1\")\"");
        if (calls === 7) assert.equal(command, "git tag v1.0.1");

        if (calls === 12) { assert.equal(command, "npm dist-tag ls package-1"); returns = "lerna-temp: 1.0.1\nstable: 1.0.0"; }
        if (calls === 13) assert.equal(command, "npm dist-tag rm package-1 lerna-temp");
        if (calls === 14) assert.equal(command, "npm dist-tag add package-1@1.0.1 latest");

        if (calls === 15) { assert.equal(command, "npm dist-tag ls package-2"); returns = "lerna-temp: 1.0.1\nstable: 1.0.0"; }
        if (calls === 16) assert.equal(command, "npm dist-tag rm package-2 lerna-temp");
        if (calls === 17) assert.equal(command, "npm dist-tag add package-2@1.0.1 latest");

        if (calls === 18) { assert.equal(command, "npm dist-tag ls package-3"); returns = "lerna-temp: 1.0.1\nstable: 1.0.0"; }
        if (calls === 19) assert.equal(command, "npm dist-tag rm package-3 lerna-temp");
        if (calls === 20) assert.equal(command, "npm dist-tag add package-3@1.0.1 latest");

        if (calls === 21) { assert.equal(command, "npm dist-tag ls package-4"); returns = "lerna-temp: 1.0.1\nstable: 1.0.0"; }
        if (calls === 22) assert.equal(command, "npm dist-tag rm package-4 lerna-temp");
        if (calls === 23) assert.equal(command, "npm dist-tag add package-4@1.0.1 latest");

        if (calls === 24) assert.equal(command, "git push");
        if (calls === 25) assert.equal(command, "git push origin v1.0.1");

        if (calls >= 25) complete();

        calls++;
        return returns;
      } catch (err) {
        done(err);
      }
    });

    stub(ChildProcessUtilities, "exec", (command, options, callback) => {
      try {
        if (calls ===  8) assert.equal(command, "cd " + path.join(testDir, "packages/package-1") + " && npm publish --tag lerna-temp");
        if (calls ===  9) assert.equal(command, "cd " + path.join(testDir, "packages/package-2") + " && npm publish --tag lerna-temp");
        if (calls === 10) assert.equal(command, "cd " + path.join(testDir, "packages/package-3") + " && npm publish --tag lerna-temp");
        if (calls === 11) assert.equal(command, "cd " + path.join(testDir, "packages/package-4") + " && npm publish --tag lerna-temp");
        calls++;
        callback();
      } catch (err) {
        done(err);
      }
    });

    function complete() {
      assert.ok(!pathExists.sync(path.join(testDir, "lerna-debug.log")));
      assert.equal(fs.readFileSync(path.join(testDir, "VERSION")), "1.0.1");

      assert.equal(require(path.join(testDir, "packages/package-1/package.json")).version, "1.0.1");
      assert.equal(require(path.join(testDir, "packages/package-2/package.json")).version, "1.0.1");
      assert.equal(require(path.join(testDir, "packages/package-3/package.json")).version, "1.0.1");
      assert.equal(require(path.join(testDir, "packages/package-4/package.json")).version, "1.0.1");

      assert.equal(require(path.join(testDir, "packages/package-2/package.json")).dependencies["package-1"], "^1.0.1");
      assert.equal(require(path.join(testDir, "packages/package-3/package.json")).devDependencies["package-2"], "^1.0.1");
      assert.equal(require(path.join(testDir, "packages/package-4/package.json")).dependencies["package-1"], "^0.0.0");

      done();
    }

    publishCommand.runCommand();
  });
});
