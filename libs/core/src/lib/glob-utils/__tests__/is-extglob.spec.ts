import { isExtglob } from "../is-extglob";

describe("isExtglob", () => {
  it("should return false for empty strings", () => {
    expect(isExtglob("")).toBe(false);
  });

  it("should return false for regular strings", () => {
    expect(isExtglob("foo")).toBe(false);
    expect(isExtglob("path/to/file.js")).toBe(false);
    expect(isExtglob("abc")).toBe(false);
    expect(isExtglob(".")).toBe(false);
  });

  it("should return true for extglob patterns with @()", () => {
    expect(isExtglob("@(foo)")).toBe(true);
    expect(isExtglob("@(a|b)")).toBe(true);
    expect(isExtglob("path/@(foo|bar)")).toBe(true);
  });

  it("should return true for extglob patterns with ?()", () => {
    expect(isExtglob("?(foo)")).toBe(true);
    expect(isExtglob("?(a|b)")).toBe(true);
  });

  it("should return true for extglob patterns with !()", () => {
    expect(isExtglob("!(foo)")).toBe(true);
    expect(isExtglob("!(a|b)")).toBe(true);
  });

  it("should return true for extglob patterns with +()", () => {
    expect(isExtglob("+(foo)")).toBe(true);
    expect(isExtglob("+(a|b)")).toBe(true);
  });

  it("should return true for extglob patterns with *()", () => {
    expect(isExtglob("*(foo)")).toBe(true);
    expect(isExtglob("*(a|b)")).toBe(true);
  });

  it("should return false for escaped extglob patterns", () => {
    expect(isExtglob("\\@(foo)")).toBe(false);
    expect(isExtglob("\\?(foo)")).toBe(false);
    expect(isExtglob("\\!(foo)")).toBe(false);
    expect(isExtglob("\\+(foo)")).toBe(false);
    expect(isExtglob("\\*(foo)")).toBe(false);
  });

  it("should return true for patterns with content inside parens", () => {
    expect(isExtglob("@(foo|bar|baz)")).toBe(true);
    expect(isExtglob("*(a|b|c)")).toBe(true);
  });

  it("should return false for non-extglob parentheses", () => {
    expect(isExtglob("(foo)")).toBe(false);
    expect(isExtglob("foo(bar)")).toBe(false);
  });
});
