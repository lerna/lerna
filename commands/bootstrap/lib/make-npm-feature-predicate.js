"use strict";

const semver = require("semver");

module.exports = makeNpmFeaturePredicate;

function makeNpmFeaturePredicate(range) {
  return () => Boolean(semver.satisfies(getNpmVersion(), range));
}

function getNpmVersion() {
  const userAgent = process.env.npm_config_user_agent;

  return (/npm\/(\d+\.\d+\.\d+)/.exec(userAgent) || [""]).pop();
}
