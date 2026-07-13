/**
 * Minimal line-diff implementation for lerna init dry-run output.
 *
 * Replaces jest-diff to eliminate the runtime dependency on jest packages and
 * their transitive dependencies (pretty-format, chalk, ansi-styles).
 *
 * Modeled on the equivalent replacement in Nx:
 * https://github.com/nrwl/nx/blob/master/packages/nx/src/command-line/release/utils/diff.ts
 * The hunk formatting is a faithful port of jest-diff's joinAlignedDiffsNoExpand,
 * but the line alignment uses a classic LCS table instead of @jest/diff-sequences,
 * which is more than fast enough for the small config files lerna init touches.
 */

const DIFF_DELETE = -1;
const DIFF_EQUAL = 0;
const DIFF_INSERT = 1;

export interface DiffOptions {
  contextLines?: number;
  expand?: boolean;
  aColor?: (s: string) => string;
  bColor?: (s: string) => string;
  commonColor?: (s: string) => string;
  patchColor?: (s: string) => string;
  omitAnnotationLines?: boolean;
}

const noColor = (s: string) => s;

const NO_DIFF_MESSAGE = "Compared values have no visual difference.";

type Diff = [number, string];

function diffLinesRaw(aLines: string[], bLines: string[]): Diff[] {
  const aLength = aLines.length;
  const bLength = bLines.length;

  // Longest common subsequence lengths; lcs[i][j] covers aLines[i..] vs bLines[j..].
  const lcs: number[][] = Array.from({ length: aLength + 1 }, () => new Array(bLength + 1).fill(0));
  for (let i = aLength - 1; i >= 0; i--) {
    for (let j = bLength - 1; j >= 0; j--) {
      lcs[i][j] = aLines[i] === bLines[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }

  const diffs: Diff[] = [];
  let aIndex = 0;
  let bIndex = 0;
  while (aIndex < aLength && bIndex < bLength) {
    if (aLines[aIndex] === bLines[bIndex]) {
      diffs.push([DIFF_EQUAL, aLines[aIndex]]);
      aIndex += 1;
      bIndex += 1;
    } else if (lcs[aIndex + 1][bIndex] >= lcs[aIndex][bIndex + 1]) {
      diffs.push([DIFF_DELETE, aLines[aIndex]]);
      aIndex += 1;
    } else {
      diffs.push([DIFF_INSERT, bLines[bIndex]]);
      bIndex += 1;
    }
  }
  for (; aIndex < aLength; aIndex += 1) {
    diffs.push([DIFF_DELETE, aLines[aIndex]]);
  }
  for (; bIndex < bLength; bIndex += 1) {
    diffs.push([DIFF_INSERT, bLines[bIndex]]);
  }

  return diffs;
}

interface ResolvedOptions {
  contextLines: number;
  aColor: (s: string) => string;
  bColor: (s: string) => string;
  commonColor: (s: string) => string;
  patchColor: (s: string) => string;
}

// A deleted/inserted empty line renders as a bare indicator; a common empty
// line renders as an empty string (matching jest-diff's default options).
function printChangeLine(line: string, color: (s: string) => string, indicator: string): string {
  return line.length === 0 ? color(indicator) : color(`${indicator} ${line}`);
}

function printCommonLine(line: string, commonColor: (s: string) => string): string {
  return line.length === 0 ? "" : commonColor(`  ${line}`);
}

function createPatchMark(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number,
  patchColor: (s: string) => string
): string {
  return patchColor(`@@ -${aStart + 1},${aEnd - aStart} +${bStart + 1},${bEnd - bStart} @@`);
}

// Faithful port of jest-diff's joinAlignedDiffsNoExpand: show changed lines
// with surrounding context only, separating distant changes with patch marks.
function joinAlignedDiffsNoExpand(diffs: Diff[], options: ResolvedOptions): string {
  const iLength = diffs.length;
  const nContextLines = options.contextLines;
  const nContextLines2 = nContextLines + nContextLines;

  // First pass: determine whether any common lines are omitted, which decides
  // if patch marks are rendered at all.
  let hasExcessAtStartOrEnd = false;
  let nExcessesBetweenChanges = 0;
  let i = 0;
  while (i !== iLength) {
    const iStart = i;
    while (i !== iLength && diffs[i][0] === DIFF_EQUAL) {
      i += 1;
    }
    if (iStart !== i) {
      if (iStart === 0) {
        if (i > nContextLines) {
          hasExcessAtStartOrEnd = true;
        }
      } else if (i === iLength) {
        if (i - iStart > nContextLines) {
          hasExcessAtStartOrEnd = true;
        }
      } else if (i - iStart > nContextLines2) {
        nExcessesBetweenChanges += 1;
      }
    }
    while (i !== iLength && diffs[i][0] !== DIFF_EQUAL) {
      i += 1;
    }
  }
  const hasPatch = nExcessesBetweenChanges !== 0 || hasExcessAtStartOrEnd;

  const lines: string[] = [];
  let jPatchMark = 0; // index of placeholder line for current patch mark
  if (hasPatch) {
    lines.push(""); // placeholder line for first patch mark
  }

  // Indexes of expected or received lines in current patch:
  let aStart = 0;
  let bStart = 0;
  let aEnd = 0;
  let bEnd = 0;
  const pushCommonLine = (line: string) => {
    lines.push(printCommonLine(line, options.commonColor));
    aEnd += 1;
    bEnd += 1;
  };

  // Second pass: push lines with diff formatting (and patch marks, if needed).
  i = 0;
  while (i !== iLength) {
    let iStart = i;
    while (i !== iLength && diffs[i][0] === DIFF_EQUAL) {
      i += 1;
    }
    if (iStart !== i) {
      if (iStart === 0) {
        // at beginning
        if (i > nContextLines) {
          iStart = i - nContextLines;
          aStart = iStart;
          bStart = iStart;
          aEnd = aStart;
          bEnd = bStart;
        }
        for (let iCommon = iStart; iCommon !== i; iCommon += 1) {
          pushCommonLine(diffs[iCommon][1]);
        }
      } else if (i === iLength) {
        // at end
        const iEnd = i - iStart > nContextLines ? iStart + nContextLines : i;
        for (let iCommon = iStart; iCommon !== iEnd; iCommon += 1) {
          pushCommonLine(diffs[iCommon][1]);
        }
      } else {
        // between changes
        const nCommon = i - iStart;
        if (nCommon > nContextLines2) {
          const iEnd = iStart + nContextLines;
          for (let iCommon = iStart; iCommon !== iEnd; iCommon += 1) {
            pushCommonLine(diffs[iCommon][1]);
          }
          lines[jPatchMark] = createPatchMark(aStart, aEnd, bStart, bEnd, options.patchColor);
          jPatchMark = lines.length;
          lines.push(""); // placeholder line for next patch mark

          const nOmit = nCommon - nContextLines2;
          aStart = aEnd + nOmit;
          bStart = bEnd + nOmit;
          aEnd = aStart;
          bEnd = bStart;
          for (let iCommon = i - nContextLines; iCommon !== i; iCommon += 1) {
            pushCommonLine(diffs[iCommon][1]);
          }
        } else {
          for (let iCommon = iStart; iCommon !== i; iCommon += 1) {
            pushCommonLine(diffs[iCommon][1]);
          }
        }
      }
    }
    while (i !== iLength && diffs[i][0] === DIFF_DELETE) {
      lines.push(printChangeLine(diffs[i][1], options.aColor, "-"));
      aEnd += 1;
      i += 1;
    }
    while (i !== iLength && diffs[i][0] === DIFF_INSERT) {
      lines.push(printChangeLine(diffs[i][1], options.bColor, "+"));
      bEnd += 1;
      i += 1;
    }
  }
  if (hasPatch) {
    lines[jPatchMark] = createPatchMark(aStart, aEnd, bStart, bEnd, options.patchColor);
  }
  return lines.join("\n");
}

function joinAlignedDiffsExpand(diffs: Diff[], options: ResolvedOptions): string {
  return diffs
    .map(([type, line]) => {
      switch (type) {
        case DIFF_DELETE:
          return printChangeLine(line, options.aColor, "-");
        case DIFF_INSERT:
          return printChangeLine(line, options.bColor, "+");
        default:
          return printCommonLine(line, options.commonColor);
      }
    })
    .join("\n");
}

export function diff(a: string, b: string, options: DiffOptions = {}): string {
  if (a === b) {
    return NO_DIFF_MESSAGE;
  }

  const aLines = a.split("\n");
  const bLines = b.split("\n");
  const diffs = diffLinesRaw(a === "" ? [] : aLines, b === "" ? [] : bLines);

  const resolved: ResolvedOptions = {
    contextLines: typeof options.contextLines === "number" ? options.contextLines : 5,
    aColor: options.aColor || noColor,
    bColor: options.bColor || noColor,
    commonColor: options.commonColor || noColor,
    patchColor: options.patchColor || noColor,
  };

  if (options.expand ?? true) {
    return joinAlignedDiffsExpand(diffs, resolved);
  }
  return joinAlignedDiffsNoExpand(diffs, resolved);
}
