"use strict";

// https://git.io/vx5iq (conventional-changelog-angular/conventional-recommended-bump.js, etc)
const parserOpts = require("./parser-opts");
const writerOpts = require("./writer-opts");
const whatBump = require("./what-bump");

// https://git.io/fhyKK
module.exports = presetOpts;

function presetOpts(cb) {
  process.nextTick(cb, null, {
    parserOpts,
    writerOpts,
    whatBump,
  });
}
