var rimraf = require("rimraf");
var async  = require("async");
var path   = require("path");
var fs     = require("fs");

function symlinkDep(src, dest, callback) {
  fs.symlink(src, dest, "dir", callback);
}

function createLinkedDep(src, dest, name, callback) {
  rimraf(dest, function (err) {
    if (err) return callback(err);
    symlinkDep(src, dest, callback);
  });
}

module.exports = function linkDependenciesForPackage(
  pkg,
  packages,
  packagesLoc,
  nodeModulesLoc,
  currentVersion,
  callback
) {
  async.each(packages, function (sub, done) {
    var ver = false;
    if (pkg.dependencies) ver = pkg.dependencies[sub.name];
    if (pkg.devDependencies && !ver) ver = pkg.devDependencies[sub.name];
    if (!ver) return done();

    // ensure that this is referring to a local package
    if (ver[0] !== "^" || ver[1] !== currentVersion[0]) return done();

    var linkSrc = path.join(packagesLoc, sub.folder);
    var linkDest = path.join(nodeModulesLoc, sub.name);

    createLinkedDep(linkSrc, linkDest, sub.name, done);
  }, callback);
}
