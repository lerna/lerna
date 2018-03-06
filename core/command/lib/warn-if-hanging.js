"use strict";

const log = require("npmlog");
const ChildProcessUtilities = require("@lerna/child-process");

module.exports = warnIfHanging;

function warnIfHanging() {
  const childProcessCount = ChildProcessUtilities.getChildProcessCount();

  if (childProcessCount > 0) {
    log.warn(
      "complete",
      `Waiting for ${childProcessCount} child ` +
        `process${childProcessCount === 1 ? "" : "es"} to exit. ` +
        "CTRL-C to exit immediately."
    );
  }
}
