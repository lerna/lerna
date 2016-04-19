import pathExists from "path-exists";
import assert from "assert";
import path from "path";
import fs from "fs";

import ChildProcessUtilities from "../src/ChildProcessUtilities";
import PromptUtilities from "../src/PromptUtilities";
import PublishCommand from "../src/commands/PublishCommand";
import exitWithCode from "./_exitWithCode";
import initFixture from "./_initFixture";
import stub from "./_stub";

function debugLog(...args) {
  if (process.env.DEBUG_PUBLISH) {
    console.log(...args);
  }
}

describe("PublishCommand", () => {

  /** =========================================================================
   * NORMAL
   * ======================================================================= */

  describe("normal mode", () => {
    let testDir;

    beforeEach(done => {
      testDir = initFixture("PublishCommand/normal", done);
    });

    it("should publish the changed packages", done => {
      const publishCommand = new PublishCommand([], {});

      publishCommand.runPreparations();

      let calls = 0;

      stub(PromptUtilities, "select", (message, options, callback) => {
        debugLog(calls, "select", message);

        let choice;

        try {
          if (calls === 1) { assert.equal(message, "Select a new version (currently 1.0.0)"); choice = 0; } // Patch

          calls++;

          callback(options.choices[choice].value);
        } catch (err) {
          done(err);
        }
      });

      stub(PromptUtilities, "confirm", (message, callback) => {
        debugLog(calls, "confirm", message);

        let choice;

        try {
          if (calls === 2) { assert.equal(message, "Are you sure you want to publish the above changes?"); choice = true; } // Confirm version

          calls++;

          callback(choice);
        } catch (err) {
          done(err);
        }
      });

      stub(ChildProcessUtilities, "execSync", (command) => {
        debugLog(calls, "execSync", command);

        let returns;

        try {
          if (calls === 0) assert.equal(command, "git tag")
          if (calls === 3) assert.equal(command, "git add " + path.join(testDir, "VERSION"));
          if (calls === 4) assert.equal(command, "git add " + path.join(testDir, "packages/package-1/package.json"));
          if (calls === 5) assert.equal(command, "git add " + path.join(testDir, "packages/package-2/package.json"));
          if (calls === 6) assert.equal(command, "git add " + path.join(testDir, "packages/package-3/package.json"));
          if (calls === 7) assert.equal(command, "git add " + path.join(testDir, "packages/package-4/package.json"));
          if (calls === 8) assert.equal(command, "git commit -m \"$(echo \"v1.0.1\")\"");
          if (calls === 9) assert.equal(command, "git tag v1.0.1");

          if (calls === 14) { assert.equal(command, "npm dist-tag ls package-1"); returns = "lerna-temp: 1.0.1\nstable: 1.0.0"; }
          if (calls === 15) assert.equal(command, "npm dist-tag rm package-1 lerna-temp");
          if (calls === 16) assert.equal(command, "npm dist-tag add package-1@1.0.1 latest");

          if (calls === 17) { assert.equal(command, "npm dist-tag ls package-2"); returns = "lerna-temp: 1.0.1\nstable: 1.0.0"; }
          if (calls === 18) assert.equal(command, "npm dist-tag rm package-2 lerna-temp");
          if (calls === 19) assert.equal(command, "npm dist-tag add package-2@1.0.1 latest");

          if (calls === 20) { assert.equal(command, "npm dist-tag ls package-3"); returns = "lerna-temp: 1.0.1\nstable: 1.0.0"; }
          if (calls === 21) assert.equal(command, "npm dist-tag rm package-3 lerna-temp");
          if (calls === 22) assert.equal(command, "npm dist-tag add package-3@1.0.1 latest");

          if (calls === 23) { assert.equal(command, "npm dist-tag ls package-4"); returns = "lerna-temp: 1.0.1\nstable: 1.0.0"; }
          if (calls === 24) assert.equal(command, "npm dist-tag rm package-4 lerna-temp");
          if (calls === 25) assert.equal(command, "npm dist-tag add package-4@1.0.1 latest");

          if (calls === 26) assert.equal(command, "git push");
          if (calls === 27) assert.equal(command, "git push origin v1.0.1");

          calls++;

          return returns;
        } catch (err) {
          done(err);
        }
      });

      stub(ChildProcessUtilities, "exec", (command, options, callback) => {
        debugLog(calls, "exec", command);

        try {
          if (calls === 10) assert.equal(command, "cd " + path.join(testDir, "packages/package-1") + " && npm publish --tag lerna-temp");
          if (calls === 11) assert.equal(command, "cd " + path.join(testDir, "packages/package-2") + " && npm publish --tag lerna-temp");
          if (calls === 12) assert.equal(command, "cd " + path.join(testDir, "packages/package-3") + " && npm publish --tag lerna-temp");
          if (calls === 13) assert.equal(command, "cd " + path.join(testDir, "packages/package-4") + " && npm publish --tag lerna-temp");

          calls++;

          callback();
        } catch (err) {
          done(err);
        }
      });

      publishCommand.runCommand(exitWithCode(0, err => {
        if (err) return done(err);

        try {
          assert.ok(!pathExists.sync(path.join(testDir, "lerna-debug.log")));
          assert.equal(fs.readFileSync(path.join(testDir, "VERSION")).toString(), "1.0.1\n");

          assert.equal(require(path.join(testDir, "packages/package-1/package.json")).version, "1.0.1");
          assert.equal(require(path.join(testDir, "packages/package-2/package.json")).version, "1.0.1");
          assert.equal(require(path.join(testDir, "packages/package-3/package.json")).version, "1.0.1");
          assert.equal(require(path.join(testDir, "packages/package-4/package.json")).version, "1.0.1");

          assert.equal(require(path.join(testDir, "packages/package-2/package.json")).dependencies["package-1"], "^1.0.1");
          assert.equal(require(path.join(testDir, "packages/package-3/package.json")).devDependencies["package-2"], "^1.0.1");
          assert.equal(require(path.join(testDir, "packages/package-4/package.json")).dependencies["package-1"], "^0.0.0");

          done();
        } catch (err) {
          done(err);
        }
      }));
    });
  });




  /** =========================================================================
   * INDEPENDENT
   * ======================================================================= */

  describe("independent mode", () => {
    let testDir;

    beforeEach(done => {
      testDir = initFixture("PublishCommand/normal", done);
    });

    it("should publish the changed packages in independent mode", done => {
      const publishCommand = new PublishCommand([], {
        independent: true
      });

      publishCommand.runPreparations();

      let calls = 0;

      stub(PromptUtilities, "select", (message, options, callback) => {
        debugLog(calls, "select", message);

        let choice;

        try {
          if (calls === 1) { assert.equal(message, "Select a new version for package-1 (currently 1.0.0)"); choice = 0; } // Patch
          if (calls === 2) { assert.equal(message, "Select a new version for package-2 (currently 1.0.0)"); choice = 1; } // Minor
          if (calls === 3) { assert.equal(message, "Select a new version for package-3 (currently 1.0.0)"); choice = 2; } // Major
          if (calls === 4) { assert.equal(message, "Select a new version for package-4 (currently 1.0.0)"); choice = 1; } // Minor

          calls++;

          callback(options.choices[choice].value);
        } catch (err) {
          done(err);
        }
      });

      stub(PromptUtilities, "confirm", (message, callback) => {
        debugLog(calls, "confirm", message);

        let choice;

        try {
          if (calls === 5) { assert.equal(message, "Are you sure you want to publish the above changes?"); choice = true; } // Confirm version

          calls++;

          callback(choice);
        } catch (err) {
          done(err);
        }
      });

      stub(ChildProcessUtilities, "execSync", (command) => {
        debugLog(calls, "execSync", command);

        let returns;

        try {
          if (calls === 0) assert.equal(command, "git tag")
          if (calls === 6) assert.equal(command, "git add " + path.join(testDir, "packages/package-1/package.json"));
          if (calls === 7) assert.equal(command, "git add " + path.join(testDir, "packages/package-2/package.json"));
          if (calls === 8) assert.equal(command, "git add " + path.join(testDir, "packages/package-3/package.json"));
          if (calls === 9) assert.equal(command, "git add " + path.join(testDir, "packages/package-4/package.json"));
          if (calls === 10) assert.equal(command, "git commit -m \"$(echo \"Publish\n\n - package-1@1.0.1\n - package-2@1.1.0\n - package-3@2.0.0\n - package-4@1.1.0\")\"");
          if (calls === 11) assert.equal(command, "git tag package-1@1.0.1");
          if (calls === 12) assert.equal(command, "git tag package-2@1.1.0");
          if (calls === 13) assert.equal(command, "git tag package-3@2.0.0");
          if (calls === 14) assert.equal(command, "git tag package-4@1.1.0");

          if (calls === 19) { assert.equal(command, "npm dist-tag ls package-1"); returns = "lerna-temp: 1.0.1\nstable: 1.0.0"; }
          if (calls === 20) assert.equal(command, "npm dist-tag rm package-1 lerna-temp");
          if (calls === 21) assert.equal(command, "npm dist-tag add package-1@1.0.1 latest");

          if (calls === 22) { assert.equal(command, "npm dist-tag ls package-2"); returns = "lerna-temp: 1.1.0\nstable: 1.0.0"; }
          if (calls === 23) assert.equal(command, "npm dist-tag rm package-2 lerna-temp");
          if (calls === 24) assert.equal(command, "npm dist-tag add package-2@1.1.0 latest");

          if (calls === 25) { assert.equal(command, "npm dist-tag ls package-3"); returns = "lerna-temp: 2.0.0\nstable: 1.0.0"; }
          if (calls === 26) assert.equal(command, "npm dist-tag rm package-3 lerna-temp");
          if (calls === 27) assert.equal(command, "npm dist-tag add package-3@2.0.0 latest");

          if (calls === 28) { assert.equal(command, "npm dist-tag ls package-4"); returns = "lerna-temp: 1.1.0\nstable: 1.0.0"; }
          if (calls === 29) assert.equal(command, "npm dist-tag rm package-4 lerna-temp");
          if (calls === 30) assert.equal(command, "npm dist-tag add package-4@1.1.0 latest");

          if (calls === 31) assert.equal(command, "git push");
          if (calls === 32) assert.equal(command, "git push origin package-1@1.0.1 package-2@1.1.0 package-3@2.0.0 package-4@1.1.0");

          calls++;

          return returns;
        } catch (err) {
          done(err);
        }
      });

      stub(ChildProcessUtilities, "exec", (command, options, callback) => {
        debugLog(calls, "exec", command);

        try {
          if (calls === 15) assert.equal(command, "cd " + path.join(testDir, "packages/package-1") + " && npm publish --tag lerna-temp");
          if (calls === 16) assert.equal(command, "cd " + path.join(testDir, "packages/package-2") + " && npm publish --tag lerna-temp");
          if (calls === 17) assert.equal(command, "cd " + path.join(testDir, "packages/package-3") + " && npm publish --tag lerna-temp");
          if (calls === 18) assert.equal(command, "cd " + path.join(testDir, "packages/package-4") + " && npm publish --tag lerna-temp");

          calls++;

          callback();
        } catch (err) {
          done(err);
        }
      });

      publishCommand.runCommand(exitWithCode(0, err => {
        if (err) return done(err);

        try {
          assert.ok(!pathExists.sync(path.join(testDir, "lerna-debug.log")));

          assert.equal(require(path.join(testDir, "packages/package-1/package.json")).version, "1.0.1");
          assert.equal(require(path.join(testDir, "packages/package-2/package.json")).version, "1.1.0");
          assert.equal(require(path.join(testDir, "packages/package-3/package.json")).version, "2.0.0");
          assert.equal(require(path.join(testDir, "packages/package-4/package.json")).version, "1.1.0");

          assert.equal(require(path.join(testDir, "packages/package-2/package.json")).dependencies["package-1"], "^1.0.1");
          assert.equal(require(path.join(testDir, "packages/package-3/package.json")).devDependencies["package-2"], "^1.1.0");
          assert.equal(require(path.join(testDir, "packages/package-4/package.json")).dependencies["package-1"], "^0.0.0");

          done();
        } catch (err) {
          done(err);
        }
      }));
    });
  });




  /** =========================================================================
   * NORMAL - CANARY
   * ======================================================================= */

  describe("normal mode as canary", () => {
    let testDir;

    beforeEach(done => {
      testDir = initFixture("PublishCommand/normal", done);
    });

    it("should publish the changed packages", done => {
      const publishCommand = new PublishCommand([], {
        canary: true
      });

      publishCommand.runPreparations();

      let calls = 0;

      stub(PromptUtilities, "select", (message, options, callback) => {
        debugLog(calls, "select", message);

        let choice;

        try {
          // if (calls === 1) { assert.equal(message, "Select a new version (currently 1.0.0)"); choice = 0; } // Patch

          calls++;

          callback(options.choices[choice].value);
        } catch (err) {
          done(err);
        }
      });

      stub(PromptUtilities, "confirm", (message, callback) => {
        debugLog(calls, "confirm", message);

        let choice;

        try {
          if (calls === 3) { assert.equal(message, "Are you sure you want to publish the above changes?"); choice = true; } // Confirm version

          calls++;

          callback(choice);
        } catch (err) {
          done(err);
        }
      });

      stub(ChildProcessUtilities, "execSync", (command) => {
        debugLog(calls, "execSync", command);

        let returns;

        try {
          if (calls === 0) assert.equal(command, "git tag")
          if (calls === 1) { assert.equal(command, "git rev-parse HEAD"); returns = "81e3b44339e1403fe3d762e9435b7c9a155fdef7" }
          if (calls === 2) { assert.equal(command, "git rev-parse HEAD"); returns = "81e3b44339e1403fe3d762e9435b7c9a155fdef7" }
          if (calls === 8) assert.equal(command, "git checkout -- packages/*/package.json");

          if (calls === 9) { assert.equal(command, "npm dist-tag ls package-1"); returns = "lerna-temp: 1.0.0-canary.81e3b443\nstable: 1.0.0"; }
          if (calls === 10) assert.equal(command, "npm dist-tag rm package-1 lerna-temp");
          if (calls === 11) assert.equal(command, "npm dist-tag add package-1@1.0.0-canary.81e3b443 canary");

          if (calls === 12) { assert.equal(command, "npm dist-tag ls package-2"); returns = "lerna-temp: 1.0.0-canary.81e3b443\nstable: 1.0.0"; }
          if (calls === 13) assert.equal(command, "npm dist-tag rm package-2 lerna-temp");
          if (calls === 14) assert.equal(command, "npm dist-tag add package-2@1.0.0-canary.81e3b443 canary");

          if (calls === 15) { assert.equal(command, "npm dist-tag ls package-3"); returns = "lerna-temp: 1.0.0-canary.81e3b443\nstable: 1.0.0"; }
          if (calls === 16) assert.equal(command, "npm dist-tag rm package-3 lerna-temp");
          if (calls === 17) assert.equal(command, "npm dist-tag add package-3@1.0.0-canary.81e3b443 canary");

          if (calls === 18) { assert.equal(command, "npm dist-tag ls package-4"); returns = "lerna-temp: 1.0.0-canary.81e3b443\nstable: 1.0.0"; }
          if (calls === 19) assert.equal(command, "npm dist-tag rm package-4 lerna-temp");
          if (calls === 20) assert.equal(command, "npm dist-tag add package-4@1.0.0-canary.81e3b443 canary");

          if (calls === 21) assert.equal(command, "git push");
          if (calls === 22) assert.equal(command, "git push origin v1.0.1");

          calls++;

          return returns;
        } catch (err) {
          done(err);
        }
      });

      stub(ChildProcessUtilities, "exec", (command, options, callback) => {
        debugLog(calls, "exec", command);

        try {
          if (calls === 4) assert.equal(command, "cd " + path.join(testDir, "packages/package-1") + " && npm publish --tag lerna-temp");
          if (calls === 5) assert.equal(command, "cd " + path.join(testDir, "packages/package-2") + " && npm publish --tag lerna-temp");
          if (calls === 6) assert.equal(command, "cd " + path.join(testDir, "packages/package-3") + " && npm publish --tag lerna-temp");
          if (calls === 7) assert.equal(command, "cd " + path.join(testDir, "packages/package-4") + " && npm publish --tag lerna-temp");

          calls++;

          callback();
        } catch (err) {
          done(err);
        }
      });

      publishCommand.runCommand(exitWithCode(0, err => {
        if (err) return done(err);

        try {
          assert.ok(!pathExists.sync(path.join(testDir, "lerna-debug.log")));
          assert.equal(fs.readFileSync(path.join(testDir, "VERSION")).toString(), "1.0.0\n");

          // The following wouldn't be the actual results of a canary release
          // because `git checkout --` would have removed the file changes.
          // However, this is what would've been published to npm so it's
          // useful to test.
          assert.equal(require(path.join(testDir, "packages/package-1/package.json")).version, "1.0.0-canary.81e3b443");
          assert.equal(require(path.join(testDir, "packages/package-2/package.json")).version, "1.0.0-canary.81e3b443");
          assert.equal(require(path.join(testDir, "packages/package-3/package.json")).version, "1.0.0-canary.81e3b443");
          assert.equal(require(path.join(testDir, "packages/package-4/package.json")).version, "1.0.0-canary.81e3b443");

          assert.equal(require(path.join(testDir, "packages/package-2/package.json")).dependencies["package-1"], "^1.0.0-canary.81e3b443");
          assert.equal(require(path.join(testDir, "packages/package-3/package.json")).devDependencies["package-2"], "^1.0.0-canary.81e3b443");
          assert.equal(require(path.join(testDir, "packages/package-4/package.json")).dependencies["package-1"], "^0.0.0");

          done();
        } catch (err) {
          done(err);
        }
      }));
    });
  });




  /** =========================================================================
   * INDEPENDENT - CANARY
   * ======================================================================= */

  describe("independent mode as canary", () => {
    let testDir;

    beforeEach(done => {
      testDir = initFixture("PublishCommand/independent", done);
    });

    it("should publish the changed packages", done => {
      const publishCommand = new PublishCommand([], {
        independent: true,
        canary: true
      });

      publishCommand.runPreparations();

      let calls = 0;

      stub(PromptUtilities, "select", (message, options, callback) => {
        debugLog(calls, "select", message);

        let choice;

        try {
          // if (calls === 1) { assert.equal(message, "Select a new version (currently 1.0.0)"); choice = 0; } // Patch

          calls++;

          callback(options.choices[choice].value);
        } catch (err) {
          done(err);
        }
      });

      stub(PromptUtilities, "confirm", (message, callback) => {
        debugLog(calls, "confirm", message);

        let choice;

        try {
          if (calls === 3) { assert.equal(message, "Are you sure you want to publish the above changes?"); choice = true; } // Confirm version

          calls++;

          callback(choice);
        } catch (err) {
          done(err);
        }
      });

      stub(ChildProcessUtilities, "execSync", (command) => {
        debugLog(calls, "execSync", command);

        let returns;

        try {
          if (calls === 0) assert.equal(command, "git tag")
          if (calls === 1) { assert.equal(command, "git rev-parse HEAD"); returns = "81e3b44339e1403fe3d762e9435b7c9a155fdef7" }
          if (calls === 2) { assert.equal(command, "git rev-parse HEAD"); returns = "81e3b44339e1403fe3d762e9435b7c9a155fdef7" }
          if (calls === 8) assert.equal(command, "git checkout -- packages/*/package.json");

          if (calls === 9) { assert.equal(command, "npm dist-tag ls package-1"); returns = "lerna-temp: 1.0.0-canary.81e3b443\nstable: 1.0.0"; }
          if (calls === 10) assert.equal(command, "npm dist-tag rm package-1 lerna-temp");
          if (calls === 11) assert.equal(command, "npm dist-tag add package-1@1.0.0-canary.81e3b443 canary");

          if (calls === 12) { assert.equal(command, "npm dist-tag ls package-2"); returns = "lerna-temp: 2.0.0-canary.81e3b443\nstable: 1.0.0"; }
          if (calls === 13) assert.equal(command, "npm dist-tag rm package-2 lerna-temp");
          if (calls === 14) assert.equal(command, "npm dist-tag add package-2@2.0.0-canary.81e3b443 canary");

          if (calls === 15) { assert.equal(command, "npm dist-tag ls package-3"); returns = "lerna-temp: 3.0.0-canary.81e3b443\nstable: 1.0.0"; }
          if (calls === 16) assert.equal(command, "npm dist-tag rm package-3 lerna-temp");
          if (calls === 17) assert.equal(command, "npm dist-tag add package-3@3.0.0-canary.81e3b443 canary");

          if (calls === 18) { assert.equal(command, "npm dist-tag ls package-4"); returns = "lerna-temp: 4.0.0-canary.81e3b443\nstable: 1.0.0"; }
          if (calls === 19) assert.equal(command, "npm dist-tag rm package-4 lerna-temp");
          if (calls === 20) assert.equal(command, "npm dist-tag add package-4@4.0.0-canary.81e3b443 canary");

          if (calls === 21) assert.equal(command, "git push");
          if (calls === 22) assert.equal(command, "git push origin v1.0.1");

          calls++;

          return returns;
        } catch (err) {
          done(err);
        }
      });

      stub(ChildProcessUtilities, "exec", (command, options, callback) => {
        debugLog(calls, "exec", command);

        try {
          if (calls === 4) assert.equal(command, "cd " + path.join(testDir, "packages/package-1") + " && npm publish --tag lerna-temp");
          if (calls === 5) assert.equal(command, "cd " + path.join(testDir, "packages/package-2") + " && npm publish --tag lerna-temp");
          if (calls === 6) assert.equal(command, "cd " + path.join(testDir, "packages/package-3") + " && npm publish --tag lerna-temp");
          if (calls === 7) assert.equal(command, "cd " + path.join(testDir, "packages/package-4") + " && npm publish --tag lerna-temp");

          calls++;

          callback();
        } catch (err) {
          done(err);
        }
      });

      publishCommand.runCommand(exitWithCode(0, err => {
        if (err) return done(err);

        try {
          assert.ok(!pathExists.sync(path.join(testDir, "lerna-debug.log")));

          // The following wouldn't be the actual results of a canary release
          // because `git checkout --` would have removed the file changes.
          // However, this is what would've been published to npm so it's
          // useful to test.
          assert.equal(require(path.join(testDir, "packages/package-1/package.json")).version, "1.0.0-canary.81e3b443");
          assert.equal(require(path.join(testDir, "packages/package-2/package.json")).version, "2.0.0-canary.81e3b443");
          assert.equal(require(path.join(testDir, "packages/package-3/package.json")).version, "3.0.0-canary.81e3b443");
          assert.equal(require(path.join(testDir, "packages/package-4/package.json")).version, "4.0.0-canary.81e3b443");

          assert.equal(require(path.join(testDir, "packages/package-2/package.json")).dependencies["package-1"], "^1.0.0-canary.81e3b443");
          assert.equal(require(path.join(testDir, "packages/package-3/package.json")).devDependencies["package-2"], "^2.0.0-canary.81e3b443");
          assert.equal(require(path.join(testDir, "packages/package-4/package.json")).dependencies["package-1"], "^0.0.0");

          done();
        } catch (err) {
          done(err);
        }
      }));
    });
  });
});
