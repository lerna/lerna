"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.builder = exports.describe = exports.command = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.handler = handler;

var _async = require("async");

var _async2 = _interopRequireDefault(_async);

var _dedent = require("dedent");

var _dedent2 = _interopRequireDefault(_dedent);

var _path = require("path");

var _path2 = _interopRequireDefault(_path);

var _ChildProcessUtilities = require("../ChildProcessUtilities");

var _ChildProcessUtilities2 = _interopRequireDefault(_ChildProcessUtilities);

var _Command2 = require("../Command");

var _Command3 = _interopRequireDefault(_Command2);

var _FileSystemUtilities = require("../FileSystemUtilities");

var _FileSystemUtilities2 = _interopRequireDefault(_FileSystemUtilities);

var _GitUtilities = require("../GitUtilities");

var _GitUtilities2 = _interopRequireDefault(_GitUtilities);

var _PromptUtilities = require("../PromptUtilities");

var _PromptUtilities2 = _interopRequireDefault(_PromptUtilities);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function handler(argv) {
  new ImportCommand([argv.pathToRepo], argv, argv._cwd).run().then(argv._onFinish, argv._onFinish);
}

var command = exports.command = "import <pathToRepo>";

var describe = exports.describe = _dedent2.default`
  Import the package in <pathToRepo> into packages/<directory-name> with commit history.
`;

var builder = exports.builder = {
  "yes": {
    group: "Command Options:",
    describe: "Skip all confirmation prompts"
  },
  "flatten": {
    group: "Command Options:",
    describe: "Import each merge commit as a single change the merge introduced"
  }
};

