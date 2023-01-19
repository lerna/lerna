import path from "path";
import { envReplace } from "./env-replace";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { types } = require("./types");

// https://github.com/npm/npm/blob/latest/lib/config/core.js#L362-L407
export function parseField(input: any, key: string | number) {
  if (typeof input !== "string") {
    return input;
  }

  const typeList: any[] = [].concat(types[key]);
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

    if (regex.test(field) && process.env["HOME"]) {
      field = path.resolve(process.env["HOME"], field.substr(2));
    }

    field = path.resolve(field);
  }

  // TODO: refactor based on TS feedback
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  if (isNumber && !Number.isNaN(field)) {
    // TODO: refactor based on TS feedback
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    field = Number(field);
  }

  return field;
}
