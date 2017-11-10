"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.builder = exports.describe = exports.command = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.handler = handler;

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _writeJsonFile = require("write-json-file");

var _writeJsonFile2 = _interopRequireDefault(_writeJsonFile);

var _writePkg = require("write-pkg");

var _writePkg2 = _interopRequireDefault(_writePkg);

var _Command2 = require("../Command");

var _Command3 = _interopRequireDefault(_Command2);

var _FileSystemUtilities = require("../FileSystemUtilities");

var _FileSystemUtilities2 = _interopRequireDefault(_FileSystemUtilities);

var _GitUtilities = require("../GitUtilities");

var _GitUtilities2 = _interopRequireDefault(_GitUtilities);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function handler(argv) {
  new InitCommand(argv._, argv, argv._cwd).run().then(argv._onFinish, argv._onFinish);
}

var command = exports.command = "init";

var describe = exports.describe = "Create a new Lerna repo or upgrade an existing repo to the current version " + "of Lerna.";

var builder = exports.builder = {
  "exact": {
    describe: "Specify lerna dependency version in package.json without a caret (^)",
    type: "boolean",
    default: undefined
  },
  "independent": {
    describe: "Version packages independently",
    alias: "i",
    type: "boolean",
    default: undefined
  }
};

var InitCommand = function (_Command) {
  _inherits(InitCommand, _Command);

  function InitCommand() {
    _classCallCheck(this, InitCommand);

    return _possibleConstructorReturn(this, (InitCommand.__proto__ || Object.getPrototypeOf(InitCommand)).apply(this, arguments));
  }

  _createClass(InitCommand, [{
    key: "runValidations",


    // don't do any of this.
    value: function runValidations() {}
  }, {
    key: "runPreparations",
    value: function runPreparations() {}
  }, {
    key: "initialize",
    value: function initialize(callback) {
      if (!_GitUtilities2.default.isInitialized(this.execOpts)) {
        this.logger.info("", "Initializing Git repository");
        _GitUtilities2.default.init(this.execOpts);
      }

      this.exact = this.options.exact;

      callback(null, true);
    }
  }, {
    key: "execute",
    value: function execute(callback) {
      this.ensurePackageJSON();
      this.ensureLernaJson();
      this.ensurePackagesDir();
      this.ensureNoVersionFile();
      this.logger.success("", "Initialized Lerna files");
      callback(null, true);
    }
  }, {
    key: "ensurePackageJSON",
    value: function ensurePackageJSON() {
      var packageJson = this.repository.packageJson;

      if (!packageJson) {
        packageJson = {};
        this.logger.info("", "Creating package.json");
      } else {
        this.logger.info("", "Updating package.json");
      }

      var targetDependencies = void 0;
      if (packageJson.dependencies && packageJson.dependencies.lerna) {
        // lerna is a dependency in the current project
        targetDependencies = packageJson.dependencies;
      } else {
        // lerna is a devDependency or no dependency, yet
        if (!packageJson.devDependencies) packageJson.devDependencies = {};
        targetDependencies = packageJson.devDependencies;
      }

      targetDependencies.lerna = this.exact ? this.lernaVersion : `^${this.lernaVersion}`;

      _writePkg2.default.sync(this.repository.packageJsonLocation, packageJson);
    }
  }, {
    key: "ensureLernaJson",
    value: function ensureLernaJson() {
      // lernaJson already defaulted to empty object in Repository constructor
      var lernaJson = this.repository.lernaJson;

      var version = void 0;

      if (this.options.independent) {
        version = "independent";
      } else if (_FileSystemUtilities2.default.existsSync(this.repository.versionLocation)) {
        version = _FileSystemUtilities2.default.readFileSync(this.repository.versionLocation);
      } else if (this.repository.version) {
        version = this.repository.version;
      } else {
        version = "0.0.0";
      }

      if (!this.repository.initVersion) {
        this.logger.info("", "Creating lerna.json");
      } else {
        this.logger.info("", "Updating lerna.json");
      }

      Object.assign(lernaJson, {
        lerna: this.lernaVersion,
        packages: this.repository.packageConfigs,
        version: version
      });

      if (this.exact) {
        // ensure --exact is preserved for future init commands
        var configKey = lernaJson.commands ? "commands" : "command";
        _lodash2.default.set(lernaJson, `${configKey}.init.exact`, true);
      }

      _writeJsonFile2.default.sync(this.repository.lernaJsonLocation, lernaJson, { indent: 2 });
    }
  }, {
    key: "ensureNoVersionFile",
    value: function ensureNoVersionFile() {
      var versionLocation = this.repository.versionLocation;
      if (_FileSystemUtilities2.default.existsSync(versionLocation)) {
        this.logger.info("", "Removing old VERSION file");
        _FileSystemUtilities2.default.unlinkSync(versionLocation);
      }
    }
  }, {
    key: "ensurePackagesDir",
    value: function ensurePackagesDir() {
      this.logger.info("", "Creating packages directory");
      this.repository.packageParentDirs.map(function (dir) {
        return _FileSystemUtilities2.default.mkdirpSync(dir);
      });
    }
  }, {
    key: "defaultOptions",
    get: function get() {
      return {
        exact: false,
        independent: false
      };
    }
  }]);

  return InitCommand;
}(_Command3.default);

exports.default = InitCommand;