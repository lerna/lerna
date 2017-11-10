"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ValidationError = exports.builder = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.commandNameFromClassName = commandNameFromClassName;

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _dedent = require("dedent");

var _dedent2 = _interopRequireDefault(_dedent);

var _npmlog = require("npmlog");

var _npmlog2 = _interopRequireDefault(_npmlog);

var _ChildProcessUtilities = require("./ChildProcessUtilities");

var _ChildProcessUtilities2 = _interopRequireDefault(_ChildProcessUtilities);

var _FileSystemUtilities = require("./FileSystemUtilities");

var _FileSystemUtilities2 = _interopRequireDefault(_FileSystemUtilities);

var _GitUtilities = require("./GitUtilities");

var _GitUtilities2 = _interopRequireDefault(_GitUtilities);

var _GitVersionParser = require("./GitVersionParser");

var _GitVersionParser2 = _interopRequireDefault(_GitVersionParser);

var _PackageUtilities = require("./PackageUtilities");

var _PackageUtilities2 = _interopRequireDefault(_PackageUtilities);

var _Repository = require("./Repository");

var _Repository2 = _interopRequireDefault(_Repository);

var _filterFlags = require("./utils/filterFlags");

var _filterFlags2 = _interopRequireDefault(_filterFlags);

var _writeLogFile = require("./utils/writeLogFile");

var _writeLogFile2 = _interopRequireDefault(_writeLogFile);

var _UpdatedPackagesCollector = require("./UpdatedPackagesCollector");

var _UpdatedPackagesCollector2 = _interopRequireDefault(_UpdatedPackagesCollector);

var _VersionSerializer = require("./VersionSerializer");

