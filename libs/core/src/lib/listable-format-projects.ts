import chalk from "chalk";
import columnify from "columnify";
import path from "path";
import { ListableOptions } from "./listable-options";
import { Package } from "./package";
import {
  getPackage,
  ProjectGraphProjectNodeWithPackage,
  ProjectGraphWithPackages,
} from "./project-graph-with-packages";
import { toposortProjects } from "./toposort-projects";

/**
 * Format a list of projects according to specified options.
 * @param projectsList List of projects to format
 */
export function listableFormatProjects(
  projectsList: ProjectGraphProjectNodeWithPackage[],
  projectGraph: ProjectGraphWithPackages,
  options: ListableOptions
) {
  const viewOptions = parseViewOptions(options);
  const resultList = filterResultList(projectsList, projectGraph, viewOptions);
  const count = resultList.length;

  let text: string;

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

function filterResultList(
  projectList: ProjectGraphProjectNodeWithPackage[],
  projectGraph: ProjectGraphWithPackages,
  viewOptions: ReturnType<typeof parseViewOptions>
): ProjectGraphProjectNodeWithPackage[] {
  let result = viewOptions.showAll
    ? projectList
    : projectList.filter((project) => !getPackage(project).private);

  if (viewOptions.isTopological) {
    result = toposortProjects(result, projectGraph);
  }

  return result;
}

function toJSONList(
  resultList: ReturnType<typeof filterResultList>,
  addtionalProperties: (project: ProjectGraphProjectNodeWithPackage) => {
    [propt: string]: unknown;
  } = () => ({})
) {
  // explicit re-mapping exposes non-enumerable properties
  return resultList.map((project) => {
    const pkg = getPackage(project);
    return {
      name: pkg.name,
      version: pkg.version,
      private: pkg.private,
      location: pkg.location,
      ...addtionalProperties(project),
    };
  });
}

export function formatJSON(
  resultList: ReturnType<typeof filterResultList>,
  additionalProperties: (project: ProjectGraphProjectNodeWithPackage) => {
    [propt: string]: unknown;
  } = () => ({})
) {
  return JSON.stringify(toJSONList(resultList, additionalProperties), null, 2);
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

  for (const project of resultList) {
    const pkg = getPackage(project);
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
): string {
  return resultList
    .map((project) => {
      const pkg = getPackage(project);
      return viewOptions.showLong ? makeParseable(pkg) : pkg.location;
    })
    .join("\n");
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
  formattedResults: { name: string; version?: string; private?: string; location?: string }[],
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
  const formattedResults = resultList.map((project) => {
    const pkg = getPackage(project);
    const formatted: { name: string; version?: string; private?: string; location?: string } = {
      name: pkg.name,
    };

    if (pkg.version) {
      formatted.version = chalk.green(`v${pkg.version}`);
    } else {
      formatted.version = chalk.yellow("MISSING");
    }

    if (pkg.private) {
      formatted.private = `(${chalk.red("PRIVATE")})`;
    }

    formatted.location = chalk.grey(path.relative(".", pkg.location));

    return formatted;
  });

  return trimmedColumns(formattedResults, viewOptions);
}
