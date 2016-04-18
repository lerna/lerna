import objectAssign from "object-assign";

export default class Package {
  constructor(pkg, location) {
    this._package = pkg;
    this._location = location;
  }

  get name() {
    return this._package.name;
  }

  get location() {
    return this._location;
  }

  get version() {
    return this._package.version;
  }

  set version(version) {
    this._package.version = version;
  }

  get dependencies() {
    return this._package.dependencies;
  }

  get devDependencies() {
    return this._package.devDependencies;
  }

  get peerDependencies() {
    return this._package.peerDependencies;
  }

  get allDependencies() {
    return objectAssign(
      {},
      this.peerDependencies,
      this.devDependencies,
      this.dependencies
    );
  }

  get scripts() {
    return this._package.scripts;
  }

  isPrivate() {
    return !!this._package.private;
  }

  toString() {
    return JSON.stringify(this._package, null, 2) + "\n";
  }
}
