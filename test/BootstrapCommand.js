import pathExists from "path-exists";
import assert from "assert";
import path from "path";
import fs from "fs";
import normalize from "normalize-path";

import ChildProcessUtilities from "../src/ChildProcessUtilities";
import FileSystemUtilities from "../src/FileSystemUtilities";
import BootstrapCommand from "../src/commands/BootstrapCommand";
import exitWithCode from "./_exitWithCode";
import initFixture from "./_initFixture";
import stub from "./_stub";

import assertStubbedCalls from "./_assertStubbedCalls";

const STDIO_OPT = ["ignore", "pipe", "pipe"];

const resolveSymlink = (symlinkLocation) => {
  return path.resolve(path.dirname(symlinkLocation), fs.readlinkSync(symlinkLocation));
};

describe("BootstrapCommand", () => {

  describe("lifecycle scripts", () => {
    let testDir;

    beforeEach((done) => {
      testDir = initFixture("BootstrapCommand/lifecycle-scripts", done);
    });

    it("should run preinstall, postinstall and prepublish scripts", (done) => {
      const bootstrapCommand = new BootstrapCommand([], {});

      bootstrapCommand.runValidations();
      bootstrapCommand.runPreparations();

      bootstrapCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done(err);

        try {
          assert.ok(!pathExists.sync(path.join(testDir, "lerna-debug.log")), "lerna-debug.log should not exist");
          assert.ok(pathExists.sync(path.join(testDir, "packages", "package-preinstall", "did-preinstall")));
          assert.ok(pathExists.sync(path.join(testDir, "packages", "package-postinstall", "did-postinstall")));
          assert.ok(pathExists.sync(path.join(testDir, "packages", "package-prepublish", "did-prepublish")));
          done();
        } catch (err) {
          done(err);
        }
      }));
    });
  });

  describe("with hoisting", () => {
    let testDir;

    beforeEach((done) => {
      testDir = initFixture("BootstrapCommand/basic", done);
    });

    it("should hoist", (done) => {
      const bootstrapCommand = new BootstrapCommand([], {hoist: true});

      bootstrapCommand.runValidations();
      bootstrapCommand.runPreparations();

      const wantPackage = {
        [path.join(testDir, "package.json")]: {
          dependencies: { "foo": "^1.0.0", "@test/package-1": "^0.0.0" }
        },
        [path.join(testDir, "packages" ,"package-3", "package.json")]: {
          dependencies: { "foo": "0.1.12" }
        },
      };
      const gotPackage = {};
      stub(FileSystemUtilities, "writeFile", (fn, json, callback) => {
        gotPackage[fn] = JSON.parse(json);
        callback();
      });

      stub(ChildProcessUtilities, "spawn", (command, args, options, callback) => {
        callback();
      });

      const wantRimraf = {
        [path.join(testDir, "packages" ,"package-1", "node_modules", "foo")]: true,
        [path.join(testDir, "packages" ,"package-2", "node_modules", "foo")]: true,
        [path.join(testDir, "packages" ,"package-4", "node_modules", "@test", "package-1")]: true,
      };
      const gotRimraf = {};
      stub(FileSystemUtilities, "rimraf", (path, callback) => {
        gotRimraf[path] = true;
        callback();
      });

      assertStubbedCalls([
        [FileSystemUtilities, "rename", { nodeCallback: true }, [
          { args: [
            path.join(testDir, "package.json"),
            path.join(testDir, "package.json.lerna_backup"),
          ] }
        ]],
        [FileSystemUtilities, "renameSync", { }, [
          { args: [
            path.join(testDir, "package.json.lerna_backup"),
            path.join(testDir, "package.json"),
          ] }
        ]],
        [FileSystemUtilities, "rename", { nodeCallback: true }, [
          { args: [
            path.join(testDir, "packages" ,"package-3", "package.json"),
            path.join(testDir, "packages" ,"package-3", "package.json.lerna_backup"),
          ] }
        ]],
        [FileSystemUtilities, "renameSync", { }, [
          { args: [
            path.join(testDir, "packages" ,"package-3", "package.json.lerna_backup"),
            path.join(testDir, "packages" ,"package-3", "package.json"),
          ] }
        ]],
      ]);

      bootstrapCommand.runCommand(exitWithCode(0, (err) => {
        assert.deepEqual(gotPackage, wantPackage, "Installed the right deps");
        assert.deepEqual(gotRimraf, wantRimraf, "Removed the right stuff");
        done(err);
      }));
    });

    it("should not hoist when disallowed", (done) => {
      const bootstrapCommand = new BootstrapCommand([], {hoist: true, nohoist: "@test/package-1"});

      bootstrapCommand.runValidations();
      bootstrapCommand.runPreparations();

      const wantPackage = {
        [path.join(testDir, "package.json")]: {
          dependencies: { "foo": "^1.0.0" }
        },
        [path.join(testDir, "packages" ,"package-3", "package.json")]: {
          dependencies: { "foo": "0.1.12" }
        },
        [path.join(testDir, "packages" ,"package-4", "package.json")]: {
          dependencies: { "@test/package-1": "^0.0.0" }
        },
      };
      const gotPackage = {};
      stub(FileSystemUtilities, "writeFile", (fn, json, callback) => {
        gotPackage[fn] = JSON.parse(json);
        callback();
      });

      const wantRimraf = {
        [path.join(testDir, "packages" ,"package-1", "node_modules", "foo")]: true,
        [path.join(testDir, "packages" ,"package-2", "node_modules", "foo")]: true,
      };
      const gotRimraf = {};
      stub(FileSystemUtilities, "rimraf", (path, callback) => {
        gotRimraf[path] = true;
        callback();
      });

      assertStubbedCalls([
        [ChildProcessUtilities, "spawn", { nodeCallback: true }, [
          { args: ["npm", ["install"], { cwd: testDir, stdio: STDIO_OPT }] }
        ]],
        [ChildProcessUtilities, "spawn", { nodeCallback: true }, [
          { args: ["npm", ["install"], { cwd: path.join(testDir, "packages" ,"package-3"), stdio: STDIO_OPT }] }
        ]],
        [ChildProcessUtilities, "spawn", { nodeCallback: true }, [
          { args: ["npm", ["install"], { cwd: path.join(testDir, "packages", "package-4"), stdio: STDIO_OPT }] }
        ]],
      ]);

      bootstrapCommand.runCommand(exitWithCode(0, (err) => {
        assert.deepEqual(gotPackage, wantPackage, "Installed the right deps");
        assert.deepEqual(gotRimraf, wantRimraf, "Removed the right stuff");
        done(err);
      }));
    });
  });


  describe("dependencies between packages in the repo", () => {
    let testDir;

    beforeEach((done) => {
      testDir = initFixture("BootstrapCommand/basic", done);
    });

    it("should bootstrap packages", (done) => {
      const bootstrapCommand = new BootstrapCommand([], {});

      bootstrapCommand.runValidations();
      bootstrapCommand.runPreparations();

      stub(ChildProcessUtilities, "spawn", (command, args, options, callback) => {
        callback();
      });

      bootstrapCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done(err);

        try {
          assert.ok(!pathExists.sync(path.join(testDir, "lerna-debug.log")), "lerna-debug.log should not exist");
          // package-1 should not have any packages symlinked
          assert.throws(() => fs.readlinkSync(path.join(testDir, "packages", "package-1", "node_modules", "package-2")));
          assert.throws(() => fs.readlinkSync(path.join(testDir, "packages", "package-1", "node_modules", "package-3")));
          assert.throws(() => fs.readlinkSync(path.join(testDir, "packages", "package-1", "node_modules", "package-4")));
          // package-2 package dependencies are symlinked
          assert.equal(
            normalize(resolveSymlink(path.join(testDir, "packages", "package-2", "node_modules", "@test", "package-1"))),
            normalize(path.join(testDir, "packages", "package-1")),
            "package-1 should be symlinked to package-2"
          );
          assert.throws(() => fs.readlinkSync(path.join(testDir, "packages", "package-2", "node_modules", "package-3")));
          assert.throws(() => fs.readlinkSync(path.join(testDir, "packages", "package-2", "node_modules", "package-4")));
          // package-3 package dependencies are symlinked
          assert.equal(
            normalize(resolveSymlink(path.join(testDir, "packages", "package-3", "node_modules", "@test", "package-1"))),
            normalize(path.join(testDir, "packages", "package-1")),
            "package-1 should be symlinked to package-3"
          );
          assert.equal(
            normalize(resolveSymlink(path.join(testDir, "packages", "package-3", "node_modules", "package-2"))),
            normalize(path.join(testDir, "packages", "package-2")),
            "package-2 should be symlinked to package-3"
          );
          assert.throws(() => fs.readlinkSync(path.join(testDir, "packages", "package-3", "node_modules", "package-4")));
          // package-4 package dependencies are symlinked
          assert.throws(() => fs.readlinkSync(path.join(testDir, "packages", "package-4", "node_modules", "package-1")));
          assert.throws(() => fs.readlinkSync(path.join(testDir, "packages", "package-4", "node_modules", "package-2")));
          assert.equal(
            normalize(resolveSymlink(path.join(testDir, "packages", "package-4", "node_modules", "package-3"))),
            normalize(path.join(testDir, "packages", "package-3")),
            "package-3 should be symlinked to package-4"
          );
          // package binaries are symlinked
          assert.equal(
            normalize(FileSystemUtilities.isSymlink(path.join(testDir, "packages", "package-3", "node_modules", ".bin", "package-2"))),
            normalize(path.join(testDir, "packages", "package-2", "cli.js")),
            "package-2 binary should be symlinked in package-3"
          );
          assert.equal(
            normalize(FileSystemUtilities.isSymlink(path.join(testDir, "packages", "package-4", "node_modules", ".bin", "package3cli1"))),
            normalize(path.join(testDir, "packages", "package-3", "cli1.js")),
            "package-3 binary should be symlinked in package-4"
          );
          assert.equal(
            normalize(FileSystemUtilities.isSymlink(path.join(testDir, "packages", "package-4", "node_modules", ".bin", "package3cli2"))),
            normalize(path.join(testDir, "packages", "package-3", "cli2.js")),
            "package-3 binary should be symlinked in package-4"
          );
          done();
        } catch (err) {
          done(err);
        }
      }));
    });

    it("should not bootstrap ignored packages", (done) => {
      const bootstrapCommand = new BootstrapCommand([], {
        ignore: "package-@(3|4)"
      });

      bootstrapCommand.runValidations();
      bootstrapCommand.runPreparations();

      const installed = [0,0,0];
      stub(ChildProcessUtilities, "spawn", (command, args, options, callback) => {
        installed[+options.cwd.match(/package-(\d)$/)[1]]++;
        callback();
      });

      assertStubbedCalls([
        [ChildProcessUtilities, "spawn", { nodeCallback: true }, [
          { args: ["npm", ["install"], { cwd: path.join(testDir, "packages", "package-1"), stdio: STDIO_OPT }] }
        ]],
        [ChildProcessUtilities, "spawn", { nodeCallback: true }, [
          { args: ["npm", ["install"], { cwd: path.join(testDir, "packages", "package-2"), stdio: STDIO_OPT }] }
        ]]
      ]);

      bootstrapCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done(err);

        try {
          assert.ok(!pathExists.sync(path.join(testDir, "lerna-debug.log")), "lerna-debug.log should not exist");
          assert.deepEqual(installed, [0,1,1], "Did all our installs");

          done();
        } catch (err) {
          done(err);
        }
      }));
    });

    it("should only bootstrap scoped packages", (done) => {
      const bootstrapCommand = new BootstrapCommand([], {
        scope: "package-@(3|4)"
      });

      bootstrapCommand.runValidations();
      bootstrapCommand.runPreparations();

      const installed = [0,0,0,0,0];
      stub(ChildProcessUtilities, "spawn", (command, args, options, callback) => {
        installed[+options.cwd.match(/package-(\d)$/)[1]]++;
        callback();
      });

      assertStubbedCalls([
        [ChildProcessUtilities, "spawn", { nodeCallback: true }, [
          { args: ["npm", ["install"], { cwd: path.join(testDir, "packages" ,"package-3"), stdio: STDIO_OPT }] }
        ]],
        [ChildProcessUtilities, "spawn", { nodeCallback: true }, [
          { args: ["npm", ["install"], { cwd: path.join(testDir, "packages", "package-4"), stdio: STDIO_OPT }] }
        ]]
      ]);

      bootstrapCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done(err);

        try {
          assert.ok(!pathExists.sync(path.join(testDir, "asini-debug.log")), "asini-debug.log should not exist");
          assert.deepEqual(installed, [0,0,0,1,1], "Did all our installs");

          // package-3 package dependencies are symlinked
          assert.equal(
            normalize(resolveSymlink(path.join(testDir, "packages", "package-3", "node_modules", "@test", "package-1"))),
            normalize(path.join(testDir, "packages", "package-1")),
            "package-1 should be symlinked to package-3"
          );
          assert.equal(
            normalize(resolveSymlink(path.join(testDir, "packages", "package-3", "node_modules", "package-2"))),
            normalize(path.join(testDir, "packages", "package-2")),
            "package-2 should be symlinked to package-3"
          );
          assert.throws(() => fs.readlinkSync(path.join(testDir, "packages", "package-3", "node_modules", "package-4")));
          // package-4 package dependencies are symlinked
          assert.throws(() => fs.readlinkSync(path.join(testDir, "packages", "package-4", "node_modules", "package-1")));
          assert.throws(() => fs.readlinkSync(path.join(testDir, "packages", "package-4", "node_modules", "package-2")));
          assert.equal(
            normalize(resolveSymlink(path.join(testDir, "packages", "package-4", "node_modules", "package-3"))),
            normalize(path.join(testDir, "packages", "package-3")),
            "package-3 should be symlinked to package-4"
          );
          // package binaries are symlinked
          assert.equal(
            normalize(FileSystemUtilities.isSymlink(path.join(testDir, "packages", "package-3", "node_modules", ".bin", "package-2"))),
            normalize(path.join(testDir, "packages", "package-2", "cli.js")),
            "package-2 binary should be symlinked in package-3"
          );
          assert.equal(
            normalize(FileSystemUtilities.isSymlink(path.join(testDir, "packages", "package-4", "node_modules", ".bin", "package3cli1"))),
            normalize(path.join(testDir, "packages", "package-3", "cli1.js")),
            "package-3 binary should be symlinked in package-4"
          );
          assert.equal(
            normalize(FileSystemUtilities.isSymlink(path.join(testDir, "packages", "package-4", "node_modules", ".bin", "package3cli2"))),
            normalize(path.join(testDir, "packages", "package-3", "cli2.js")),
            "package-3 binary should be symlinked in package-4"
          );
          done();
        } catch (err) {
          done(err);
        }
      }));
    });
  });

  describe("a repo with packages outside of packages/", () => {
    let testDir;

    beforeEach((done) => {
      testDir = initFixture("BootstrapCommand/extra", done);
    });

    it("should bootstrap packages", (done) => {
      const bootstrapCommand = new BootstrapCommand([], {});

      bootstrapCommand.runValidations();
      bootstrapCommand.runPreparations();

      const want = {
        [path.join(testDir, "packages", "package-1")]: true,
        [path.join(testDir, "packages", "package-2")]: true,
        [path.join(testDir,             "package-3")]: true,
        [path.join(testDir, "packages", "package-4")]: true,
      };
      const got = {};
      stub(ChildProcessUtilities, "spawn", (command, args, options, callback) => {
        got[options.cwd] = true;
        callback();
      });

      assertStubbedCalls([
        [ChildProcessUtilities, "spawn", { nodeCallback: true }, [
          { args: ["npm", ["install", "foo@^1.0.0"], { cwd: path.join(testDir, "packages", "package-1"), stdio: STDIO_OPT }] }
        ]],
        [ChildProcessUtilities, "spawn", { nodeCallback: true }, [
          { args: ["npm", ["install", "foo@^1.0.0"], { cwd: path.join(testDir, "packages", "package-2"), stdio: STDIO_OPT }] }
        ]],
        [ChildProcessUtilities, "spawn", { nodeCallback: true }, [
          { args: ["npm", ["install", "foo@0.1.12"], { cwd: path.join(testDir, "package-3"), stdio: STDIO_OPT }] }
        ]],
        [ChildProcessUtilities, "spawn", { nodeCallback: true }, [
          { args: ["npm", ["install", "@test/package-1@^0.0.0"], { cwd: path.join(testDir, "packages", "package-4"), stdio: STDIO_OPT }] }
        ]],
      ]);

      bootstrapCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done(err);

        try {
          assert.ok(!pathExists.sync(path.join(testDir, "lerna-debug.log")), "lerna-debug.log should not exist");

          assert.deepEqual(want, got, "Installed everywhere");

          // Make sure the `prepublish` script got run (index.js got created).
          assert.ok(pathExists.sync(path.join(testDir, "packages", "package-1", "index.js")));
          // package-1 should not have any packages symlinked
          assert.throws(() => fs.readlinkSync(path.join(testDir, "packages", "package-1", "node_modules", "package-2")));
          assert.throws(() => fs.readlinkSync(path.join(testDir, "packages", "package-1", "node_modules", "package-3")));
          assert.throws(() => fs.readlinkSync(path.join(testDir, "packages", "package-1", "node_modules", "package-4")));
          // package-2 package dependencies are symlinked
          assert.equal(
            path.resolve(resolveSymlink(path.join(testDir, "packages", "package-2", "node_modules", "@test", "package-1"))),
            path.resolve(path.join(testDir, "packages", "package-1")),
            "package-1 should be symlinked to package-2"
          );
          assert.throws(() => fs.readlinkSync(path.join(testDir, "packages", "package-2", "node_modules", "package-3")));
          assert.throws(() => fs.readlinkSync(path.join(testDir, "packages", "package-2", "node_modules", "package-4")));
          // package-3 package dependencies are symlinked
          assert.equal(
            normalize(resolveSymlink(path.join(testDir, "package-3", "node_modules", "@test", "package-1"))),
            normalize(path.join(testDir, "packages", "package-1")),
            "package-1 should be symlinked to package-3"
          );
          assert.equal(
            normalize(resolveSymlink(path.join(testDir, "package-3", "node_modules", "package-2"))),
            normalize(path.join(testDir, "packages", "package-2")),
            "package-2 should be symlinked to package-3"
          );
          assert.throws(() => fs.readlinkSync(path.join(testDir, "package-3", "node_modules", "package-4")));
          // package-4 package dependencies are symlinked
          assert.throws(() => fs.readlinkSync(path.join(testDir, "packages", "package-4", "node_modules", "package-1")));
          assert.throws(() => fs.readlinkSync(path.join(testDir, "packages", "package-4", "node_modules", "package-2")));
          assert.equal(
            normalize(resolveSymlink(path.join(testDir, "packages", "package-4", "node_modules", "package-3"))),
            normalize(path.join(testDir, "package-3")),
            "package-3 should be symlinked to package-4"
          );
          // package binaries are symlinked
          assert.equal(
            normalize(FileSystemUtilities.isSymlink(path.join(testDir, "package-3", "node_modules", ".bin", "package-2"))),
            normalize(path.join(testDir, "packages", "package-2", "cli.js")),
            "package-2 binary should be symlinked in package-3"
          );
          assert.equal(
            normalize(FileSystemUtilities.isSymlink(path.join(testDir, "packages", "package-4", "node_modules", ".bin", "package3cli1"))),
            normalize(path.join(testDir, "package-3", "cli1.js")),
            "package-3 binary should be symlinked in package-4"
          );
          assert.equal(
            normalize(FileSystemUtilities.isSymlink(path.join(testDir, "packages", "package-4", "node_modules", ".bin", "package3cli2"))),
            normalize(path.join(testDir, "package-3", "cli2.js")),
            "package-3 binary should be symlinked in package-4"
          );
          done();
        } catch (err) {
          done(err);
        }
      }));
    });

    it("should not bootstrap ignored packages", (done) => {
      const bootstrapCommand = new BootstrapCommand([], {
        ignore: "package-@(3|4)"
      });

      bootstrapCommand.runValidations();
      bootstrapCommand.runPreparations();

      const installed = [0,0,0];
      stub(ChildProcessUtilities, "spawn", (command, args, options, callback) => {
        installed[+options.cwd.match(/package-(\d)$/)[1]]++;
        callback();
      });

      bootstrapCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done(err);

        try {
          assert.ok(!pathExists.sync(path.join(testDir, "lerna-debug.log")), "lerna-debug.log should not exist");

          done();
        } catch (err) {
          done(err);
        }
      }));
    });

    it("should bootstrap any dependencies not included by --scope when --include-filtered-dependencies is true", (done) => {
      // we scope to package-2 only but should still install package-1 as it is a dependency of package-2
      const bootstrapCommand = new BootstrapCommand([], {
        scope: "package-2",
        includeFilteredDependencies: true
      });

      bootstrapCommand.runValidations();
      bootstrapCommand.runPreparations();

      const installed = [0,0,0];
      stub(ChildProcessUtilities, "spawn", (command, args, options, callback) => {
        installed[+options.cwd.match(/package-(\d)$/)[1]]++;
        callback();
      });

      bootstrapCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done(err);

        try {
          assert.ok(!pathExists.sync(path.join(testDir, "lerna-debug.log")), "lerna-debug.log should not exist");

          assert.deepEqual(installed, [0,1,1], "Did all our installs");

          // Make sure the `prepublish` script got run (index.js got created)
          assert.ok(pathExists.sync(path.join(testDir, "packages", "package-1", "index.js")));

          done();
        } catch (err) {
          done(err);
        }
      }));
    });

    it("should bootstrap any dependencies exluded by --ignore when --include-filtered-dependencies is true", (done) => {
      // we ignore package 1 but it should still be installed because it is a dependency of package-2
      const bootstrapCommand = new BootstrapCommand([], {
        ignore: "{@test/package-1,package-@(3|4)}",
        includeFilteredDependencies: true
      });

      bootstrapCommand.runValidations();
      bootstrapCommand.runPreparations();

      const installed = [0,0,0];
      stub(ChildProcessUtilities, "spawn", (command, args, options, callback) => {
        installed[+options.cwd.match(/package-(\d)$/)[1]]++;
        callback();
      });

      bootstrapCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done(err);

        try {
          assert.ok(!pathExists.sync(path.join(testDir, "lerna-debug.log")), "lerna-debug.log should not exist");

          // Make sure the `prepublish` script got run (index.js got created), even though we --ignored package-1
          assert.ok(pathExists.sync(path.join(testDir, "packages", "package-1", "index.js")));

          assert.deepEqual(installed, [0,1,1], "Did all our installs");

          done();
        } catch (err) {
          done(err);
        }
      }));
    });
  });

  describe("external dependencies that haven't been installed", () => {
    let testDir;

    beforeEach((done) => {
      testDir = initFixture("BootstrapCommand/cold", done);
    });

    it("should get installed", (done) => {
      const bootstrapCommand = new BootstrapCommand([], {});

      bootstrapCommand.runValidations();
      bootstrapCommand.runPreparations();

      let installed = 0;
      let spawnArgs = [];
      let spawnOptions = [];
      const writeFns = [];
      const writeJsons = [];

      stub(FileSystemUtilities, "writeFile", (fn, json, callback) => {
        writeFns.push(fn);
        writeJsons.push(JSON.parse(json));
        callback();
      });

      stub(ChildProcessUtilities, "spawn", (command, args, options, callback) => {
        spawnArgs.push(args);
        spawnOptions.push(options);
        installed++;
        callback();
      });

      bootstrapCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done(err);

        try {
          assert.ok(!pathExists.sync(path.join(testDir, "lerna-debug.log")), "lerna-debug.log should not exist");
          assert.deepEqual(spawnArgs, [ ["install"], ["install"] ]);
          assert.deepEqual(spawnOptions, [
            { cwd: path.join(testDir, "packages", "package-1"), stdio: STDIO_OPT },
            { cwd: path.join(testDir, "packages", "package-2"), stdio: STDIO_OPT }
          ]);
          assert.deepEqual(writeFns, [
            path.join(testDir, "packages", "package-1", "package.json"),
            path.join(testDir, "packages", "package-2", "package.json"),
          ]);
          assert.deepEqual(writeJsons, [
            { dependencies: {external: "^1.0.0"}},
            { dependencies: {external: "^2.0.0"}},
          ]);

          assert.equal(installed, 2, "The external dependencies were installed");

          done();
        } catch (err) {
          done(err);
        }
      }));
    });
  });

  describe("external dependencies that have already been installed", () => {
    let testDir;

    beforeEach((done) => {
      testDir = initFixture("BootstrapCommand/warm", done);
    });

    it("should not get re-installed", (done) => {
      const bootstrapCommand = new BootstrapCommand([], {});

      bootstrapCommand.runValidations();
      bootstrapCommand.runPreparations();

      let installed = false;
      stub(ChildProcessUtilities, "spawn", (command, args, options, callback) => {
        installed = true;
        callback();
      });

      bootstrapCommand.runCommand(exitWithCode(0, (err) => {
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

  describe("peer dependencies in packages in the repo", () => {
    let testDir;

    beforeEach((done) => {
      testDir = initFixture("BootstrapCommand/peer", done);
    });

    it("should not bootstrap ignored peer dependencies", (done) => {
      const bootstrapCommand = new BootstrapCommand([], {
        "ignore-peer-deps": true
      });

      bootstrapCommand.runValidations();
      bootstrapCommand.runPreparations();

      let installed = false;
      stub(ChildProcessUtilities, "spawn", (command, args, options, callback) => {
        // This should never be reached
        assert.deepEqual(args, ["install", "external@^1.0.0"]);
        assert.deepEqual(options, { cwd: path.join(testDir, "packages/package-1"), stdio: STDIO_OPT });
        installed = true;
        callback();
      });

      bootstrapCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done(err);

        try {
          assert.ok(!pathExists.sync(path.join(testDir, "lerna-debug.log")), "lerna-debug.log should not exist");
          assert.ok(!pathExists.sync(path.join(testDir, "packages/package-1/node_modules/package-2")), "The linkable peer dependency should not be installed");
          assert.ok(!installed, "The external peer dependency should not be installed");
          done();
        } catch (err) {
          done(err);
        }
      }));
    });
  });

  describe("zero packages", () => {
    beforeEach((done) => {
      initFixture("BootstrapCommand/zero-pkgs", done);
    });

    it("should succeed in repositories with zero packages", (done) => {
      const bootstrapCommand = new BootstrapCommand([], {});

      bootstrapCommand.runValidations();
      bootstrapCommand.runPreparations();

      bootstrapCommand.runCommand(exitWithCode(0, (err) => {
        assert.equal(undefined, err);
        done();
      }));
    });
  });

  describe("registries", () => {
    let testDir;

    beforeEach((done) => {
      testDir = initFixture("BootstrapCommand/registries", done);
    });

    it("should use config property", (done) => {
      const bootstrapCommand = new BootstrapCommand([], {});

      bootstrapCommand.runValidations();
      bootstrapCommand.runPreparations();

      assertStubbedCalls([
        [ChildProcessUtilities, "spawn", { nodeCallback: true }, [
          { args: ["npm", ["install"], { cwd: path.join(testDir, "packages", "package-1"), stdio: STDIO_OPT, env: { npm_config_registry: "https://my-secure-registry/npm" } }] }
        ]]
      ]);

      bootstrapCommand.runCommand(exitWithCode(0, done));
    });
  });
});