var ImportCommand = function (_Command) {
  _inherits(ImportCommand, _Command);

  function ImportCommand() {
    _classCallCheck(this, ImportCommand);

    return _possibleConstructorReturn(this, (ImportCommand.__proto__ || Object.getPrototypeOf(ImportCommand)).apply(this, arguments));
  }

  _createClass(ImportCommand, [{
    key: "gitParamsForTargetCommits",
    value: function gitParamsForTargetCommits() {
      var params = ["log", "--format=%h"];
      if (this.options.flatten) {
        params.push("--first-parent");
      }
      return params;
    }
  }, {
    key: "initialize",
    value: function initialize(callback) {
      var inputPath = this.input[0];

      var externalRepoPath = _path2.default.resolve(inputPath);
      var externalRepoBase = _path2.default.basename(externalRepoPath);

      this.externalExecOpts = Object.assign({}, this.execOpts, {
        cwd: externalRepoPath
      });

      try {
        var stats = _FileSystemUtilities2.default.statSync(externalRepoPath);

        if (!stats.isDirectory()) {
          throw new Error(`Input path "${inputPath}" is not a directory`);
        }

        var packageJson = _path2.default.join(externalRepoPath, "package.json");
        var packageName = require(packageJson).name;

        if (!packageName) {
          throw new Error(`No package name specified in "${packageJson}"`);
        }
      } catch (e) {
        if (e.code === "ENOENT") {
          return callback(new Error(`No repository found at "${inputPath}"`));
        }

        return callback(e);
      }

      var targetBase = getTargetBase(this.repository.packageConfigs);
      this.targetDir = _path2.default.join(targetBase, externalRepoBase);

      if (_FileSystemUtilities2.default.existsSync(_path2.default.resolve(this.repository.rootPath, this.targetDir))) {
        return callback(new Error(`Target directory already exists "${this.targetDir}"`));
      }

      this.commits = this.externalExecSync("git", this.gitParamsForTargetCommits()).split("\n").reverse();
      // this.commits = this.externalExecSync("git", [
      //   "rev-list",
      //   "--no-merges",
      //   "--topo-order",
      //   "--reverse",
      //   "HEAD",
      // ]).split("\n");

      if (!this.commits.length) {
        return callback(new Error(`No git commits to import at "${inputPath}"`));
      }

      // Stash the repo's pre-import head away in case something goes wrong.
      this.preImportHead = _GitUtilities2.default.getCurrentSHA(this.execOpts);

      if (_ChildProcessUtilities2.default.execSync("git", ["diff-index", "HEAD"], this.execOpts)) {
        return callback(new Error("Local repository has un-committed changes"));
      }

      this.logger.info("", `About to import ${this.commits.length} commits from ${inputPath} into ${this.targetDir}`);

      if (this.options.yes) {
        callback(null, true);
      } else {
        var message = "Are you sure you want to import these commits onto the current branch?";

        _PromptUtilities2.default.confirm(message, function (confirmed) {
          callback(null, confirmed);
        });
      }
    }
  }, {
    key: "externalExecSync",
    value: function externalExecSync(cmd, args) {
      return _ChildProcessUtilities2.default.execSync(cmd, args, this.externalExecOpts);
    }
  }, {
    key: "createPatchForCommit",
    value: function createPatchForCommit(sha) {
      var patch = null;
      if (this.options.flatten) {
        var diff = this.externalExecSync("git", ["log", "--reverse", "--first-parent", "-p", "-m", "--pretty=email", "--stat", "--binary", "-1", sha]);
        var version = this.externalExecSync("git", ["--version"]).replace(/git version /g, '');
        patch = `${diff}\n--\n${version}`;
      } else {
        patch = this.externalExecSync("git", ["format-patch", "-1", sha, "--stdout"]);
      }

      var formattedTarget = this.targetDir.replace(/\\/g, '/');
      var replacement = `$1/${formattedTarget}`;
      // Create a patch file for this commit and prepend the target directory
      // to all affected files.  This moves the git history for the entire
      // external repository into the package subdirectory, commit by commit.
      return patch.replace(/^([-+]{3} [ab])/mg, replacement).replace(/^(diff --git a)/mg, replacement).replace(/^(diff --git \S+ b)/mg, replacement).replace(/^(rename (from|to)) /mg, `$1 ${formattedTarget}/`);
    }
  }, {
    key: "execute",
    value: function execute(callback) {
      var _this2 = this;

      var tracker = this.logger.newItem("execute");

      tracker.addWork(this.commits.length);

      _async2.default.series(this.commits.map(function (sha) {
        return function (done) {
          tracker.info(sha);

          var patch = _this2.createPatchForCommit(sha);
          // Apply the modified patch to the current lerna repository, preserving
          // original commit date, author and message.
          //
          // Fall back to three-way merge, which can help with duplicate commits
          // due to merge history.
          _ChildProcessUtilities2.default.exec("git", ["am", "-3"], _this2.execOpts, function (err) {
            if (err) {
              var isEmptyCommit = err.stdout.indexOf("Patch is empty.") === 0;
              if (isEmptyCommit) {
                // Automatically skip empty commits
                _ChildProcessUtilities2.default.execSync("git", ["am", "--skip"], _this2.execOpts);

                // Reset previous error
                err = null;
              } else {
                // Give some context for the error message.
                err = `Failed to apply commit ${sha}.\n${err}\n` + `Rolling back to previous HEAD (commit ${_this2.preImportHead}).\n` + `You may try with --flatten to import flat history.`;

                // Abort the failed `git am` and roll back to previous HEAD.
                _ChildProcessUtilities2.default.execSync("git", ["am", "--abort"], _this2.execOpts);
                _ChildProcessUtilities2.default.execSync("git", ["reset", "--hard", _this2.preImportHead], _this2.execOpts);
              }
            }

            tracker.completeWork(1);

            done(err);
          }).stdin.end(patch);
        };
      }), function (err) {
        tracker.finish();

        if (!err) {
          _this2.logger.success("import", "finished");
        } else {
          _this2.logger.error("import", err);
        }

        callback(err, !err);
      });
    }
  }]);

  return ImportCommand;
}(_Command3.default);

exports.default = ImportCommand;


function getTargetBase(packageConfigs) {
  var straightPackageDirectories = packageConfigs.filter(function (p) {
    return _path2.default.basename(p) === "*";
  }).map(function (p) {
    return _path2.default.dirname(p);
  });

  return straightPackageDirectories[0] || "packages";
}