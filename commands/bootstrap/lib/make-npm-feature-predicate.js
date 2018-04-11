"use strict";

const semver = require("semver");

module.exports = makeNpmFeaturePredicate;

function makeNpmFeaturePredicate(range) {
  return conf => Boolean(semver.satisfies(getNpmVersion(conf), range));
}

function getNpmVersion(conf) {
  const userAgent = conf.get("user-agent");

  return (/npm\/(\d+\.\d+\.\d+)/.exec(userAgent) || [""]).pop();
}
