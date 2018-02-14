"use strict";

const globby = require("globby");
const loadJsonFile = require("load-json-file");
const path = require("path");

const Package = require("../Package");
const ValidationError = require("./ValidationError");

module.exports = collectPackages;

function collectPackages({ packageConfigs, rootPath }) {
  const packages = [];
  const globOpts = {
    cwd: rootPath,
    strict: true,
    absolute: true,
  };

  const hasNodeModules = packageConfigs.some(cfg => cfg.indexOf("node_modules") > -1);
  const hasGlobStar = packageConfigs.some(cfg => cfg.indexOf("**") > -1);

  if (hasGlobStar) {
    if (hasNodeModules) {
      throw new ValidationError(
        "EPKGCONFIG",
        "An explicit node_modules package path does not allow globstars (**)"
      );
    }

    globOpts.ignore = [
      // allow globs like "packages/**",
      // but avoid picking up node_modules/**/package.json
      "**/node_modules/**",
    ];
  }

  packageConfigs.forEach(globPath => {
    globby.sync(path.join(globPath, "package.json"), globOpts).forEach(globResult => {
      // https://github.com/isaacs/node-glob/blob/master/common.js#L104
      // glob always returns "\\" as "/" in windows, so everyone
      // gets normalized because we can't have nice things.
      const packageConfigPath = path.normalize(globResult);
      const packageDir = path.dirname(packageConfigPath);
      const packageJson = loadJsonFile.sync(packageConfigPath);

      packages.push(new Package(packageJson, packageDir, rootPath));
    });
  });

  return packages;
}
