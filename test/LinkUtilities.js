import pathExists from "path-exists";
import assert from "assert";
import path from "path";
import fs from "fs";
import normalize from "normalize-path";

import ChildProcessUtilities from "../src/ChildProcessUtilities";
import FileSystemUtilities from "../src/FileSystemUtilities";
import LinkUtilities from "../src/LinkUtilities";
import PackageUtilities from "../src/PackageUtilities";
import Repository from "../src/Repository";
import initFixture from "./_initFixture";
import stub from "./_stub";

describe("LinkUtilities", () => {

  function stubChildProcessUtilities() {
    let didShellOut = false;

    stub(ChildProcessUtilities, "spawn", () => {
      didShellOut = true;
    });

    stub(ChildProcessUtilities, "exec", () => {
      didShellOut = true;
    });

    stub(ChildProcessUtilities, "execSync", () => {
      didShellOut = true;
    });

    return () => didShellOut;
  }

  let testDir;

  describe(".symlinkPackages()", () => {

    beforeEach((done) => {
      testDir = initFixture("LinkUtilities/basic", done);
    });

    it("should link packages", (done) => {
      const packages = PackageUtilities.getPackages(new Repository());
      const packageGraph = PackageUtilities.getPackageGraph(packages);
      const getDidShellOut = stubChildProcessUtilities();

      LinkUtilities.symlinkPackages(packages, packageGraph, (err) => {
        if (err) return done(err);
        if (getDidShellOut()) return done(new Error("should not have shelled out to any other processes"));

        try {
          assert.ok(!pathExists.sync(path.join(testDir, "lerna-debug.log")), "lerna-debug.log should not exist");
          // package-1 should not have any packages symlinked
          assert.throws(() => fs.readlinkSync(path.join(testDir, "packages", "package-1", "node_modules", "package-2")));
          assert.throws(() => fs.readlinkSync(path.join(testDir, "packages", "package-1", "node_modules", "package-3")));
          assert.throws(() => fs.readlinkSync(path.join(testDir, "packages", "package-1", "node_modules", "package-4")));
          // package-2 package dependencies are symlinked
          assert.equal(
            normalize(fs.readlinkSync(path.join(testDir, "packages", "package-2", "node_modules", "@test", "package-1"))),
            normalize(path.join(testDir, "packages", "package-1")),
            "package-1 should be symlinked to package-2"
          );
          assert.throws(() => fs.readlinkSync(path.join(testDir, "packages", "package-2", "node_modules", "package-3")));
          assert.throws(() => fs.readlinkSync(path.join(testDir, "packages", "package-2", "node_modules", "package-4")));
          // package-3 package dependencies are symlinked
          assert.equal(
            normalize(fs.readlinkSync(path.join(testDir, "packages", "package-3", "node_modules", "@test", "package-1"))),
            normalize(path.join(testDir, "packages", "package-1")),
            "package-1 should be symlinked to package-3"
          );
          assert.equal(
            normalize(fs.readlinkSync(path.join(testDir, "packages", "package-3", "node_modules", "package-2"))),
            normalize(path.join(testDir, "packages", "package-2")),
            "package-2 should be symlinked to package-3"
          );
          assert.throws(() => fs.readlinkSync(path.join(testDir, "packages", "package-3", "node_modules", "package-4")));
          // package-4 package dependencies are symlinked
          assert.throws(() => fs.readlinkSync(path.join(testDir, "packages", "package-4", "node_modules", "package-1")));
          assert.throws(() => fs.readlinkSync(path.join(testDir, "packages", "package-4", "node_modules", "package-2")));
          assert.equal(
            normalize(fs.readlinkSync(path.join(testDir, "packages", "package-4", "node_modules", "package-3"))),
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
      });
    });
  });
});
