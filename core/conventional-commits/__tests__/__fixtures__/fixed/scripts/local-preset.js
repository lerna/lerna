"use strict";

// https://github.com/conventional-changelog/conventional-changelog/blob/b516084ef6a725197f148236c0ddbfae7ffe3e6f/packages/conventional-changelog-angular/conventional-recommended-bump.js
const parserOpts = require("./parser-opts");
const writerOpts = require("./writer-opts");
const whatBump = require("./what-bump");

module.exports = {
  conventionalChangelog: {
    parserOpts,
    writerOpts,
  },
  recommendedBumpOpts: {
    parserOpts,
    whatBump,
  },
};
