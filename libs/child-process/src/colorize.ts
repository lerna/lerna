// @ts-expect-error -- styleText is available in Node 20.12+ but @types/node may be outdated
import { styleText } from "node:util";

let enabled = true;

/**
 * Apply terminal color/style formatting to text.
 * Wraps util.styleText with a programmatic kill switch for tests,
 * since jest-worker sets FORCE_COLOR=1 which overrides NO_COLOR.
 *
 * NOTE: This is intentionally duplicated from @lerna/core to avoid
 * a circular dependency (core depends on child-process).
 */
export function colorize(format: string | string[], text: string): string {
  if (!enabled) {
    return text;
  }
  return styleText(format, text);
}

colorize.disable = () => {
  enabled = false;
};

colorize.enable = () => {
  enabled = true;
};
