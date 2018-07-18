"use strict";

const path = require("path");

function sorter(a, b) {
  const l = Math.max(a.length, b.length);

  for (let i = 0; i < l; i += 1) {
    if (!(i in a)) {
      return -1;
    }
    if (!(i in b)) {
      return +1;
    }
    if (a[i].toUpperCase() > b[i].toUpperCase()) {
      return +1;
    }
    if (a[i].toUpperCase() < b[i].toUpperCase()) {
      return -1;
    }
  }

  if (a.length < b.length) {
    return -1;
  }
  if (a.length > b.length) {
    return +1;
  }

  return 0;
}

function pathsort(paths, sep = path.sep) {
  return paths
    .map(el => el.split(sep))
    .sort(sorter)
    .map(el => el.join(sep));
}

function standalone(sep = path.sep) {
  return (a, b) => sorter(a.split(sep), b.split(sep));
}

module.exports = pathsort;
module.exports.standalone = standalone;
