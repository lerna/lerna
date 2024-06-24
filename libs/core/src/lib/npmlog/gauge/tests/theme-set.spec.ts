/* eslint-disable jest/no-conditional-expect */
/* eslint-disable @typescript-eslint/no-var-requires */

const ThemeSet = require("../theme-set");

const themes = new ThemeSet();
themes.addTheme("fallback", { id: 0 });
themes.addTheme("test1", { id: 1 });
themes.addTheme("test2", { id: 2 });
themes.addTheme("test3", { id: 3 });
themes.addTheme("test4", { id: 4 });
themes.addTheme("testz", themes.getTheme("fallback"), { id: "z" });
themes.setDefault("fallback");
themes.setDefault({ platform: "aa", hasUnicode: false, hasColor: false }, "test1");
themes.setDefault({ platform: "bb", hasUnicode: true, hasColor: true }, "test2");
themes.setDefault({ platform: "ab", hasUnicode: false, hasColor: true }, "test3");
themes.setDefault({ platform: "ba", hasUnicode: true, hasColor: false }, "test4");

themes.setDefault({ platform: "zz", hasUnicode: false, hasColor: false }, "test1");
themes.setDefault({ platform: "zz", hasUnicode: true, hasColor: true }, "test2");
themes.setDefault({ platform: "zz", hasUnicode: false, hasColor: true }, "test3");
themes.setDefault({ platform: "zz", hasUnicode: true, hasColor: false }, "test4");

describe("ThemeSet", () => {
  it("should get themes based on conditions", () => {
    expect(themes().id).toBe(0); // fallback

    expect(themes({ platform: "aa" }).id).toBe(1); // aa ff
    expect(themes({ platform: "aa", hasUnicode: true }).id).toBe(1); // aa tf
    expect(themes({ platform: "aa", hasColor: true }).id).toBe(1); // aa ft
    expect(themes({ platform: "aa", hasUnicode: true, hasColor: true }).id).toBe(1); // aa tt
    expect(themes({ platform: "bb" }).id).toBe(0); // bb ff
    expect(themes({ platform: "bb", hasUnicode: true }).id).toBe(0); // bb tf
    expect(themes({ platform: "bb", hasColor: true }).id).toBe(0); // bb ft
    expect(themes({ platform: "bb", hasUnicode: true, hasColor: true }).id).toBe(2); // bb tt

    expect(themes({ platform: "ab" }).id).toBe(0); // ab ff
    expect(themes({ platform: "ab", hasUnicode: true }).id).toBe(0); // ab tf
    expect(themes({ platform: "ab", hasColor: true }).id).toBe(3); // ab ft
    expect(themes({ platform: "ab", hasUnicode: true, hasColor: true }).id).toBe(3); // ab tt

    expect(themes({ platform: "ba" }).id).toBe(0); // ba ff
    expect(themes({ platform: "ba", hasUnicode: true }).id).toBe(4); // ba tf
    expect(themes({ platform: "ba", hasColor: true }).id).toBe(0); // ba ft
    expect(themes({ platform: "ba", hasUnicode: true, hasColor: true }).id).toBe(4); // ba tt

    expect(themes({ platform: "zz" }).id).toBe(1); // zz ff
    expect(themes({ platform: "zz", hasUnicode: true }).id).toBe(4); // zz tf
    expect(themes({ platform: "zz", hasColor: true }).id).toBe(3); // zz ft
    expect(themes({ platform: "zz", hasUnicode: true, hasColor: true }).id).toBe(2); // zz tt

    try {
      themes.getTheme("does not exist");
      throw new Error("Test failed"); // intentionally throw error if no error is caught
    } catch (ex: any) {
      expect(ex.code).toBe("EMISSINGTHEME"); // missing theme
    }

    expect(themes.getTheme("testz").id).toBe("z"); // testz

    const empty = new ThemeSet();

    try {
      empty();
      throw new Error("Test failed"); // intentionally throw error if no error is caught
    } catch (ex: any) {
      expect(ex.code).toBe("EMISSINGTHEME"); // no themes
    }

    empty.addTheme("exists", { id: "exists" });
    empty.setDefault({ hasUnicode: true, hasColor: true }, "exists");
    try {
      empty();
      throw new Error("Test failed"); // intentionally throw error if no error is caught
    } catch (ex: any) {
      expect(ex.code).toBe("EMISSINGTHEME"); // no fallback
    }
  });

  it("should add properties to all themes", () => {
    themes.addToAllThemes({
      xyz: 17,
    });
    expect(themes.getTheme("test1").xyz).toBe(17); // existing themes updated
    const newTheme: any = themes.newTheme({ id: 99 });
    expect(newTheme.id).toBe(99); // new theme initialized
    expect(newTheme.xyz).toBe(17); // new theme got extension
  });
});
