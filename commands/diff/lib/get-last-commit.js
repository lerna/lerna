"use strict";

const GitUtilities = require("@lerna/git-utils");

module.exports = getLastCommit;

function getLastCommit(execOpts) {
  if (GitUtilities.hasTags(execOpts)) {
    return GitUtilities.getLastTaggedCommit(execOpts);
  }

  return GitUtilities.getFirstCommit(execOpts);
}
