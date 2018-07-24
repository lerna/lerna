"use strict";

const conventionalRecommendedBump = require("conventional-recommended-bump");
const log = require("npmlog");
const semver = require("semver");
const getChangelogConfig = require("./get-changelog-config");

module.exports = recommendVersion;

function recommendVersion(pkg, type, { changelogPreset, rootPath }) {
  log.silly(type, "for %s at %s", pkg.name, pkg.location);

  const options = {
    path: pkg.location,
  };

  if (type === "independent") {
    options.lernaPackage = pkg.name;
  }

  return getChangelogConfig(changelogPreset, rootPath).then(config => {
    // "new" preset API
    options.config = config;

    return new Promise((resolve, reject) => {
      conventionalRecommendedBump(options, (err, data) => {
        if (err) {
          return reject(err);
        }

        log.verbose(type, "increment %s by %s", pkg.version, data.releaseType);
        resolve(semver.inc(pkg.version, data.releaseType));
      });
    });
  });
}
