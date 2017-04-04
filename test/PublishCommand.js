import fs from "graceful-fs";
import pathExists from "path-exists";
import assert from "assert";
import path from "path";
import { EOL } from "os";
import normalizeNewline from "normalize-newline";
import escapeArgs from "command-join";

import ConventionalCommitUtilities from "../src/ConventionalCommitUtilities";
import ChildProcessUtilities from "../src/ChildProcessUtilities";
import PromptUtilities from "../src/PromptUtilities";
import PublishCommand from "../src/commands/PublishCommand";
import exitWithCode from "./helpers/exitWithCode";
import initFixture from "./helpers/initFixture";

import assertStubbedCalls from "./helpers/assertStubbedCalls";

describe("PublishCommand", () => {
  /** =========================================================================
   * NORMAL
   * ======================================================================= */

  describe("normal mode", () => {
    let testDir;

    beforeEach(() => initFixture("PublishCommand/normal").then((dir) => {
      testDir = dir;
    }));

    it("should publish the changed packages", (done) => {
      const publishCommand = new PublishCommand([], {});

      publishCommand.runValidations();
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
          { args: ["git rev-parse --abbrev-ref HEAD"], returns: "master" },
          { args: ["git add " + escapeArgs(path.join(testDir, "lerna.json"))] },
          { args: ["git add " + escapeArgs(path.join(testDir, "packages/package-1/package.json"))] },
          { args: ["git add " + escapeArgs(path.join(testDir, "packages/package-2/package.json"))] },
          { args: ["git add " + escapeArgs(path.join(testDir, "packages/package-3/package.json"))] },
          { args: ["git add " + escapeArgs(path.join(testDir, "packages/package-4/package.json"))] },
          { args: ["git add " + escapeArgs(path.join(testDir, "packages/package-5/package.json"))] },
          { args: ["git commit -m \"$(echo \"v1.0.1\")\""] },
          { args: ["git tag -a v1.0.1 -m \"v1.0.1\""] }
        ]],
        [ChildProcessUtilities, "exec", { nodeCallback: true }, [
          { args: ["npm publish --tag lerna-temp"] },
          { args: ["npm publish --tag lerna-temp"] },
          { args: ["npm publish --tag lerna-temp"] },
          { args: ["npm publish --tag lerna-temp"] },
          // No package-5.  It's private.
        ]],
        [ChildProcessUtilities, "execSync", {}, [
          { args: ["npm dist-tag ls package-1"], returns: "lerna-temp: 1.0.1" + EOL + "stable: 1.0.0" },
          { args: ["npm dist-tag rm package-1 lerna-temp"] },
          { args: ["npm dist-tag add package-1@1.0.1 latest"] },

          { args: ["npm dist-tag ls package-3"], returns: "lerna-temp: 1.0.1" + EOL + "stable: 1.0.0" },
          { args: ["npm dist-tag rm package-3 lerna-temp"] },
          { args: ["npm dist-tag add package-3@1.0.1 latest"] },

          { args: ["npm dist-tag ls package-4"], returns: "lerna-temp: 1.0.1" + EOL + "stable: 1.0.0" },
          { args: ["npm dist-tag rm package-4 lerna-temp"] },
          { args: ["npm dist-tag add package-4@1.0.1 latest"] },

          { args: ["npm dist-tag ls package-2"], returns: "lerna-temp: 1.0.1" + EOL + "stable: 1.0.0" },
          { args: ["npm dist-tag rm package-2 lerna-temp"] },
          { args: ["npm dist-tag add package-2@1.0.1 latest"] },

          // No package-5.  It's private.

          { args: ["git rev-parse --abbrev-ref HEAD"], returns: "master" },
          { args: ["git push origin master"] },
          { args: ["git push origin v1.0.1"] }
        ]],
      ]);

      publishCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done.fail(err);

        try {
          assert.ok(!pathExists.sync(path.join(testDir, "lerna-debug.log")));
          assert.equal(normalizeNewline(fs.readFileSync(path.join(testDir, "lerna.json"), "utf-8")), "{\n  \"lerna\": \"__TEST_VERSION__\",\n  \"version\": \"1.0.1\"\n}\n");

          assert.equal(require(path.join(testDir, "packages/package-1/package.json")).version, "1.0.1");
          assert.equal(require(path.join(testDir, "packages/package-2/package.json")).version, "1.0.1");
          assert.equal(require(path.join(testDir, "packages/package-3/package.json")).version, "1.0.1");
          assert.equal(require(path.join(testDir, "packages/package-4/package.json")).version, "1.0.1");
          assert.equal(require(path.join(testDir, "packages/package-5/package.json")).version, "1.0.1");

          assert.equal(require(path.join(testDir, "packages/package-2/package.json")).dependencies["package-1"], "^1.0.1");
          assert.equal(require(path.join(testDir, "packages/package-3/package.json")).devDependencies["package-2"], "^1.0.1");
          assert.equal(require(path.join(testDir, "packages/package-4/package.json")).dependencies["package-1"], "^0.0.0");
          assert.equal(require(path.join(testDir, "packages/package-5/package.json")).dependencies["package-1"], "^1.0.1");

          done();
        } catch (ex) {
          done.fail(ex);
        }
      }));
    });
  });

  /** =========================================================================
   * INDEPENDENT
   * ======================================================================= */

  describe("independent mode", () => {
    let testDir;

    beforeEach(() => initFixture("PublishCommand/independent").then((dir) => {
      testDir = dir;
    }));

    it("should publish the changed packages in independent mode", (done) => {
      const publishCommand = new PublishCommand([], {
        independent: true
      });

      publishCommand.runValidations();
      publishCommand.runPreparations();

      assertStubbedCalls([
        [ChildProcessUtilities, "execSync", {}, [
          { args: ["git tag"] }
        ]],
        [PromptUtilities, "select", { valueCallback: true }, [
          { args: ["Select a new version for package-1 (currently 1.0.0)"], returns: "1.0.1" },
          { args: ["Select a new version for package-2 (currently 2.0.0)"], returns: "1.1.0" },
          { args: ["Select a new version for package-3 (currently 3.0.0)"], returns: "2.0.0" },
          { args: ["Select a new version for package-4 (currently 4.0.0)"], returns: "1.1.0" }
        ]],
        [PromptUtilities, "confirm", { valueCallback: true }, [
          { args: ["Are you sure you want to publish the above changes?"], returns: true }
        ]],
        [ChildProcessUtilities, "execSync", {}, [
          { args: ["git rev-parse --abbrev-ref HEAD"], returns: "master" },
          { args: ["git add " + escapeArgs(path.join(testDir, "packages/package-1/package.json"))] },
          { args: ["git add " + escapeArgs(path.join(testDir, "packages/package-2/package.json"))] },
          { args: ["git add " + escapeArgs(path.join(testDir, "packages/package-3/package.json"))] },
          { args: ["git add " + escapeArgs(path.join(testDir, "packages/package-4/package.json"))] },
          { args: ["git commit -m \"$(echo \"Publish" + EOL + EOL + " - package-1@1.0.1" + EOL + " - package-2@1.1.0" + EOL + " - package-3@2.0.0" + EOL + " - package-4@1.1.0\")\""] },
          { args: ["git tag -a package-1@1.0.1 -m \"package-1@1.0.1\""] },
          { args: ["git tag -a package-2@1.1.0 -m \"package-2@1.1.0\""] },
          { args: ["git tag -a package-3@2.0.0 -m \"package-3@2.0.0\""] },
          { args: ["git tag -a package-4@1.1.0 -m \"package-4@1.1.0\""] }
        ]],
        [ChildProcessUtilities, "exec", { nodeCallback: true }, [
          { args: ["npm publish --tag lerna-temp"] },
          { args: ["npm publish --tag lerna-temp"] },
          { args: ["npm publish --tag lerna-temp"] },
          { args: ["npm publish --tag lerna-temp"] },
        ]],
        [ChildProcessUtilities, "execSync", {}, [
          { args: ["npm dist-tag ls package-1"], returns: "lerna-temp: 1.0.1" + EOL + "stable: 1.0.0" },
          { args: ["npm dist-tag rm package-1 lerna-temp"] },
          { args: ["npm dist-tag add package-1@1.0.1 latest"] },

          { args: ["npm dist-tag ls package-3"], returns: "lerna-temp: 2.0.0" + EOL + "stable: 1.0.0" },
          { args: ["npm dist-tag rm package-3 lerna-temp"] },
          { args: ["npm dist-tag add package-3@2.0.0 latest"] },

          { args: ["npm dist-tag ls package-4"], returns: "lerna-temp: 1.1.0" + EOL + "stable: 1.0.0" },
          { args: ["npm dist-tag rm package-4 lerna-temp"] },
          { args: ["npm dist-tag add package-4@1.1.0 latest"] },

          { args: ["npm dist-tag ls package-2"], returns: "lerna-temp: 1.1.0" + EOL + "stable: 1.0.0" },
          { args: ["npm dist-tag rm package-2 lerna-temp"] },
          { args: ["npm dist-tag add package-2@1.1.0 latest"] },

          { args: ["git rev-parse --abbrev-ref HEAD"], returns: "master" },
          { args: ["git push origin master"] },
          { args: ["git push origin package-1@1.0.1 package-2@1.1.0 package-3@2.0.0 package-4@1.1.0"] },
        ]]
      ]);

      publishCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done.fail(err);

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
        } catch (ex) {
          done.fail(ex);
        }
      }));
    });
  });

  /** =========================================================================
   * NORMAL - CANARY
   * ======================================================================= */

  describe("normal mode as canary", () => {
    let testDir;

    beforeEach(() => initFixture("PublishCommand/normal").then((dir) => {
      testDir = dir;
    }));

    it("should publish the changed packages", (done) => {
      const publishCommand = new PublishCommand([], {
        canary: true
      });

      publishCommand.runValidations();
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
          { args: ["npm publish --tag lerna-temp"] },
          { args: ["npm publish --tag lerna-temp"] },
          { args: ["npm publish --tag lerna-temp"] },
          { args: ["npm publish --tag lerna-temp"] },
        ]],
        [ChildProcessUtilities, "execSync", {}, [
          { args: ["git checkout -- packages/*/package.json"] },

          { args: ["npm dist-tag ls package-1"], returns: "lerna-temp: 1.0.0-alpha.81e3b443" + EOL + "stable: 1.0.0" },
          { args: ["npm dist-tag rm package-1 lerna-temp"] },
          { args: ["npm dist-tag add package-1@1.0.0-alpha.81e3b443 canary"] },

          { args: ["npm dist-tag ls package-3"], returns: "lerna-temp: 1.0.0-alpha.81e3b443" + EOL + "stable: 1.0.0" },
          { args: ["npm dist-tag rm package-3 lerna-temp"] },
          { args: ["npm dist-tag add package-3@1.0.0-alpha.81e3b443 canary"] },

          { args: ["npm dist-tag ls package-4"], returns: "lerna-temp: 1.0.0-alpha.81e3b443" + EOL + "stable: 1.0.0" },
          { args: ["npm dist-tag rm package-4 lerna-temp"] },
          { args: ["npm dist-tag add package-4@1.0.0-alpha.81e3b443 canary"] },

          { args: ["npm dist-tag ls package-2"], returns: "lerna-temp: 1.0.0-alpha.81e3b443" + EOL + "stable: 1.0.0" },
          { args: ["npm dist-tag rm package-2 lerna-temp"] },
          { args: ["npm dist-tag add package-2@1.0.0-alpha.81e3b443 canary"] },
        ]]
      ]);

      publishCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done.fail(err);

        try {
          assert.ok(!pathExists.sync(path.join(testDir, "lerna-debug.log")));
          assert.equal(normalizeNewline(fs.readFileSync(path.join(testDir, "lerna.json"), "utf-8")), "{\n  \"lerna\": \"__TEST_VERSION__\",\n  \"version\": \"1.0.0\"\n}\n");

          // The following wouldn't be the actual results of a canary release
          // because `git checkout --` would have removed the file changes.
          // However, this is what would've been published to npm so it's
          // useful to test.
          assert.equal(require(path.join(testDir, "packages/package-1/package.json")).version, "1.0.0-alpha.81e3b443");
          assert.equal(require(path.join(testDir, "packages/package-2/package.json")).version, "1.0.0-alpha.81e3b443");
          assert.equal(require(path.join(testDir, "packages/package-3/package.json")).version, "1.0.0-alpha.81e3b443");
          assert.equal(require(path.join(testDir, "packages/package-4/package.json")).version, "1.0.0-alpha.81e3b443");

          assert.equal(require(path.join(testDir, "packages/package-2/package.json")).dependencies["package-1"], "^1.0.0-alpha.81e3b443");
          assert.equal(require(path.join(testDir, "packages/package-3/package.json")).devDependencies["package-2"], "^1.0.0-alpha.81e3b443");
          assert.equal(require(path.join(testDir, "packages/package-4/package.json")).dependencies["package-1"], "^0.0.0");

          done();
        } catch (ex) {
          done.fail(ex);
        }
      }));
    });
  });

  /** =========================================================================
   * INDEPENDENT - CANARY
   * ======================================================================= */

  describe("independent mode as canary", () => {
    let testDir;

    beforeEach(() => initFixture("PublishCommand/independent").then((dir) => {
      testDir = dir;
    }));

    it("should publish the changed packages", (done) => {
      const publishCommand = new PublishCommand([], {
        independent: true,
        canary: true
      });

      publishCommand.runValidations();
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
          { args: ["npm publish --tag lerna-temp"] },
          { args: ["npm publish --tag lerna-temp"] },
          { args: ["npm publish --tag lerna-temp"] },
          { args: ["npm publish --tag lerna-temp"] },
        ]],
        [ChildProcessUtilities, "execSync", {}, [
          { args: ["git checkout -- packages/*/package.json"] },

          { args: ["npm dist-tag ls package-1"], returns: "lerna-temp: 1.0.0-alpha.81e3b443" + EOL + "stable: 1.0.0" },
          { args: ["npm dist-tag rm package-1 lerna-temp"] },
          { args: ["npm dist-tag add package-1@1.0.0-alpha.81e3b443 canary"] },

          { args: ["npm dist-tag ls package-3"], returns: "lerna-temp: 3.0.0-alpha.81e3b443" + EOL + "stable: 1.0.0" },
          { args: ["npm dist-tag rm package-3 lerna-temp"] },
          { args: ["npm dist-tag add package-3@3.0.0-alpha.81e3b443 canary"] },

          { args: ["npm dist-tag ls package-4"], returns: "lerna-temp: 4.0.0-alpha.81e3b443" + EOL + "stable: 1.0.0" },
          { args: ["npm dist-tag rm package-4 lerna-temp"] },
          { args: ["npm dist-tag add package-4@4.0.0-alpha.81e3b443 canary"] },

          { args: ["npm dist-tag ls package-2"], returns: "lerna-temp: 2.0.0-alpha.81e3b443" + EOL + "stable: 1.0.0" },
          { args: ["npm dist-tag rm package-2 lerna-temp"] },
          { args: ["npm dist-tag add package-2@2.0.0-alpha.81e3b443 canary"] },
        ]]
      ]);

      publishCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done.fail(err);

        try {
          assert.ok(!pathExists.sync(path.join(testDir, "lerna-debug.log")));

          // The following wouldn't be the actual results of a canary release
          // because `git checkout --` would have removed the file changes.
          // However, this is what would've been published to npm so it's
          // useful to test.
          assert.equal(require(path.join(testDir, "packages/package-1/package.json")).version, "1.0.0-alpha.81e3b443");
          assert.equal(require(path.join(testDir, "packages/package-2/package.json")).version, "2.0.0-alpha.81e3b443");
          assert.equal(require(path.join(testDir, "packages/package-3/package.json")).version, "3.0.0-alpha.81e3b443");
          assert.equal(require(path.join(testDir, "packages/package-4/package.json")).version, "4.0.0-alpha.81e3b443");

          assert.equal(require(path.join(testDir, "packages/package-2/package.json")).dependencies["package-1"], "^1.0.0-alpha.81e3b443");
          assert.equal(require(path.join(testDir, "packages/package-3/package.json")).devDependencies["package-2"], "^2.0.0-alpha.81e3b443");
          assert.equal(require(path.join(testDir, "packages/package-4/package.json")).dependencies["package-1"], "^0.0.0");

          done();
        } catch (ex) {
          done.fail(ex);
        }
      }));
    });
  });

  /** =========================================================================
   * NORMAL - SKIP GIT
   * ======================================================================= */

  describe("normal mode with --skip-git", () => {
    let testDir;

    beforeEach(() => initFixture("PublishCommand/normal").then((dir) => {
      testDir = dir;
    }));

    it("should publish the changed packages", (done) => {
      const publishCommand = new PublishCommand([], {
        skipGit: true
      });

      publishCommand.runValidations();
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
        [ChildProcessUtilities, "exec", { nodeCallback: true }, [
          { args: ["npm publish --tag lerna-temp"] },
          { args: ["npm publish --tag lerna-temp"] },
          { args: ["npm publish --tag lerna-temp"] },
          { args: ["npm publish --tag lerna-temp"] },
        ]],
        [ChildProcessUtilities, "execSync", {}, [
          { args: ["npm dist-tag ls package-1"], returns: "lerna-temp: 1.0.1" + EOL + "stable: 1.0.0" },
          { args: ["npm dist-tag rm package-1 lerna-temp"] },
          { args: ["npm dist-tag add package-1@1.0.1 latest"] },

          { args: ["npm dist-tag ls package-3"], returns: "lerna-temp: 1.0.1" + EOL + "stable: 1.0.0" },
          { args: ["npm dist-tag rm package-3 lerna-temp"] },
          { args: ["npm dist-tag add package-3@1.0.1 latest"] },

          { args: ["npm dist-tag ls package-4"], returns: "lerna-temp: 1.0.1" + EOL + "stable: 1.0.0" },
          { args: ["npm dist-tag rm package-4 lerna-temp"] },
          { args: ["npm dist-tag add package-4@1.0.1 latest"] },

          { args: ["npm dist-tag ls package-2"], returns: "lerna-temp: 1.0.1" + EOL + "stable: 1.0.0" },
          { args: ["npm dist-tag rm package-2 lerna-temp"] },
          { args: ["npm dist-tag add package-2@1.0.1 latest"] },
        ]],
      ]);

      publishCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done.fail(err);

        try {
          assert.ok(!pathExists.sync(path.join(testDir, "lerna-debug.log")));
          assert.equal(normalizeNewline(fs.readFileSync(path.join(testDir, "lerna.json"), "utf-8")), "{\n  \"lerna\": \"__TEST_VERSION__\",\n  \"version\": \"1.0.1\"\n}\n");

          assert.equal(require(path.join(testDir, "packages/package-1/package.json")).version, "1.0.1");
          assert.equal(require(path.join(testDir, "packages/package-2/package.json")).version, "1.0.1");
          assert.equal(require(path.join(testDir, "packages/package-3/package.json")).version, "1.0.1");
          assert.equal(require(path.join(testDir, "packages/package-4/package.json")).version, "1.0.1");

          assert.equal(require(path.join(testDir, "packages/package-2/package.json")).dependencies["package-1"], "^1.0.1");
          assert.equal(require(path.join(testDir, "packages/package-3/package.json")).devDependencies["package-2"], "^1.0.1");
          assert.equal(require(path.join(testDir, "packages/package-4/package.json")).dependencies["package-1"], "^0.0.0");

          done();
        } catch (ex) {
          done.fail(ex);
        }
      }));
    });
  });

  /** =========================================================================
   * NORMAL - SKIP NPM
   * ======================================================================= */

  describe("normal mode with --skip-npm", () => {
    let testDir;

    beforeEach(() => initFixture("PublishCommand/normal").then((dir) => {
      testDir = dir;
    }));

    it("should update versions and push changes but not publish", (done) => {
      const publishCommand = new PublishCommand([], {
        skipNpm: true
      });

      publishCommand.runValidations();
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
          { args: ["git rev-parse --abbrev-ref HEAD"], returns: "master" },
          { args: ["git add " + escapeArgs(path.join(testDir, "lerna.json"))] },
          { args: ["git add " + escapeArgs(path.join(testDir, "packages/package-1/package.json"))] },
          { args: ["git add " + escapeArgs(path.join(testDir, "packages/package-2/package.json"))] },
          { args: ["git add " + escapeArgs(path.join(testDir, "packages/package-3/package.json"))] },
          { args: ["git add " + escapeArgs(path.join(testDir, "packages/package-4/package.json"))] },
          { args: ["git add " + escapeArgs(path.join(testDir, "packages/package-5/package.json"))] },
          { args: ["git commit -m \"$(echo \"v1.0.1\")\""] },
          { args: ["git tag -a v1.0.1 -m \"v1.0.1\""] }
        ]],
      ]);

      publishCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done.fail(err);

        try {
          assert.ok(!pathExists.sync(path.join(testDir, "lerna-debug.log")));
          assert.equal(normalizeNewline(fs.readFileSync(path.join(testDir, "lerna.json"), "utf-8")), "{\n  \"lerna\": \"__TEST_VERSION__\",\n  \"version\": \"1.0.1\"\n}\n");

          assert.equal(require(path.join(testDir, "packages/package-1/package.json")).version, "1.0.1");
          assert.equal(require(path.join(testDir, "packages/package-2/package.json")).version, "1.0.1");
          assert.equal(require(path.join(testDir, "packages/package-3/package.json")).version, "1.0.1");
          assert.equal(require(path.join(testDir, "packages/package-4/package.json")).version, "1.0.1");
          assert.equal(require(path.join(testDir, "packages/package-5/package.json")).version, "1.0.1");

          assert.equal(require(path.join(testDir, "packages/package-2/package.json")).dependencies["package-1"], "^1.0.1");
          assert.equal(require(path.join(testDir, "packages/package-3/package.json")).devDependencies["package-2"], "^1.0.1");
          assert.equal(require(path.join(testDir, "packages/package-4/package.json")).dependencies["package-1"], "^0.0.0");
          assert.equal(require(path.join(testDir, "packages/package-5/package.json")).dependencies["package-1"], "^1.0.1");

          done();
        } catch (ex) {
          done.fail(ex);
        }
      }));
    });
  });

  /** =========================================================================
   * NORMAL - SKIP GIT AND SKIP NPM
   * ======================================================================= */

  describe("normal mode with --skip-git and --skip-npm", () => {
    let testDir;

    beforeEach(() => initFixture("PublishCommand/normal").then((dir) => {
      testDir = dir;
    }));

    it("should update versions but not push changes or publish", (done) => {
      const publishCommand = new PublishCommand([], {
        skipGit: true,
        skipNpm: true
      });

      publishCommand.runValidations();
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
      ]);

      publishCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done.fail(err);

        try {
          assert.ok(!pathExists.sync(path.join(testDir, "lerna-debug.log")));
          assert.equal(normalizeNewline(fs.readFileSync(path.join(testDir, "lerna.json"), "utf-8")), "{\n  \"lerna\": \"__TEST_VERSION__\",\n  \"version\": \"1.0.1\"\n}\n");

          assert.equal(require(path.join(testDir, "packages/package-1/package.json")).version, "1.0.1");
          assert.equal(require(path.join(testDir, "packages/package-2/package.json")).version, "1.0.1");
          assert.equal(require(path.join(testDir, "packages/package-3/package.json")).version, "1.0.1");
          assert.equal(require(path.join(testDir, "packages/package-4/package.json")).version, "1.0.1");

          assert.equal(require(path.join(testDir, "packages/package-2/package.json")).dependencies["package-1"], "^1.0.1");
          assert.equal(require(path.join(testDir, "packages/package-3/package.json")).devDependencies["package-2"], "^1.0.1");
          assert.equal(require(path.join(testDir, "packages/package-4/package.json")).dependencies["package-1"], "^0.0.0");

          done();
        } catch (ex) {
          done.fail(ex);
        }
      }));
    });
  });

  /** =========================================================================
   * NORMAL - SKIP TEMP TAG
   * ======================================================================= */

  describe("normal mode with --skip-temp-tag", () => {
    let testDir;

    beforeEach(() => initFixture("PublishCommand/normal").then((dir) => {
      testDir = dir;
    }));

    it("should publish the changed packages without the temp tag", (done) => {
      const publishCommand = new PublishCommand([], {
        npmTag: "prerelease",
        skipTempTag: true
      });

      publishCommand.runValidations();
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
          { args: ["git rev-parse --abbrev-ref HEAD"], returns: "master" },
          { args: ["git add " + escapeArgs(path.join(testDir, "lerna.json"))] },
          { args: ["git add " + escapeArgs(path.join(testDir, "packages/package-1/package.json"))] },
          { args: ["git add " + escapeArgs(path.join(testDir, "packages/package-2/package.json"))] },
          { args: ["git add " + escapeArgs(path.join(testDir, "packages/package-3/package.json"))] },
          { args: ["git add " + escapeArgs(path.join(testDir, "packages/package-4/package.json"))] },
          { args: ["git add " + escapeArgs(path.join(testDir, "packages/package-5/package.json"))] },
          { args: ["git commit -m \"$(echo \"v1.0.1\")\""] },
          { args: ["git tag -a v1.0.1 -m \"v1.0.1\""] }
        ]],
        [ChildProcessUtilities, "exec", { nodeCallback: true }, [
          { args: ["npm publish --tag prerelease"] },
          { args: ["npm publish --tag prerelease"] },
          { args: ["npm publish --tag prerelease"] },
          { args: ["npm publish --tag prerelease"] },
        ]],
        [ChildProcessUtilities, "execSync", {}, [

          // No package-5.  It's private.

          { args: ["git rev-parse --abbrev-ref HEAD"], returns: "master" },
          { args: ["git push origin master"] },
          { args: ["git push origin v1.0.1"] }
        ]],
      ]);

      publishCommand.runCommand(exitWithCode(0, done));
    });
  });

  /** =========================================================================
   * NORMAL - NPM TAG
   * ======================================================================= */

  describe("normal mode with --npm-tag", () => {
    let testDir;

    beforeEach(() => initFixture("PublishCommand/normal").then((dir) => {
      testDir = dir;
    }));

    it("should publish the changed packages with npm tag", (done) => {
      const publishCommand = new PublishCommand([], {
        npmTag: "prerelease"
      });

      publishCommand.runValidations();
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
          { args: ["git rev-parse --abbrev-ref HEAD"], returns: "master" },
          { args: ["git add " + escapeArgs(path.join(testDir, "lerna.json"))] },
          { args: ["git add " + escapeArgs(path.join(testDir, "packages/package-1/package.json"))] },
          { args: ["git add " + escapeArgs(path.join(testDir, "packages/package-2/package.json"))] },
          { args: ["git add " + escapeArgs(path.join(testDir, "packages/package-3/package.json"))] },
          { args: ["git add " + escapeArgs(path.join(testDir, "packages/package-4/package.json"))] },
          { args: ["git add " + escapeArgs(path.join(testDir, "packages/package-5/package.json"))] },
          { args: ["git commit -m \"$(echo \"v1.0.1\")\""] },
          { args: ["git tag -a v1.0.1 -m \"v1.0.1\""] }
        ]],
        [ChildProcessUtilities, "exec", { nodeCallback: true }, [
          { args: ["npm publish --tag lerna-temp"] },
          { args: ["npm publish --tag lerna-temp"] },
          { args: ["npm publish --tag lerna-temp"] },
          { args: ["npm publish --tag lerna-temp"] },
          // No package-5.  It's private.
        ]],
        [ChildProcessUtilities, "execSync", {}, [
          { args: ["npm dist-tag ls package-1"], returns: "lerna-temp: 1.0.1" + EOL + "stable: 1.0.0" },
          { args: ["npm dist-tag rm package-1 lerna-temp"] },
          { args: ["npm dist-tag add package-1@1.0.1 prerelease"] },

          { args: ["npm dist-tag ls package-3"], returns: "lerna-temp: 1.0.1" + EOL + "stable: 1.0.0" },
          { args: ["npm dist-tag rm package-3 lerna-temp"] },
          { args: ["npm dist-tag add package-3@1.0.1 prerelease"] },

          { args: ["npm dist-tag ls package-4"], returns: "lerna-temp: 1.0.1" + EOL + "stable: 1.0.0" },
          { args: ["npm dist-tag rm package-4 lerna-temp"] },
          { args: ["npm dist-tag add package-4@1.0.1 prerelease"] },

          { args: ["npm dist-tag ls package-2"], returns: "lerna-temp: 1.0.1" + EOL + "stable: 1.0.0" },
          { args: ["npm dist-tag rm package-2 lerna-temp"] },
          { args: ["npm dist-tag add package-2@1.0.1 prerelease"] },

          // No package-5.  It's private.

          { args: ["git rev-parse --abbrev-ref HEAD"], returns: "master" },
          { args: ["git push origin master"] },
          { args: ["git push origin v1.0.1"] }
        ]],
      ]);

      publishCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done.fail(err);

        try {
          assert.ok(!pathExists.sync(path.join(testDir, "lerna-debug.log")));
          assert.equal(normalizeNewline(fs.readFileSync(path.join(testDir, "lerna.json"), "utf-8")), "{\n  \"lerna\": \"__TEST_VERSION__\",\n  \"version\": \"1.0.1\"\n}\n");

          assert.equal(require(path.join(testDir, "packages/package-1/package.json")).version, "1.0.1");
          assert.equal(require(path.join(testDir, "packages/package-2/package.json")).version, "1.0.1");
          assert.equal(require(path.join(testDir, "packages/package-3/package.json")).version, "1.0.1");
          assert.equal(require(path.join(testDir, "packages/package-4/package.json")).version, "1.0.1");
          assert.equal(require(path.join(testDir, "packages/package-5/package.json")).version, "1.0.1");

          assert.equal(require(path.join(testDir, "packages/package-2/package.json")).dependencies["package-1"], "^1.0.1");
          assert.equal(require(path.join(testDir, "packages/package-3/package.json")).devDependencies["package-2"], "^1.0.1");
          assert.equal(require(path.join(testDir, "packages/package-4/package.json")).dependencies["package-1"], "^0.0.0");
          assert.equal(require(path.join(testDir, "packages/package-5/package.json")).dependencies["package-1"], "^1.0.1");

          done();
        } catch (ex) {
          done.fail(ex);
        }
      }));
    });
  });

  describe("auto confirmation", () => {
    it("should be possible to skip asking for confirmation", (done) => {
      const publishCommand = new PublishCommand([], {
        yes: true
      });
      publishCommand.updates = [];
      publishCommand.confirmVersions(done);
    });
  });

  /** =========================================================================
   * NORMAL - EXPLICIT REGISTRY FLAG
   * ======================================================================= */

  describe("normal mode with --registry", () => {
    let testDir;

    const originalEnv = Object.assign({}, process.env);
    const mockEnv = {
      mock_value: 1,
      NODE_ENV: "lerna-test",
    };

    beforeEach(() => initFixture("PublishCommand/normal").then((dir) => {
      testDir = dir;

      // mock out the ENV to a simpler version for testing
      process.env = mockEnv;
    }));

    afterEach(() => {
      process.env = originalEnv;
    });

    it("should publish the changed packages", (done) => {
      const publishCommand = new PublishCommand([], {
        repoVersion: "1.0.1",
        registry: "https://my-private-registry"
      });
      const env = Object.assign({}, mockEnv, {
        npm_config_registry: "https://my-private-registry",
      });

      publishCommand.runValidations();
      publishCommand.runPreparations();

      assertStubbedCalls([
        [ChildProcessUtilities, "execSync", {}, [
          { args: ["git tag"] }
        ]],
        [PromptUtilities, "confirm", { valueCallback: true }, [
          { args: ["Are you sure you want to publish the above changes?"], returns: true }
        ]],
        [ChildProcessUtilities, "execSync", {}, [
          { args: ["git rev-parse --abbrev-ref HEAD"], returns: "master" },
          { args: ["git add " + escapeArgs(path.join(testDir, "lerna.json"))] },
          { args: ["git add " + escapeArgs(path.join(testDir, "packages/package-1/package.json"))] },
          { args: ["git add " + escapeArgs(path.join(testDir, "packages/package-2/package.json"))] },
          { args: ["git add " + escapeArgs(path.join(testDir, "packages/package-3/package.json"))] },
          { args: ["git add " + escapeArgs(path.join(testDir, "packages/package-4/package.json"))] },
          { args: ["git add " + escapeArgs(path.join(testDir, "packages/package-5/package.json"))] },
          { args: ["git commit -m \"$(echo \"v1.0.1\")\""] },
          { args: ["git tag -a v1.0.1 -m \"v1.0.1\""] }
        ]],
        [ChildProcessUtilities, "exec", { nodeCallback: true }, [
          { args: ["npm publish --tag lerna-temp", { env, cwd: path.join(testDir,"packages/package-1") }] },
          { args: ["npm publish --tag lerna-temp", { env, cwd: path.join(testDir,"packages/package-3") }] },
          { args: ["npm publish --tag lerna-temp", { env, cwd: path.join(testDir,"packages/package-4") }] },
          { args: ["npm publish --tag lerna-temp", { env, cwd: path.join(testDir,"packages/package-2") }] }
          // No package-5.  It's private.
        ]],
        [ChildProcessUtilities, "execSync", {}, [
          { args: ["npm dist-tag ls package-1", { env, cwd: path.join(testDir,"packages/package-1") }], returns: "lerna-temp: 1.0.1\nstable: 1.0.0" },
          { args: ["npm dist-tag rm package-1 lerna-temp", { env, cwd: path.join(testDir,"packages/package-1") }]},
          { args: ["npm dist-tag add package-1@1.0.1 latest", { env, cwd: path.join(testDir,"packages/package-1") }]},

          { args: ["npm dist-tag ls package-3", { env, cwd: path.join(testDir,"packages/package-3") }], returns: "lerna-temp: 1.0.1\nstable: 1.0.0" },
          { args: ["npm dist-tag rm package-3 lerna-temp", { env, cwd: path.join(testDir,"packages/package-3") }]},
          { args: ["npm dist-tag add package-3@1.0.1 latest", { env, cwd: path.join(testDir,"packages/package-3") }]},

          { args: ["npm dist-tag ls package-4", { env, cwd: path.join(testDir,"packages/package-4") }], returns: "lerna-temp: 1.0.1\nstable: 1.0.0" },
          { args: ["npm dist-tag rm package-4 lerna-temp", { env, cwd: path.join(testDir,"packages/package-4") }]},
          { args: ["npm dist-tag add package-4@1.0.1 latest", { env, cwd: path.join(testDir,"packages/package-4") }]},

          { args: ["npm dist-tag ls package-2", { env, cwd: path.join(testDir,"packages/package-2") }], returns: "lerna-temp: 1.0.1\nstable: 1.0.0" },
          { args: ["npm dist-tag rm package-2 lerna-temp", { env, cwd: path.join(testDir,"packages/package-2") }]},
          { args: ["npm dist-tag add package-2@1.0.1 latest", { env, cwd: path.join(testDir,"packages/package-2") }]},

          // No package-5.  It's private.

          { args: ["git rev-parse --abbrev-ref HEAD"], returns: "master" },
          { args: ["git push origin master"] },
          { args: ["git push origin v1.0.1"] }
        ]],
      ]);

      publishCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done.fail(err);

        try {
          assert.ok(!pathExists.sync(path.join(testDir, "lerna-debug.log")));
          assert.equal(normalizeNewline(fs.readFileSync(path.join(testDir, "lerna.json"), "utf-8")), "{\n  \"lerna\": \"__TEST_VERSION__\",\n  \"version\": \"1.0.1\"\n}\n");

          assert.equal(require(path.join(testDir, "packages/package-1/package.json")).version, "1.0.1");
          assert.equal(require(path.join(testDir, "packages/package-2/package.json")).version, "1.0.1");
          assert.equal(require(path.join(testDir, "packages/package-3/package.json")).version, "1.0.1");
          assert.equal(require(path.join(testDir, "packages/package-4/package.json")).version, "1.0.1");
          assert.equal(require(path.join(testDir, "packages/package-5/package.json")).version, "1.0.1");

          assert.equal(require(path.join(testDir, "packages/package-2/package.json")).dependencies["package-1"], "^1.0.1");
          assert.equal(require(path.join(testDir, "packages/package-3/package.json")).devDependencies["package-2"], "^1.0.1");
          assert.equal(require(path.join(testDir, "packages/package-4/package.json")).dependencies["package-1"], "^0.0.0");
          assert.equal(require(path.join(testDir, "packages/package-5/package.json")).dependencies["package-1"], "^1.0.1");

          done();
        } catch (ex) {
          done.fail(ex);
        }
      }));
    });
  });

  /** =========================================================================
   * NORMAL - REGISTRY CONFIG
   * ======================================================================= */

  describe("normal mode with registry config", () => {
    let testDir;

    const originalEnv = Object.assign({}, process.env);
    const mockEnv = {
      mock_value: 1,
      NODE_ENV: "lerna-test",
    };

    beforeEach(() => initFixture("PublishCommand/registries").then((dir) => {
      testDir = dir;

      // mock out the ENV to a simpler version for testing
      process.env = mockEnv;
    }));

    afterEach(() => {
      process.env = originalEnv;
    });

    it("should use config property", (done) => {
      const publishCommand = new PublishCommand([], {
        repoVersion: "1.0.1"
      });
      const env = Object.assign({}, mockEnv, {
        npm_config_registry: "https://my-secure-registry/npm",
      });

      publishCommand.runValidations();
      publishCommand.runPreparations();

      assertStubbedCalls([
        [ChildProcessUtilities, "execSync", {}, [
          { args: ["git tag"] }
        ]],
        [PromptUtilities, "confirm", { valueCallback: true }, [
          { args: ["Are you sure you want to publish the above changes?"], returns: true }
        ]],
        [ChildProcessUtilities, "execSync", {}, [
          { args: ["git rev-parse --abbrev-ref HEAD"], returns: "master" },
          { args: ["git add " + escapeArgs(path.join(testDir, "lerna.json"))] },
          { args: ["git add " + escapeArgs(path.join(testDir, "packages/package-1/package.json"))] },
          { args: ["git commit -m \"$(echo \"v1.0.1\")\""] },
          { args: ["git tag -a v1.0.1 -m \"v1.0.1\""] }
        ]],
        [ChildProcessUtilities, "exec", { nodeCallback: true }, [
          { args: ["npm publish --tag lerna-temp", { env, cwd: path.join(testDir,"packages/package-1") }]}
        ]],
        [ChildProcessUtilities, "execSync", {}, [
          { args: ["npm dist-tag ls package-1", { env, cwd: path.join(testDir,"packages/package-1") }],
            returns: "lerna-temp: 1.0.1\nstable: 1.0.0"
          },
          { args: ["npm dist-tag rm package-1 lerna-temp", { env, cwd: path.join(testDir,"packages/package-1") }] },
          { args: ["npm dist-tag add package-1@1.0.1 latest", { env, cwd: path.join(testDir,"packages/package-1") }] },

          { args: ["git rev-parse --abbrev-ref HEAD"], returns: "master" },
          { args: ["git push origin master"] },
          { args: ["git push origin v1.0.1"] }
        ]],
      ]);

      publishCommand.runCommand(exitWithCode(0, done));
    });
  });

  /** =========================================================================
   * NORMAL - REPO VERSION
   * ======================================================================= */

  describe("normal mode with --repo-version", () => {
    let testDir;

    beforeEach(() => initFixture("PublishCommand/normal").then((dir) => {
      testDir = dir;
    }));

    it("should publish the changed packages", (done) => {
      const publishCommand = new PublishCommand([], {
        repoVersion: "1.0.1"
      });

      publishCommand.runValidations();
      publishCommand.runPreparations();

      assertStubbedCalls([
        [ChildProcessUtilities, "execSync", {}, [
          { args: ["git tag"] }
        ]],
        [PromptUtilities, "confirm", { valueCallback: true }, [
          { args: ["Are you sure you want to publish the above changes?"], returns: true }
        ]],
        [ChildProcessUtilities, "execSync", {}, [
          { args: ["git rev-parse --abbrev-ref HEAD"], returns: "master" },
          { args: ["git add " + escapeArgs(path.join(testDir, "lerna.json"))] },
          { args: ["git add " + escapeArgs(path.join(testDir, "packages/package-1/package.json"))] },
          { args: ["git add " + escapeArgs(path.join(testDir, "packages/package-2/package.json"))] },
          { args: ["git add " + escapeArgs(path.join(testDir, "packages/package-3/package.json"))] },
          { args: ["git add " + escapeArgs(path.join(testDir, "packages/package-4/package.json"))] },
          { args: ["git add " + escapeArgs(path.join(testDir, "packages/package-5/package.json"))] },
          { args: ["git commit -m \"$(echo \"v1.0.1\")\""] },
          { args: ["git tag -a v1.0.1 -m \"v1.0.1\""] }
        ]],
        [ChildProcessUtilities, "exec", { nodeCallback: true }, [
          { args: ["npm publish --tag lerna-temp"] },
          { args: ["npm publish --tag lerna-temp"] },
          { args: ["npm publish --tag lerna-temp"] },
          { args: ["npm publish --tag lerna-temp"] },
          // No package-5.  It's private.
        ]],
        [ChildProcessUtilities, "execSync", {}, [
          { args: ["npm dist-tag ls package-1"], returns: "lerna-temp: 1.0.1\nstable: 1.0.0" },
          { args: ["npm dist-tag rm package-1 lerna-temp"] },
          { args: ["npm dist-tag add package-1@1.0.1 latest"] },

          { args: ["npm dist-tag ls package-3"], returns: "lerna-temp: 1.0.1\nstable: 1.0.0" },
          { args: ["npm dist-tag rm package-3 lerna-temp"] },
          { args: ["npm dist-tag add package-3@1.0.1 latest"] },

          { args: ["npm dist-tag ls package-4"], returns: "lerna-temp: 1.0.1\nstable: 1.0.0" },
          { args: ["npm dist-tag rm package-4 lerna-temp"] },
          { args: ["npm dist-tag add package-4@1.0.1 latest"] },

          { args: ["npm dist-tag ls package-2"], returns: "lerna-temp: 1.0.1\nstable: 1.0.0" },
          { args: ["npm dist-tag rm package-2 lerna-temp"] },
          { args: ["npm dist-tag add package-2@1.0.1 latest"] },

          // No package-5.  It's private.

          { args: ["git rev-parse --abbrev-ref HEAD"], returns: "master" },
          { args: ["git push origin master"] },
          { args: ["git push origin v1.0.1"] }
        ]],
      ]);

      publishCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done.fail(err);

        try {
          assert.ok(!pathExists.sync(path.join(testDir, "lerna-debug.log")));
          assert.equal(normalizeNewline(fs.readFileSync(path.join(testDir, "lerna.json"), "utf-8")), "{\n  \"lerna\": \"__TEST_VERSION__\",\n  \"version\": \"1.0.1\"\n}\n");

          assert.equal(require(path.join(testDir, "packages/package-1/package.json")).version, "1.0.1");
          assert.equal(require(path.join(testDir, "packages/package-2/package.json")).version, "1.0.1");
          assert.equal(require(path.join(testDir, "packages/package-3/package.json")).version, "1.0.1");
          assert.equal(require(path.join(testDir, "packages/package-4/package.json")).version, "1.0.1");
          assert.equal(require(path.join(testDir, "packages/package-5/package.json")).version, "1.0.1");

          assert.equal(require(path.join(testDir, "packages/package-2/package.json")).dependencies["package-1"], "^1.0.1");
          assert.equal(require(path.join(testDir, "packages/package-3/package.json")).devDependencies["package-2"], "^1.0.1");
          assert.equal(require(path.join(testDir, "packages/package-4/package.json")).dependencies["package-1"], "^0.0.0");
          assert.equal(require(path.join(testDir, "packages/package-5/package.json")).dependencies["package-1"], "^1.0.1");

          done();
        } catch (ex) {
          done.fail(ex);
        }
      }));
    });
  });

  /** =========================================================================
   * NORMAL - EXACT REPO VERSION
   * ======================================================================= */

  describe("normal mode with --repo-version and --exact", () => {
    let testDir;

    beforeEach(() => initFixture("PublishCommand/normal").then((dir) => {
      testDir = dir;
    }));

    it("should publish the changed packages", (done) => {
      const publishCommand = new PublishCommand([], {
        repoVersion: "1.0.1",
        exact: true
      });

      publishCommand.runValidations();
      publishCommand.runPreparations();

      assertStubbedCalls([
        [ChildProcessUtilities, "execSync", {}, [
          { args: ["git tag"] }
        ]],
        [PromptUtilities, "confirm", { valueCallback: true }, [
          { args: ["Are you sure you want to publish the above changes?"], returns: true }
        ]],
        [ChildProcessUtilities, "execSync", {}, [
          { args: ["git rev-parse --abbrev-ref HEAD"], returns: "master" },
          { args: ["git add " + escapeArgs(path.join(testDir, "lerna.json"))] },
          { args: ["git add " + escapeArgs(path.join(testDir, "packages/package-1/package.json"))] },
          { args: ["git add " + escapeArgs(path.join(testDir, "packages/package-2/package.json"))] },
          { args: ["git add " + escapeArgs(path.join(testDir, "packages/package-3/package.json"))] },
          { args: ["git add " + escapeArgs(path.join(testDir, "packages/package-4/package.json"))] },
          { args: ["git add " + escapeArgs(path.join(testDir, "packages/package-5/package.json"))] },
          { args: ["git commit -m \"$(echo \"v1.0.1\")\""] },
          { args: ["git tag -a v1.0.1 -m \"v1.0.1\""] }
        ]],
        [ChildProcessUtilities, "exec", { nodeCallback: true }, [
          { args: ["npm publish --tag lerna-temp"] },
          { args: ["npm publish --tag lerna-temp"] },
          { args: ["npm publish --tag lerna-temp"] },
          { args: ["npm publish --tag lerna-temp"] },
          // No package-5.  It's private.
        ]],
        [ChildProcessUtilities, "execSync", {}, [
          { args: ["npm dist-tag ls package-1"], returns: "lerna-temp: 1.0.1\nstable: 1.0.0" },
          { args: ["npm dist-tag rm package-1 lerna-temp"] },
          { args: ["npm dist-tag add package-1@1.0.1 latest"] },

          { args: ["npm dist-tag ls package-3"], returns: "lerna-temp: 1.0.1\nstable: 1.0.0" },
          { args: ["npm dist-tag rm package-3 lerna-temp"] },
          { args: ["npm dist-tag add package-3@1.0.1 latest"] },

          { args: ["npm dist-tag ls package-4"], returns: "lerna-temp: 1.0.1\nstable: 1.0.0" },
          { args: ["npm dist-tag rm package-4 lerna-temp"] },
          { args: ["npm dist-tag add package-4@1.0.1 latest"] },

          { args: ["npm dist-tag ls package-2"], returns: "lerna-temp: 1.0.1\nstable: 1.0.0" },
          { args: ["npm dist-tag rm package-2 lerna-temp"] },
          { args: ["npm dist-tag add package-2@1.0.1 latest"] },

          // No package-5.  It's private.

          { args: ["git rev-parse --abbrev-ref HEAD"], returns: "master" },
          { args: ["git push origin master"] },
          { args: ["git push origin v1.0.1"] }
        ]],
      ]);

      publishCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done.fail(err);

        try {
          assert.ok(!pathExists.sync(path.join(testDir, "lerna-debug.log")));
          assert.equal(normalizeNewline(fs.readFileSync(path.join(testDir, "lerna.json"), "utf-8")), "{\n  \"lerna\": \"__TEST_VERSION__\",\n  \"version\": \"1.0.1\"\n}\n");

          assert.equal(require(path.join(testDir, "packages/package-1/package.json")).version, "1.0.1");
          assert.equal(require(path.join(testDir, "packages/package-2/package.json")).version, "1.0.1");
          assert.equal(require(path.join(testDir, "packages/package-3/package.json")).version, "1.0.1");
          assert.equal(require(path.join(testDir, "packages/package-4/package.json")).version, "1.0.1");
          assert.equal(require(path.join(testDir, "packages/package-5/package.json")).version, "1.0.1");

          assert.equal(require(path.join(testDir, "packages/package-2/package.json")).dependencies["package-1"], "1.0.1");
          assert.equal(require(path.join(testDir, "packages/package-3/package.json")).devDependencies["package-2"], "1.0.1");
          // remains semver because it is a diverged version,
          // (different from the release version) and is specified
          // as semver in the package-4's package.json
          assert.equal(require(path.join(testDir, "packages/package-4/package.json")).dependencies["package-1"], "^0.0.0");
          assert.equal(require(path.join(testDir, "packages/package-5/package.json")).dependencies["package-1"], "1.0.1");

          done();
        } catch (ex) {
          done.fail(ex);
        }
      }));
    });
  });

  /** =========================================================================
   * NORMAL - EXACT CONFIG
   * ======================================================================= */

  describe("normal mode with --repo-version and exact config", () => {
    let testDir;

    beforeEach(() => initFixture("PublishCommand/normal-exact").then((dir) => {
      testDir = dir;
    }));

    it("should publish the changed packages", (done) => {
      const publishCommand = new PublishCommand([], {
        repoVersion: "1.0.1"
      });

      publishCommand.runValidations();
      publishCommand.runPreparations();

      assertStubbedCalls([
        [ChildProcessUtilities, "execSync", {}, [
          { args: ["git tag"] }
        ]],
        [PromptUtilities, "confirm", { valueCallback: true }, [
          { args: ["Are you sure you want to publish the above changes?"], returns: true }
        ]],
        [ChildProcessUtilities, "execSync", {}, [
          { args: ["git rev-parse --abbrev-ref HEAD"], returns: "master" },
          { args: ["git add " + escapeArgs(path.join(testDir, "lerna.json"))] },
          { args: ["git add " + escapeArgs(path.join(testDir, "packages/package-1/package.json"))] },
          { args: ["git add " + escapeArgs(path.join(testDir, "packages/package-2/package.json"))] },
          { args: ["git add " + escapeArgs(path.join(testDir, "packages/package-3/package.json"))] },
          { args: ["git add " + escapeArgs(path.join(testDir, "packages/package-4/package.json"))] },
          { args: ["git add " + escapeArgs(path.join(testDir, "packages/package-5/package.json"))] },
          { args: ["git commit -m \"$(echo \"v1.0.1\")\""] },
          { args: ["git tag -a v1.0.1 -m \"v1.0.1\""] }
        ]],
        [ChildProcessUtilities, "exec", { nodeCallback: true }, [
          { args: ["npm publish --tag lerna-temp"] },
          { args: ["npm publish --tag lerna-temp"] },
          { args: ["npm publish --tag lerna-temp"] },
          { args: ["npm publish --tag lerna-temp"] },
          // No package-5.  It's private.
        ]],
        [ChildProcessUtilities, "execSync", {}, [
          { args: ["npm dist-tag ls package-1"], returns: "lerna-temp: 1.0.1\nstable: 1.0.0" },
          { args: ["npm dist-tag rm package-1 lerna-temp"] },
          { args: ["npm dist-tag add package-1@1.0.1 latest"] },

          { args: ["npm dist-tag ls package-3"], returns: "lerna-temp: 1.0.1\nstable: 1.0.0" },
          { args: ["npm dist-tag rm package-3 lerna-temp"] },
          { args: ["npm dist-tag add package-3@1.0.1 latest"] },

          { args: ["npm dist-tag ls package-4"], returns: "lerna-temp: 1.0.1\nstable: 1.0.0" },
          { args: ["npm dist-tag rm package-4 lerna-temp"] },
          { args: ["npm dist-tag add package-4@1.0.1 latest"] },

          { args: ["npm dist-tag ls package-2"], returns: "lerna-temp: 1.0.1\nstable: 1.0.0" },
          { args: ["npm dist-tag rm package-2 lerna-temp"] },
          { args: ["npm dist-tag add package-2@1.0.1 latest"] },

          // No package-5.  It's private.

          { args: ["git rev-parse --abbrev-ref HEAD"], returns: "master" },
          { args: ["git push origin master"] },
          { args: ["git push origin v1.0.1"] }
        ]],
      ]);

      publishCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done.fail(err);

        try {
          assert.ok(!pathExists.sync(path.join(testDir, "lerna-debug.log")));
          assert.equal(normalizeNewline(fs.readFileSync(path.join(testDir, "lerna.json"), "utf-8")),
          "{\n  \"lerna\": \"__TEST_VERSION__\",\n  \"version\": \"1.0.1\",\n  \"exact\": true\n}\n");

          assert.equal(require(path.join(testDir, "packages/package-1/package.json")).version, "1.0.1");
          assert.equal(require(path.join(testDir, "packages/package-2/package.json")).version, "1.0.1");
          assert.equal(require(path.join(testDir, "packages/package-3/package.json")).version, "1.0.1");
          assert.equal(require(path.join(testDir, "packages/package-4/package.json")).version, "1.0.1");
          assert.equal(require(path.join(testDir, "packages/package-5/package.json")).version, "1.0.1");

          assert.equal(require(path.join(testDir, "packages/package-2/package.json")).dependencies["package-1"], "1.0.1");
          assert.equal(require(path.join(testDir, "packages/package-3/package.json")).devDependencies["package-2"], "1.0.1");
          // remains semver because it is a diverged version,
          // (different from the release version) and is specified
          // as semver in the package-4's package.json
          assert.equal(require(path.join(testDir, "packages/package-4/package.json")).dependencies["package-1"], "^0.0.0");
          assert.equal(require(path.join(testDir, "packages/package-5/package.json")).dependencies["package-1"], "1.0.1");

          done();
        } catch (ex) {
          done.fail(ex);
        }
      }));
    });
  });

  /** =========================================================================
   * NORMAL MODE - CD VERSION
   * ======================================================================= */

  describe("normal mode with --cd-version", () => {
    let testDir;

    beforeEach(() => initFixture("PublishCommand/normal").then((dir) => {
      testDir = dir;
    }));

    it("should use semver increments when passed to cdVersion flag", (done) => {
      const publishCommand = new PublishCommand([], {
        cdVersion: "minor"
      });

      publishCommand.runValidations();
      publishCommand.runPreparations();

      assertStubbedCalls([
        [ChildProcessUtilities, "execSync", {}, [
          { args: ["git tag"] }
        ]],
        [PromptUtilities, "confirm", { valueCallback: true }, [
          { args: ["Are you sure you want to publish the above changes?"], returns: true }
        ]],
        [ChildProcessUtilities, "execSync", {}, [
          { args: ["git rev-parse --abbrev-ref HEAD"], returns: "master" },
          { args: ["git add " + escapeArgs(path.join(testDir, "lerna.json"))] },
          { args: ["git add " + escapeArgs(path.join(testDir, "packages/package-1/package.json"))] },
          { args: ["git add " + escapeArgs(path.join(testDir, "packages/package-2/package.json"))] },
          { args: ["git add " + escapeArgs(path.join(testDir, "packages/package-3/package.json"))] },
          { args: ["git add " + escapeArgs(path.join(testDir, "packages/package-4/package.json"))] },
          { args: ["git add " + escapeArgs(path.join(testDir, "packages/package-5/package.json"))] },
          { args: ["git commit -m \"$(echo \"v1.1.0\")\""] },
          { args: ["git tag -a v1.1.0 -m \"v1.1.0\""] }
        ]],
        [ChildProcessUtilities, "exec", { nodeCallback: true }, [
          { args: ["npm publish --tag lerna-temp", { cwd: path.join(testDir,"packages/package-1") }] },
          { args: ["npm publish --tag lerna-temp", { cwd: path.join(testDir,"packages/package-3") }] },
          { args: ["npm publish --tag lerna-temp", { cwd: path.join(testDir,"packages/package-4") }] },
          { args: ["npm publish --tag lerna-temp", { cwd: path.join(testDir,"packages/package-2") }] }
        ]],
        [ChildProcessUtilities, "execSync", {}, [
          { args: ["npm dist-tag ls package-1", { cwd: path.join(testDir,"packages/package-1") }], returns: "lerna-temp: 1.1.0\nstable: 1.0.0" },
          { args: ["npm dist-tag rm package-1 lerna-temp", { cwd: path.join(testDir,"packages/package-1") }] },
          { args: ["npm dist-tag add package-1@1.1.0 latest", { cwd: path.join(testDir,"packages/package-1") }] },

          { args: ["npm dist-tag ls package-3", { cwd: path.join(testDir,"packages/package-3") }], returns: "lerna-temp: 1.1.0\nstable: 1.0.0" },
          { args: ["npm dist-tag rm package-3 lerna-temp", { cwd: path.join(testDir,"packages/package-3") }] },
          { args: ["npm dist-tag add package-3@1.1.0 latest", { cwd: path.join(testDir,"packages/package-3") }] },

          { args: ["npm dist-tag ls package-4", { cwd: path.join(testDir,"packages/package-4") }], returns: "lerna-temp: 1.1.0\nstable: 1.0.0" },
          { args: ["npm dist-tag rm package-4 lerna-temp", { cwd: path.join(testDir,"packages/package-4") }] },
          { args: ["npm dist-tag add package-4@1.1.0 latest", { cwd: path.join(testDir,"packages/package-4") }] },

          { args: ["npm dist-tag ls package-2", { cwd: path.join(testDir,"packages/package-2") }], returns: "lerna-temp: 1.1.0\nstable: 1.0.0" },
          { args: ["npm dist-tag rm package-2 lerna-temp", { cwd: path.join(testDir,"packages/package-2") }] },
          { args: ["npm dist-tag add package-2@1.1.0 latest", { cwd: path.join(testDir,"packages/package-2") }] },

          { args: ["git rev-parse --abbrev-ref HEAD"], returns: "master" },
          { args: ["git push origin master"] },
          { args: ["git push origin v1.1.0"] }
        ]],
      ]);

      publishCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done.fail(err);

        try {
          assert.ok(!pathExists.sync(path.join(testDir, "lerna-debug.log")));
          assert.equal(normalizeNewline(fs.readFileSync(path.join(testDir, "lerna.json"), "utf-8")), "{\n  \"lerna\": \"__TEST_VERSION__\",\n  \"version\": \"1.1.0\"\n}\n");

          assert.equal(require(path.join(testDir, "lerna.json")).version, "1.1.0");
          assert.equal(require(path.join(testDir, "packages/package-1/package.json")).version, "1.1.0");
          assert.equal(require(path.join(testDir, "packages/package-2/package.json")).version, "1.1.0");
          assert.equal(require(path.join(testDir, "packages/package-3/package.json")).version, "1.1.0");
          assert.equal(require(path.join(testDir, "packages/package-4/package.json")).version, "1.1.0");

          assert.equal(require(path.join(testDir, "packages/package-2/package.json")).dependencies["package-1"], "^1.1.0");
          assert.equal(require(path.join(testDir, "packages/package-3/package.json")).devDependencies["package-2"], "^1.1.0");
          assert.equal(require(path.join(testDir, "packages/package-4/package.json")).dependencies["package-1"], "^0.0.0");

          done();
        } catch (ex) {
          done.fail(ex);
        }
      }));
    });
  });

  /** =========================================================================
   * INDEPENDENT - CD VERSION
   * ======================================================================= */

  describe("indepdendent mode with --cd-version", () => {
    let testDir;

    beforeEach(() => initFixture("PublishCommand/independent").then((dir) => {
      testDir = dir;
    }));

    it("should use semver increments when passed to cdVersion flag", (done) => {
      const publishCommand = new PublishCommand([], {
        independent: true,
        cdVersion: "patch"
      });

      publishCommand.runValidations();
      publishCommand.runPreparations();

      assertStubbedCalls([
        [ChildProcessUtilities, "execSync", {}, [
          { args: ["git tag"] }
        ]],
        [PromptUtilities, "confirm", { valueCallback: true }, [
          { args: ["Are you sure you want to publish the above changes?"], returns: true }
        ]],
        [ChildProcessUtilities, "execSync", {}, [
          { args: ["git rev-parse --abbrev-ref HEAD"], returns: "master" },
          { args: ["git add " + escapeArgs(path.join(testDir, "packages/package-1/package.json"))] },
          { args: ["git add " + escapeArgs(path.join(testDir, "packages/package-2/package.json"))] },
          { args: ["git add " + escapeArgs(path.join(testDir, "packages/package-3/package.json"))] },
          { args: ["git add " + escapeArgs(path.join(testDir, "packages/package-4/package.json"))] },
          { args: ["git commit -m \"$(echo \"Publish" + EOL + EOL + " - package-1@1.0.1" + EOL + " - package-2@2.0.1" + EOL + " - package-3@3.0.1" + EOL + " - package-4@4.0.1\")\""] },
          { args: ["git tag -a package-1@1.0.1 -m \"package-1@1.0.1\""] },
          { args: ["git tag -a package-2@2.0.1 -m \"package-2@2.0.1\""] },
          { args: ["git tag -a package-3@3.0.1 -m \"package-3@3.0.1\""] },
          { args: ["git tag -a package-4@4.0.1 -m \"package-4@4.0.1\""] }
        ]],
        [ChildProcessUtilities, "exec", { nodeCallback: true }, [
          { args: ["npm publish --tag lerna-temp"] },
          { args: ["npm publish --tag lerna-temp"] },
          { args: ["npm publish --tag lerna-temp"] },
          { args: ["npm publish --tag lerna-temp"] }
        ]],
        [ChildProcessUtilities, "execSync", {}, [
          { args: ["npm dist-tag ls package-1"], returns: "lerna-temp: 1.0.1\nstable: 1.0.0" },
          { args: ["npm dist-tag rm package-1 lerna-temp"] },
          { args: ["npm dist-tag add package-1@1.0.1 latest"] },

          { args: ["npm dist-tag ls package-3"], returns: "lerna-temp: 3.0.1\nstable: 1.0.0" },
          { args: ["npm dist-tag rm package-3 lerna-temp"] },
          { args: ["npm dist-tag add package-3@3.0.1 latest"] },

          { args: ["npm dist-tag ls package-4"], returns: "lerna-temp: 4.0.1\nstable: 1.0.0" },
          { args: ["npm dist-tag rm package-4 lerna-temp"] },
          { args: ["npm dist-tag add package-4@4.0.1 latest"] },

          { args: ["npm dist-tag ls package-2"], returns: "lerna-temp: 2.0.1\nstable: 1.0.0" },
          { args: ["npm dist-tag rm package-2 lerna-temp"] },
          { args: ["npm dist-tag add package-2@2.0.1 latest"] },

          { args: ["git rev-parse --abbrev-ref HEAD"], returns: "master" },
          { args: ["git push origin master"] },
          { args: ["git push origin package-1@1.0.1 package-2@2.0.1 package-3@3.0.1 package-4@4.0.1"] }
        ]],
      ]);

      publishCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done.fail(err);

        try {
          assert.ok(!pathExists.sync(path.join(testDir, "lerna-debug.log")));
          assert.equal(normalizeNewline(fs.readFileSync(path.join(testDir, "lerna.json"), "utf-8")), "{\n  \"lerna\": \"__TEST_VERSION__\",\n  \"version\": \"independent\"\n}\n");

          assert.equal(require(path.join(testDir, "packages/package-1/package.json")).version, "1.0.1");
          assert.equal(require(path.join(testDir, "packages/package-2/package.json")).version, "2.0.1");
          assert.equal(require(path.join(testDir, "packages/package-3/package.json")).version, "3.0.1");
          assert.equal(require(path.join(testDir, "packages/package-4/package.json")).version, "4.0.1");

          assert.equal(require(path.join(testDir, "packages/package-2/package.json")).dependencies["package-1"], "^1.0.1");
          assert.equal(require(path.join(testDir, "packages/package-3/package.json")).devDependencies["package-2"], "^2.0.1");
          assert.equal(require(path.join(testDir, "packages/package-4/package.json")).dependencies["package-1"], "^0.0.0");

          done();
        } catch (ex) {
          done.fail(ex);
        }
      }));
    });
  });

  /** =========================================================================
   * NORMAL - GIT REMOTE
   * ======================================================================= */

  describe("normal mode with --git-remote", () => {
    let testDir;

    beforeEach(() => initFixture("PublishCommand/normal").then((dir) => {
      testDir = dir;
    }));

    it("should publish the changed packages", (done) => {
      const publishCommand = new PublishCommand([], {
        gitRemote: "upstream"
      });

      publishCommand.runValidations();
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
          { args: ["git rev-parse --abbrev-ref HEAD"], returns: "master" },
          { args: ["git add " + escapeArgs(path.join(testDir, "lerna.json"))] },
          { args: ["git add " + escapeArgs(path.join(testDir, "packages/package-1/package.json"))] },
          { args: ["git add " + escapeArgs(path.join(testDir, "packages/package-2/package.json"))] },
          { args: ["git add " + escapeArgs(path.join(testDir, "packages/package-3/package.json"))] },
          { args: ["git add " + escapeArgs(path.join(testDir, "packages/package-4/package.json"))] },
          { args: ["git add " + escapeArgs(path.join(testDir, "packages/package-5/package.json"))] },
          { args: ["git commit -m \"$(echo \"v1.0.1\")\""] },
          { args: ["git tag -a v1.0.1 -m \"v1.0.1\""] }
        ]],
        [ChildProcessUtilities, "exec", { nodeCallback: true }, [
          { args: ["npm publish --tag lerna-temp"] },
          { args: ["npm publish --tag lerna-temp"] },
          { args: ["npm publish --tag lerna-temp"] },
          { args: ["npm publish --tag lerna-temp"] },
          // No package-5.  It's private.
        ]],
        [ChildProcessUtilities, "execSync", {}, [
          { args: ["npm dist-tag ls package-1"], returns: "lerna-temp: 1.0.1" + EOL + "stable: 1.0.0" },
          { args: ["npm dist-tag rm package-1 lerna-temp"] },
          { args: ["npm dist-tag add package-1@1.0.1 latest"] },

          { args: ["npm dist-tag ls package-3"], returns: "lerna-temp: 1.0.1" + EOL + "stable: 1.0.0" },
          { args: ["npm dist-tag rm package-3 lerna-temp"] },
          { args: ["npm dist-tag add package-3@1.0.1 latest"] },

          { args: ["npm dist-tag ls package-4"], returns: "lerna-temp: 1.0.1" + EOL + "stable: 1.0.0" },
          { args: ["npm dist-tag rm package-4 lerna-temp"] },
          { args: ["npm dist-tag add package-4@1.0.1 latest"] },

          { args: ["npm dist-tag ls package-2"], returns: "lerna-temp: 1.0.1" + EOL + "stable: 1.0.0" },
          { args: ["npm dist-tag rm package-2 lerna-temp"] },
          { args: ["npm dist-tag add package-2@1.0.1 latest"] },

          // No package-5.  It's private.

          { args: ["git rev-parse --abbrev-ref HEAD"], returns: "master" },
          { args: ["git push upstream master"] },
          { args: ["git push upstream v1.0.1"] }
        ]],
      ]);

      publishCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done.fail(err);

        try {
          assert.ok(!pathExists.sync(path.join(testDir, "lerna-debug.log")));
          assert.equal(normalizeNewline(fs.readFileSync(path.join(testDir, "lerna.json"), "utf-8")), "{\n  \"lerna\": \"__TEST_VERSION__\",\n  \"version\": \"1.0.1\"\n}\n");

          assert.equal(require(path.join(testDir, "packages/package-1/package.json")).version, "1.0.1");
          assert.equal(require(path.join(testDir, "packages/package-2/package.json")).version, "1.0.1");
          assert.equal(require(path.join(testDir, "packages/package-3/package.json")).version, "1.0.1");
          assert.equal(require(path.join(testDir, "packages/package-4/package.json")).version, "1.0.1");
          assert.equal(require(path.join(testDir, "packages/package-5/package.json")).version, "1.0.1");

          assert.equal(require(path.join(testDir, "packages/package-2/package.json")).dependencies["package-1"], "^1.0.1");
          assert.equal(require(path.join(testDir, "packages/package-3/package.json")).devDependencies["package-2"], "^1.0.1");
          assert.equal(require(path.join(testDir, "packages/package-4/package.json")).dependencies["package-1"], "^0.0.0");
          assert.equal(require(path.join(testDir, "packages/package-5/package.json")).dependencies["package-1"], "^1.0.1");

          done();
        } catch (ex) {
          done.fail(ex);
        }
      }));
    });
  });

  /** =========================================================================
   * NORMAL - GIT REMOTE
   * ======================================================================= */

  describe("normal mode with --ignore", () => {
    let testDir;

    beforeEach(() => initFixture("PublishCommand/normal").then((dir) => {
      testDir = dir;
    }));

    it("should publish the changed packages", (done) => {
      const publishCommand = new PublishCommand([], {
        gitRemote: "upstream",
        ignore: ["package-2", "package-3", "package-4"]
      });

      publishCommand.runValidations();
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
          { args: ["git rev-parse --abbrev-ref HEAD"], returns: "master" },
          { args: ["git add " + escapeArgs(path.join(testDir, "lerna.json"))] },
          { args: ["git add " + escapeArgs(path.join(testDir, "packages/package-1/package.json"))] },
          { args: ["git add " + escapeArgs(path.join(testDir, "packages/package-5/package.json"))] },
          { args: ["git commit -m \"$(echo \"v1.0.1\")\""] },
          { args: ["git tag -a v1.0.1 -m \"v1.0.1\""] }
        ]],
        [ChildProcessUtilities, "exec", { nodeCallback: true }, [
          { args: ["npm publish --tag lerna-temp"] }
        ]],
        [ChildProcessUtilities, "execSync", {}, [
          { args: ["npm dist-tag ls package-1"], returns: "lerna-temp: 1.0.1" + EOL + "stable: 1.0.0" },
          { args: ["npm dist-tag rm package-1 lerna-temp"] },
          { args: ["npm dist-tag add package-1@1.0.1 latest"] },

          { args: ["git rev-parse --abbrev-ref HEAD"], returns: "master" },
          { args: ["git push upstream master"] },
          { args: ["git push upstream v1.0.1"] }
        ]],
      ]);

      publishCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done.fail(err);

        try {
          assert.ok(!pathExists.sync(path.join(testDir, "lerna-debug.log")));
          done();
        } catch (ex) {
          done.fail(ex);
        }
      }));
    });
  });

  /** =========================================================================
   * NORMAL - MESSAGE
   * ======================================================================= */

  describe("normal mode with --message", () => {
    let testDir;

    beforeEach(() => initFixture("PublishCommand/normal").then((dir) => {
      testDir = dir;
    }));

    it("should publish the changed packages, committing the publish changes with a custom message", (done) => {
      const publishCommand = new PublishCommand([], {
        message: "A custom publish message"
      });

      publishCommand.runValidations();
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
          { args: ["git rev-parse --abbrev-ref HEAD"], returns: "master" },
          { args: ["git add " + escapeArgs(path.join(testDir, "lerna.json"))] },
          { args: ["git add " + escapeArgs(path.join(testDir, "packages/package-1/package.json"))] },
          { args: ["git add " + escapeArgs(path.join(testDir, "packages/package-2/package.json"))] },
          { args: ["git add " + escapeArgs(path.join(testDir, "packages/package-3/package.json"))] },
          { args: ["git add " + escapeArgs(path.join(testDir, "packages/package-4/package.json"))] },
          { args: ["git add " + escapeArgs(path.join(testDir, "packages/package-5/package.json"))] },
          { args: ["git commit -m \"$(echo \"A custom publish message\")\""] },
          { args: ["git tag -a v1.0.1 -m \"v1.0.1\""] }
        ]],
        [ChildProcessUtilities, "exec", { nodeCallback: true }, [
          { args: ["npm publish --tag lerna-temp"] },
          { args: ["npm publish --tag lerna-temp"] },
          { args: ["npm publish --tag lerna-temp"] },
          { args: ["npm publish --tag lerna-temp"] },
          // No package-5.  It's private.
        ]],
        [ChildProcessUtilities, "execSync", {}, [
          { args: ["npm dist-tag ls package-1"], returns: "lerna-temp: 1.0.1\nstable: 1.0.0" },
          { args: ["npm dist-tag rm package-1 lerna-temp"] },
          { args: ["npm dist-tag add package-1@1.0.1 latest"] },

          { args: ["npm dist-tag ls package-3"], returns: "lerna-temp: 1.0.1\nstable: 1.0.0" },
          { args: ["npm dist-tag rm package-3 lerna-temp"] },
          { args: ["npm dist-tag add package-3@1.0.1 latest"] },

          { args: ["npm dist-tag ls package-4"], returns: "lerna-temp: 1.0.1\nstable: 1.0.0" },
          { args: ["npm dist-tag rm package-4 lerna-temp"] },
          { args: ["npm dist-tag add package-4@1.0.1 latest"] },

          { args: ["npm dist-tag ls package-2"], returns: "lerna-temp: 1.0.1\nstable: 1.0.0" },
          { args: ["npm dist-tag rm package-2 lerna-temp"] },
          { args: ["npm dist-tag add package-2@1.0.1 latest"] },

          // No package-5.  It's private.

          { args: ["git rev-parse --abbrev-ref HEAD"], returns: "master" },
          { args: ["git push origin master"] },
          { args: ["git push origin v1.0.1"] }
        ]],
      ]);

      publishCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done.fail(err);

        try {
          assert.ok(!pathExists.sync(path.join(testDir, "lerna-debug.log")));
          assert.equal(normalizeNewline(fs.readFileSync(path.join(testDir, "lerna.json"), "utf-8")), "{\n  \"lerna\": \"__TEST_VERSION__\",\n  \"version\": \"1.0.1\"\n}\n");

          assert.equal(require(path.join(testDir, "packages/package-1/package.json")).version, "1.0.1");
          assert.equal(require(path.join(testDir, "packages/package-2/package.json")).version, "1.0.1");
          assert.equal(require(path.join(testDir, "packages/package-3/package.json")).version, "1.0.1");
          assert.equal(require(path.join(testDir, "packages/package-4/package.json")).version, "1.0.1");
          assert.equal(require(path.join(testDir, "packages/package-5/package.json")).version, "1.0.1");

          assert.equal(require(path.join(testDir, "packages/package-2/package.json")).dependencies["package-1"], "^1.0.1");
          assert.equal(require(path.join(testDir, "packages/package-3/package.json")).devDependencies["package-2"], "^1.0.1");
          assert.equal(require(path.join(testDir, "packages/package-4/package.json")).dependencies["package-1"], "^0.0.0");
          assert.equal(require(path.join(testDir, "packages/package-5/package.json")).dependencies["package-1"], "^1.0.1");

          done();
        } catch (ex) {
          done.fail(ex);
        }
      }));
    });
  });

  /** =========================================================================
   * INDEPENDENT - MESSAGE
   * ======================================================================= */

  describe("independent mode with --message", () => {
    let testDir;

    beforeEach(() => initFixture("PublishCommand/independent").then((dir) => {
      testDir = dir;
    }));

    it("should publish the changed packages in independent mode, committing with a custom msg", (done) => {
      const publishCommand = new PublishCommand([], {
        independent: true,
        message: "A custom publish message"
      });

      publishCommand.runValidations();
      publishCommand.runPreparations();

      assertStubbedCalls([
        [ChildProcessUtilities, "execSync", {}, [
          { args: ["git tag"] }
        ]],
        [PromptUtilities, "select", { valueCallback: true }, [
          { args: ["Select a new version for package-1 (currently 1.0.0)"], returns: "1.0.1" },
          { args: ["Select a new version for package-2 (currently 2.0.0)"], returns: "1.1.0" },
          { args: ["Select a new version for package-3 (currently 3.0.0)"], returns: "2.0.0" },
          { args: ["Select a new version for package-4 (currently 4.0.0)"], returns: "1.1.0" }
        ]],
        [PromptUtilities, "confirm", { valueCallback: true }, [
          { args: ["Are you sure you want to publish the above changes?"], returns: true }
        ]],
        [ChildProcessUtilities, "execSync", {}, [
          { args: ["git rev-parse --abbrev-ref HEAD"], returns: "master" },
          { args: ["git add " + escapeArgs(path.join(testDir, "packages/package-1/package.json"))] },
          { args: ["git add " + escapeArgs(path.join(testDir, "packages/package-2/package.json"))] },
          { args: ["git add " + escapeArgs(path.join(testDir, "packages/package-3/package.json"))] },
          { args: ["git add " + escapeArgs(path.join(testDir, "packages/package-4/package.json"))] },
          { args: ["git commit -m \"$(echo \"A custom publish message\")\""] },
          { args: ["git tag -a package-1@1.0.1 -m \"package-1@1.0.1\""] },
          { args: ["git tag -a package-2@1.1.0 -m \"package-2@1.1.0\""] },
          { args: ["git tag -a package-3@2.0.0 -m \"package-3@2.0.0\""] },
          { args: ["git tag -a package-4@1.1.0 -m \"package-4@1.1.0\""] }
        ]],
        [ChildProcessUtilities, "exec", { nodeCallback: true }, [
          { args: ["npm publish --tag lerna-temp"] },
          { args: ["npm publish --tag lerna-temp"] },
          { args: ["npm publish --tag lerna-temp"] },
          { args: ["npm publish --tag lerna-temp"] },
        ]],
        [ChildProcessUtilities, "execSync", {}, [
          { args: ["npm dist-tag ls package-1"], returns: "lerna-temp: 1.0.1" + EOL + "stable: 1.0.0" },
          { args: ["npm dist-tag rm package-1 lerna-temp"] },
          { args: ["npm dist-tag add package-1@1.0.1 latest"] },

          { args: ["npm dist-tag ls package-3"], returns: "lerna-temp: 2.0.0" + EOL + "stable: 1.0.0" },
          { args: ["npm dist-tag rm package-3 lerna-temp"] },
          { args: ["npm dist-tag add package-3@2.0.0 latest"] },

          { args: ["npm dist-tag ls package-4"], returns: "lerna-temp: 1.1.0" + EOL + "stable: 1.0.0" },
          { args: ["npm dist-tag rm package-4 lerna-temp"] },
          { args: ["npm dist-tag add package-4@1.1.0 latest"] },

          { args: ["npm dist-tag ls package-2"], returns: "lerna-temp: 1.1.0" + EOL + "stable: 1.0.0" },
          { args: ["npm dist-tag rm package-2 lerna-temp"] },
          { args: ["npm dist-tag add package-2@1.1.0 latest"] },

          { args: ["git rev-parse --abbrev-ref HEAD"], returns: "master" },
          { args: ["git push origin master"] },
          { args: ["git push origin package-1@1.0.1 package-2@1.1.0 package-3@2.0.0 package-4@1.1.0"] },
        ]]
      ]);

      publishCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done.fail(err);

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
        } catch (ex) {
          done.fail(ex);
        }
      }));
    });
  });

  /** =========================================================================
   * INDEPENDENT - CONVENTIONAL COMMITS
   * ======================================================================= */

  describe("independent mode with --conventional-commits", () => {
    let testDir;

    beforeEach(() => initFixture("PublishCommand/independent").then((dir) => {
      testDir = dir;
    }));

    it("should use conventional-commits utility to guess version bump and generate CHANGELOG", (done) => {
      const publishCommand = new PublishCommand([], {
        independent: true,
        message: "A custom publish message",
        conventionalCommits: true
      });

      publishCommand.runValidations();
      publishCommand.runPreparations();

      assertStubbedCalls([
        [ChildProcessUtilities, "execSync", {}, [
          { args: ["git tag"] }
        ]],
        [ConventionalCommitUtilities, "recommendVersion", {}, [
          { args: [{ name: "package-1", version: "1.0.0", location: path.join(testDir, "packages/package-1") }], returns: "1.0.1" },
          { args: [{ name: "package-2", version: "2.0.0", location: path.join(testDir, "packages/package-2") }], returns: "1.1.0" },
          { args: [{ name: "package-3", version: "3.0.0", location: path.join(testDir, "packages/package-3") }], returns: "2.0.0" },
          { args: [{ name: "package-4", version: "4.0.0", location: path.join(testDir, "packages/package-4") }], returns: "1.1.0" }
        ]],
        [PromptUtilities, "confirm", { valueCallback: true }, [
          { args: ["Are you sure you want to publish the above changes?"], returns: true }
        ]],
        [ChildProcessUtilities, "execSync", {}, [
          { args: ["git rev-parse --abbrev-ref HEAD"], returns: "master" },
        ]],
        [ConventionalCommitUtilities, "updateChangelog", {}, [
          { args: [{ name: "package-1", location: path.join(testDir, "packages/package-1") }] },
          { args: [{ name: "package-2", location: path.join(testDir, "packages/package-2") }] },
          { args: [{ name: "package-3", location: path.join(testDir, "packages/package-3") }] },
          { args: [{ name: "package-4", location: path.join(testDir, "packages/package-4") }] }
        ]],
        [ChildProcessUtilities, "execSync", {}, [
          { args: ["git add " + escapeArgs(path.join(testDir, "packages/package-1/CHANGELOG.md"))] },
          { args: ["git add " + escapeArgs(path.join(testDir, "packages/package-1/package.json"))] },
          { args: ["git add " + escapeArgs(path.join(testDir, "packages/package-2/CHANGELOG.md"))] },
          { args: ["git add " + escapeArgs(path.join(testDir, "packages/package-2/package.json"))] },
          { args: ["git add " + escapeArgs(path.join(testDir, "packages/package-3/CHANGELOG.md"))] },
          { args: ["git add " + escapeArgs(path.join(testDir, "packages/package-3/package.json"))] },
          { args: ["git add " + escapeArgs(path.join(testDir, "packages/package-4/CHANGELOG.md"))] },
          { args: ["git add " + escapeArgs(path.join(testDir, "packages/package-4/package.json"))] },
          { args: ["git commit -m \"$(echo \"A custom publish message\")\""] },
          { args: ["git tag -a package-1@1.0.1 -m \"package-1@1.0.1\""] },
          { args: ["git tag -a package-2@1.1.0 -m \"package-2@1.1.0\""] },
          { args: ["git tag -a package-3@2.0.0 -m \"package-3@2.0.0\""] },
          { args: ["git tag -a package-4@1.1.0 -m \"package-4@1.1.0\""] }
        ]],
        [ChildProcessUtilities, "exec", { nodeCallback: true }, [
          { args: ["npm publish --tag lerna-temp"] },
          { args: ["npm publish --tag lerna-temp"] },
          { args: ["npm publish --tag lerna-temp"] },
          { args: ["npm publish --tag lerna-temp"] },
        ]],
        [ChildProcessUtilities, "execSync", {}, [
          { args: ["npm dist-tag ls package-1"], returns: "lerna-temp: 1.0.1" + EOL + "stable: 1.0.0" },
          { args: ["npm dist-tag rm package-1 lerna-temp"] },
          { args: ["npm dist-tag add package-1@1.0.1 latest"] },

          { args: ["npm dist-tag ls package-3"], returns: "lerna-temp: 2.0.0" + EOL + "stable: 1.0.0" },
          { args: ["npm dist-tag rm package-3 lerna-temp"] },
          { args: ["npm dist-tag add package-3@2.0.0 latest"] },

          { args: ["npm dist-tag ls package-4"], returns: "lerna-temp: 1.1.0" + EOL + "stable: 1.0.0" },
          { args: ["npm dist-tag rm package-4 lerna-temp"] },
          { args: ["npm dist-tag add package-4@1.1.0 latest"] },

          { args: ["npm dist-tag ls package-2"], returns: "lerna-temp: 1.1.0" + EOL + "stable: 1.0.0" },
          { args: ["npm dist-tag rm package-2 lerna-temp"] },
          { args: ["npm dist-tag add package-2@1.1.0 latest"] },

          { args: ["git rev-parse --abbrev-ref HEAD"], returns: "master" },
          { args: ["git push origin master"] },
          { args: ["git push origin package-1@1.0.1 package-2@1.1.0 package-3@2.0.0 package-4@1.1.0"] },
        ]]
      ]);

      publishCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done.fail(err);

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
        } catch (ex) {
          done.fail(ex);
        }
      }));
    });
  });

  /** =========================================================================
   * INDEPENDENT - CANARY + NPMTAG + YES + EXACT
   * ======================================================================= */

  describe("independent mode --canary --npm-tag=next --yes --exact", () => {
    let testDir;

    beforeEach(() => initFixture("PublishCommand/independent").then((dir) => {
      testDir = dir;
    }));

    it("should publish the changed packages", (done) => {
      const publishCommand = new PublishCommand([], {
        independent: true,
        canary: true,
        npmTag: "next",
        yes: true,
        exact: true,
      });

      publishCommand.runValidations();
      publishCommand.runPreparations();

      assertStubbedCalls([
        [ChildProcessUtilities, "execSync", {}, [
          { args: ["git tag"] },

          { args: ["git rev-parse HEAD"], returns: "81e3b44339e1403fe3d762e9435b7c9a155fdef7" },
          { args: ["git rev-parse HEAD"], returns: "81e3b44339e1403fe3d762e9435b7c9a155fdef7" }
        ]],
        [ChildProcessUtilities, "exec", { nodeCallback: true }, [
          { args: ["npm publish --tag lerna-temp"] },
          { args: ["npm publish --tag lerna-temp"] },
          { args: ["npm publish --tag lerna-temp"] },
          { args: ["npm publish --tag lerna-temp"] },
        ]],
        [ChildProcessUtilities, "execSync", {}, [
          { args: ["git checkout -- packages/*/package.json"] },

          { args: ["npm dist-tag ls package-1"], returns: "lerna-temp: 1.0.0-alpha.81e3b443" + EOL + "latest: 1.0.0" },
          { args: ["npm dist-tag rm package-1 lerna-temp"] },
          { args: ["npm dist-tag add package-1@1.0.0-alpha.81e3b443 next"] },

          { args: ["npm dist-tag ls package-3"], returns: "lerna-temp: 3.0.0-alpha.81e3b443" + EOL + "latest: 1.0.0" },
          { args: ["npm dist-tag rm package-3 lerna-temp"] },
          { args: ["npm dist-tag add package-3@3.0.0-alpha.81e3b443 next"] },

          { args: ["npm dist-tag ls package-4"], returns: "lerna-temp: 4.0.0-alpha.81e3b443" + EOL + "latest: 1.0.0" },
          { args: ["npm dist-tag rm package-4 lerna-temp"] },
          { args: ["npm dist-tag add package-4@4.0.0-alpha.81e3b443 next"] },

          { args: ["npm dist-tag ls package-2"], returns: "lerna-temp: 2.0.0-alpha.81e3b443" + EOL + "latest: 1.0.0" },
          { args: ["npm dist-tag rm package-2 lerna-temp"] },
          { args: ["npm dist-tag add package-2@2.0.0-alpha.81e3b443 next"] },
        ]]
      ]);

      publishCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done.fail(err);

        try {
          assert.ok(!pathExists.sync(path.join(testDir, "lerna-debug.log")));

          // The following wouldn't be the actual results of a canary release
          // because `git checkout --` would have removed the file changes.
          // However, this is what would've been published to npm so it's
          // useful to test.
          assert.equal(require(path.join(testDir, "packages/package-1/package.json")).version, "1.0.0-alpha.81e3b443");
          assert.equal(require(path.join(testDir, "packages/package-2/package.json")).version, "2.0.0-alpha.81e3b443");
          assert.equal(require(path.join(testDir, "packages/package-3/package.json")).version, "3.0.0-alpha.81e3b443");
          assert.equal(require(path.join(testDir, "packages/package-4/package.json")).version, "4.0.0-alpha.81e3b443");

          assert.equal(require(path.join(testDir, "packages/package-2/package.json")).dependencies["package-1"], "1.0.0-alpha.81e3b443");
          assert.equal(require(path.join(testDir, "packages/package-3/package.json")).devDependencies["package-2"], "2.0.0-alpha.81e3b443");
          assert.equal(require(path.join(testDir, "packages/package-4/package.json")).dependencies["package-1"], "^0.0.0");

          done();
        } catch (ex) {
          done.fail(ex);
        }
      }));
    });
  });
});
