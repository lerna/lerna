"use strict";

module.exports = getForcedPackages;

function getForcedPackages(forcePublish) {
  // new Set(null) is equivalent to new Set([])
  // i.e., an empty Set
  let inputs = null;

  if (forcePublish === true) {
    // --force-publish
    inputs = ["*"];
  } else if (typeof forcePublish === "string") {
    // --force-publish=*
    // --force-publish=foo
    // --force-publish=foo,bar
    inputs = forcePublish.split(",");
  } else if (Array.isArray(forcePublish)) {
    // --force-publish foo --force-publish baz
    inputs = [...forcePublish];
  }

  return new Set(inputs);
}
