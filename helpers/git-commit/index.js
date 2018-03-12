"use strict";

const os = require("os");
const execa = require("execa");
const tempWrite = require("temp-write");

module.exports = gitCommit;

function gitCommit(cwd, message) {
  if (message.indexOf(os.EOL) > -1) {
    // Use tempfile to allow multi\nline strings.
    return tempWrite(message).then(fp => execa("git", ["commit", "-F", fp], { cwd }));
  }

  return execa("git", ["commit", "-m", message], { cwd });
}
