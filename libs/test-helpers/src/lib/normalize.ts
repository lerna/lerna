/**
 * Snapshot-stable path and newline helpers that replace the `normalize-path`
 * and `normalize-newline` packages with native string operations.
 */
export function normalizeNewline(value: string): string {
  return value.replaceAll("\r\n", "\n");
}

export function normalizePath(filePath: string): string {
  return filePath.replaceAll("\\", "/");
}
