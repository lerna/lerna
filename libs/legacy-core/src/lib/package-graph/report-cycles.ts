import { ValidationError } from "@lerna/core";
import log from "npmlog";

export function reportCycles(paths: string[], rejectCycles?: boolean) {
  if (!paths.length) {
    return;
  }

  const cycleMessage = ["Dependency cycles detected, you should fix these!"].concat(paths).join("\n");

  if (rejectCycles) {
    throw new ValidationError("ECYCLE", cycleMessage);
  }

  log.warn("ECYCLE", cycleMessage);
}
