"use strict";

const globby = require("globby");
const loadJsonFile = require("load-json-file");
const path = require("path");
const pMap = require("p-map");

const Package = require("@lerna/package");
const ValidationError = require("@lerna/validation-error");

module.exports = collectPackages;

function collectPackages(rootPath, packageConfigs = ["packages/*"], linkTarget = undefined) {
  const globOpts = {
    cwd: rootPath,
    absolute: true,
    followSymlinkedDirectories: false,
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

  return pMap(
    packageConfigs,
    globPath =>
      globby(path.join(globPath, "package.json"), globOpts).then(
        globResults =>
          pMap(globResults, globResult => {
            // https://github.com/isaacs/node-glob/blob/master/common.js#L104
            // glob always returns "\\" as "/" in windows, so everyone
            // gets normalized because we can't have nice things.
            const packageConfigPath = path.normalize(globResult);
            const packageDir = path.dirname(packageConfigPath);

            return loadJsonFile(packageConfigPath).then(
              packageJson => new Package(packageJson, packageDir, rootPath, linkTarget)
            );
          }),
        { concurrency: 50 }
      ),
    { concurrency: 4 }
  ).then(results => {
    // fast-glob does not respect pattern order, so we re-sort by absolute path
    const lexicalByLocation = (a, b) => a.location.localeCompare(b.location);

    return results.reduce((pkgs, result) => pkgs.concat(result.sort(lexicalByLocation)), []);
  });
}
