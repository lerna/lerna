var rimraf = require("rimraf");
var mkdirp = require("mkdirp");
var async  = require("async");
var path   = require("path");
var fs     = require("fs");

function createLinkedDepFiles(src, dest, name, callback) {
  fs.writeFile(path.join(dest, "package.json"), JSON.stringify({
    name: name,
    version: require(path.join(src, "package.json")).version
  }, null, "  "), function (err) {
    if (err) return callback(err);

    fs.writeFile(
      path.join(dest, "index.js"),
      "module.exports = require(" + JSON.stringify(src) + ");",
      callback
    );
  });
}

function createLinkedDep(src, dest, name, callback) {
  rimraf(dest, function (err) {
    if (err) return callback(err);

    mkdirp(dest, function (err) {
      if (err) return callback(err);
      createLinkedDepFiles(src, dest, name, callback);
    });
  });
}

module.exports = function linkDependenciesForPackage(
  pkg,
  packages,
  packagesLoc,
  nodeModulesLoc,
  currentVersion,
  independent,
  callback
) {
  async.each(packages, function (sub, done) {
    var ver = false;
    if (pkg.dependencies) ver = pkg.dependencies[sub.name];
    if (pkg.devDependencies && !ver) ver = pkg.devDependencies[sub.name];
    if (!ver) return done();

    var matchedVersion = independent ? sub.version : currentVersion;

    // ensure that this is referring to a local package
    if (ver[0] !== "^" || ver[1] !== matchedVersion[0]) return done();

    var linkSrc = path.join(packagesLoc, sub.folder);
    var linkDest = path.join(nodeModulesLoc, sub.name);

    createLinkedDep(linkSrc, linkDest, sub.name, done);
  }, callback);
}
