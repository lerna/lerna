module.exports = function hasMatchingDependency(pkg, dep) {
  var version = false;

  if (pkg.pkg.dependencies) {
    version = pkg.pkg.dependencies[dep.name];
  }

  if (pkg.pkg.devDependencies && !version) {
    version = pkg.pkg.devDependencies[dep.name];
  }

  if (!version) {
    return false;
  }

  // ensure that this is referring to a local package
  if (version[0] !== "^" || version[1] !== dep.version[0]) {
    return false;
  }

  return true;
};
