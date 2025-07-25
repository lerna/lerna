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

  // Test the helper functions by accessing them through a test-only export
  describe("helper functions", () => {
    // We'll access the helper functions by importing them from a test file
    // Since they're private, we'll test them indirectly through edge cases
    
    it("should handle empty cycles", () => {
      expect(mergeOverlappingCycles([])).toEqual([]);
    });

    it("should handle single cycle", () => {
      const cycles = [["package-a", "package-b", "package-c"]];
      expect(mergeOverlappingCycles(cycles)).toEqual([["package-a", "package-b", "package-c"]]);
    });

    it("should handle cycles with no overlaps", () => {
      const cycles = [
        ["package-a", "package-b"],
        ["package-c", "package-d"],
        ["package-e", "package-f"]
      ];
      expect(mergeOverlappingCycles(cycles)).toEqual([
        ["package-a", "package-b"],
        ["package-c", "package-d"],
        ["package-e", "package-f"]
      ]);
    });

    it("should handle cycles with complete overlap", () => {
      const cycles = [
        ["package-a", "package-b", "package-c"],
        ["package-a", "package-b", "package-c"]
      ];
      expect(mergeOverlappingCycles(cycles)).toEqual([
        ["package-a", "package-b", "package-c"]
      ]);
    });

    it("should handle cycles with partial overlap", () => {
      const cycles = [
        ["package-a", "package-b"],
        ["package-b", "package-c"]
      ];
      expect(mergeOverlappingCycles(cycles)).toEqual([
        ["package-a", "package-b", "package-c"]
      ]);
    });
  });
});
