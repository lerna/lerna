import { ExecaError } from "execa";

export function cleanStack(err: string | ExecaError, className: string) {
  const lines = isAExecaError(err) && err.stack ? err.stack.split("\n") : String(err).split("\n");
  const cutoff = new RegExp(`^    at ${className}.runCommand .*$`);
  const relevantIndex = lines.findIndex((line) => cutoff.test(line));

  if (relevantIndex) {
    return lines.slice(0, relevantIndex).join("\n");
  }

  // nothing matched, just return original error
  return err.toString();
}

function isAExecaError(err: ExecaError | string): err is ExecaError {
  return (err as ExecaError).stack !== undefined;
}
