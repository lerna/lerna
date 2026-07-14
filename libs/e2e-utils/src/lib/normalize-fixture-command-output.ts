/**
 * Remove terminal colors and npm's own launcher notices from the output of
 * Lerna commands executed through npx.
 */
export function normalizeFixtureCommandOutput(command: string, output: string): string {
  const normalizedOutput = stripConsoleColors(output);

  if (!command.startsWith("npx ") || !command.includes("lerna")) {
    return normalizedOutput;
  }

  return normalizedOutput.replace(/^npm notice run npx\r?\nnpm notice run 'lerna'(?: [^\r\n]*)?\r?\n/gm, "");
}

/**
 * Remove log colors for fail proof string search.
 */
function stripConsoleColors(log: string): string {
  // eslint-disable-next-line no-control-regex
  return log.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, "");
}
