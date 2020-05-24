"use strict";

// https://git.io/vx5iq (conventional-changelog-angular/conventional-recommended-bump.js, etc)
const parserOpts = require("./parser-opts");
const writerOpts = require("./writer-opts");
const whatBump = require("./what-bump");

// https://git.io/fhyKK
module.exports = presetOpts;

function presetOpts(param) {
  if (typeof param !== "function") {
    return Promise.resolve(
      Object.assign(param, {
        parserOpts,
        writerOpts,
        whatBump,
      })
    );
  }

  process.nextTick(param, null, {
    parserOpts,
    writerOpts,
    whatBump,
  });
}
