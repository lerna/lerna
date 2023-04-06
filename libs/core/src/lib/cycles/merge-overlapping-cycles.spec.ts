import { mergeOverlappingCycles } from "./merge-overlapping-cycles";

describe("mergeOverlappingCycles", () => {
  it("should merge multiple overlapping cycles into one", () => {
    const cycles: string[][] = [
      ["package-a", "package-b"],
      ["package-2", "package-3", "package-4"],
      ["package-3", "package-5", "package-6"],
      ["package-x", "package-xx", "package-xxx"],
      ["package-y", "package-yy", "package-yyy", "package-xxx"],
      ["package-z", "package-zz", "package-zzz", "package-zzzz"],
    ];

    expect(mergeOverlappingCycles(cycles)).toEqual([
      ["package-a", "package-b"],
      ["package-2", "package-3", "package-4", "package-5", "package-6"],
      ["package-x", "package-xx", "package-xxx", "package-y", "package-yy", "package-yyy"],
      ["package-z", "package-zz", "package-zzz", "package-zzzz"],
    ]);
  });
});
