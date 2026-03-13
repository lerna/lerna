/**
 * Convert Windows backslash paths to forward slash paths.
 * Preserves Windows extended-length paths (\\?\) as-is.
 */
export function slash(path: string): string {
  const isExtendedLengthPath = path.startsWith("\\\\?\\");

  if (isExtendedLengthPath) {
    return path;
  }

  return path.replace(/\\/g, "/");
}
