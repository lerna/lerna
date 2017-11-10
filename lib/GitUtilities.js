"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _os = require("os");

var _npmlog = require("npmlog");

var _npmlog2 = _interopRequireDefault(_npmlog);

var _path = require("path");

var _path2 = _interopRequireDefault(_path);

var _tempWrite = require("temp-write");

var _tempWrite2 = _interopRequireDefault(_tempWrite);

var _ChildProcessUtilities = require("./ChildProcessUtilities");

var _ChildProcessUtilities2 = _interopRequireDefault(_ChildProcessUtilities);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var GitUtilities = function () {
  function GitUtilities() {
    _classCallCheck(this, GitUtilities);
  }

  _createClass(GitUtilities, null, [{
    key: "isDetachedHead",
    value: function isDetachedHead(opts) {
      _npmlog2.default.silly("isDetachedHead");

      var branchName = GitUtilities.getCurrentBranch(opts);
      var isDetached = branchName === "HEAD";
      _npmlog2.default.verbose("isDetachedHead", isDetached);

      return isDetached;
    }
  }, {
    key: "isInitialized",
    value: function isInitialized(opts) {
      _npmlog2.default.silly("isInitialized");
      var initialized = void 0;

      try {
        // we only want the return code, so ignore stdout/stderr
        _ChildProcessUtilities2.default.execSync("git", ["rev-parse"], Object.assign({}, opts, {
          stdio: "ignore"
        }));
        initialized = true;
      } catch (err) {
        _npmlog2.default.verbose("isInitialized", "swallowed error", err);
        initialized = false;
      }

      // this does not need to be verbose
      _npmlog2.default.silly("isInitialized", initialized);
      return initialized;
    }
  }, {
    key: "addFile",
    value: function addFile(file, opts) {
      _npmlog2.default.silly("addFile", file);
      _ChildProcessUtilities2.default.execSync("git", ["add", file], opts);
    }
  }, {
    key: "commit",
    value: function commit(message, opts) {
      _npmlog2.default.silly("commit", message);
      var args = ["commit", "--no-gpg-sign"];

      if (message.indexOf(_os.EOL) > -1) {
        // Use tempfile to allow multi\nline strings.
        args.push("-F", _tempWrite2.default.sync(message, "lerna-commit.txt"));
      } else {
        args.push("-m", message);
      }

      _npmlog2.default.verbose("commit", args);
      _ChildProcessUtilities2.default.execSync("git", args, opts);
    }
  }, {
    key: "addTag",
    value: function addTag(tag, opts) {
      _npmlog2.default.silly("addTag", tag);
      _ChildProcessUtilities2.default.execSync("git", ["tag", tag, "-m", tag], opts);
    }
  }, {
    key: "removeTag",
    value: function removeTag(tag, opts) {
      _npmlog2.default.silly("removeTag", tag);
      _ChildProcessUtilities2.default.execSync("git", ["tag", "-d", tag], opts);
    }
  }, {
    key: "hasTags",
    value: function hasTags(opts) {
      _npmlog2.default.silly("hasTags");

      var yes = !!_ChildProcessUtilities2.default.execSync("git", ["tag"], opts);
      _npmlog2.default.verbose("hasTags", yes);

      return yes;
    }
  }, {
    key: "getLastTaggedCommit",
    value: function getLastTaggedCommit(opts) {
      _npmlog2.default.silly("getLastTaggedCommit");

      var taggedCommit = _ChildProcessUtilities2.default.execSync("git", ["rev-list", "--tags", "--max-count=1"], opts);
      _npmlog2.default.verbose("getLastTaggedCommit", taggedCommit);

      return taggedCommit;
    }
  }, {
    key: "getLastTaggedCommitInBranch",
    value: function getLastTaggedCommitInBranch(opts) {
      _npmlog2.default.silly("getLastTaggedCommitInBranch");

      var tagName = GitUtilities.getLastTag(opts);
      var commitInBranch = _ChildProcessUtilities2.default.execSync("git", ["rev-list", "-n", "1", tagName], opts);
      _npmlog2.default.verbose("getLastTaggedCommitInBranch", commitInBranch);

      return commitInBranch;
    }
  }, {
    key: "getFirstCommit",
    value: function getFirstCommit(opts) {
      _npmlog2.default.silly("getFirstCommit");

      var firstCommit = _ChildProcessUtilities2.default.execSync("git", ["rev-list", "--max-parents=0", "HEAD"], opts);
      _npmlog2.default.verbose("getFirstCommit", firstCommit);

      return firstCommit;
    }
  }, {
    key: "pushWithTags",
    value: function pushWithTags(remote, tags, opts) {
      _npmlog2.default.silly("pushWithTags", [remote, tags]);

      var branch = GitUtilities.getCurrentBranch(opts);
      _ChildProcessUtilities2.default.execSync("git", ["push", remote, branch], opts);
      _ChildProcessUtilities2.default.execSync("git", ["push", remote].concat(tags), opts);
    }
  }, {
    key: "getLastTag",
    value: function getLastTag(opts) {
      _npmlog2.default.silly("getLastTag");

      var lastTag = _ChildProcessUtilities2.default.execSync("git", ["describe", "--tags", "--abbrev=0"], opts);
      _npmlog2.default.verbose("getLastTag", lastTag);

      return lastTag;
    }
  }, {
    key: "describeTag",
    value: function describeTag(commit, opts) {
      _npmlog2.default.silly("describeTag", commit);

      var description = _ChildProcessUtilities2.default.execSync("git", ["describe", "--tags", commit], opts);
      _npmlog2.default.silly("describeTag", description);

      return description;
    }
  }, {
    key: "diffSinceIn",
    value: function diffSinceIn(since, location, opts) {
      var formattedLocation = _path2.default.relative(opts.cwd, location).replace(/\\/g, '/');
      _npmlog2.default.silly("diffSinceIn", since, formattedLocation);

      var diff = _ChildProcessUtilities2.default.execSync("git", ["diff", "--name-only", since, "--", formattedLocation], opts);
      _npmlog2.default.silly("diff", diff);

      return diff;
    }
  }, {
    key: "getCurrentBranch",
    value: function getCurrentBranch(opts) {
      _npmlog2.default.silly("getCurrentBranch");

      var currentBranch = _ChildProcessUtilities2.default.execSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], opts);
      _npmlog2.default.verbose("getCurrentBranch", currentBranch);

      return currentBranch;
    }
  }, {
    key: "getCurrentSHA",
    value: function getCurrentSHA(opts) {
      _npmlog2.default.silly("getCurrentSHA");

      var sha = _ChildProcessUtilities2.default.execSync("git", ["rev-parse", "HEAD"], opts);
      _npmlog2.default.verbose("getCurrentSHA", sha);

      return sha;
    }
  }, {
    key: "checkoutChanges",
    value: function checkoutChanges(fileGlob, opts) {
      _npmlog2.default.silly("checkoutChanges", fileGlob);
      _ChildProcessUtilities2.default.execSync("git", ["checkout", "--", fileGlob], opts);
    }
  }, {
    key: "init",
    value: function init(opts) {
      _npmlog2.default.silly("git init");
      _ChildProcessUtilities2.default.execSync("git", ["init"], opts);
    }
  }, {
    key: "hasCommit",
    value: function hasCommit(opts) {
      _npmlog2.default.silly("hasCommit");
      var retVal = void 0;

      try {
        _ChildProcessUtilities2.default.execSync("git", ["log"], opts);
        retVal = true;
      } catch (e) {
        retVal = false;
      }

      _npmlog2.default.verbose("hasCommit", retVal);
      return retVal;
    }
  }]);

  return GitUtilities;
}();

exports.default = GitUtilities;
module.exports = exports["default"];