var _VersionSerializer2 = _interopRequireDefault(_VersionSerializer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

// handle log.success()
_npmlog2.default.addLevel("success", 3001, { fg: "green", bold: true });

var DEFAULT_CONCURRENCY = 4;

var builder = exports.builder = {
  "loglevel": {
    defaultDescription: "info",
    describe: "What level of logs to report.",
    type: "string"
  },
  "concurrency": {
    describe: "How many threads to use if lerna parallelises the tasks.",
    type: "number",
    requiresArg: true
  },
  "scope": {
    describe: _dedent2.default`
      Restricts the scope to package names matching the given glob.
      (Only for 'run', 'exec', 'clean', 'ls', and 'bootstrap' commands)
    `,
    type: "string",
    requiresArg: true
  },
  "since": {
    describe: _dedent2.default`
      Restricts the scope to the packages that have been updated since
      the specified [ref], or if not specified, the latest tag.
      (Only for 'run', 'exec', 'clean', 'ls', and 'bootstrap' commands)
    `,
    type: "string",
    requiresArg: false
  },
  "ignore": {
    describe: _dedent2.default`
      Ignore packages with names matching the given glob.
      (Only for 'run', 'exec', 'clean', 'ls', and 'bootstrap' commands)
    `,
    type: "string",
    requiresArg: true
  },
  "include-filtered-dependencies": {
    describe: _dedent2.default`
      Include all transitive dependencies when running a command, regardless of --scope, --since or --ignore.
    `
  },
  "registry": {
    describe: "Use the specified registry for all npm client operations.",
    type: "string",
    requiresArg: true
  },
  "reject-cycles": {
    describe: "Fail if a cycle is detected among dependencies",
    type: "boolean",
    default: false
  },
  "sort": {
    describe: "Sort packages topologically (all dependencies before dependents)",
    type: "boolean",
    default: undefined
  },
  "max-buffer": {
    describe: "Set max-buffer(bytes) for Command execution",
    type: "number",
    requiresArg: true
  }
};

var ValidationError = exports.ValidationError = function (_Error) {
  _inherits(ValidationError, _Error);

  function ValidationError(prefix, message) {
    _classCallCheck(this, ValidationError);

    var _this = _possibleConstructorReturn(this, (ValidationError.__proto__ || Object.getPrototypeOf(ValidationError)).call(this, message));

    _this.name = "ValidationError";
    _npmlog2.default.error(prefix, message);
    return _this;
  }

  return ValidationError;
}(Error);

var ValidationWarning = function (_Error2) {
  _inherits(ValidationWarning, _Error2);

  function ValidationWarning(message) {
    _classCallCheck(this, ValidationWarning);

    var _this2 = _possibleConstructorReturn(this, (ValidationWarning.__proto__ || Object.getPrototypeOf(ValidationWarning)).call(this, message));

    _this2.name = "ValidationWarning";
    _npmlog2.default.warn("EINVALID", message);
    return _this2;
  }

  return ValidationWarning;
}(Error);

var Command = function () {
  function Command(input, flags, cwd) {
    _classCallCheck(this, Command);

    _npmlog2.default.pause();
    _npmlog2.default.heading = "lerna";

    this.input = input;
    this._flags = flags;

    _npmlog2.default.silly("input", input);
    _npmlog2.default.silly("flags", (0, _filterFlags2.default)(flags));

    this.lernaVersion = require("../package.json").version;
    this.repository = new _Repository2.default(cwd);
    this.logger = _npmlog2.default.newGroup(this.name);
  }

  _createClass(Command, [{
    key: "run",
    value: function run() {
      var _this3 = this;

      var loglevel = this.options.loglevel;


      if (loglevel) {
        _npmlog2.default.level = loglevel;
      }

      // no logging is emitted until run() is called
      _npmlog2.default.resume();
      _npmlog2.default.info("version", this.lernaVersion);

      if (this.repository.isIndependent()) {
        _npmlog2.default.info("versioning", "independent");
      }

      return new Promise(function (resolve, reject) {
        var onComplete = function onComplete(err, exitCode) {
          if (err) {
            if (typeof err === 'string') err = { stack: err };
            err.exitCode = exitCode;
            reject(err);
          } else {
            resolve({ exitCode });
          }
        };

        try {
          _this3.runValidations();
          _this3.runPreparations();
        } catch (err) {
          return _this3._complete(err, 1, onComplete);
        }

        _this3.runCommand(onComplete);
      });
    }
  }, {
    key: "runValidations",
    value: function runValidations() {
      if (this.requiresGit && !_GitUtilities2.default.isInitialized(this.execOpts)) {
        throw new ValidationError("ENOGIT", "This is not a git repository, did you already run `git init` or `lerna init`?");
      }

      if (!this.repository.packageJson) {
        throw new ValidationError("ENOPKG", "`package.json` does not exist, have you run `lerna init`?");
      }

      if (!this.repository.initVersion) {
        throw new ValidationError("ENOLERNA", "`lerna.json` does not exist, have you run `lerna init`?");
      }

      if (this.options.independent && !this.repository.isIndependent()) {
        throw new ValidationError("EVERSIONMODE", _dedent2.default`
          You ran lerna with --independent or -i, but the repository is not set to independent mode.
          To use independent mode you need to set lerna.json's "version" property to "independent".
          Then you won't need to pass the --independent or -i flags.
        `);
      }

      if (!this.repository.isCompatibleLerna(this.lernaVersion)) {
        throw new ValidationError("EMISMATCH", _dedent2.default`
          Incompatible local version of lerna detected!
          The running version of lerna is ${this.lernaVersion}, but the version in lerna.json is ${this.repository.initVersion}.
          You can either run 'lerna init' again or install 'lerna@^${this.repository.initVersion}'.
        `);
      }

      /* eslint-disable max-len */
      // TODO: remove these warnings eventually
      if (_FileSystemUtilities2.default.existsSync(this.repository.versionLocation)) {
        throw new ValidationWarning("You have a `VERSION` file in your repository, this is leftover from a previous version. Please run `lerna init` to update.");
      }

      if (process.env.NPM_DIST_TAG !== undefined) {
        throw new ValidationWarning("`NPM_DIST_TAG=[tagname] lerna publish` is deprecated, please use `lerna publish --tag [tagname]` instead.");
      }

      if (process.env.FORCE_VERSION !== undefined) {
        throw new ValidationWarning("`FORCE_VERSION=[package/*] lerna updated/publish` is deprecated, please use `lerna updated/publish --force-publish [package/*]` instead.");
      }

      if (this.options.onlyExplicitUpdates) {
        throw new ValidationWarning("`--only-explicit-updates` has been removed. This flag was only ever added for Babel and we never should have exposed it to everyone.");
      }
      /* eslint-enable max-len */
    }
  }, {
    key: "runPreparations",
    value: function runPreparations() {
      var _repository = this.repository,
          rootPath = _repository.rootPath,
          packageConfigs = _repository.packageConfigs;
      var _options = this.options,
          scope = _options.scope,
          ignore = _options.ignore,
          registry = _options.registry,
          since = _options.since,
          useGitVersion = _options.useGitVersion,
          gitVersionPrefix = _options.gitVersionPrefix;


      if (scope) {
        _npmlog2.default.info("scope", scope);
      }

      if (ignore) {
        _npmlog2.default.info("ignore", ignore);
      }

      if (registry) {
        this.npmRegistry = registry;
      }

      try {
        var versionParser = useGitVersion && new _GitVersionParser2.default(gitVersionPrefix);
        var packages = _PackageUtilities2.default.getPackages({ rootPath, packageConfigs });
        var packageGraph = _PackageUtilities2.default.getPackageGraph(packages, false, versionParser);

        if (useGitVersion) {
          packages.forEach(function (pkg) {
            pkg.versionSerializer = new _VersionSerializer2.default({
              graphDependencies: packageGraph.get(pkg.name).dependencies,
              versionParser
            });
          });
        }

        this.packages = packages;
        this.packageGraph = packageGraph;
        this.filteredPackages = _PackageUtilities2.default.filterPackages(packages, { scope, ignore });

        // The UpdatedPackagesCollector requires that filteredPackages be present prior to checking for
        // updates. That's okay because it further filters based on what's already been filtered.
        if (typeof since === "string") {
          var updated = new _UpdatedPackagesCollector2.default(this).getUpdates().map(function (update) {
            return update.package.name;
          });
          this.filteredPackages = this.filteredPackages.filter(function (pkg) {
            return updated.indexOf(pkg.name) > -1;
          });
        }

        if (this.options.includeFilteredDependencies) {
          this.filteredPackages = _PackageUtilities2.default.addDependencies(this.filteredPackages, this.packageGraph);
        }
      } catch (err) {
        this._logError("EPACKAGES", "Errored while collecting packages and package graph", err);
        throw err;
      }
    }
  }, {
    key: "runCommand",
    value: function runCommand(callback) {
      var _this4 = this;

      this._attempt("initialize", function () {
        _this4._attempt("execute", function () {
          _this4._complete(null, 0, callback);
        }, callback);
      }, callback);
    }
  }, {
    key: "_attempt",
    value: function _attempt(method, next, callback) {
      var _this5 = this;

      try {
        _npmlog2.default.silly(method, "attempt");

        this[method](function (err, completed) {
          var code = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;

          if (err) {
            // If we have package details we can direct the developers attention
            // to that specific package.
            if (err.pkg) {
              _this5._logPackageError(method, err);
            } else {
              _this5._logError(method, "callback with error", err);
            }
            _this5._complete(err, 1, callback);
          } else if (!completed) {
            // an early exit is rarely an error
            _npmlog2.default.verbose(method, "exited early");
            _this5._complete(null, code, callback);
          } else {
            _npmlog2.default.silly(method, "success");
            next();
          }
        });
      } catch (err) {
        // ValidationError already logged appropriately
        if (err.name !== "ValidationError") {
          this._logError(method, "caught error", err);
        }
        this._complete(err, 1, callback);
      }
    }
  }, {
    key: "_complete",
    value: function _complete(err, code, callback) {
      if (err && err.name !== "ValidationWarning" && err.name !== "ValidationError") {
        (0, _writeLogFile2.default)(this.repository.rootPath);
      }

      // process.exit() is an anti-pattern
      process.exitCode = code;

      var finish = function finish() {
        if (callback) {
          callback(err, code);
        }
      };

      var childProcessCount = _ChildProcessUtilities2.default.getChildProcessCount();
      if (childProcessCount > 0) {
        _npmlog2.default.warn("complete", `Waiting for ${childProcessCount} child ` + `process${childProcessCount === 1 ? "" : "es"} to exit. ` + "CTRL-C to exit immediately.");
        _ChildProcessUtilities2.default.onAllExited(finish);
      } else {
        finish();
      }
    }
  }, {
    key: "_legacyOptions",
    value: function _legacyOptions() {
      var _this6 = this;

      return ["bootstrap", "publish"].reduce(function (opts, command) {
        if (_this6.name === command && _this6.repository.lernaJson[`${command}Config`]) {
          _npmlog2.default.warn("deprecated", `\`${command}Config.ignore\` has been replaced by \`command.${command}.ignore\`.`);
          opts.ignore = _this6.repository.lernaJson[`${command}Config`].ignore;
        }
        return opts;
      }, {});
    }
  }, {
    key: "initialize",
    value: function initialize() {
      throw new Error("command.initialize() needs to be implemented.");
    }
  }, {
    key: "execute",
    value: function execute() {
      throw new Error("command.execute() needs to be implemented.");
    }
  }, {
    key: "_logError",
    value: function _logError(method, description, err) {
      _npmlog2.default.error(method, description);

      // npmlog does some funny stuff to the stack by default,
      // so pass it directly to avoid duplication.
      _npmlog2.default.error("", cleanStack(err, this.className));
    }
  }, {
    key: "_logPackageError",
    value: function _logPackageError(method, err) {
      _npmlog2.default.error(method, _dedent2.default`
      Error occured with '${err.pkg.name}' while running '${err.cmd}'
    `);

      var pkgPrefix = `${err.cmd} [${err.pkg.name}]`;
      _npmlog2.default.error(pkgPrefix, `Output from stdout:`);
      _npmlog2.default.pause();
      console.error(err.stdout);

      _npmlog2.default.resume();
      _npmlog2.default.error(pkgPrefix, `Output from stderr:`);
      _npmlog2.default.pause();
      console.error(err.stderr);

      // Below is just to ensure something sensible is printed after the long
      // stream of logs
      _npmlog2.default.resume();
      _npmlog2.default.error(method, _dedent2.default`
      Error occured with '${err.pkg.name}' while running '${err.cmd}'
    `);
    }
  }, {
    key: "concurrency",
    get: function get() {
      if (!this._concurrency) {
        var concurrency = this.options.concurrency;

        this._concurrency = Math.max(1, +concurrency || DEFAULT_CONCURRENCY);
      }

      return this._concurrency;
    }
  }, {
    key: "toposort",
    get: function get() {
      if (!this._toposort) {
        var sort = this.options.sort;
        // If the option isn't present then the default is to sort.

        this._toposort = sort == null || sort;
      }

      return this._toposort;
    }
  }, {
    key: "name",
    get: function get() {
      // For a class named "FooCommand" this returns "foo".
      return commandNameFromClassName(this.className);
    }
  }, {
    key: "className",
    get: function get() {
      return this.constructor.name;
    }
  }, {
    key: "execOpts",
    get: function get() {
      if (!this._execOpts) {
        this._execOpts = {
          cwd: this.repository.rootPath
        };

        if (this.options.maxBuffer) {
          this._execOpts.maxBuffer = this.options.maxBuffer;
        }
      }

      return this._execOpts;
    }
  }, {
    key: "requiresGit",
    get: function get() {
      return true;
    }

    // Override this to inherit config from another command.
    // For example `updated` inherits config from `publish`.

  }, {
    key: "otherCommandConfigs",
    get: function get() {
      return [];
    }
  }, {
    key: "options",
    get: function get() {
      if (!this._options) {
        // Command config object is either "commands" or "command".
        var _repository$lernaJson = this.repository.lernaJson,
            commands = _repository$lernaJson.commands,
            command = _repository$lernaJson.command;

        // The current command always overrides otherCommandConfigs

        var lernaCommandOverrides = [this.name].concat(_toConsumableArray(this.otherCommandConfigs)).map(function (name) {
          return (commands || command || {})[name];
        });

        this._options = _lodash2.default.defaults.apply(_lodash2.default, [{},
        // CLI flags, which if defined overrule subsequent values
        this._flags].concat(_toConsumableArray(lernaCommandOverrides), [
        // Global options from `lerna.json`
        this.repository.lernaJson,
        // Command specific defaults
        this.defaultOptions,
        // Deprecated legacy options in `lerna.json`
        this._legacyOptions()]));
      }

      return this._options;
    }
  }, {
    key: "defaultOptions",
    get: function get() {
      return {
        concurrency: DEFAULT_CONCURRENCY,
        sort: true
      };
    }
  }]);

  return Command;
}();

exports.default = Command;
function commandNameFromClassName(className) {
  return className.replace(/Command$/, "").toLowerCase();
}

function cleanStack(err, className) {
  var lines = err.stack ? err.stack.split('\n') : err.split('\n');
  var cutoff = new RegExp(`^    at ${className}._attempt .*$`);
  var relevantIndex = lines.findIndex(function (line) {
    return cutoff.test(line);
  });
  return lines.slice(0, relevantIndex).join('\n');
}