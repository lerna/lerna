/**
 * Determine whether a string contains an extglob pattern.
 * Extglob patterns use one of: @(...) ?(...) !(...) +(...) *(...)
 *
 * Modernized TypeScript replacement for the `is-extglob` npm package.
 */
export function isExtglob(str: string): boolean {
  if (str === "") return false;

  const regex = /(\\).|([@?!+*]\(.*\))/g;
  let match: RegExpExecArray | null;
  let remaining = str;

  while ((match = regex.exec(remaining))) {
    if (match[2]) return true;
    remaining = remaining.slice(match.index + match[0].length);
    regex.lastIndex = 0;
  }

  return false;
}
