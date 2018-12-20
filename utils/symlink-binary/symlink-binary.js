"use strict";

const fs = require("fs-extra");
const path = require("path");
const pMap = require("p-map");

const Package = require("@lerna/package");
const createSymlink = require("@lerna/create-symlink");

module.exports = symlinkBinary;

/**
 * Symlink bins of srcPackage to node_modules/.bin in destPackage
 * @param {Object|string} srcPackageRef
 * @param {Object|string} destPackageRef
 * @returns {Promise}
 */
function symlinkBinary(srcPackageRef, destPackageRef) {
  return Promise.all([Package.lazy(srcPackageRef), Package.lazy(destPackageRef)]).then(
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

      return fs.mkdirp(destPackage.binLocation).then(() =>
        pMap(actions, meta => {
          if (meta) {
            return createSymlink(meta.src, meta.dst, "exec").then(() => fs.chmod(meta.src, "755"));
          }
        })
      );
    }
  );
}
