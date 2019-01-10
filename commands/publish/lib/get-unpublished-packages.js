"use strict";

const log = require("libnpm/log");
const pMap = require("p-map");
const getPackument = require("libnpm/packument");

module.exports = getUnpublishedPackages;

function getUnpublishedPackages(packageGraph, opts) {
  log.silly("getUnpublishedPackages");

  let chain = Promise.resolve();

  const mapper = pkg =>
    getPackument(pkg.name, opts).then(
      packument => {
        if (packument.versions[pkg.version] === undefined) {
          return pkg;
        }
      },
      () => {
        log.warn("", "Unable to determine published version, assuming %j unpublished.", pkg.name);
        return pkg;
      }
    );

  chain = chain.then(() => pMap(packageGraph.values(), mapper, { concurrency: 4 }));

  return chain.then(results => results.filter(Boolean));
}
