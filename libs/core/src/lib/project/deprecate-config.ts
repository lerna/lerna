import dotProp from "dot-prop";
import log from "npmlog";
import path from "path";

export const deprecateConfig = compose(
  // add new predicates HERE
  remap("command.add.includeFilteredDependencies", "command.add.includeDependencies", { alsoRoot: true }),
  remap("command.add.includeFilteredDependents", "command.add.includeDependents", { alsoRoot: true }),
  remap("command.bootstrap.includeFilteredDependencies", "command.bootstrap.includeDependencies"),
  remap("command.bootstrap.includeFilteredDependents", "command.bootstrap.includeDependents"),
  remap("command.clean.includeFilteredDependencies", "command.clean.includeDependencies"),
  remap("command.clean.includeFilteredDependents", "command.clean.includeDependents"),
  remap("command.exec.includeFilteredDependencies", "command.exec.includeDependencies"),
  remap("command.exec.includeFilteredDependents", "command.exec.includeDependents"),
  remap("command.list.includeFilteredDependencies", "command.list.includeDependencies"),
  remap("command.list.includeFilteredDependents", "command.list.includeDependents"),
  remap("command.run.includeFilteredDependencies", "command.run.includeDependencies"),
  remap("command.run.includeFilteredDependents", "command.run.includeDependents"),
  remap("command.version.githubRelease", "command.version.createRelease", {
    toValue: (value) => value && "github",
  }),
  remap("command.publish.githubRelease", "command.version.createRelease", {
    alsoRoot: true,
    toValue: (value) => value && "github",
  }),
  remap("command.publish.npmTag", "command.publish.distTag", { alsoRoot: true }),
  remap("command.publish.cdVersion", "command.publish.bump", { alsoRoot: true }),
  remap("command.publish.ignore", "command.publish.ignoreChanges"),
  remap("commands", "command"),
  (config: any, filepath: any) => ({ config, filepath })
);

/**
 * Remap deprecated config properties, if they exist.
 * The returned predicate mutates the `config` parameter.
 *
 * @param search Path to deprecated option
 * @param target Path of renamed option
 * @param opts Optional configuration object
 * @param opts.alsoRoot Whether to check root config as well
 * @param opts.toValue Return the new config value given the current value
 * @return predicate accepting (config, filepath)
 */
function remap(
  search: string,
  target: string,
  { alsoRoot, toValue }: { alsoRoot?: boolean; toValue?: (x: any) => any } = {}
): (config: any, filepath: string) => void {
  const pathsToSearch = [search];

  if (alsoRoot) {
    // root config is overwritten by "more specific" nested config
    // TODO: refactor based on TS feedback
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    pathsToSearch.unshift(search.split(".").pop());
  }

  return (obj) => {
    for (const searchPath of pathsToSearch) {
      if (dotProp.has(obj.config, searchPath)) {
        const fromVal = dotProp.get(obj.config, searchPath);
        const toVal = toValue ? toValue(fromVal) : fromVal;

        log.warn("project", deprecationMessage(obj, target, searchPath, fromVal, toVal));

        dotProp.set(obj.config, target, toVal);
        dotProp.delete(obj.config, searchPath);
      }
    }

    return obj;
  };
}

/**
 * Builds a deprecation message string that specifies
 * a deprecated config option and suggests a correction.
 *
 * @param obj A config object
 * @param target Path of renamed option
 * @param searchPath Path to deprecated option
 * @param fromVal Current value of deprecated option
 * @param toVal Corrected value of deprecated option
 * @return deprecation message
 */
function deprecationMessage(
  obj: { filepath: string },
  target: string,
  searchPath: string,
  fromVal: unknown,
  toVal: any
): string {
  const localPath = path.relative(".", obj.filepath);

  let from;
  let to;
  if (toVal === fromVal) {
    from = `"${searchPath}"`;
    to = `"${target}"`;
  } else {
    from = stringify({ [searchPath]: fromVal });
    to = stringify({ [target]: toVal });
  }

  return `Deprecated key "${searchPath}" found in ${localPath}\nPlease update ${from} => ${to}`;
}

function stringify(obj: { [x: string]: any }) {
  return JSON.stringify(obj).slice(1, -1);
}

function compose(...funcs: any[]) {
  return funcs.reduce(
    (a, b) =>
      (...args: any) =>
        a(b(...args))
  );
}
