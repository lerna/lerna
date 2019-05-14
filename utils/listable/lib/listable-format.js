"use strict";

const chalk = require("chalk");
const columnify = require("columnify");
const path = require("path");
const QueryGraph = require("@lerna/query-graph");

module.exports = listableFormat;

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
  } else {
    text = formatColumns(resultList, viewOptions);
  }

  return { text, count };
}

function parseViewOptions(options) {
  const alias = options._[0];

  return {
    showAll: alias === "la" || options.all,
    showLong: alias === "la" || alias === "ll" || options.long,
    showJSON: options.json,
    showNDJSON: options.ndjson,
    showParseable: options.parseable,
    isTopological: options.toposort,
  };
}

function filterResultList(pkgList, viewOptions) {
  let result = viewOptions.showAll ? pkgList.slice() : pkgList.filter(pkg => !pkg.private);

  if (viewOptions.isTopological) {
    // allow cycles, output needs to be usable for debugging circularity
    result = QueryGraph.toposort(result);
  }

  return result;
}

function toJSONList(resultList) {
  // explicit re-mapping exposes non-enumerable properties
  return resultList.map(pkg => ({
    name: pkg.name,
    version: pkg.version,
    private: pkg.private,
    location: pkg.location,
  }));
}

function formatJSON(resultList) {
  return JSON.stringify(toJSONList(resultList), null, 2);
}

function formatNDJSON(resultList) {
  return toJSONList(resultList)
    .map(data => JSON.stringify(data))
    .join("\n");
}

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

function formatParseable(resultList, viewOptions) {
  return resultList.map(viewOptions.showLong ? makeParseable : pkg => pkg.location).join("\n");
}

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
    .map(line => line.trimRight())
    .join("\n");
}

function formatColumns(resultList, viewOptions) {
  const formattedResults = resultList.map(result => {
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
