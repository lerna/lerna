import { isGlob } from "../is-glob";

describe("isGlob", () => {
  it("should return false for regular strings and paths", () => {
    expect(isGlob("")).toBe(false);
    expect(isGlob("foo")).toBe(false);
    expect(isGlob("path/to/file.js")).toBe(false);
    expect(isGlob("abc.txt")).toBe(false);
    expect(isGlob(".")).toBe(false);
  });

  it("should return true for * patterns", () => {
    expect(isGlob("*")).toBe(true);
    expect(isGlob("*.js")).toBe(true);
    expect(isGlob("path/to/*.js")).toBe(true);
    expect(isGlob("**")).toBe(true);
    expect(isGlob("path/**")).toBe(true);
  });

  it("should return true for ? patterns after certain chars", () => {
    expect(isGlob("file?.js")).toBe(true);
    expect(isGlob("a]?b")).toBe(true);
    expect(isGlob("a.?b")).toBe(true);
    expect(isGlob("a+?b")).toBe(true);
    expect(isGlob("a)?b")).toBe(true);
  });

  it("should return true for [...] bracket patterns", () => {
    expect(isGlob("[abc]")).toBe(true);
    expect(isGlob("[a-z]")).toBe(true);
    expect(isGlob("path/[abc]/file")).toBe(true);
  });

  it("should return true for {...} brace patterns", () => {
    expect(isGlob("{a,b}")).toBe(true);
    expect(isGlob("{a,b,c}")).toBe(true);
    expect(isGlob("path/{a,b}/file")).toBe(true);
  });

  it("should return true for negation patterns starting with !", () => {
    expect(isGlob("!foo")).toBe(true);
    expect(isGlob("!*.js")).toBe(true);
  });

  it("should return true for extglob patterns", () => {
    expect(isGlob("@(foo|bar)")).toBe(true);
    expect(isGlob("?(foo)")).toBe(true);
    expect(isGlob("!(foo)")).toBe(true);
    expect(isGlob("+(foo)")).toBe(true);
    expect(isGlob("*(foo)")).toBe(true);
  });

  it("should return true for regex-like capture group patterns", () => {
    expect(isGlob("(?:foo)")).toBe(true);
    expect(isGlob("(?!foo)")).toBe(true);
    expect(isGlob("(?=foo)")).toBe(true);
  });

  it("should return false for escaped glob characters", () => {
    expect(isGlob("\\*")).toBe(false);
    expect(isGlob("\\?")).toBe(false);
    expect(isGlob("\\[abc]")).toBe(false);
    expect(isGlob("\\{a,b}")).toBe(false);
  });
});
