"use strict";

const conventionalRecommendedBump = require("conventional-recommended-bump");
const log = require("npmlog");
const semver = require("semver");
const getChangelogConfig = require("./get-changelog-config");

module.exports = recommendVersion;

function recommendVersion(pkg, type, { changelogPreset, rootPath, tagPrefix }) {
  log.silly(type, "for %s at %s", pkg.name, pkg.location);

  const options = {
    path: pkg.location,
  };

  if (type === "independent") {
    options.lernaPackage = pkg.name;
  } else {
    // only fixed mode can have a custom tag prefix
    options.tagPrefix = tagPrefix;
  }

  return getChangelogConfig(changelogPreset, rootPath).then(config => {
    // "new" preset API
    options.config = config;

    return new Promise((resolve, reject) => {
      conventionalRecommendedBump(options, (err, data) => {
        if (err) {
          return reject(err);
        }

        // result might be undefined because some presets are not consistent with angular
        // we still need to bump _something_ because lerna saw a change here
        const releaseType = data.releaseType || "patch";

        log.verbose(type, "increment %s by %s", pkg.version, releaseType);
        resolve(semver.inc(pkg.version, releaseType));
      });
    });
  });
}
