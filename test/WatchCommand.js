import pathExists from "path-exists";
import assert from "assert";
import path from "path";

import WatchCommand from "../src/commands/WatchCommand";
import exitWithCode from "./_exitWithCode";
import initFixture from "./_initFixture";
import stub from "./_stub";

describe.only("WatchCommand", () => {

  describe("initialization", () => {
    let testDir;

    beforeEach((done) => {
      testDir = initFixture("WatchCommand/basic", done);
    });

    it("should error when 1 argument is missing", (done) => {
      const watchCommand = new WatchCommand(["*.js"], {});

      watchCommand.runValidations();
      watchCommand.runPreparations();

      watchCommand.initialize((err) => {
        assert.equal(err.message, "You must specify a glob of files to watch and NPM script to run.");
        done();
      });
    });

    it("should error when no arguments are specified", (done) => {
      const watchCommand = new WatchCommand([], {});

      watchCommand.runValidations();
      watchCommand.runPreparations();

      watchCommand.initialize((err) => {
        assert.equal(err.message, "You must specify a glob of files to watch and NPM script to run.");
        done();
      });
    });

    it("should not watch ignored packages", (done) => {
      const watchCommand = new WatchCommand(["*.js", "prepublish"], {
        ignore: "package-2"
      });

      watchCommand.runValidations();
      watchCommand.runPreparations();

      // don't run the watcher
      stub(watchCommand, "execute", (callback) => callback(null, true));

      watchCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done(err);

        try {
          assert.ok(!pathExists.sync(path.join(testDir, "lerna-debug.log")), "lerna-debug.log should not exist");
          assert.deepEqual(watchCommand.packagesToWatch.map((pkg) => pkg.name), ["package-1", "package-3"]);
          done();
        } catch (err) {
          done(err);
        }
      }));
    });

    it("should only watch scoped packages", (done) => {
      const watchCommand = new WatchCommand(["*.js", "prepublish"], {
        scope: "package-2"
      });

      watchCommand.runValidations();
      watchCommand.runPreparations();

      // don't run the watcher
      stub(watchCommand, "execute", (callback) => callback(null, true));

      watchCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done(err);

        try {
          assert.ok(!pathExists.sync(path.join(testDir, "lerna-debug.log")), "lerna-debug.log should not exist");
          assert.deepEqual(watchCommand.packagesToWatch.map((pkg) => pkg.name), ["package-2"]);
          done();
        } catch (err) {
          done(err);
        }
      }));
    });

    it("should exclude packages without the specified script", (done) => {
      const watchCommand = new WatchCommand(["*.js", "hello"], {});

      watchCommand.runValidations();
      watchCommand.runPreparations();

      // don't run the watcher
      stub(watchCommand, "execute", (callback) => callback(null, true));

      watchCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done(err);

        try {
          assert.ok(!pathExists.sync(path.join(testDir, "lerna-debug.log")), "lerna-debug.log should not exist");
          assert.deepEqual(watchCommand.packagesToWatch.map((pkg) => pkg.name), ["package-2"]);
          done();
        } catch (err) {
          done(err);
        }
      }));
    });

    it("should error when no packages are matched", (done) => {
      const watchCommand = new WatchCommand(["*.js", "foo"], {});

      watchCommand.runValidations();
      watchCommand.runPreparations();

      watchCommand.initialize((err) => {
        assert.equal(err.message, "No packages found with the npm script 'foo'");
        done();
      });
    });
  });

});
