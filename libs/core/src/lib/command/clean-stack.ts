import { ExecaError } from "execa";

export function cleanStack(err: ExecaError, className: string) {
  const lines = err.stack ? err.stack.split("\n") : String(err).split("\n");
  const cutoff = new RegExp(`^    at ${className}.runCommand .*$`);
  const relevantIndex = lines.findIndex((line) => cutoff.test(line));

  if (relevantIndex) {
    return lines.slice(0, relevantIndex).join("\n");
  }

  // nothing matched, just return original error
  return err;
}
