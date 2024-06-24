/* eslint-disable @typescript-eslint/no-var-requires */

// eslint-disable-next-line jest/no-export
export {};

const progressBar = require("../progress-bar");

describe("progressBar", () => {
  it("should handle different progress values correctly", () => {
    const theme: any = {
      complete: "#",
      remaining: "-",
    };

    let result: any;
    result = progressBar(theme, 10, 0);
    expect(result).toBe("----------"); // 0% bar

    result = progressBar(theme, 10, 0.5);
    expect(result).toBe("#####-----"); // 50% bar

    result = progressBar(theme, 10, 1);
    expect(result).toBe("##########"); // 100% bar

    result = progressBar(theme, 10, -100);
    expect(result).toBe("----------"); // 0% underflow bar

    result = progressBar(theme, 10, 100);
    expect(result).toBe("##########"); // 100% overflow bar

    result = progressBar(theme, 0, 0.5);
    expect(result).toBe(""); // 0 width bar

    const multicharTheme: any = {
      complete: "123",
      remaining: "abc",
    };

    result = progressBar(multicharTheme, 10, 0);
    expect(result).toBe("abcabcabca"); // 0% bar

    result = progressBar(multicharTheme, 10, 0.5);
    expect(result).toBe("12312abcab"); // 50% bar

    result = progressBar(multicharTheme, 10, 1);
    expect(result).toBe("1231231231"); // 100% bar

    result = progressBar(multicharTheme, 10, -100);
    expect(result).toBe("abcabcabca"); // 0% underflow bar

    result = progressBar(multicharTheme, 10, 100);
    expect(result).toBe("1231231231"); // 100% overflow bar

    result = progressBar(multicharTheme, 0, 0.5);
    expect(result).toBe(""); // 0 width bar
  });
});
