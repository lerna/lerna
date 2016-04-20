import pathExists from "path-exists";
import assert from "assert";
import path from "path";
import fs from "fs";

import ChildProcessUtilities from "../src/ChildProcessUtilities";
import PromptUtilities from "../src/PromptUtilities";
import PublishCommand from "../src/commands/PublishCommand";
import exitWithCode from "./_exitWithCode";
import initFixture from "./_initFixture";

import assertStubbedCalls from "./_assertStubbedCalls";

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

      assertStubbedCalls([
        [ChildProcessUtilities, "execSync", {}, [
          { args: ["git tag"] }
        ]],
        [PromptUtilities, "select", { valueCallback: true }, [
          { args: ["Select a new version (currently 1.0.0)"], returns: "1.0.1" }
        ]],
        [PromptUtilities, "confirm", { valueCallback: true }, [
          { args: ["Are you sure you want to publish the above changes?"], returns: true }
        ]],
        [ChildProcessUtilities, "execSync", {}, [
          { args: ["git add " + path.join(testDir, "VERSION")] },
          { args: ["git add " + path.join(testDir, "packages/package-1/package.json")] },
          { args: ["git add " + path.join(testDir, "packages/package-2/package.json")] },
          { args: ["git add " + path.join(testDir, "packages/package-3/package.json")] },
          { args: ["git add " + path.join(testDir, "packages/package-4/package.json")] },
          { args: ["git commit -m \"$(echo \"v1.0.1\")\""] },
          { args: ["git tag v1.0.1"] }
        ]],
        [ChildProcessUtilities, "exec", { nodeCallback: true }, [
          { args: ["cd " + path.join(testDir, "packages/package-1") + " && npm publish --tag lerna-temp"] },
          { args: ["cd " + path.join(testDir, "packages/package-2") + " && npm publish --tag lerna-temp"] },
          { args: ["cd " + path.join(testDir, "packages/package-3") + " && npm publish --tag lerna-temp"] },
          { args: ["cd " + path.join(testDir, "packages/package-4") + " && npm publish --tag lerna-temp"] }
        ], true],
        [ChildProcessUtilities, "execSync", {}, [
          { args: ["npm dist-tag ls package-1"], returns: "lerna-temp: 1.0.1\nstable: 1.0.0" },
          { args: ["npm dist-tag rm package-1 lerna-temp"] },
          { args: ["npm dist-tag add package-1@1.0.1 latest"] },

          { args: ["npm dist-tag ls package-2"], returns: "lerna-temp: 1.0.1\nstable: 1.0.0" },
          { args: ["npm dist-tag rm package-2 lerna-temp"] },
          { args: ["npm dist-tag add package-2@1.0.1 latest"] },

          { args: ["npm dist-tag ls package-3"], returns: "lerna-temp: 1.0.1\nstable: 1.0.0" },
          { args: ["npm dist-tag rm package-3 lerna-temp"] },
          { args: ["npm dist-tag add package-3@1.0.1 latest"] },

          { args: ["npm dist-tag ls package-4"], returns: "lerna-temp: 1.0.1\nstable: 1.0.0" },
          { args: ["npm dist-tag rm package-4 lerna-temp"] },
          { args: ["npm dist-tag add package-4@1.0.1 latest"] },

          { args: ["git push"] },
          { args: ["git push origin v1.0.1"] }
        ]],
      ]);

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

      assertStubbedCalls([
        [ChildProcessUtilities, "execSync", {}, [
          { args: ["git tag"] }
        ]],
        [PromptUtilities, "select", { valueCallback: true }, [
          { args: ["Select a new version for package-1 (currently 1.0.0)"], returns: "1.0.1" },
          { args: ["Select a new version for package-2 (currently 1.0.0)"], returns: "1.1.0" },
          { args: ["Select a new version for package-3 (currently 1.0.0)"], returns: "2.0.0" },
          { args: ["Select a new version for package-4 (currently 1.0.0)"], returns: "1.1.0" }
        ]],
        [PromptUtilities, "confirm", { valueCallback: true }, [
          { args: ["Are you sure you want to publish the above changes?"], returns: true }
        ]],
        [ChildProcessUtilities, "execSync", {}, [
          { args: ["git add " + path.join(testDir, "packages/package-1/package.json")] },
          { args: ["git add " + path.join(testDir, "packages/package-2/package.json")] },
          { args: ["git add " + path.join(testDir, "packages/package-3/package.json")] },
          { args: ["git add " + path.join(testDir, "packages/package-4/package.json")] },
          { args: ["git commit -m \"$(echo \"Publish\n\n - package-1@1.0.1\n - package-2@1.1.0\n - package-3@2.0.0\n - package-4@1.1.0\")\""] },
          { args: ["git tag package-1@1.0.1"] },
          { args: ["git tag package-2@1.1.0"] },
          { args: ["git tag package-3@2.0.0"] },
          { args: ["git tag package-4@1.1.0"] }
        ]],
        [ChildProcessUtilities, "exec", { nodeCallback: true }, [
          { args: ["cd " + path.join(testDir, "packages/package-1") + " && npm publish --tag lerna-temp"] },
          { args: ["cd " + path.join(testDir, "packages/package-2") + " && npm publish --tag lerna-temp"] },
          { args: ["cd " + path.join(testDir, "packages/package-3") + " && npm publish --tag lerna-temp"] },
          { args: ["cd " + path.join(testDir, "packages/package-4") + " && npm publish --tag lerna-temp"] }
        ]],
        [ChildProcessUtilities, "execSync", {}, [
          { args: ["npm dist-tag ls package-1"], returns: "lerna-temp: 1.0.1\nstable: 1.0.0" },
          { args: ["npm dist-tag rm package-1 lerna-temp"] },
          { args: ["npm dist-tag add package-1@1.0.1 latest"] },

          { args: ["npm dist-tag ls package-2"], returns: "lerna-temp: 1.1.0\nstable: 1.0.0" },
          { args: ["npm dist-tag rm package-2 lerna-temp"] },
          { args: ["npm dist-tag add package-2@1.1.0 latest"] },

          { args: ["npm dist-tag ls package-3"], returns: "lerna-temp: 2.0.0\nstable: 1.0.0" },
          { args: ["npm dist-tag rm package-3 lerna-temp"] },
          { args: ["npm dist-tag add package-3@2.0.0 latest"] },

          { args: ["npm dist-tag ls package-4"], returns: "lerna-temp: 1.1.0\nstable: 1.0.0" },
          { args: ["npm dist-tag rm package-4 lerna-temp"] },
          { args: ["npm dist-tag add package-4@1.1.0 latest"] },

          { args: ["git push"] },
          { args: ["git push origin package-1@1.0.1 package-2@1.1.0 package-3@2.0.0 package-4@1.1.0"] },
        ]]
      ]);

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

      assertStubbedCalls([
        [ChildProcessUtilities, "execSync", {}, [
          { args: ["git tag"] },
          { args: ["git rev-parse HEAD"], returns: "81e3b44339e1403fe3d762e9435b7c9a155fdef7" },
          { args: ["git rev-parse HEAD"], returns: "81e3b44339e1403fe3d762e9435b7c9a155fdef7" }
        ]],
        [PromptUtilities, "confirm", { valueCallback: true }, [
          { args: ["Are you sure you want to publish the above changes?"], returns: true }
        ]],
        [ChildProcessUtilities, "exec", { nodeCallback: true }, [
          { args: ["cd " + path.join(testDir, "packages/package-1") + " && npm publish --tag lerna-temp"] },
          { args: ["cd " + path.join(testDir, "packages/package-2") + " && npm publish --tag lerna-temp"] },
          { args: ["cd " + path.join(testDir, "packages/package-3") + " && npm publish --tag lerna-temp"] },
          { args: ["cd " + path.join(testDir, "packages/package-4") + " && npm publish --tag lerna-temp"] }
        ]],
        [ChildProcessUtilities, "execSync", {}, [
          { args: ["git checkout -- packages/*/package.json"] },

          { args: ["npm dist-tag ls package-1"], returns: "lerna-temp: 1.0.0-canary.81e3b443\nstable: 1.0.0" },
          { args: ["npm dist-tag rm package-1 lerna-temp"] },
          { args: ["npm dist-tag add package-1@1.0.0-canary.81e3b443 canary"] },

          { args: ["npm dist-tag ls package-2"], returns: "lerna-temp: 1.0.0-canary.81e3b443\nstable: 1.0.0" },
          { args: ["npm dist-tag rm package-2 lerna-temp"] },
          { args: ["npm dist-tag add package-2@1.0.0-canary.81e3b443 canary"] },

          { args: ["npm dist-tag ls package-3"], returns: "lerna-temp: 1.0.0-canary.81e3b443\nstable: 1.0.0" },
          { args: ["npm dist-tag rm package-3 lerna-temp"] },
          { args: ["npm dist-tag add package-3@1.0.0-canary.81e3b443 canary"] },

          { args: ["npm dist-tag ls package-4"], returns: "lerna-temp: 1.0.0-canary.81e3b443\nstable: 1.0.0" },
          { args: ["npm dist-tag rm package-4 lerna-temp"] },
          { args: ["npm dist-tag add package-4@1.0.0-canary.81e3b443 canary"] },

          { args: ["git push"] },
          { args: ["git push origin v1.0.1"] }
        ]]
      ]);

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

      assertStubbedCalls([
        [ChildProcessUtilities, "execSync", {}, [
          { args: ["git tag"] },
          { args: ["git rev-parse HEAD"], returns: "81e3b44339e1403fe3d762e9435b7c9a155fdef7" },
          { args: ["git rev-parse HEAD"], returns: "81e3b44339e1403fe3d762e9435b7c9a155fdef7" }
        ]],
        [PromptUtilities, "confirm", { valueCallback: true }, [
          { args: ["Are you sure you want to publish the above changes?"], returns: true }
        ]],
        [ChildProcessUtilities, "exec", { nodeCallback: true }, [
          { args: ["cd " + path.join(testDir, "packages/package-1") + " && npm publish --tag lerna-temp"] },
          { args: ["cd " + path.join(testDir, "packages/package-2") + " && npm publish --tag lerna-temp"] },
          { args: ["cd " + path.join(testDir, "packages/package-3") + " && npm publish --tag lerna-temp"] },
          { args: ["cd " + path.join(testDir, "packages/package-4") + " && npm publish --tag lerna-temp"] }
        ]],
        [ChildProcessUtilities, "execSync", {}, [
          { args: ["git checkout -- packages/*/package.json"] },

          { args: ["npm dist-tag ls package-1"], returns: "lerna-temp: 1.0.0-canary.81e3b443\nstable: 1.0.0" },
          { args: ["npm dist-tag rm package-1 lerna-temp"] },
          { args: ["npm dist-tag add package-1@1.0.0-canary.81e3b443 canary"] },

          { args: ["npm dist-tag ls package-2"], returns: "lerna-temp: 2.0.0-canary.81e3b443\nstable: 1.0.0" },
          { args: ["npm dist-tag rm package-2 lerna-temp"] },
          { args: ["npm dist-tag add package-2@2.0.0-canary.81e3b443 canary"] },

          { args: ["npm dist-tag ls package-3"], returns: "lerna-temp: 3.0.0-canary.81e3b443\nstable: 1.0.0" },
          { args: ["npm dist-tag rm package-3 lerna-temp"] },
          { args: ["npm dist-tag add package-3@3.0.0-canary.81e3b443 canary"] },

          { args: ["npm dist-tag ls package-4"], returns: "lerna-temp: 4.0.0-canary.81e3b443\nstable: 1.0.0" },
          { args: ["npm dist-tag rm package-4 lerna-temp"] },
          { args: ["npm dist-tag add package-4@4.0.0-canary.81e3b443 canary"] },

          { args: ["git push"] },
          { args: ["git push origin v1.0.1"] }
        ]]
      ]);

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
