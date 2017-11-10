"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.builder = exports.describe = exports.command = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.handler = handler;

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _async = require("async");

var _async2 = _interopRequireDefault(_async);

var _getPort = require("get-port");

var _getPort2 = _interopRequireDefault(_getPort);

var _path = require("path");

var _path2 = _interopRequireDefault(_path);

var _semver = require("semver");

var _semver2 = _interopRequireDefault(_semver);

var _Command2 = require("../Command");

var _Command3 = _interopRequireDefault(_Command2);

var _FileSystemUtilities = require("../FileSystemUtilities");

var _FileSystemUtilities2 = _interopRequireDefault(_FileSystemUtilities);

var _NpmUtilities = require("../NpmUtilities");

var _NpmUtilities2 = _interopRequireDefault(_NpmUtilities);

var _PackageUtilities = require("../PackageUtilities");

var _PackageUtilities2 = _interopRequireDefault(_PackageUtilities);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var YARN_HOIST_MESSAGE = `--hoist is not supported with --npm-client=yarn, use yarn workspaces instead
A guide is available at https://yarnpkg.com/blog/2017/08/02/introducing-workspaces/#setting-up-workspaces`;

function handler(argv) {
  new BootstrapCommand([].concat(_toConsumableArray(argv.args)), argv, argv._cwd).run().then(argv._onFinish, argv._onFinish);
}

var command = exports.command = "bootstrap [args..]";

var describe = exports.describe = "Link local packages together and install remaining package dependencies";

var builder = exports.builder = {
  "hoist": {
    group: "Command Options:",
    describe: "Install external dependencies matching [glob] to the repo root",
    defaultDescription: "'**'",
    coerce: function coerce(arg) {
      // `--hoist` is equivalent to `--hoist=**`.
      return arg === true ? "**" : arg;
    }
  },
  "nohoist": {
    group: "Command Options:",
    describe: "Don't hoist external dependencies matching [glob] to the repo root",
    type: "string"
  },
  "npm-client": {
    group: "Command Options:",
    describe: "Executable used to install dependencies (npm, yarn, pnpm, ...)",
    type: "string",
    requiresArg: true
  }
};

