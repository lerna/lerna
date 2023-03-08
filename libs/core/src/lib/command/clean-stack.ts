export function cleanStack(err: string | Error, className: string) {
  const lines = isErrorWithStack(err) ? err.stack.split("\n") : String(err).split("\n");
  const cutoff = new RegExp(`^    at ${className}.runCommand .*$`);
  const relevantIndex = lines.findIndex((line) => cutoff.test(line));

  if (relevantIndex) {
    return lines.slice(0, relevantIndex).join("\n");
  }

  // nothing matched, just return original error
  return err.toString();
}

function isErrorWithStack(err: Error | string): err is Error & { stack: string } {
  return (err as Error).stack !== undefined;
}
