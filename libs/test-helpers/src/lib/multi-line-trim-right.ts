// TODO: refactor to address type issues
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import normalizeNewline from "normalize-newline";

export function multiLineTrimRight(str: any) {
  return normalizeNewline(str)
    .split("\n")
    .map((line: string) => line.trimRight())
    .join("\n");
}
