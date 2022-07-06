/**
Original: https://github.com/npm/init-package-json/blob/c649fbe/default-input.js

The contents of this file are compiled into a function with this signature:

    (function(
        yes,
        filename,
        dirname,
        basename,
        package,
        config,
        prompt,
        __filename,
        __dirname,
        __basename,
        module,
        require,
        exports
    ) {

Because of the `package` parameter, we can't "use strict",
as `package` is a reserved word in strict mode.

Conveniently, all of these parameters are also available on `this`.
We exploit this fact to avoid eslint breaking on the reserved word.
*/

const validateLicense = require("validate-npm-package-license");
const validateName = require("validate-npm-package-name");
const npa = require("npm-package-arg");
const semver = require("semver");

const niceName = (rudeName) =>
  rudeName
    .replace(/^node-|[.-]js$/g, "")
    .replace(" ", "-")
    .toLowerCase();

let name = this.package.name || this.basename;
let spec;
try {
  spec = npa(name);
} catch (e) {
  spec = {};
}
let scope = this.config.get("scope");
if (scope) {
  if (scope.charAt(0) !== "@") {
    scope = `@${scope}`;
  }

  if (spec.scope) {
    name = `${scope}/${spec.name.split("/")[1]}`;
  } else {
    name = `${scope}/${name}`;
  }
}

exports.name = this.yes
  ? name
  : this.prompt("package name", niceName(name), (data) => {
      const its = validateName(data);
      if (its.validForNewPackages) {
        return data;
      }

      const errors = (its.errors || []).concat(its.warnings || []);
      const er = new Error(`Sorry, ${errors.join(" and ")}.`);
      er.notValid = true;
      return er;
    });

const version = this.package.version || this.config.get("init-version") || "1.0.0";
exports.version = this.yes
  ? version
  : this.prompt("version", version, (data) => {
      if (semver.valid(data)) {
        return data;
      }

      const er = new Error(`Invalid version: "${data}"`);
      er.notValid = true;
      return er;
    });

if (this.config.get("private")) {
  exports.private = true;
}

if (!this.package.description) {
  exports.description = this.yes ? this.config.get("description") : this.prompt("description");
}

if (!this.package.keywords) {
  const keywords = this.config.get("keywords") || "";
  exports.keywords = this.yes
    ? keywords
    : this.prompt("keywords", keywords, (data) => {
        if (!data) {
          return undefined;
        }

        if (Array.isArray(data)) {
          // eslint-disable-next-line no-param-reassign
          data = data.join(" ");
        }

        if (typeof data !== "string") {
          return data;
        }

        return data.split(/[\s,]+/);
      });
}

if (!this.package.author) {
  let authorConfig;

  if (this.config.get("init-author-name")) {
    authorConfig = {
      name: this.config.get("init-author-name"),
      email: this.config.get("init-author-email"),
      url: this.config.get("init-author-url"),
    };
  }

  exports.author = authorConfig || (this.yes ? "" : this.prompt("author"));
}

if (!this.package.homepage) {
  const homepage = this.config.get("homepage");
  exports.homepage = this.yes ? homepage : this.prompt("homepage", homepage);
}

const license = this.package.license || this.config.get("init-license") || "ISC";
exports.license = this.yes
  ? license
  : this.prompt("license", license, (data) => {
      const its = validateLicense(data);
      if (its.validForNewPackages) {
        return data;
      }

      const errors = (its.errors || []).concat(its.warnings || []);
      const er = new Error(`Sorry, ${errors.join(" and ")}.`);
      er.notValid = true;
      return er;
    });

if (!this.package.main && this.config.get("init-main")) {
  const mainEntry = this.config.get("init-main");

  exports.main = this.yes ? mainEntry : this.prompt("entry point", mainEntry);
}

if (!this.package.module && this.config.get("init-es-module")) {
  const moduleEntry = this.config.get("init-es-module");

  exports.module = this.yes ? moduleEntry : this.prompt("module entry", moduleEntry);
}

if (!this.package.bin && this.config.get("bin")) {
  exports.bin = this.config.get("bin");
}

if (!this.package.directories && this.config.get("directories")) {
  exports.directories = this.config.get("directories");
}

if (!this.package.files && this.config.get("files")) {
  exports.files = (cb) => {
    // callback MUST yield the thread for some inexplicable reason
    process.nextTick(cb, null, this.config.get("files"));
  };
}

if (!this.package.publishConfig && this.config.get("publishConfig")) {
  exports.publishConfig = this.config.get("publishConfig");
}

if (!this.package.repository) {
  exports.repository = (cb) => {
    let val = this.config.get("repository");

    if (val && val.match(/^git@github.com:/)) {
      val = val.replace(/^git@github.com:/, "https://github.com/");
    }

    return cb(null, this.yes ? val : this.prompt("git repository", val));
  };
}

if (!this.package.scripts) {
  exports.scripts = {
    test: 'echo "Error: run tests from root" && exit 1',
  };
}

if (!this.package.dependencies && this.config.get("dependencies")) {
  exports.dependencies = this.config.get("dependencies");
}
