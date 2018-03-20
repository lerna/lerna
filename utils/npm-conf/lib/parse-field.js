"use strict";

const path = require("path");
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

  switch (field) { // eslint-disable-line default-case
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
  }

  field = envReplace(field);

  if (isPath) {
    const regex = process.platform === "win32" ? /^~(\/|\\)/ : /^~\//;

    if (regex.test(field) && process.env.HOME) {
      field = path.resolve(process.env.HOME, field.substr(2));
    }

    field = path.resolve(field);
  }

  if (isNumber && !field.isNan()) {
    field = Number(field);
  }

  return field;
}

// https://github.com/npm/npm/blob/latest/lib/config/core.js#L409-L423
function envReplace(str) {
  if (typeof str !== "string" || !str) {
    return str;
  }

  // Replace any ${ENV} values with the appropriate environment
  const regex = /(\\*)\$\{([^}]+)\}/g;

  return str.replace(regex, (orig, esc, name) => {
    // eslint-disable-next-line no-param-reassign
    esc = esc.length > 0 && esc.length % 2;

    if (esc) {
      return orig;
    }

    if (process.env[name] === undefined) {
      throw new Error(`Failed to replace env in config: ${orig}`);
    }

    return process.env[name];
  });
}
