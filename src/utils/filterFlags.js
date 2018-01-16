import _ from "lodash";

/**
 * Passed argv from yargs, return an object that contains _only_
 * what was passed on the command line, omitting undefined values
 * and yargs spam.
 */
export default function filterFlags(argv) {
  return _.omit(_.omitBy(argv, _.isNil), ["h", "help", "v", "version", "$0", "_onRejected"]);
}
