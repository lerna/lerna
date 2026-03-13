import { readFile, writeFile } from "node:fs/promises";
import path from "path";

const dependencyKeys = new Set([
  "dependencies",
  "devDependencies",
  "optionalDependencies",
  "peerDependencies",
]);

function sortObjectKeys(obj: Record<string, string>): Record<string, string> {
  const sorted: Record<string, string> = {};
  for (const key of Object.keys(obj).sort()) {
    sorted[key] = obj[key];
  }
  return sorted;
}

function normalize(data: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const key of Object.keys(data)) {
    if (dependencyKeys.has(key) && data[key] && typeof data[key] === "object") {
      result[key] = sortObjectKeys(data[key]);
    } else {
      result[key] = data[key];
    }
  }
  return result;
}

function detectIndent(content: string): string {
  const match = content.match(/^[ \t]+/m);
  return match ? match[0] : "  ";
}

export async function writePackage(filePath: string, data: Record<string, any>): Promise<void> {
  const resolvedPath =
    path.basename(filePath) === "package.json" ? filePath : path.join(filePath, "package.json");

  const normalized = normalize(data);

  let indent = "  ";
  try {
    const existing = await readFile(resolvedPath, "utf8");
    indent = detectIndent(existing);
  } catch {
    // File doesn't exist yet, use default indent
  }

  const json = JSON.stringify(normalized, null, indent) + "\n";
  await writeFile(resolvedPath, json);
}
