import log from "../npmlog";
import { ValidationError } from "../validation-error";

export function reportCycles(cycles: string[][], rejectCycles?: boolean) {
  // indicate that the last node in the cycle points back to the first
  const cyclesWithRepeatedNodes = cycles.map((cycle) => [...cycle, cycle[0]]);

  const paths = Array.from(cyclesWithRepeatedNodes, (cycle) => cycle.join(" -> "), false);

  if (!paths.length) {
    return;
  }

  const cycleMessage = ["Dependency cycles detected, you should fix these!"].concat(paths).join("\n");

  if (rejectCycles) {
    throw new ValidationError("ECYCLE", cycleMessage);
  }

  log.warn("ECYCLE", cycleMessage);
}
