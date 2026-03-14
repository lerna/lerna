/**
 * Inlined from deprecated package https://github.com/npm/aproba/blob/v2.0.0/index.js
 */

"use strict";

interface ValidateError extends Error {
  code: string;
}

interface TypeDef {
  label: string;
  check: (value: any) => boolean;
}

interface TypeMap {
  [key: string]: TypeDef;
}

function isArguments(thingy: any): boolean {
  return (
    thingy != null && typeof thingy === "object" && Object.prototype.hasOwnProperty.call(thingy, "callee")
  );
}

const types: TypeMap = {
  "*": { label: "any", check: () => true },
  A: { label: "array", check: (_: any) => Array.isArray(_) || isArguments(_) },
  S: { label: "string", check: (_: any) => typeof _ === "string" },
  N: { label: "number", check: (_: any) => typeof _ === "number" },
  F: { label: "function", check: (_: any) => typeof _ === "function" },
  O: {
    label: "object",
    check: (_: any) => typeof _ === "object" && _ != null && !types.A.check(_) && !types.E.check(_),
  },
  B: { label: "boolean", check: (_: any) => typeof _ === "boolean" },
  E: { label: "error", check: (_: any) => _ instanceof Error },
  Z: { label: "null", check: (_: any) => _ == null },
};

function addSchema(schema: string, arity: { [key: number]: string[] }): void {
  const group = (arity[schema.length] = arity[schema.length] || []);
  if (group.indexOf(schema) === -1) group.push(schema);
}

function validate(rawSchemas: string, args: any[] | IArguments): void {
  if (arguments.length !== 2) throw wrongNumberOfArgs(["SA"], arguments.length);
  if (!rawSchemas) throw missingRequiredArg(0);
  if (!args) throw missingRequiredArg(1);
  if (!types.S.check(rawSchemas)) throw invalidType(0, ["string"], rawSchemas);
  if (!types.A.check(args)) throw invalidType(1, ["array"], args);
  const schemas = rawSchemas.split("|");
  const arity: { [key: number]: string[] } = {};

  schemas.forEach((schema) => {
    for (let ii = 0; ii < schema.length; ++ii) {
      const type = schema[ii];
      if (!types[type]) throw unknownType(ii, type);
    }
    if (/E.*E/.test(schema)) throw moreThanOneError(schema);
    addSchema(schema, arity);
    if (/E/.test(schema)) {
      addSchema(schema.replace(/E.*$/, "E"), arity);
      addSchema(schema.replace(/E/, "Z"), arity);
      if (schema.length === 1) addSchema("", arity);
    }
  });
  let matching = arity[args.length];
  if (!matching) {
    throw wrongNumberOfArgs(Object.keys(arity).map(Number), args.length);
  }
  for (let ii = 0; ii < args.length; ++ii) {
    const newMatching = matching.filter((schema) => {
      const type = schema[ii];
      const typeCheck = types[type].check;
      return typeCheck(args[ii]);
    });
    if (!newMatching.length) {
      const labels = matching.map((_) => types[_[ii]].label).filter((_) => _ != null);
      throw invalidType(ii, labels, args[ii]);
    }
    matching = newMatching;
  }
}

function missingRequiredArg(num: number): ValidateError {
  return newException("EMISSINGARG", "Missing required argument #" + (num + 1));
}

function unknownType(num: number, type: string): ValidateError {
  return newException("EUNKNOWNTYPE", "Unknown type " + type + " in argument #" + (num + 1));
}

function invalidType(num: number, expectedTypes: (string | number)[], value: any): ValidateError {
  let valueType: string | undefined;
  Object.keys(types).forEach((typeCode) => {
    if (types[typeCode].check(value)) valueType = types[typeCode].label;
  });
  return newException(
    "EINVALIDTYPE",
    "Argument #" + (num + 1) + ": Expected " + englishList(expectedTypes) + " but got " + valueType
  );
}

function englishList(list: (string | number)[]): string {
  return list.join(", ").replace(/, ([^,]+)$/, " or $1");
}

function wrongNumberOfArgs(expected: (string | number)[], got: number): ValidateError {
  const english = englishList(expected);
  const args = expected.every((ex) => String(ex).length === 1) ? "argument" : "arguments";
  return newException("EWRONGARGCOUNT", "Expected " + english + " " + args + " but got " + got);
}

function moreThanOneError(schema: string): ValidateError {
  return newException(
    "ETOOMANYERRORTYPES",
    'Only one error type per argument signature is allowed, more than one found in "' + schema + '"'
  );
}

function newException(code: string, msg: string): ValidateError {
  const err = new Error(msg) as ValidateError;
  err.code = code;
  if (Error.captureStackTrace) Error.captureStackTrace(err, validate);
  return err;
}

export = validate;
