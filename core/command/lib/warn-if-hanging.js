"use strict";

const log = require("npmlog");
const childProcess = require("@lerna/child-process");

module.exports.warnIfHanging = warnIfHanging;

function warnIfHanging() {
  const childProcessCount = childProcess.getChildProcessCount();

  if (childProcessCount > 0) {
    log.warn(
      "complete",
      `Waiting for ${childProcessCount} child ` +
        `process${childProcessCount === 1 ? "" : "es"} to exit. ` +
        "CTRL-C to exit immediately."
    );
  }
}
