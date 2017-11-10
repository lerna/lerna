"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _dedent = require("dedent");

var _dedent2 = _interopRequireDefault(_dedent);

var _npmlog = require("npmlog");

var _npmlog2 = _interopRequireDefault(_npmlog);

var _path = require("path");

var _path2 = _interopRequireDefault(_path);

var _semver = require("semver");

var _semver2 = _interopRequireDefault(_semver);

var _ChildProcessUtilities = require("./ChildProcessUtilities");

var _ChildProcessUtilities2 = _interopRequireDefault(_ChildProcessUtilities);

var _FileSystemUtilities = require("./FileSystemUtilities");

var _FileSystemUtilities2 = _interopRequireDefault(_FileSystemUtilities);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var CHANGELOG_NAME = "CHANGELOG.md";
var CHANGELOG_HEADER = (0, _dedent2.default)(`# Change Log

  All notable changes to this project will be documented in this file.
  See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.`);

// We call these resolved CLI files in the "path/to/node path/to/cli <..args>"
// pattern to avoid Windows hangups with shebangs (e.g., WSH can't handle it)
var RECOMMEND_CLI = require.resolve("conventional-recommended-bump/cli");
var CHANGELOG_CLI = require.resolve("conventional-changelog-cli/cli");

var ConventionalCommitUtilities = function () {
  function ConventionalCommitUtilities() {
    _classCallCheck(this, ConventionalCommitUtilities);
  }

  _createClass(ConventionalCommitUtilities, null, [{
    key: "recommendIndependentVersion",
    value: function recommendIndependentVersion(pkg, opts) {
      var args = [RECOMMEND_CLI, "-l", pkg.name, "--commit-path", pkg.location, "-p", "angular"];
      return ConventionalCommitUtilities.recommendVersion(pkg, opts, "recommendIndependentVersion", args);
    }
  }, {
    key: "recommendFixedVersion",
    value: function recommendFixedVersion(pkg, opts) {
      var args = [RECOMMEND_CLI, "--commit-path", pkg.location, "-p", "angular"];
      return ConventionalCommitUtilities.recommendVersion(pkg, opts, "recommendFixedVersion", args);
    }
  }, {
    key: "recommendVersion",
    value: function recommendVersion(pkg, opts, type, args) {
      _npmlog2.default.silly(type, "for %s at %s", pkg.name, pkg.location);

      var recommendedBump = _ChildProcessUtilities2.default.execSync(process.execPath, args, opts);

      _npmlog2.default.verbose(type, "increment %s by %s", pkg.version, recommendedBump);
      return _semver2.default.inc(pkg.version, recommendedBump);
    }
  }, {
    key: "updateIndependentChangelog",
    value: function updateIndependentChangelog(pkg, opts) {
      var pkgJsonLocation = _path2.default.join(pkg.location, "package.json");
      var args = [CHANGELOG_CLI, "-l", pkg.name, "--commit-path", pkg.location, "--pkg", pkgJsonLocation, "-p", "angular"];
      ConventionalCommitUtilities.updateChangelog(pkg, opts, "updateIndependentChangelog", args);
    }
  }, {
    key: "updateFixedChangelog",
    value: function updateFixedChangelog(pkg, opts) {
      var pkgJsonLocation = _path2.default.join(pkg.location, "package.json");
      var args = [CHANGELOG_CLI, "--commit-path", pkg.location, "--pkg", pkgJsonLocation, "-p", "angular"];
      ConventionalCommitUtilities.updateChangelog(pkg, opts, "updateFixedChangelog", args);
    }
  }, {
    key: "updateFixedRootChangelog",
    value: function updateFixedRootChangelog(pkg, opts) {
      var args = [CHANGELOG_CLI, "-p", "angular", "--context", _path2.default.resolve(__dirname, "..", "lib", "ConventionalChangelogContext.js")];
      ConventionalCommitUtilities.updateChangelog(pkg, opts, "updateFixedRootChangelog", args);
    }
  }, {
    key: "updateChangelog",
    value: function updateChangelog(pkg, opts, type, args) {
      _npmlog2.default.silly(type, "for %s at %s", pkg.name, pkg.location);

      var changelogLocation = ConventionalCommitUtilities.changelogLocation(pkg);

      var changelogContents = "";
      if (_FileSystemUtilities2.default.existsSync(changelogLocation)) {
        changelogContents = _FileSystemUtilities2.default.readFileSync(changelogLocation);
      }

      // run conventional-changelog-cli to generate the markdown for the upcoming release.
      var newEntry = _ChildProcessUtilities2.default.execSync(process.execPath, args, opts);

      // When force publishing, it is possible that there will be no actual changes, only a version bump.
      // Add a note to indicate that only a version bump has occurred.
      if (!newEntry.split("\n").some(function (line) {
        return line.startsWith("*");
      })) {
        newEntry = (0, _dedent2.default)(`
        ${newEntry}
        
        **Note:** Version bump only for package ${pkg.name} 
        `);
      }

      _npmlog2.default.silly(type, "writing new entry: %j", newEntry);

      // CHANGELOG entries start with <a name=, we remove
      // the header if it exists by starting at the first entry.
      if (changelogContents.indexOf("<a name=") !== -1) {
        changelogContents = changelogContents.substring(changelogContents.indexOf("<a name="));
      }

      _FileSystemUtilities2.default.writeFileSync(changelogLocation,
      // only allow 1 \n at end of content.
      (0, _dedent2.default)(`${CHANGELOG_HEADER}

        ${newEntry}

        ${changelogContents}`.replace(/\n+$/, "\n")));

      _npmlog2.default.verbose(type, "wrote", changelogLocation);
    }
  }, {
    key: "changelogLocation",
    value: function changelogLocation(pkg) {
      return _path2.default.join(pkg.location, CHANGELOG_NAME);
    }
  }]);

  return ConventionalCommitUtilities;
}();

exports.default = ConventionalCommitUtilities;
module.exports = exports["default"];