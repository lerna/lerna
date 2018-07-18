"use strict";

const globby = require("globby");
const pMap = require("p-map");
const path = require("path");
const ValidationError = require("@lerna/validation-error");
const pathSort = require("./path-sort");

module.exports = makeFileFinder;

function makeFileFinder(rootPath, packageConfigs) {
  const globOpts = {
    cwd: rootPath,
    absolute: true,
    case: false,
    followSymlinkedDirectories: false,
  };

  if (packageConfigs.some(cfg => cfg.indexOf("**") > -1)) {
    if (packageConfigs.some(cfg => cfg.indexOf("node_modules") > -1)) {
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

  return (fileName, fileMapper) =>
    pMap(
      pathSort(packageConfigs),
      globPath => {
        let chain = globby(path.join(globPath, fileName), globOpts);

        // fast-glob does not respect pattern order, so we re-sort by absolute path
        chain = chain.then(filePaths => pathSort(filePaths));

        if (fileMapper) {
          chain = chain.then(fileMapper);
        }

        return chain;
      },
      { concurrency: 4 }
    )
      // flatten the results
      .then(results => results.reduce((acc, result) => acc.concat(result), []));
}
