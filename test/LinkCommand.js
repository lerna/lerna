import assert from "assert";

import LinkCommand from "../src/commands/LinkCommand";
import LinkUtilities from "../src/LinkUtilities";
import exitWithCode from "./_exitWithCode";
import initFixture from "./_initFixture";
import stub from "./_stub";

describe("LinkCommand", () => {

  let packagesArg;
  let packageGraphArg;

  beforeEach((done) => {
    let calledSymlinkPackages = false;
    packagesArg = null;
    packageGraphArg = null;
    stub(LinkUtilities, "symlinkPackages", (packages, packageGraph, callback) => {
      if (calledSymlinkPackages) {
        throw new Error("already called symlinkPackages!");
      }
      packagesArg = packages;
      packageGraphArg = packageGraph;
      calledSymlinkPackages = true;

      callback();
    });


    initFixture("LinkCommand/basic", done);
  });

  it("should call LinkUtilities#symlinkPackages with filteredPackages", (done) => {
    const linkCommand = new LinkCommand([], {});

    linkCommand.runValidations();
    linkCommand.runPreparations();

    linkCommand.runCommand(exitWithCode(0, (err) => {
      if (err) return done(err);

      try {
        assert.strictEqual(packagesArg, linkCommand.filteredPackages);
        assert.strictEqual(packageGraphArg, linkCommand.packageGraph);
        done();
      } catch (err) {
        done(err);
      }
    }));
  });
});
