"use strict";

const { BLANK_LINE } = require("./constants");

module.exports = makeBumpOnlyFilter;

function makeBumpOnlyFilter(pkg) {
  return newEntry => {
    // When force publishing, it is possible that there will be no actual changes, only a version bump.
    if (!newEntry.split("\n").some(line => line.startsWith("*"))) {
      // Add a note to indicate that only a version bump has occurred.
      // TODO: actually list the dependencies that were bumped
      const message = `**Note:** Version bump only for package ${pkg.name}`;

      // the extra blank lines preserve the whitespace delimiting releases
      return [newEntry.trim(), message, BLANK_LINE].join(BLANK_LINE);
    }

    return newEntry;
  };
}
