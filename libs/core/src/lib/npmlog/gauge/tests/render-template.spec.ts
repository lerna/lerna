/* eslint-disable @typescript-eslint/no-var-requires */

const renderTemplate = require("../render-template");

describe("renderTemplate", () => {
  it("should handle various template and value combinations correctly", () => {
    let result: any;
    result = renderTemplate(10, [{ type: "name" }], { name: "NAME" });
    expect(result).toBe("NAME      "); // name substitution

    result = renderTemplate(10, [{ type: "name" }, { type: "completionbar" }], {
      name: "NAME",
      completionbar: (values: any, theme: any, width: any) => "xx" + String(width) + "xx",
    });
    expect(result).toBe("NAMExx6xx "); // name + 50%

    result = renderTemplate(10, ["static"], {});
    expect(result).toBe("static    "); // static text

    result = renderTemplate(10, ["static", { type: "name" }], { name: "NAME" });
    expect(result).toBe("staticNAME"); // static text + var

    result = renderTemplate(10, ["static", { type: "name", kerning: 1 }], { name: "NAME" });
    expect(result).toBe("static NAM"); // pre-separated

    result = renderTemplate(10, [{ type: "name", kerning: 1 }, "static"], { name: "NAME" });
    expect(result).toBe("NAME stati"); // post-separated

    result = renderTemplate(10, ["1", { type: "name", kerning: 1 }, "2"], { name: "" });
    expect(result).toBe("12        "); // separated no value

    result = renderTemplate(10, ["1", { type: "name", kerning: 1 }, "2"], { name: "NAME" });
    expect(result).toBe("1 NAME 2  "); // separated value

    result = renderTemplate(10, ["AB", { type: "name", kerning: 1 }, { value: "CD", kerning: 1 }], {
      name: "NAME",
    });
    expect(result).toBe("AB NAME CD"); // multi kerning

    result = renderTemplate(10, [{ type: "name", length: "50%" }, "static"], { name: "N" });
    expect(result).toBe("N    stati"); // percent length

    try {
      result = renderTemplate(10, [{ type: "xyzzy" }, "static"], {});
      throw new Error("Test failed"); // intentionally throw error if no error is caught
    } catch (e) {
      // eslint-disable-next-line jest/no-conditional-expect
      expect(e).toBeDefined(); // missing type
    }

    result = renderTemplate(10, [{ type: "name", minLength: "20%" }, "this long thing"], { name: "N" });
    expect(result).toBe("N this lon"); // percent minlength

    result = renderTemplate(10, [{ type: "name", maxLength: "20%" }, "nope"], { name: "NAME" });
    expect(result).toBe("NAnope    "); // percent maxlength

    result = renderTemplate(10, [{ type: "name", padLeft: 2, padRight: 2 }, "||"], { name: "NAME" });
    expect(result).toBe("  NAME  ||"); // manual padding

    result = renderTemplate(10, [{ value: "ABC", minLength: 2, maxLength: 6 }, "static"], {});
    expect(result).toBe("ABC static"); // max hunk size < maxLength

    result = renderTemplate(10, [{ value: () => "" }], {});
    expect(result).toBe("          "); // empty value

    result = renderTemplate(10, [{ value: "12古34", align: "center", length: "100%" }], {});
    expect(result).toBe("  12古34  "); // wide chars

    result = renderTemplate(10, [{ type: "test", value: "abc" }], { preTest: "¡", postTest: "!" });
    expect(result).toBe("¡abc!     "); // pre/post values

    result = renderTemplate(10, [{ type: "test", value: "abc" }], { preTest: "¡" });
    expect(result).toBe("¡abc      "); // pre values

    result = renderTemplate(10, [{ type: "test", value: "abc" }], { postTest: "!" });
    expect(result).toBe("abc!      "); // post values

    result = renderTemplate(10, [{ value: "abc" }, { value: "‼‼", length: 0 }, { value: "def" }]);
    expect(result).toBe("abcdef    "); // post values

    result = renderTemplate(10, [{ value: "abc", align: "xyzzy" }]);
    expect(result).toBe("abc       "); // unknown aligns are align left
  });
});
