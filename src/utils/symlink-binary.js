"use strict";

const fs = require("fs-extra");
const path = require("path");
const pMap = require("p-map");
const readPkg = require("read-pkg");

const Package = require("../Package");
const FileSystemUtilities = require("../FileSystemUtilities");
const createSymlink = require("./create-symlink");

module.exports = symlinkBinary;

/**
 * Symlink bins of srcPackage to node_modules/.bin in destPackage
 * @param {Object|string} srcPackageRef
 * @param {Object|string} destPackageRef
 * @returns {Promise}
 */
function symlinkBinary(srcPackageRef, destPackageRef) {
  return Promise.all([resolvePackageRef(srcPackageRef), resolvePackageRef(destPackageRef)]).then(
    ([srcPackage, destPackage]) => {
      const actions = Object.keys(srcPackage.bin).map(name => {
        const src = path.join(srcPackage.location, srcPackage.bin[name]);
        const dst = path.join(destPackage.binLocation, name);

        return fs.pathExists(src).then(exists => {
          if (exists) {
            return { src, dst };
          }
        });
      });

      if (actions.length === 0) {
        return Promise.resolve();
      }

      return FileSystemUtilities.mkdirp(destPackage.binLocation).then(() =>
        pMap(actions, meta => {
          if (meta) {
            return createSymlink(meta.src, meta.dst, "exec").then(() =>
              FileSystemUtilities.chmod(meta.src, "755")
            );
          }
        })
      );
    }
  );
}

function resolvePackageRef(pkgRef) {
  if (pkgRef instanceof Package) {
    return pkgRef;
  }

  return readPkg(pkgRef, { normalize: false }).then(json => new Package(json, pkgRef));
}
