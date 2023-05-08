import { ExecOptions } from "child_process";
import multimatch from "multimatch";
import log from "npmlog";
import util from "util";
import { addDependencies } from "./add-dependencies";
import { addDependents } from "./add-dependents";
import { collectProjectUpdates } from "./collect-updates/collect-project-updates";
import { FilterOptions } from "./filter-options";
import { ProjectGraphProjectNodeWithPackage, ProjectGraphWithPackages } from "./project-graph-with-packages";
import { ValidationError } from "./validation-error";

export function filterProjects(
  projectGraph: ProjectGraphWithPackages,
  execOpts: Partial<ExecOptions> = {},
  opts: Partial<FilterOptions> = {}
): ProjectGraphProjectNodeWithPackage[] {
  const options = { log, ...opts };

  if (options.scope) {
    options.log.notice("filter", "including %j", options.scope);
  }

  if (options.ignore) {
    options.log.notice("filter", "excluding %j", options.ignore);
  }

  // only look at projects with packages, since the user's input is matched against package name
  let projects = Object.values(projectGraph.nodes).filter((p) => !!p.package);

  // combine scope and ignore into a single array of patterns to match
  const patterns = ([] as string[]).concat(arrify(options.scope), negate(arrify(options.ignore)));

  // filter out private if requested
  if (options.private === false) {
    projects = projects.filter((p) => !p.package?.private);
  }

  const patternsToLog = [...patterns];
  if (patterns.length) {
    if (!options.scope?.length) {
      // only excludes needs to select all items first
      // globstar is for matching scoped packages
      patterns.unshift("**");
    }

    const packageNames = Array.from(projects)
      .map((p) => p.package?.name)
      .filter((p: string | undefined): p is string => !!p);
    const chosen = new Set(multimatch(packageNames, patterns));

    projects = projects.filter((p) => p.package?.name && chosen.has(p.package.name));

    if (!projects.length && !options.continueIfNoMatch) {
      throw new ValidationError("EFILTER", util.format("No packages remain after filtering", patterns));
    }
  }

  if (options.since !== undefined) {
    options.log.notice("filter", "changed since %j", options.since);

    if (options.excludeDependents) {
      options.log.notice("filter", "excluding dependents");
    }

    if (options.includeMergedTags) {
      options.log.notice("filter", "including merged tags");
    }

    const updates = collectProjectUpdates(projects, projectGraph, execOpts, opts);

    const updated = new Set(updates.map((node) => node.name));

    projects = projects.filter((project) => updated.has(project.name));
  }

  if (options.includeDependents) {
    options.log.notice("filter", "including dependents");

    projects = addDependents(projects, projectGraph);
  }

  if (options.includeDependencies) {
    options.log.notice("filter", "including dependencies");

    projects = addDependencies(projects, projectGraph);
  }

  if (patternsToLog.length) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    log.info("filter", patternsToLog);
  }

  return projects;
}

function arrify(thing: string[] | string | undefined): string[] {
  if (!thing) {
    return [];
  }

  if (!Array.isArray(thing)) {
    return [thing];
  }

  return thing;
}

function negate(patterns: string[]) {
  return patterns.map((pattern) => `!${pattern}`);
}
