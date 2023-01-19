"use strict";

import chalk from "chalk";
import columnify from "columnify";
import path from "path";
import { Package } from "../package";
import { QueryGraph } from "../query-graph";
import { ListableOptions } from "./listable-options";

/**
 * Format a list of packages according to specified options.
 */
export function listableFormat(pkgList: Package[], options: ListableOptions) {
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

function parseViewOptions(options: ListableOptions) {
  // TODO: refactor based on TS feedback
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
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

function filterResultList(pkgList: Package[], viewOptions: ReturnType<typeof parseViewOptions>) {
  let result = viewOptions.showAll ? pkgList.slice() : pkgList.filter((pkg) => !pkg.private);

  if (viewOptions.isTopological) {
    // allow cycles, output needs to be usable for debugging circularity
    result = QueryGraph.toposort(result);
  }

  return result;
}

function toJSONList(resultList: ReturnType<typeof filterResultList>) {
  // explicit re-mapping exposes non-enumerable properties
  return resultList.map((pkg) => ({
    name: pkg.name,
    version: pkg.version,
    private: pkg.private,
    location: pkg.location,
  }));
}

function formatJSON(resultList: ReturnType<typeof filterResultList>) {
  return JSON.stringify(toJSONList(resultList), null, 2);
}

function formatNDJSON(resultList: ReturnType<typeof filterResultList>) {
  return toJSONList(resultList)
    .map((data) => JSON.stringify(data))
    .join("\n");
}

function formatJSONGraph(
  resultList: ReturnType<typeof filterResultList>,
  viewOptions: ReturnType<typeof parseViewOptions>
) {
  // https://en.wikipedia.org/wiki/Adjacency_list
  const graph: Record<string, string[]> = {};
  const getNeighbors = viewOptions.showAll
    ? (pkg: Package) =>
        Object.keys(
          Object.assign(
            {},
            pkg.devDependencies,
            pkg.peerDependencies,
            pkg.optionalDependencies,
            pkg.dependencies
          )
        ).sort()
    : (pkg: Package) =>
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

function makeParseable(pkg: Package) {
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

function formatParseable(
  resultList: ReturnType<typeof filterResultList>,
  viewOptions: ReturnType<typeof parseViewOptions>
) {
  return resultList.map(viewOptions.showLong ? makeParseable : (pkg) => pkg.location).join("\n");
}

/**
 * @param {ReturnType<typeof parseViewOptions>} viewOptions
 */
function getColumnOrder(viewOptions: ReturnType<typeof parseViewOptions>) {
  const columns = ["name"];

  if (viewOptions.showLong) {
    columns.push("version", "location");
  }

  if (viewOptions.showAll) {
    columns.push("private");
  }

  return columns;
}

function trimmedColumns(
  formattedResults: ReturnType<typeof filterResultList>,
  viewOptions: ReturnType<typeof parseViewOptions>
) {
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
    .map((line: string) => line.trimRight())
    .join("\n");
}

function formatColumns(
  resultList: ReturnType<typeof filterResultList>,
  viewOptions: ReturnType<typeof parseViewOptions>
) {
  const formattedResults: any[] = resultList.map((result) => {
    const formatted: { name: string; version?: string; private?: string; location?: string } = {
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
