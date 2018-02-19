"use strict";

const escapeStringRegexp = require("escape-string-regexp");
const npa = require("npm-package-arg");

class VersionSerializer {
  constructor({ localDependencies, tagVersionPrefix = "v" }) {
    this._localDependencies = localDependencies;
    this._gitUrlPattern = new RegExp(`(.+?#${escapeStringRegexp(tagVersionPrefix)})(.+)$`);
    this._strippedPrefixes = new Map();
  }

  serialize(pkg) {
    this._prependPrefix(pkg.dependencies || {});
    this._prependPrefix(pkg.devDependencies || {});

    return pkg;
  }

  deserialize(pkg) {
    this._stripPrefix(pkg.dependencies || {});
    this._stripPrefix(pkg.devDependencies || {});

    return pkg;
  }

  _prependPrefix(dependencies) {
    this._strippedPrefixes.forEach((prefix, name) => {
      const version = dependencies[name];
      if (version) {
        // eslint-disable-next-line no-param-reassign
        dependencies[name] = `${prefix}${version}`;
      }
    });
  }

  _stripPrefix(dependencies) {
    Object.keys(dependencies).forEach(name => {
      if (this._localDependencies.has(name)) {
        const result = this._parseVersion(name, dependencies[name]);

        if (result.prefix) {
          // eslint-disable-next-line no-param-reassign
          dependencies[name] = result.version;
          this._strippedPrefixes.set(name, result.prefix);
        }
      }
    });
  }

  _parseVersion(name, version) {
    // passing name to disambiguate deprecated "git scp"-style URLs
    const result = npa.resolve(name, version);

    let targetMatches;

    if (result.gitCommittish) {
      targetMatches = this._gitUrlPattern.exec(version);
    }

    return {
      prefix: targetMatches ? targetMatches[1] : null,
      version: targetMatches ? targetMatches[2] : version,
    };
  }
}

module.exports = VersionSerializer;
