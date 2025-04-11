import path from "path";
import resolveFrom from "resolve-from";
import { ValidationError } from "../validation-error";
import { shallowExtend } from "./shallow-extend";

export function applyExtends(config: { [x: string]: unknown; extends?: any }, cwd: string, seen = new Set()) {
  let defaultConfig = {};

  if ("extends" in config) {
    let pathToDefault;

    try {
      pathToDefault = resolveFrom(cwd, config.extends);
    } catch (err) {
      throw new ValidationError("ERESOLVED", "Config .extends must be locally-resolvable", err);
    }

    if (seen.has(pathToDefault)) {
      throw new ValidationError("ECIRCULAR", "Config .extends cannot be circular", seen);
    }

    seen.add(pathToDefault);

    defaultConfig = require(pathToDefault);
    delete config.extends;

    defaultConfig = applyExtends(defaultConfig, path.dirname(pathToDefault), seen);
  }

  return shallowExtend(config, defaultConfig);
}
