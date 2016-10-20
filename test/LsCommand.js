import assert from "assert";

import exitWithCode from "./_exitWithCode";
import initFixture from "./_initFixture";
import LsCommand from "../src/commands/LsCommand";
import logger from "../src/logger";
import stub from "./_stub";

describe("LsCommand", () => {
  beforeEach((done) => {
    initFixture("LsCommand/basic", done);
  });

  it("should list changes", (done) => {
    const lsCommand = new LsCommand([], {});

    lsCommand.runValidations();
    lsCommand.runPreparations();

    stub(logger, "info", (message) => {
      assert.equal(message, "package-1\npackage-2\npackage-3\npackage-4");
    });

    lsCommand.runCommand(exitWithCode(0, done));
  });

  it("should list local packages in package-1's dependency tree", (done) => {
    const lsCommand = new LsCommand(["package-1"], {});

    lsCommand.runValidations();
    lsCommand.runPreparations();

    stub(logger, "info", (message) => {
      assert.equal(message, "package-1");
    });

    lsCommand.runCommand(exitWithCode(0, done));
  });

  it("should list local packages in package-3's dependency tree", (done) => {
    const lsCommand = new LsCommand(["package-3"], {});

    lsCommand.runValidations();
    lsCommand.runPreparations();

    stub(logger, "info", (message) => {
      assert.equal(message, "package-1\npackage-2\npackage-3");
    });

    lsCommand.runCommand(exitWithCode(0, done));
  });

  it("should list local packages in package-4's dependency tree", (done) => {
    const lsCommand = new LsCommand(["package-4"], {});

    lsCommand.runValidations();
    lsCommand.runPreparations();

    stub(logger, "info", (message) => {
      assert.equal(message, "package-1\npackage-4");
    });

    lsCommand.runCommand(exitWithCode(0, done));
  });
});
