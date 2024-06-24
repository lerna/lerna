/* eslint-disable @typescript-eslint/no-var-requires */

// eslint-disable-next-line jest/no-export
export {};

const wideTruncate = require("../wide-truncate");

describe("wideTruncate", () => {
  it("should handle various truncation cases correctly", () => {
    let result: any;

    result = wideTruncate("abc", 6);
    expect(result).toBe("abc"); // narrow, no truncation

    result = wideTruncate("古古古", 6);
    expect(result).toBe("古古古"); // wide, no truncation

    result = wideTruncate("abc", 2);
    expect(result).toBe("ab"); // narrow, truncation

    result = wideTruncate("古古古", 2);
    expect(result).toBe("古"); // wide, truncation

    result = wideTruncate("古古", 3);
    expect(result).toBe("古"); // wide, truncation, partial

    result = wideTruncate("古", 1);
    expect(result).toBe(""); // wide, truncation, no chars fit

    result = wideTruncate("abc", 0);
    expect(result).toBe(""); // zero truncation is empty

    result = wideTruncate("", 10);
    expect(result).toBe(""); // empty string

    result = wideTruncate("abc古古古def", 12);
    expect(result).toBe("abc古古古def"); // mixed nwn, no truncation

    result = wideTruncate("abcdef古古古", 12);
    expect(result).toBe("abcdef古古古"); // mixed nw, no truncation

    result = wideTruncate("古古古abcdef", 12);
    expect(result).toBe("古古古abcdef"); // mixed wn, no truncation

    result = wideTruncate("古古abcdef古", 12);
    expect(result).toBe("古古abcdef古"); // mixed wnw, no truncation

    result = wideTruncate("abc古古古def", 6);
    expect(result).toBe("abc古"); // mixed nwn, truncation

    result = wideTruncate("abcdef古古古", 6);
    expect(result).toBe("abcdef"); // mixed nw, truncation

    result = wideTruncate("古古古abcdef", 6);
    expect(result).toBe("古古古"); // mixed wn, truncation

    result = wideTruncate("古古abcdef古", 6);
    expect(result).toBe("古古ab"); // mixed wnw, truncation

    result = wideTruncate("abc\x1b[0mdef", 6);
    expect(result).toBe("abc\x1b[0mdef"); // ansi codes are zero width

    result = wideTruncate("abc\x1b[0mdef", 4);
    expect(result).toBe("abc\x1b[0md"); // ansi codes are zero width, clip text
  });
});
