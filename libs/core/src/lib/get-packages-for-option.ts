/**
 * @returns A set of package names (or wildcard) derived from option value.
 */
export function getPackagesForOption(option?: string | string[] | boolean): Set<string> {
  // new Set(null) is equivalent to new Set([])
  // i.e., an empty Set
  let inputs = null;

  if (option === true) {
    // option passed without specific packages, eg. --force-publish
    inputs = ["*"];
  } else if (typeof option === "string") {
    // option passed with one or more comma separated package names, eg.:
    // --force-publish=*
    // --force-publish=foo
    // --force-publish=foo,bar
    inputs = option.split(",");
  } else if (Array.isArray(option)) {
    // option passed multiple times with individual package names
    // --force-publish foo --force-publish baz
    inputs = [...option];
  }

  return new Set(inputs);
}
