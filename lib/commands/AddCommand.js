"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.builder = exports.describe = exports.command = undefined;

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.handler = handler;

var _path = require("path");

var _path2 = _interopRequireDefault(_path);

var _dedent = require("dedent");

var _dedent2 = _interopRequireDefault(_dedent);

var _packageJson = require("package-json");

var _packageJson2 = _interopRequireDefault(_packageJson);

var _readPkg = require("read-pkg");

var _readPkg2 = _interopRequireDefault(_readPkg);

var _semver = require("semver");

var _semver2 = _interopRequireDefault(_semver);

var _writePkg = require("write-pkg");

var _writePkg2 = _interopRequireDefault(_writePkg);

var _BootstrapCommand = require("./BootstrapCommand");

var _BootstrapCommand2 = _interopRequireDefault(_BootstrapCommand);

var _Command2 = require("../Command");

var _Command3 = _interopRequireDefault(_Command2);

var _splitVersion = require("../utils/splitVersion");

var _splitVersion2 = _interopRequireDefault(_splitVersion);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var command = exports.command = "add [args..]";

var describe = exports.describe = "Add packages as dependency to matched packages";

var builder = exports.builder = {
  dev: {
    describe: "Save as to devDependencies"
  }
};

function handler(argv) {
  new AddCommand([].concat(_toConsumableArray(argv.args)), argv, argv._cwd).run().then(argv._onFinish, argv._onFinish);
}

