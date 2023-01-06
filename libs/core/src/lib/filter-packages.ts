import multimatch from "multimatch";
import log from "npmlog";
import util from "util";
import { Package } from "./package";
import { ValidationError } from "./validation-error";

/**
 * Filters a list of packages, returning all packages that match the `include` glob[s]
 * and do not match the `exclude` glob[s].
 *
 * @param packagesToFilter The packages to filter
 * @param [include] A list of globs to match the package name against
 * @param [exclude] A list of globs to filter the package name against
 * @param [showPrivate] When false, filter out private packages
 * @param [continueIfNoMatch] When true, do not throw if no package is matched
 * @throws when a given glob would produce an empty list of packages and `continueIfNoMatch` is not set.
 */
export function filterPackages(
  packagesToFilter: Package[],
  include: string[] = [],
  exclude: string[] = [],
  showPrivate?: boolean,
  continueIfNoMatch?: boolean
) {
  const filtered = new Set(packagesToFilter);
  const patterns = ([] as string[]).concat(arrify(include), negate(exclude));

  if (showPrivate === false) {
    for (const pkg of filtered) {
      if (pkg.private) {
        filtered.delete(pkg);
      }
    }
  }

  if (patterns.length) {
    // TODO: refactor to address type issues
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    log.info("filter", patterns);

    if (!include.length) {
      // only excludes needs to select all items first
      // globstar is for matching scoped packages
      patterns.unshift("**");
    }

    const pnames = Array.from(filtered).map((pkg) => pkg.name);
    const chosen = new Set(multimatch(pnames, patterns));

    for (const pkg of filtered) {
      if (!chosen.has(pkg.name)) {
        filtered.delete(pkg);
      }
    }

    if (!filtered.size && !continueIfNoMatch) {
      throw new ValidationError("EFILTER", util.format("No packages remain after filtering", patterns));
    }
  }

  return Array.from(filtered);
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
  return arrify(patterns).map((pattern) => `!${pattern}`);
}
