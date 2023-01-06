import globby from "globby";
import pMap from "p-map";
import path from "path";
import { ValidationError } from "../validation-error";

function normalize(results: string[]) {
  return results.map((fp) => path.normalize(fp));
}

function getGlobOpts(rootPath: string, packageConfigs: any[]) {
  const globOpts = {
    cwd: rootPath,
    absolute: true,
    expandDirectories: false,
    followSymbolicLinks: false,
  } as any;

  if (packageConfigs.some((cfg) => cfg.indexOf("**") > -1)) {
    if (packageConfigs.some((cfg) => cfg.indexOf("node_modules") > -1)) {
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

  return globOpts;
}

export function makeFileFinder(rootPath: string, packageConfigs: any[]) {
  const globOpts = getGlobOpts(rootPath, packageConfigs);

  return (fileName: string, fileMapper: any, customGlobOpts: any) => {
    const options = Object.assign({}, customGlobOpts, globOpts);
    const promise = pMap(
      Array.from(packageConfigs).sort(),
      (globPath: string) => {
        let chain = globby(path.posix.join(globPath, fileName), options);

        // fast-glob does not respect pattern order, so we re-sort by absolute path
        chain = chain.then((results) => results.sort());

        // POSIX results always need to be normalized
        // TODO: refactor to address type issues
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        chain = chain.then(normalize);

        if (fileMapper) {
          chain = chain.then(fileMapper);
        }

        return chain;
      },
      { concurrency: 4 }
    );

    // always flatten the results
    return promise.then((results: any[]) => results.reduce((acc, result) => acc.concat(result), []));
  };
}

export function makeSyncFileFinder(rootPath: string, packageConfigs: any[]) {
  const globOpts = getGlobOpts(rootPath, packageConfigs);

  return (fileName: string, fileMapper: any, customGlobOpts: any) => {
    const options = Object.assign({}, customGlobOpts, globOpts);
    const patterns = packageConfigs.map((globPath) => path.posix.join(globPath, fileName)).sort();

    let results = globby.sync(patterns, options);

    // POSIX results always need to be normalized
    // TODO: refactor to address type issues
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    results = normalize(results);

    /* istanbul ignore else */
    if (fileMapper) {
      results = results.map(fileMapper);
    }

    return results;
  };
}