var BootstrapCommand = function (_Command) {
  _inherits(BootstrapCommand, _Command);

  function BootstrapCommand() {
    _classCallCheck(this, BootstrapCommand);

    return _possibleConstructorReturn(this, (BootstrapCommand.__proto__ || Object.getPrototypeOf(BootstrapCommand)).apply(this, arguments));
  }

  _createClass(BootstrapCommand, [{
    key: "initialize",
    value: function initialize(callback) {
      var _this2 = this;

      var _options = this.options,
          registry = _options.registry,
          rejectCycles = _options.rejectCycles,
          npmClient = _options.npmClient,
          npmClientArgs = _options.npmClientArgs,
          mutex = _options.mutex,
          hoist = _options.hoist;


      if (npmClient === "yarn" && typeof hoist === "string") {
        var err = new _Command2.ValidationError("", YARN_HOIST_MESSAGE);
        return callback(err);
      }

      this.npmConfig = {
        registry,
        npmClient,
        npmClientArgs,
        mutex
      };

      // lerna bootstrap ... -- <input>
      if (this.input.length) {
        this.npmConfig.npmClientArgs = [].concat(_toConsumableArray(npmClientArgs || []), _toConsumableArray(this.input));
      }

      try {
        this.batchedPackages = this.toposort ? _PackageUtilities2.default.topologicallyBatchPackages(this.filteredPackages, {
          rejectCycles
        }) : [this.filteredPackages];
      } catch (e) {
        return callback(e);
      }

      if (npmClient === "yarn" && !mutex) {
        return (0, _getPort2.default)({ port: 42424, host: '0.0.0.0' }).then(function (port) {
          _this2.npmConfig.mutex = `network:${port}`;
          _this2.logger.silly("npmConfig", _this2.npmConfig);
          callback(null, true);
        }).catch(callback);
      }

      _PackageUtilities2.default.validatePackageNames(this.filteredPackages);

      this.logger.silly("npmConfig", this.npmConfig);
      callback(null, true);
    }
  }, {
    key: "execute",
    value: function execute(callback) {
      var _this3 = this;

      this.bootstrapPackages(function (err) {
        if (err) {
          callback(err);
        } else {
          _this3.logger.success("", `Bootstrapped ${_this3.filteredPackages.length} packages`);
          callback(null, true);
        }
      });
    }

    /**
     * Bootstrap packages
     * @param {Function} callback
     */

  }, {
    key: "bootstrapPackages",
    value: function bootstrapPackages(callback) {
      var _this4 = this;

      this.logger.info("", `Bootstrapping ${this.filteredPackages.length} packages`);

      var useWorkspaces = this.options.useWorkspaces;


      if (useWorkspaces) {
        this.installRootPackageOnly(callback);
      } else {
        _async2.default.series([
        // preinstall bootstrapped packages
        function (cb) {
          return _this4.preinstallPackages(cb);
        },
        // install external dependencies
        function (cb) {
          return _this4.installExternalDependencies(cb);
        },
        // symlink packages and their binaries
        function (cb) {
          return _this4.symlinkPackages(cb);
        },
        // postinstall bootstrapped packages
        function (cb) {
          return _this4.postinstallPackages(cb);
        },
        // prepublish bootstrapped packages
        function (cb) {
          return _this4.prepublishPackages(cb);
        },
        // prepare bootstrapped packages
        function (cb) {
          return _this4.preparePackages(cb);
        }], callback);
      }
    }
  }, {
    key: "installRootPackageOnly",
    value: function installRootPackageOnly(callback) {
      var tracker = this.logger.newItem("install dependencies");

      _NpmUtilities2.default.installInDirOriginalPackageJson(this.repository.rootPath, this.npmConfig, function (err) {
        if (err) return callback(err);
        tracker.info("hoist", "Finished installing in root");
        tracker.completeWork(1);
        callback(err);
      });
    }
  }, {
    key: "runScriptInPackages",
    value: function runScriptInPackages(scriptName, callback) {
      if (!this.filteredPackages.length) {
        return callback(null, true);
      }

      var tracker = this.logger.newItem(scriptName);
      tracker.addWork(this.filteredPackages.length);

      _PackageUtilities2.default.runParallelBatches(this.batchedPackages, function (pkg) {
        return function (done) {
          pkg.runScript(scriptName, function (err) {
            tracker.silly(pkg.name);
            tracker.completeWork(1);
            if (err) {
              err.pkg = pkg;
            }
            done(err);
          });
        };
      }, this.concurrency, function (err) {
        tracker.finish();
        callback(err);
      });
    }

    /**
     * Run the "preinstall" NPM script in all bootstrapped packages
     * @param callback
     */

  }, {
    key: "preinstallPackages",
    value: function preinstallPackages(callback) {
      this.logger.info("lifecycle", "preinstall");
      this.runScriptInPackages("preinstall", callback);
    }

    /**
     * Run the "postinstall" NPM script in all bootstrapped packages
     * @param callback
     */

  }, {
    key: "postinstallPackages",
    value: function postinstallPackages(callback) {
      this.logger.info("lifecycle", "postinstall");
      this.runScriptInPackages("postinstall", callback);
    }

    /**
     * Run the "prepublish" NPM script in all bootstrapped packages
     * @param callback
     */

  }, {
    key: "prepublishPackages",
    value: function prepublishPackages(callback) {
      this.logger.info("lifecycle", "prepublish");
      this.runScriptInPackages("prepublish", callback);
    }

    /**
     * Run the "prepublish" NPM script in all bootstrapped packages
     * @param callback
     */

  }, {
    key: "preparePackages",
    value: function preparePackages(callback) {
      this.logger.info("lifecycle", "prepare");
      this.runScriptInPackages("prepare", callback);
    }
  }, {
    key: "hoistedDirectory",
    value: function hoistedDirectory(dependency) {
      return _path2.default.join(this.repository.rootPath, "node_modules", dependency);
    }
  }, {
    key: "hoistedPackageJson",
    value: function hoistedPackageJson(dependency) {
      try {
        return require(_path2.default.join(this.hoistedDirectory(dependency), "package.json"));
      } catch (e) {
        // Pass.
      }
    }

    /**
     * Determine if a dependency installed at the root satifies the requirements of the passed packages
     * This helps to optimize the bootstrap process and skip dependencies that are already installed
     * @param {String} dependency
     * @param {Array.<String>} packages
     */

  }, {
    key: "dependencySatisfiesPackages",
    value: function dependencySatisfiesPackages(dependency, packages) {
      var _ref = this.hoistedPackageJson(dependency) || {},
          version = _ref.version;

      return packages.every(function (pkg) {
        return _semver2.default.satisfies(version, pkg.allDependencies[dependency]);
      });
    }

    /**
     * Return a object of root and leaf dependencies to install
     * @returns {Object}
     */

  }, {
    key: "getDependenciesToInstall",
    value: function getDependenciesToInstall(tracker) {
      var _this5 = this;

      // find package by name
      var findPackage = function findPackage(name, version) {
        return _lodash2.default.find(_this5.packages, function (pkg) {
          return pkg.name === name && (!version || _semver2.default.satisfies(pkg.version, version));
        });
      };

      var hasPackage = function hasPackage(name, version) {
        return Boolean(findPackage(name, version));
      };

      // Configuration for what packages to hoist may be in lerna.json or it may
      // come in as command line options.
      var _options2 = this.options,
          hoist = _options2.hoist,
          nohoist = _options2.nohoist;


      if (hoist) {
        tracker.verbose("hoist", "enabled for %j", hoist);
      }

      // This will contain entries for each hoistable dependency.
      var root = [];

      // This will map packages to lists of unhoistable dependencies
      var leaves = {};

      /**
       * Map of dependencies to install
       * {
       *   <name>: {
       *     versions: {
       *       <version>: <# of dependents>
       *     },
       *     dependents: {
       *       <version>: [<dependent1>, <dependent2>, ...]
       *     }
       *   }
       * }
       *
       * Example:
       *
       * {
       *   react: {
       *     versions: {
       *       "15.x": 3,
       *       "^0.14.0": 1
       *     },
       *     dependents: {
       *       "15.x": ["my-component1", "my-component2", "my-component3"],
       *       "^0.14.0": ["my-component4"],
       *     }
       *   }
       * }
       */
      var depsToInstall = {};

      Object.keys(this.repository.package.allDependencies).forEach(function (name) {
        var version = _this5.repository.package.allDependencies[name];
        depsToInstall[name] = {
          versions: { [version]: 0 },
          dependents: { [version]: [] }
        };
      });

      // get the map of external dependencies to install
      this.filteredPackages.forEach(function (pkg) {

        // for all package dependencies
        Object.keys(pkg.allDependencies)

        // map to package or normalized external dependency
        .map(function (name) {
          return findPackage(name, pkg.allDependencies[name]) || { name, version: pkg.allDependencies[name] };
        })

        // match external and version mismatched local packages
        .filter(function (dep) {
          return !hasPackage(dep.name, dep.version) || !pkg.hasMatchingDependency(dep, true);
        }).forEach(function (_ref2) {
          var name = _ref2.name,
              version = _ref2.version;

          // Get the object for this package, auto-vivifying.
          var dep = depsToInstall[name] || (depsToInstall[name] = {
            versions: {},
            dependents: {}
          });

          // Add this version if it's the first time we've seen it.
          if (!dep.versions[version]) {
            dep.versions[version] = 0;
            dep.dependents[version] = [];
          }

          // Record the dependency on this version.
          dep.versions[version]++;
          dep.dependents[version].push(pkg.name);
        });
      });

      // determine where each dependency will be installed
      Object.keys(depsToInstall).forEach(function (name) {
        var _depsToInstall$name = depsToInstall[name],
            versions = _depsToInstall$name.versions,
            dependents = _depsToInstall$name.dependents;


        var rootVersion = void 0;

        if (hoist && _PackageUtilities2.default.isHoistedPackage(name, hoist, nohoist)) {
          // Get the most common version.
          var commonVersion = Object.keys(versions).reduce(function (a, b) {
            return versions[a] > versions[b] ? a : b;
          });

          // Get the version required by the repo root (if any).
          // If the root doesn't have a dependency on this package then we'll
          // install the most common dependency there.
          rootVersion = _this5.repository.package.allDependencies[name] || commonVersion;

          if (rootVersion !== commonVersion) {
            tracker.warn("EHOIST_ROOT_VERSION", `The repository root depends on ${name}@${rootVersion}, ` + `which differs from the more common ${name}@${commonVersion}.`);
          }

          // Install the best version we can in the repo root.
          // Even if it's already installed there we still need to make sure any
          // binaries are linked to the packages that depend on them.
          root.push({
            name,
            dependents: (dependents[rootVersion] || []).map(function (dep) {
              return _this5.packageGraph.get(dep).package;
            }),
            dependency: `${name}@${rootVersion}`,
            isSatisfied: _this5.repository.hasDependencyInstalled(name, rootVersion)
          });
        }

        // Add less common versions to package installs.
        Object.keys(versions).forEach(function (version) {
          // Only install deps that can't be hoisted in the leaves.
          if (version === rootVersion) return;

          dependents[version].forEach(function (pkg) {
            if (rootVersion) {
              tracker.warn("EHOIST_PKG_VERSION", `"${pkg}" package depends on ${name}@${version}, ` + `which differs from the hoisted ${name}@${rootVersion}.`);
            }

            // only install dependency if it's not already installed
            (leaves[pkg] || (leaves[pkg] = [])).push({
              dependency: `${name}@${version}`,
              isSatisfied: findPackage(pkg).hasDependencyInstalled(name)
            });
          });
        });
      });

      tracker.silly("root dependencies", JSON.stringify(root, null, 2));
      tracker.silly("leaf dependencies", JSON.stringify(leaves, null, 2));

      return { root, leaves };
    }

    /**
     * Install external dependencies for all packages
     * @param {Function} callback
     */

  }, {
    key: "installExternalDependencies",
    value: function installExternalDependencies(callback) {
      var _this6 = this;

      var tracker = this.logger.newItem("install dependencies");

      var _getDependenciesToIns = this.getDependenciesToInstall(tracker),
          leaves = _getDependenciesToIns.leaves,
          root = _getDependenciesToIns.root;

      var actions = [];

      // Start root install first, if any, since it's likely to take the longest.
      if (Object.keys(root).length) {

        // If we have anything to install in the root then we'll install
        // _everything_ that needs to go there.  This is important for
        // consistent behavior across npm clients.
        var depsToInstallInRoot = root.some(function (_ref3) {
          var isSatisfied = _ref3.isSatisfied;
          return !isSatisfied;
        }) ? root.map(function (_ref4) {
          var dependency = _ref4.dependency;
          return dependency;
        }) : [];

        actions.push(function (cb) {
          if (depsToInstallInRoot.length) {
            tracker.info("hoist", "Installing hoisted dependencies into root");
          }

          _NpmUtilities2.default.installInDir(_this6.repository.rootPath, depsToInstallInRoot, _this6.npmConfig, function (err) {
            if (err) return cb(err);

            // Link binaries into dependent packages so npm scripts will have
            // access to them.
            _async2.default.series(root.map(function (_ref5) {
              var name = _ref5.name,
                  dependents = _ref5.dependents;
              return function (cb) {
                var _ref6 = _this6.hoistedPackageJson(name) || {},
                    bin = _ref6.bin;

                if (bin) {
                  _async2.default.series(dependents.map(function (pkg) {
                    return function (cb) {
                      var src = _this6.hoistedDirectory(name);
                      var dest = pkg.nodeModulesLocation;
                      _PackageUtilities2.default.createBinaryLink(src, dest, name, bin, cb);
                    };
                  }), cb);
                } else {
                  cb();
                }
              };
            }), function (err) {
              tracker.info("hoist", "Finished installing in root");
              tracker.completeWork(1);
              cb(err);
            });
          });
        });

        // Remove any hoisted dependencies that may have previously been
        // installed in package directories.
        actions.push(function (cb) {
          // Compute the list of candidate directories synchronously
          var candidates = root.filter(function (pkg) {
            return pkg.dependents.length;
          }).reduce(function (list, _ref7) {
            var name = _ref7.name,
                dependents = _ref7.dependents;

            var dirs = dependents.filter(function (pkg) {
              return pkg.nodeModulesLocation !== _this6.repository.nodeModulesLocation;
            }).map(function (pkg) {
              return _path2.default.join(pkg.nodeModulesLocation, name);
            });

            return list.concat(dirs);
          }, []);

          if (!candidates.length) {
            tracker.verbose("hoist", "nothing to prune");
            tracker.completeWork(1); // the action "work"
            return cb();
          }

          tracker.info("hoist", "Pruning hoisted dependencies");
          tracker.silly("prune", candidates);
          tracker.addWork(candidates.length);

          _async2.default.series(candidates.map(function (dirPath) {
            return function (done) {
              _FileSystemUtilities2.default.rimraf(dirPath, function (err) {
                tracker.verbose("prune", dirPath);
                tracker.completeWork(1);
                done(err);
              });
            };
          }), function (err) {
            tracker.info("hoist", "Finished pruning hoisted dependencies");
            tracker.completeWork(1); // the action "work"
            cb(err);
          });
        });
      }

      var leafNpmConfig = Object.assign({}, this.npmConfig, {
        // Use `npm install --global-style` for leaves when hoisting is enabled
        npmGlobalStyle: !!this.options.hoist
      });

      // Install anything that needs to go into the leaves.
      Object.keys(leaves).map(function (pkgName) {
        return { pkg: _this6.packageGraph.get(pkgName).package, deps: leaves[pkgName] };
      }).forEach(function (_ref8) {
        var pkg = _ref8.pkg,
            deps = _ref8.deps;

        // If we have any unsatisfied deps then we need to install everything.
        // This is important for consistent behavior across npm clients.
        if (deps.some(function (_ref9) {
          var isSatisfied = _ref9.isSatisfied;
          return !isSatisfied;
        })) {
          actions.push(function (cb) {
            _NpmUtilities2.default.installInDir(pkg.location, deps.map(function (_ref10) {
              var dependency = _ref10.dependency;
              return dependency;
            }), leafNpmConfig, function (err) {
              tracker.verbose("installed leaf", pkg.name);
              tracker.completeWork(1);
              cb(err);
            });
          });
        }
      });

      if (actions.length) {
        tracker.info("", "Installing external dependencies");
        tracker.verbose("actions", "%d actions, concurrency %d", actions.length, this.concurrency);
        tracker.addWork(actions.length);
      }

      _async2.default.parallelLimit(actions, this.concurrency, function (err) {
        tracker.finish();
        callback(err);
      });
    }

    /**
     * Symlink all packages to the packages/node_modules directory
     * Symlink package binaries to dependent packages' node_modules/.bin directory
     * @param {Function} callback
     */

  }, {
    key: "symlinkPackages",
    value: function symlinkPackages(callback) {
      var forceLocal = false;
      var filteredPackages = this.filteredPackages,
          packageGraph = this.packageGraph,
          logger = this.logger;

      _PackageUtilities2.default.symlinkPackages(filteredPackages, packageGraph, logger, forceLocal, callback);
    }
  }, {
    key: "requiresGit",
    get: function get() {
      return false;
    }
  }]);

  return BootstrapCommand;
}(_Command3.default);

exports.default = BootstrapCommand;