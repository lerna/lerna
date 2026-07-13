import { normalizeCommandOutput } from "./snapshot-serializer-utils";

describe("normalizeCommandOutput", () => {
  it("removes terminal styling before trimming lines", () => {
    const output =
      "\u001B[7m\u001B[1m\u001B[32m Lerna (powered by Nx) \u001B[39m\u001B[22m\u001B[27m  Successfully ran target";

    expect(normalizeCommandOutput(output)).toBe("Lerna (powered by Nx)   Successfully ran target");
  });
});
