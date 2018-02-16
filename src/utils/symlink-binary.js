"use strict";

const _ = require("lodash");
const async = require("async");
const path = require("path");
const readPkg = require("read-pkg");

const Package = require("../Package");
const FileSystemUtilities = require("../FileSystemUtilities");
const createSymlink = require("./create-symlink");

module.exports = symlinkBinary;

/**
 * Symlink bins of srcPackage to node_modules/.bin in destPackage
 * @param {Object|string} srcPackageRef
 * @param {Object|string} destPackageRef
 * @param {Function} callback
 */
function symlinkBinary(srcPackageRef, destPackageRef, callback) {
  const srcPackage = resolvePackageRef(srcPackageRef);
  const destPackage = resolvePackageRef(destPackageRef);

  const actions = _.entries(srcPackage.bin)
    .map(([name, file]) => ({
      src: path.join(srcPackage.location, file),
      dst: path.join(destPackage.binLocation, name),
    }))
    .filter(({ src }) => FileSystemUtilities.existsSync(src))
    .map(({ src, dst }) => cb =>
      async.series(
        [next => createSymlink(src, dst, "exec", next), done => FileSystemUtilities.chmod(src, "755", done)],
        cb
      )
    );

  if (actions.length === 0) {
    return callback();
  }

  const ensureBin = cb => FileSystemUtilities.mkdirp(destPackage.binLocation, cb);
  const linkEntries = cb => async.parallel(actions, cb);

  async.series([ensureBin, linkEntries], callback);
}

function resolvePackageRef(pkgRef) {
  if (pkgRef instanceof Package) {
    return pkgRef;
  }

  return new Package(readPkg.sync(pkgRef), pkgRef);
}
