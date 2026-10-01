import { normalizeNewline } from "./normalize";

export function multiLineTrimRight(str: any) {
  return normalizeNewline(String(str))
    .split("\n")
    .map((line: string) => line.trimRight())
    .join("\n");
}
