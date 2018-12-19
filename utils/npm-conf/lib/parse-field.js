"use strict";

const path = require("path");
const envReplace = require("./env-replace");
const types = require("./types");

module.exports = parseField;

// https://github.com/npm/npm/blob/latest/lib/config/core.js#L362-L407
function parseField(input, key) {
  if (typeof input !== "string") {
    return input;
  }

  const typeList = [].concat(types[key]);
  const isPath = typeList.indexOf(path) !== -1;
  const isBool = typeList.indexOf(Boolean) !== -1;
  const isString = typeList.indexOf(String) !== -1;
  const isNumber = typeList.indexOf(Number) !== -1;

  let field = `${input}`.trim();

  if (/^".*"$/.test(field)) {
    try {
      field = JSON.parse(field);
    } catch (err) {
      throw new Error(`Failed parsing JSON config key ${key}: ${field}`);
    }
  }

  if (isBool && !isString && field === "") {
    return true;
  }

  switch (field) {
    case "true": {
      return true;
    }

    case "false": {
      return false;
    }

    case "null": {
      return null;
    }

    case "undefined": {
      return undefined;
    }

    // no default
  }

  field = envReplace(field);

  if (isPath) {
    const regex = process.platform === "win32" ? /^~(\/|\\)/ : /^~\//;

    if (regex.test(field) && process.env.HOME) {
      field = path.resolve(process.env.HOME, field.substr(2));
    }

    field = path.resolve(field);
  }

  // eslint-disable-next-line no-restricted-globals
  if (isNumber && !isNaN(field)) {
    field = Number(field);
  }

  return field;
}
