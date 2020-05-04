"use strict";

const stripAnsi = require("strip-ansi");

// expect.addSnapshotSerializer(require("@lerna-test/strip-ansi"));
module.exports = {
  test(val) {
    return typeof val === "string";
  },
  serialize(val, config, indentation, depth) {
    const str = stripAnsi(val);

    // top-level strings don't need quotes, but nested ones do (object properties, etc)
    return depth ? `"${str}"` : str;
  },
};
