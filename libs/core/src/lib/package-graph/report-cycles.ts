import log from "npmlog";
import { ValidationError } from "../validation-error";

export function reportCycles(paths: any, rejectCycles: any) {
  if (!paths.length) {
    return;
  }

  const cycleMessage = ["Dependency cycles detected, you should fix these!"].concat(paths).join("\n");

  if (rejectCycles) {
    throw new ValidationError("ECYCLE", cycleMessage);
  }

  log.warn("ECYCLE", cycleMessage);
}
