/* eslint-disable @typescript-eslint/no-var-requires */

const themes = require("../themes");

describe("selector", () => {
  it("should return correct theme based on conditions", () => {
    expect(themes({ hasUnicode: false, hasColor: false, platform: "unknown" })).toBe(
      themes.getTheme("ASCII")
    ); // fallback
    expect(themes({ hasUnicode: false, hasColor: false, platform: "darwin" })).toBe(themes.getTheme("ASCII")); // ff darwin
    expect(themes({ hasUnicode: true, hasColor: false, platform: "darwin" })).toBe(
      themes.getTheme("brailleSpinner")
    ); // tf darwin
    expect(themes({ hasUnicode: false, hasColor: true, platform: "darwin" })).toBe(
      themes.getTheme("colorASCII")
    ); // ft darwin
    expect(themes({ hasUnicode: true, hasColor: true, platform: "darwin" })).toBe(
      themes.getTheme("colorBrailleSpinner")
    ); // tt darwin
  });
});
