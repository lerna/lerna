// _.defaults(), but simplified:
//  * All inputs are plain objects

import { CommandConfigOptions } from "../project";

//  * Only own keys, not inherited
export function defaultOptions<T extends CommandConfigOptions>(...sources: any[]): T {
  const options: CommandConfigOptions = {};

  for (const source of sources) {
    if (source != null) {
      for (const key of Object.keys(source)) {
        // TODO: refactor to address type issues
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        if (options[key] === undefined) {
          // TODO: refactor to address type issues
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          options[key] = source[key];
        }
      }
    }
  }

  return options as T;
}
