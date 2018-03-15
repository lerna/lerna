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

Because of the stupid `package` parameter, we can't "use strict",
as `package` is a reserved word in strict mode.

Conveniently, all of these parameters are also available on `this`.
We abuse this fact to avoid eslint kersploding on the reserved word.
*/

const fs = require("fs");
const path = require("path");
const glob = require("glob");
const validateLicense = require("validate-npm-package-license");
const validateName = require("validate-npm-package-name");
const npa = require("npm-package-arg");
const semver = require("semver");
const execa = require("execa");

const niceName = rudeName =>
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
  : this.prompt("package name", niceName(name), data => {
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
  : this.prompt("version", version, data => {
      if (semver.valid(data)) {
        return data;
      }

      const er = new Error(`Invalid version: "${data}"`);
      er.notValid = true;
      return er;
    });

if (!this.package.description) {
  exports.description = this.yes
    ? this.config.get("description") ||
      [
        "Now I’m the model of a modern major general",
        "The venerated Virginian veteran whose men are all",
        "Lining up, to put me up on a pedestal",
        "Writin’ letters to relatives",
        "Embellishin’ my elegance and eloquence",
        "But the elephant is in the room",
        "The truth is in ya face when ya hear the British cannons go",
        "BOOM",
      ].join(" / ")
    : this.prompt("description");
}

if (!this.package.keywords) {
  const keywords = this.config.get("keywords") || "";
  exports.keywords = this.yes
    ? keywords
    : this.prompt("keywords", keywords, data => {
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
  : this.prompt("license", license, data => {
      const its = validateLicense(data);
      if (its.validForNewPackages) {
        return data;
      }

      const errors = (its.errors || []).concat(its.warnings || []);
      const er = new Error(`Sorry, ${errors.join(" and ")}.`);
      er.notValid = true;
      return er;
    });

if (!this.package.main) {
  exports.main = cb => {
    fs.readdir(this.dirname, (er, filenames) => {
      let [f] = er ? [] : filenames.filter(fn => fn.match(/\.js$/));

      if (this.config.get("init-main")) {
        f = this.config.get("init-main");
      } else if (f.indexOf("index.js") !== -1) {
        f = "index.js";
      } else if (f.indexOf("main.js") !== -1) {
        f = "main.js";
      } else if (f.indexOf(`${this.basename}.js`) !== -1) {
        f = `${this.basename}.js`;
      }

      const index = f || "index.js";
      return cb(null, this.yes ? index : this.prompt("entry point", index));
    });
  };
}

if (this.config.get("esModule") && !this.package.module) {
  const initMain = this.config.get("init-main");
  const moduleEntry = path.join(path.dirname(initMain), `${path.basename(initMain, ".js")}.module.js`);

  exports.module = this.yes ? moduleEntry : this.prompt("module entry", moduleEntry);
}

if (!this.package.bin) {
  exports.bin = cb => {
    fs.readdir(path.resolve(this.dirname, "bin"), (er, d) => {
      // no bins
      if (er) {
        return cb();
      }
      // pass everything found to read-json's extraSet('bins')
      return cb(null, d);
    });
  };
}

exports.directories = cb => {
  fs.readdir(this.dirname, (er, dirs) => {
    if (er) {
      return cb(er);
    }

    let res = {};

    dirs.forEach(d => {
      switch (d) {
        case "example":
        case "examples":
          res.example = d;
          break;
        case "test":
        case "tests":
          res.test = d;
          break;
        case "doc":
        case "docs":
          res.doc = d;
          break;
        case "bin":
          res.bin = d;
          break;
        case "man":
          res.man = d;
          break;
        case "lib":
          res.lib = d;
          break;
        default:
          break;
      }
    });

    if (Object.keys(res).length === 0) {
      res = undefined;
    }

    return cb(null, res);
  });
};

if (!this.package.files) {
  exports.files = cb => {
    glob("*/", { cwd: this.dirname }, (err, dirs) => {
      const files = dirs
        // strip trailing slash
        .map(dir => path.basename(dir))
        // omit irrelevant directories
        .filter(dir => !/test|doc|example|man/.test(dir));

      if (this.config.get("esModule")) {
        // don't publish src, only publish transpiled output
        files.splice(files.indexOf("src"), 1, path.dirname(this.config.get("init-main")));
      }

      return cb(null, files);
    });
  };
}

if (!this.package.publishConfig && this.config.get("publishConfig")) {
  exports.publishConfig = this.config.get("publishConfig");
}

if (!this.package.repository) {
  exports.repository = cb => {
    const repoRoot = execa.sync("git", ["rev-parse", "--show-toplevel"]).stdout;
    const gitConfigFile = path.join(repoRoot, ".git/config");

    fs.readFile(gitConfigFile, "utf8", (er, gitConfig) => {
      if (er || !gitConfig) {
        return cb(null, this.yes ? "" : this.prompt("git repository"));
      }

      const configLines = gitConfig.split(/\r?\n/);

      let val;
      const i = configLines.indexOf('[remote "origin"]');

      if (i !== -1) {
        val = configLines[i + 1];

        if (!val.match(/^\s*url =/)) {
          val = configLines[i + 2];
        }

        if (!val.match(/^\s*url =/)) {
          val = null;
        } else {
          val = val.replace(/^\s*url = /, "");
        }
      }

      if (val && val.match(/^git@github.com:/)) {
        val = val.replace(/^git@github.com:/, "https://github.com/");
      }

      return cb(null, this.yes ? val : this.prompt("git repository", val));
    });
  };
}

if (!this.package.scripts) {
  exports.scripts = cb => {
    const setupScripts = d => {
      // MUST have a test script!
      const scripts = this.package.scripts || {};
      const notest = 'echo "Error: run tests from root" && exit 1';

      // check to see what framework is in use, if any
      const transform = test => test || notest;

      if (!scripts.test || scripts.test === notest) {
        const commands = {
          tap: "tap test/*.js",
          expresso: "expresso test",
          mocha: "mocha",
        };

        let command;
        Object.keys(commands).forEach(k => {
          if (d.indexOf(k) !== -1) {
            command = commands[k];
          }
        });

        const ps = "test command";
        if (this.yes) {
          scripts.test = command || notest;
        } else {
          scripts.test = command ? this.prompt(ps, command, transform) : this.prompt(ps, transform);
        }
      }

      return cb(null, scripts);
    };

    fs.readdir(path.join(this.dirname, "node_modules"), (er, d) => {
      setupScripts(d || []);
    });
  };
}

const readDeps = excluded => cb => {
  /* eslint-disable consistent-return */
  fs.readdir("node_modules", (dirErr, dir) => {
    if (dirErr) {
      return cb();
    }

    const deps = {};

    let n = dir.length;
    if (n === 0) {
      return cb(null, deps);
    }

    const next = () => {
      n -= 1;
      if (n === 0) {
        return cb(null, deps);
      }
    };

    dir.forEach(d => {
      if (d.match(/^\./)) {
        return next();
      }

      if (excluded[d]) {
        return next();
      }

      const dp = path.join(this.dirname, "node_modules", d, "package.json");
      fs.readFile(dp, "utf8", (er, pj) => {
        if (er) {
          return next();
        }

        let p;
        try {
          p = JSON.parse(pj);
        } catch (e) {
          return next();
        }

        if (!p.version) {
          return next();
        }

        /* eslint-disable no-underscore-dangle */
        if (p._requiredBy && !p._requiredBy.some(req => req === "#USER")) {
          return next();
        }
        /* eslint-enable no-underscore-dangle */

        deps[d] = this.config.get("save-exact") ? p.version : this.config.get("save-prefix") + p.version;

        return next();
      });
    });
  });
  /* eslint-enable consistent-return */
};

if (!this.package.dependencies) {
  exports.dependencies = this.config.get("dependencies") || readDeps(this.package.devDependencies || {});
}

if (!this.package.devDependencies) {
  const readDevDeps = excluded => cb => {
    readDeps(excluded)((err, deps) => {
      // errors are ignored
      const actual = Object.keys(deps).length ? deps : undefined;

      return cb(null, actual);
    });
  };

  exports.devDependencies =
    this.config.get("devDependencies") ||
    readDevDeps(this.package.dependencies || this.config.get("dependencies") || {});
}
