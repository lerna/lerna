import { getCycles } from "./get-cycles";

describe("getCycles", () => {
  it("should find a single cycle", () => {
    const projectGraphDependencies: Record<string, Set<string>> = {
      "package-1": new Set(["package-2"]),
      "package-2": new Set(["package-3"]),
      "package-3": new Set(["package-2"]),
    };

    expect(getCycles(projectGraphDependencies)).toEqual([["package-2", "package-3"]]);
  });

  it("should find two independent cycles", () => {
    const projectGraphDependencies: Record<string, Set<string>> = {
      "package-a": new Set(["package-b"]),
      "package-b": new Set(["package-c"]),
      "package-c": new Set(["package-a"]),
      "package-1": new Set(["package-2"]),
      "package-2": new Set(["package-3"]),
      "package-3": new Set(["package-1"]),
      "package-x": new Set(["package-xx"]),
      "package-xx": new Set(["package-b", "package-3"]),
    };

    expect(getCycles(projectGraphDependencies)).toEqual([
      ["package-a", "package-b", "package-c"],
      ["package-1", "package-2", "package-3"],
    ]);
  });

  it("should find two cycles with overlapping nodes", () => {
    const projectGraphDependencies: Record<string, Set<string>> = {
      "package-1": new Set(["package-2", "package-7"]),
      "package-2": new Set(["package-3"]),
      "package-3": new Set(["package-4", "package-5"]),
      "package-4": new Set(["package-2"]),
      "package-5": new Set(["package-6"]),
      "package-6": new Set(["package-3"]),
      "package-7": new Set(["package-5"]),
    };

    expect(getCycles(projectGraphDependencies)).toEqual([
      ["package-2", "package-3", "package-4"],
      ["package-3", "package-5", "package-6"],
    ]);
  });
});
