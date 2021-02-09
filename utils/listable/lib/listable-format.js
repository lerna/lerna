"use strict";

const chalk = require("chalk");
const columnify = require("columnify");
const path = require("path");
const { QueryGraph } = require("@lerna/query-graph");

module.exports.listableFormat = listableFormat;

/**
 * Format a list of packages according to specified options.
 * @param {import("@lerna/package").Package[]} pkgList
 * @param {import("./listable-options").ListableOptions} options
 */
function listableFormat(pkgList, options) {
  const viewOptions = parseViewOptions(options);
  const resultList = filterResultList(pkgList, viewOptions);
  const count = resultList.length;

  let text;

  if (viewOptions.showJSON) {
    text = formatJSON(resultList);
  } else if (viewOptions.showNDJSON) {
    text = formatNDJSON(resultList);
  } else if (viewOptions.showParseable) {
    text = formatParseable(resultList, viewOptions);
  } else if (viewOptions.showGraph) {
    text = formatJSONGraph(resultList, viewOptions);
  } else {
    text = formatColumns(resultList, viewOptions);
  }

  return { text, count };
}

/**
 * @param {import("./listable-options").ListableOptions} options
 */
function parseViewOptions(options) {
  const alias = options._[0];

  return {
    showAll: alias === "la" || options.all,
    showLong: alias === "la" || alias === "ll" || options.long,
    showJSON: options.json,
    showNDJSON: options.ndjson,
    showParseable: options.parseable,
    isTopological: options.toposort,
    showGraph: options.graph,
  };
}

/**
 * @param {import("@lerna/package").Package[]} pkgList
 * @param {ReturnType<typeof parseViewOptions>} viewOptions
 */
function filterResultList(pkgList, viewOptions) {
  let result = viewOptions.showAll ? pkgList.slice() : pkgList.filter((pkg) => !pkg.private);

  if (viewOptions.isTopological) {
    // allow cycles, output needs to be usable for debugging circularity
    result = QueryGraph.toposort(result);
  }

  return result;
}

/**
 * @param {ReturnType<typeof filterResultList>} resultList
 */
function toJSONList(resultList) {
  // explicit re-mapping exposes non-enumerable properties
  return resultList.map((pkg) => ({
    name: pkg.name,
    version: pkg.version,
    private: pkg.private,
    location: pkg.location,
  }));
}

/**
 * @param {ReturnType<typeof filterResultList>} resultList
 */
function formatJSON(resultList) {
  return JSON.stringify(toJSONList(resultList), null, 2);
}

/**
 * @param {ReturnType<typeof filterResultList>} resultList
 */
function formatNDJSON(resultList) {
  return toJSONList(resultList)
    .map((data) => JSON.stringify(data))
    .join("\n");
}

/**
 * @param {ReturnType<typeof filterResultList>} resultList
 * @param {ReturnType<typeof parseViewOptions>} viewOptions
 */
function formatJSONGraph(resultList, viewOptions) {
  // https://en.wikipedia.org/wiki/Adjacency_list
  const graph = {};
  const getNeighbors = viewOptions.showAll
    ? (pkg) =>
        Object.keys(
          Object.assign(
            {},
            pkg.devDependencies,
            pkg.peerDependencies,
            pkg.optionalDependencies,
            pkg.dependencies
          )
        ).sort()
    : (pkg) =>
        Object.keys(
          Object.assign(
            {},
            // no devDependencies
            // no peerDependencies
            pkg.optionalDependencies,
            pkg.dependencies
          )
        ).sort();

  for (const pkg of resultList) {
    graph[pkg.name] = getNeighbors(pkg);
  }

  return JSON.stringify(graph, null, 2);
}

/**
 * @param {import("@lerna/package").Package} pkg
 */
function makeParseable(pkg) {
  const result = [pkg.location, pkg.name];

  // sometimes the version is inexplicably missing?
  if (pkg.version) {
    result.push(pkg.version);
  } else {
    result.push("MISSING");
  }

  if (pkg.private) {
    result.push("PRIVATE");
  }

  return result.join(":");
}

/**
 * @param {ReturnType<typeof filterResultList>} resultList
 * @param {ReturnType<typeof parseViewOptions>} viewOptions
 */
function formatParseable(resultList, viewOptions) {
  return resultList.map(viewOptions.showLong ? makeParseable : (pkg) => pkg.location).join("\n");
}

/**
 * @param {ReturnType<typeof parseViewOptions>} viewOptions
 */
function getColumnOrder(viewOptions) {
  const columns = ["name"];

  if (viewOptions.showLong) {
    columns.push("version", "location");
  }

  if (viewOptions.showAll) {
    columns.push("private");
  }

  return columns;
}

/**
 * @param {ReturnType<typeof filterResultList>} resultList
 * @param {ReturnType<typeof parseViewOptions>} viewOptions
 */
function trimmedColumns(formattedResults, viewOptions) {
  const str = columnify(formattedResults, {
    showHeaders: false,
    columns: getColumnOrder(viewOptions),
    config: {
      version: {
        align: "right",
      },
    },
  });

  // columnify leaves a lot of trailing space in the last column, remove that here
  return str
    .split("\n")
    .map((line) => line.trimRight())
    .join("\n");
}

/**
 * @param {ReturnType<typeof filterResultList>} resultList
 * @param {ReturnType<typeof parseViewOptions>} viewOptions
 */
function formatColumns(resultList, viewOptions) {
  const formattedResults = resultList.map((result) => {
    const formatted = {
      name: result.name,
    };

    if (result.version) {
      formatted.version = chalk.green(`v${result.version}`);
    } else {
      formatted.version = chalk.yellow("MISSING");
    }

    if (result.private) {
      formatted.private = `(${chalk.red("PRIVATE")})`;
    }

    formatted.location = chalk.grey(path.relative(".", result.location));

    return formatted;
  });

  return trimmedColumns(formattedResults, viewOptions);
}
