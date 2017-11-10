"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.PackageGraphNode = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _semver = require("semver");

var _semver2 = _interopRequireDefault(_semver);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Represents a node in a PackageGraph.
 * @constructor
 * @param {!<Package>} pkg - A Package object to build the node from.
 */
var PackageGraphNode = exports.PackageGraphNode = function () {
  function PackageGraphNode(pkg) {
    _classCallCheck(this, PackageGraphNode);

    this.package = pkg;
    this.dependencies = [];
  }

  _createClass(PackageGraphNode, [{
    key: "satisfies",
    value: function satisfies(versionRange) {
      return _semver2.default.satisfies(this.package.version, versionRange);
    }
  }]);

  return PackageGraphNode;
}();

/**
 * Represents a node in a PackageGraph.
 * @constructor
 * @param {!Array.<Package>} packages An array of Packages to build the graph out of.
 * @param {boolean} [depsOnly=false] True to create a graph of only dependencies, excluding the
 *    devDependencies that would normally be included.
 */


var PackageGraph = function () {
  function PackageGraph(packages) {
    var depsOnly = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
    var versionParser = arguments[2];

    _classCallCheck(this, PackageGraph);

    this.nodes = [];
    this.nodesByName = {};

    for (var p = 0; p < packages.length; p++) {
      var pkg = packages[p];
      var node = new PackageGraphNode(pkg);
      this.nodes.push(node);
      this.nodesByName[pkg.name] = node;
    }

    for (var n = 0; n < this.nodes.length; n++) {
      var _node = this.nodes[n];
      var dependencies = _node.package[depsOnly ? "dependencies" : "allDependencies"] || {};
      var depNames = Object.keys(dependencies);

      for (var d = 0; d < depNames.length; d++) {
        var depName = depNames[d];
        var packageNode = this.nodesByName[depName];

        if (packageNode) {
          var depVersion = versionParser ? versionParser.parseVersion(dependencies[depName]).version : dependencies[depName];

          if (packageNode.satisfies(depVersion)) {
            _node.dependencies.push(depName);
          }
        }
      }
    }
  }

  _createClass(PackageGraph, [{
    key: "get",
    value: function get(packageName) {
      return this.nodesByName[packageName];
    }
  }]);

  return PackageGraph;
}();

exports.default = PackageGraph;