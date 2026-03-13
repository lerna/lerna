import minimatch from "minimatch";

export function multimatch(
  list: string | string[],
  patterns: string | string[],
  options: minimatch.IOptions = {}
): string[] {
  list = Array.isArray(list) ? list : [list];
  patterns = Array.isArray(patterns) ? patterns : [patterns];

  if (list.length === 0 || patterns.length === 0) {
    return [];
  }

  let result: string[] = [];
  for (const item of list) {
    for (let pattern of patterns) {
      let process: (a: string[], b: string[]) => string[];

      if (pattern[0] === "!") {
        pattern = pattern.slice(1);
        process = arrayDiffer;
      } else {
        process = arrayUnion;
      }

      result = process(result, minimatch.match([item], pattern, options));
    }
  }

  return result;
}

function arrayUnion(a: string[], b: string[]): string[] {
  const set = new Set(a);
  for (const item of b) {
    set.add(item);
  }
  return [...set];
}

function arrayDiffer(a: string[], b: string[]): string[] {
  const set = new Set(b);
  return a.filter((item) => !set.has(item));
}
