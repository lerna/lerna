"use strict";

const os = require("os");
const path = require("path");
const log = require("npmlog");
const writeFileAtomic = require("write-file-atomic");

module.exports = writeLogFile;

function writeLogFile(cwd) {
  let logOutput = "";

  log.record.forEach(m => {
    let pref = [m.id, m.level];
    if (m.prefix) {
      pref.push(m.prefix);
    }
    pref = pref.join(" ");

    m.message
      .trim()
      .split(/\r?\n/)
      .map(line => `${pref} ${line}`.trim())
      .forEach(line => {
        logOutput += line + os.EOL;
      });
  });

  // this must be synchronous because it is called before process exit
  writeFileAtomic.sync(path.join(cwd, "lerna-debug.log"), logOutput);

  // truncate log after writing
  log.record.length = 0;
}