var AddCommand = function (_Command) {
  _inherits(AddCommand, _Command);

  function AddCommand() {
    _classCallCheck(this, AddCommand);

    return _possibleConstructorReturn(this, (AddCommand.__proto__ || Object.getPrototypeOf(AddCommand)).apply(this, arguments));
  }

  _createClass(AddCommand, [{
    key: "initialize",
    value: function initialize(callback) {
      var _this2 = this;

      var pkgs = this.input.filter(function (input) {
        return typeof input === "string" && input.trim() !== "";
      }).map(function (input) {
        return (0, _splitVersion2.default)(input) || [input, "latest"];
      }).filter(function (split) {
        return Array.isArray(split);
      }).map(function (_ref) {
        var _ref2 = _slicedToArray(_ref, 2),
            name = _ref2[0],
            _ref2$ = _ref2[1],
            versionRange = _ref2$ === undefined ? "latest" : _ref2$;

        return { name, versionRange };
      });

      if (pkgs.length === 0) {
        var err = new _Command2.ValidationError("EINPUT", "Missing list of packages to add to your project.");
        return callback(err);
      }

      var unsatisfied = pkgs.filter(function (pkg) {
        return _this2.packageExists(pkg.name);
      }).filter(function (a) {
        return !_this2.packageSatisfied(a.name, a.versionRange);
      }).map(function (u) {
        return {
          name: u.name,
          versionRange: u.versionRange,
          version: _this2.getPackage(u.name).version
        };
      });

      if (unsatisfied.length > 0) {
        var _err = new _Command2.ValidationError("ENOTSATISFIED", notSatisfiedMessage(unsatisfied));
        return callback(_err);
      }

      this.dependencyType = this.options.dev ? "devDependencies" : "dependencies";

      Promise.all(pkgs.map(function (_ref3) {
        var name = _ref3.name,
            versionRange = _ref3.versionRange;
        return _this2.getPackageVersion(name, versionRange).then(function (version) {
          return { name, version, versionRange };
        });
      })).then(function (packagesToInstall) {
        _this2.packagesToInstall = packagesToInstall;

        _this2.packagesToChange = _this2.filteredPackages
        // Skip packages that only would install themselves
        .filter(function (filteredPackage) {
          var notSamePackage = function notSamePackage(pkgToInstall) {
            return pkgToInstall.name !== filteredPackage.name;
          };
          var addable = _this2.packagesToInstall.some(notSamePackage);
          if (!addable) {
            _this2.logger.warn(`Will not add ${filteredPackage.name} to itself.`);
          }
          return addable;
        })
        // Skip packages without actual changes to manifest
        .filter(function (filteredPackage) {
          var deps = filteredPackage[_this2.dependencyType] || {};

          // Check if one of the packages to install necessiates a change to filteredPackage's manifest
          return _this2.packagesToInstall.filter(function (pkgToInstall) {
            return pkgToInstall.name !== filteredPackage.name;
          }).some(function (pkgToInstall) {
            if (!(pkgToInstall.name in deps)) {
              return true;
            }
            var current = deps[pkgToInstall.name];
            var range = getRangeToReference(current, pkgToInstall.version, pkgToInstall.versionRange);
            return range !== current;
          });
        });

        if (_this2.packagesToChange.length === 0) {
          var packagesToInstallList = _this2.packagesToInstall.map(function (pkg) {
            return pkg.name;
          }).join(", ");
          _this2.logger.warn(`No packages found in scope where ${packagesToInstallList} can be added.`);
        }
      }).then(function () {
        return callback(null, _this2.packagesToChange.length > 0);
      }).catch(callback);
    }
  }, {
    key: "execute",
    value: function execute(callback) {
      var _this3 = this;

      this.logger.info(`Add ${this.dependencyType} in ${this.packagesToChange.length} packages`);

      Promise.all(this.packagesToChange.map(function (pkgToChange) {
        var manifestPath = _path2.default.join(pkgToChange.location, "package.json");

        var notSamePackage = function notSamePackage(pkgToInstall) {
          return pkgToChange.name !== pkgToInstall.name;
        };

        var applicable = _this3.packagesToInstall.filter(notSamePackage).reduce(function (results, pkgToInstall) {
          var deps = pkgToChange[_this3.dependencyType] || {};
          var current = deps[pkgToInstall.name];
          var range = getRangeToReference(current, pkgToInstall.version, pkgToInstall.versionRange);
          var id = `${pkgToInstall.name}@${range}`;
          var message = `Add ${id} as ${_this3.dependencyType} in ${pkgToChange.name}`;
          _this3.logger.verbose(message);
          results[pkgToInstall.name] = range;
          return results;
        }, {});

        return (0, _readPkg2.default)(manifestPath, { normalize: false }).then(function (a) {
          var previous = a[_this3.dependencyType] || {};
          var payload = Object.assign({}, previous, applicable);
          var ammendment = { [_this3.dependencyType]: payload };

          var b = Object.assign({}, a, ammendment);
          return { a, b };
        }).then(function (_ref4) {
          var a = _ref4.a,
              b = _ref4.b;

          var changed = JSON.stringify(a) !== JSON.stringify(b);
          var exec = changed ? function () {
            return (0, _writePkg2.default)(manifestPath, b);
          } : function () {
            return Promise.resolve();
          };

          return exec().then(function () {
            return {
              name: pkgToChange.name,
              changed
            };
          });
        });
      })).then(function (pkgs) {
        var changedPkgs = pkgs.filter(function (p) {
          return p.changed;
        });

        _this3.logger.info(`Changes require bootstrap in ${changedPkgs.length} packages`);

        var options = Object.assign({}, _this3.options, {
          scope: changedPkgs.map(function (p) {
            return p.name;
          })
        });

        return new _BootstrapCommand2.default([], options, _this3.repository.rootPath).run();
      }).then(function () {
        return callback();
      }).catch(callback);
    }
  }, {
    key: "getPackage",
    value: function getPackage(name) {
      return this.packages.find(function (pkg) {
        return pkg.name === name;
      });
    }
  }, {
    key: "getPackageVersion",
    value: function getPackageVersion(name, versionRange) {
      if (this.packageSatisfied(name, versionRange)) {
        return Promise.resolve(this.getPackage(name).version);
      }
      return (0, _packageJson2.default)(name, { version: versionRange }).then(function (pkg) {
        return pkg.version;
      });
    }
  }, {
    key: "packageExists",
    value: function packageExists(name) {
      return this.packages.some(function (pkg) {
        return pkg.name === name;
      });
    }
  }, {
    key: "packageSatisfied",
    value: function packageSatisfied(name, versionRange) {
      var pkg = this.getPackage(name);

      if (!pkg) {
        return false;
      }
      if (versionRange === "latest") {
        return true;
      }
      return _semver2.default.intersects(pkg.version, versionRange);
    }
  }, {
    key: "requireGit",
    get: function get() {
      return false;
    }
  }]);

  return AddCommand;
}(_Command3.default);

exports.default = AddCommand;


function notSatisfiedMessage(unsatisfied) {
  return _dedent2.default`
    Requested range not satisfiable:
    ${unsatisfied.map(function (u) {
    return `${u.name}@${u.versionRange} (available: ${u.version})`;
  }).join(", ")}
  `;
}

function getRangeToReference(current, available, requested) {
  var resolved = requested === "latest" ? `^${available}` : requested;

  if (current && _semver2.default.intersects(current, resolved)) {
    return current;
  }

  return resolved;
}