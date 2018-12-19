"use strict";

const log = require("libnpm/log");
const pReduce = require("p-reduce");
const getPackument = require("libnpm/packument");

module.exports = getUnpublishedPackages;

function getUnpublishedPackages(project, opts) {
  log.silly("getPackageVersions");

  let chain = Promise.resolve();

  const mapper = (unpublished, pkg) =>
    getPackument(pkg.name, opts).then(
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
