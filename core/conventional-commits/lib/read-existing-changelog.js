"use strict";

const fs = require("fs-extra");
const path = require("path");

module.exports = readExistingChangelog;

function readExistingChangelog(pkg) {
  const changelogFileLoc = path.join(pkg.location, "CHANGELOG.md");

  let chain = Promise.resolve();

  // catch allows missing file to pass without breaking chain
  chain = chain.then(() => fs.readFile(changelogFileLoc, "utf8").catch(() => ""));

  chain = chain.then(changelogContents => {
    // CHANGELOG entries start with <a name=, we remove
    // the header if it exists by starting at the first entry.
    const firstEntryIndex = changelogContents.indexOf("<a name=");

    if (firstEntryIndex !== -1) {
      return changelogContents.substring(firstEntryIndex);
    }

    return changelogContents;
  });

  // consumer expects resolved tuple
  chain = chain.then(changelogContents => [changelogFileLoc, changelogContents]);

  return chain;
}
