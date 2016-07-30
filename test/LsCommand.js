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
      assert.equal(message, "- package-1\n- package-2\n- package-3\n- package-4");
    });

    lsCommand.runCommand(exitWithCode(0, done));
  });
});
