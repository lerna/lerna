"use strict";

const log = require("npmlog");
const pMap = require("p-map");
const getPackument = require("@evocateur/pacote/packument");

module.exports = getUnpublishedPackages;

function getUnpublishedPackages(packageGraph, opts) {
  log.silly("getUnpublishedPackages");

  let chain = Promise.resolve();

  // don't bother attempting to get the packument for private packages
  const graphNodesToCheck = Array.from(packageGraph.values()).filter(({ pkg }) => !pkg.private);

  const mapper = pkg =>
    getPackument(pkg.name, opts).then(
      packument => {
        if (packument.versions === undefined || packument.versions[pkg.version] === undefined) {
          return pkg;
        }
      },
      () => {
        log.warn("", "Unable to determine published version, assuming %j unpublished.", pkg.name);
        return pkg;
      }
    );

  chain = chain.then(() => pMap(graphNodesToCheck, mapper, { concurrency: 4 }));

  return chain.then(results => results.filter(Boolean));
}
