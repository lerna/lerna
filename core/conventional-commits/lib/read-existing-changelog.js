"use strict";

const fs = require("fs-extra");
const path = require("path");
const { BLANK_LINE, COMMIT_GUIDELINE } = require("./constants");

module.exports = readExistingChangelog;

function readExistingChangelog(pkg) {
  const changelogFileLoc = path.join(pkg.location, "CHANGELOG.md");

  let chain = Promise.resolve();

  // catch allows missing file to pass without breaking chain
  chain = chain.then(() => fs.readFile(changelogFileLoc, "utf8").catch(() => ""));

  chain = chain.then(changelogContents => {
    // Remove the header if it exists, thus starting at the first entry.
    const headerIndex = changelogContents.indexOf(COMMIT_GUIDELINE);

    if (headerIndex !== -1) {
      return changelogContents.substring(headerIndex + COMMIT_GUIDELINE.length + BLANK_LINE.length);
    }

    return changelogContents;
  });

  // consumer expects resolved tuple
  chain = chain.then(changelogContents => [changelogFileLoc, changelogContents]);

  return chain;
}
