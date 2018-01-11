export default class VersionSerializer {
  constructor({ graphDependencies, versionParser }) {
    this._graphDependencies = graphDependencies;
    this._versionParser = versionParser;
    this._dependenciesKeys = ["dependencies", "devDependencies"];
    this._strippedPrefixes = new Map();
  }

  serialize(pkg) {
    this._dependenciesKeys.forEach(key => {
      this._prependPrefix(pkg[key] || {});
    });

    return pkg;
  }

  deserialize(pkg) {
    this._dependenciesKeys.forEach(key => {
      this._stripPrefix(pkg[key] || {});
    });

    return pkg;
  }

  _prependPrefix(dependencies) {
    this._strippedPrefixes.forEach((prefix, name) => {
      const version = dependencies[name];
      if (version) {
        dependencies[name] = `${prefix}${version}`;
      }
    });
  }

  _stripPrefix(dependencies) {
    Object.keys(dependencies).forEach(name => {
      if (this._graphDependencies.includes(name)) {
        const result = this._versionParser.parseVersion(dependencies[name]);

        if (result.prefix) {
          dependencies[name] = result.version;
          this._strippedPrefixes.set(name, result.prefix);
        }
      }
    });
  }
}
