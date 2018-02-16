"use strict";

const _ = require("lodash");
const hostedGitInfo = require("hosted-git-info");

class GitVersionParser {
  constructor(versionPrefix = "v") {
    this._gitUrlPattern = new RegExp(`(.+?#${_.escapeRegExp(versionPrefix)})(.+)$`);
  }

  parseVersion(version) {
    const gitInfo = hostedGitInfo.fromUrl(version);
    let targetMatches;

    if (gitInfo && gitInfo.committish) {
      targetMatches = this._gitUrlPattern.exec(version);
    }

    return {
      prefix: targetMatches ? targetMatches[1] : null,
      version: targetMatches ? targetMatches[2] : version,
    };
  }
}

module.exports = GitVersionParser;
