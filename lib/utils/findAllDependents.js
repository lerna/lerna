var logger = require("./logger");

function findDependents(packages, changed) {
  var dependents = [];

  packages.forEach(function(pkg) {
    var dependencies = pkg.pkg.dependencies || {};
    var devDependencies = pkg.pkg.devDependencies || {};

    if (
      (!dependencies[changed.name]) &&
      (!devDependencies[changed.name])
    ) {
      return;
    }

    dependents.push(pkg);

    var filtered = packages.filter(function(p) {
      return pkg.name !== p.name;
    });

    dependents = dependents.concat(findDependents(filtered, pkg));
  });

  return dependents;
}

module.exports = function findAllDependents(packages, changed) {
  var dependents = [];

  changed.forEach(function(pkg) {
    dependents = dependents.concat(findDependents(packages, pkg));
  });

  return dependents;
};
