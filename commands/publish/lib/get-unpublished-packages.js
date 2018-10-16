"use strict";

const fetch = require("npm-registry-fetch");
const log = require("npmlog");
const pReduce = require("p-reduce");

module.exports = getUnpublishedPackages;

// Only the abbreviated package metadata is needed to
// determine which versions have been published. This
// saves transfer time for packages with a lot of
// history.
const registryOptions = {
  Accept: "application/vnd.npm.install-v1+json",
};

function getUnpublishedPackages(project, opts) {
  log.silly("getPackageVersions");

  let chain = Promise.resolve();

  const mapper = (unpublished, pkg) =>
    fetch.json(`-/${pkg.name}`, Object.assign({}, opts, registryOptions)).then(
      packument => {
        if (packument.versions[pkg.version] === undefined) {
          unpublished.push(pkg);
        }

        return unpublished;
      },
      () => {
        log.warn("", "Unable to determine published versions, assuming unpublished.");
        return unpublished.concat([pkg]);
      }
    );

  chain = chain.then(() => project.getPackages());
  chain = chain.then(packages => pReduce(packages, mapper, []));

  return chain;
}
