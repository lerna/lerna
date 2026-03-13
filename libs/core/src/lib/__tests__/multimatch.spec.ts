import { multimatch } from "../multimatch";

const fixtures = ["vendor/js/foo.js", "vendor/js/bar.js", "vendor/js/baz.js"];

describe("multimatch", () => {
  it("match on multiple patterns", () => {
    expect(multimatch(["unicorn", "cake", "rainbows"], ["*", "!cake"])).toEqual(["unicorn", "rainbows"]);
    expect(multimatch(["foo", "bar", "baz"], ["foo"])).toEqual(["foo"]);
    expect(multimatch(["foo", "bar", "baz"], ["!foo"])).toEqual([]);
    expect(multimatch(["foo", "bar", "baz"], ["foo", "bar"])).toEqual(["foo", "bar"]);
    expect(multimatch(["foo", "bar", "baz"], ["foo", "!bar"])).toEqual(["foo"]);
    expect(multimatch(["foo", "bar", "baz"], ["!foo", "bar"])).toEqual(["bar"]);
    expect(multimatch(["foo", "bar", "baz"], ["!foo", "!bar"])).toEqual([]);
    expect(multimatch(["foo", "bar", "baz"], ["!*{o,r}", "foo"])).toEqual(["foo"]);
  });

  it("return an array of matches", () => {
    expect(multimatch(["foo", "bar", "baz"], "foo")).toEqual(["foo"]);
    expect(multimatch(["foo", "bar", "baz"], ["f*"])).toEqual(["foo"]);
    expect(multimatch(["foo", "bar", "baz"], ["f*", "bar"])).toEqual(["foo", "bar"]);
    expect(multimatch(["foo", "bar", "baz"], ["foo", "bar"])).toEqual(["foo", "bar"]);
  });

  it("return matches in the order the list were defined", () => {
    expect(multimatch(["foo", "bar", "baz"], ["bar", "f*"])).toEqual(["foo", "bar"]);
    expect(multimatch(["foo", "bar", "baz"], ["f*", "*z"])).toEqual(["foo", "baz"]);
    expect(multimatch(["foo", "bar", "baz"], ["*z", "f*"])).toEqual(["foo", "baz"]);
    expect(multimatch(["foo", "bar", "baz"], ["!*z", "*r", "f*"])).toEqual(["foo", "bar"]);
    expect(multimatch(["foo", "bar", "baz"], ["*a*", "!f*"])).toEqual(["bar", "baz"]);
  });

  it("return an array with negations omitted", () => {
    expect(multimatch(["foo", "bar", "baz"], "!foo")).toEqual([]);
    expect(multimatch(["foo", "bar", "baz"], ["!foo"])).toEqual([]);
    expect(multimatch(["foo", "bar", "baz"], ["!foo", "!bar"])).toEqual([]);
    expect(multimatch(["foo", "bar", "baz"], ["!*z"])).toEqual([]);
    expect(multimatch(["foo", "bar", "baz"], ["!*z", "!*a*"])).toEqual([]);
    expect(multimatch(["foo", "bar", "baz"], ["!*"])).toEqual([]);
    expect(multimatch(fixtures, ["!**/*z.js"])).toEqual([]);
    expect(multimatch(fixtures, ["!**/*z.js", "**/foo.js"])).toEqual(["vendor/js/foo.js"]);
    expect(multimatch(fixtures, ["!**/*z.js", "!**/*a*.js"])).toEqual([]);
  });

  it("return an empty array when no matches are found", () => {
    expect(multimatch(["foo", "bar", "baz"], ["quux"])).toEqual([]);
    expect(multimatch(fixtures, ["!**/*.js"])).toEqual([]);
  });

  it("patterns are order sensitive", () => {
    expect(multimatch(["foo", "bar", "baz"], ["!*a*", "*z"])).toEqual(["baz"]);
    expect(multimatch(["foo", "bar", "baz"], ["*z", "!*a*"])).toEqual([]);
    expect(multimatch(["foo", "foam", "for", "forum"], ["!*m", "f*"])).toEqual([
      "foo",
      "foam",
      "for",
      "forum",
    ]);
    expect(multimatch(["foo", "foam", "for", "forum"], ["f*", "!*m"])).toEqual(["foo", "for"]);
    expect(multimatch(["foo", "bar", "baz"], ["!*{o,r}", "foo"])).toEqual(["foo"]);
    expect(multimatch(["foo", "bar", "baz"], ["foo", "!*{o,r}"])).toEqual([]);
    expect(multimatch(["foo", "bar", "baz"], ["!foo", "bar"])).toEqual(["bar"]);
    expect(multimatch(["foo", "bar", "baz"], ["foo", "!bar"])).toEqual(["foo"]);
    expect(multimatch(["foo", "bar", "baz"], ["bar", "!foo", "foo"])).toEqual(["foo", "bar"]);
    expect(multimatch(["foo", "bar", "baz"], ["foo", "!foo", "bar"])).toEqual(["bar"]);
  });

  it("override negations and re-include explicitly defined patterns", () => {
    expect(multimatch(["foo", "bar", "baz"], ["!*"])).toEqual([]);
    expect(multimatch(["foo", "bar", "baz"], ["!*a*"])).toEqual([]);
    expect(multimatch(["foo", "bar", "baz"], ["bar", "!*a*"])).toEqual([]);
    expect(multimatch(["foo", "bar", "baz"], ["!*a*", "bar"])).toEqual(["bar"]);
    expect(multimatch(["foo", "bar", "baz"], ["!*a*", "*"])).toEqual(["foo", "bar", "baz"]);
    expect(multimatch(["foo", "bar", "baz"], ["!*a*", "*z"])).toEqual(["baz"]);
  });

  it("misc", () => {
    expect(multimatch(["foo", "bar", "baz"], ["*", "!foo"])).toEqual(["bar", "baz"]);
    expect(multimatch(["foo", "bar", "baz"], ["*", "!foo", "bar"])).toEqual(["bar", "baz"]);
    expect(multimatch(["foo", "bar", "baz"], ["!foo", "*"])).toEqual(["foo", "bar", "baz"]);
    expect(multimatch(["foo", "bar", "baz"], ["*", "!foo", "!bar"])).toEqual(["baz"]);
    expect(multimatch(["foo", "bar", "baz"], ["!*{o,r}", "*"])).toEqual(["foo", "bar", "baz"]);
    expect(multimatch(["foo", "bar", "baz"], ["*", "!*{o,r}"])).toEqual(["baz"]);
    expect(multimatch(["foo", "bar", "baz"], ["foo", "!*{o,r}", "*"])).toEqual(["foo", "bar", "baz"]);
    expect(multimatch(["foo", "bar", "baz"], ["*", "!*{o,r}", "foo"])).toEqual(["foo", "baz"]);
    expect(multimatch(["foo", "bar", "baz"], ["!*{o,r}", "*", "foo"])).toEqual(["foo", "bar", "baz"]);
    expect(multimatch(["foo", "bar", "baz"], ["foo", "!*{o,r}", "foo"])).toEqual(["foo"]);
    expect(multimatch(["foo", "one", "two", "four", "do", "once", "only"], ["once", "!o*", "once"])).toEqual([
      "once",
    ]);
    expect(multimatch(["foo", "one", "two", "four", "do", "once", "only"], ["*", "!o*", "once"])).toEqual([
      "foo",
      "two",
      "four",
      "do",
      "once",
    ]);
  });

  it("handles empty inputs", () => {
    expect(multimatch([], ["foo"])).toEqual([]);
    expect(multimatch(["foo"], [])).toEqual([]);
    expect(multimatch([], [])).toEqual([]);
  });

  it("accepts a single string for list and patterns", () => {
    expect(multimatch("foo", "foo")).toEqual(["foo"]);
    expect(multimatch("foo", "bar")).toEqual([]);
  });
});
