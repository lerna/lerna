"use strict";

const execa = require("execa");

module.exports = gitInit;

function gitInit(cwd, message) {
  const opts = { cwd };

  return Promise.resolve()
    .then(() => execa("git", ["init", "."], opts))
    .then(() => execa("git", ["config", "commit.gpgSign", "false"], opts))
    .then(() => execa("git", ["add", "-A"], opts))
    .then(() => execa("git", ["commit", "-m", message], opts));
}
