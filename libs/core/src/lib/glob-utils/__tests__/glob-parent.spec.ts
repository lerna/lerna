import { globParent } from "../glob-parent";

describe("globParent", () => {
  it("should return the dirname of simple paths (non-glob segments are treated as filenames)", () => {
    expect(globParent("path/to/dir/")).toBe("path/to/dir");
  });

  it("should strip glob from end", () => {
    expect(globParent("path/to/*.js")).toBe("path/to");
  });

  it("should strip globstar", () => {
    expect(globParent("path/**/file")).toBe("path");
  });

  it("should handle brace expansion", () => {
    expect(globParent("path/{a,b}")).toBe("path");
  });

  it("should handle all extglob variants", () => {
    expect(globParent("path/!(a|b)")).toBe("path");
    expect(globParent("path/?(a|b)")).toBe("path");
    expect(globParent("path/+(a|b)")).toBe("path");
    expect(globParent("path/*(a|b)")).toBe("path");
    expect(globParent("path/@(a|b)")).toBe("path");
  });

  it("should handle nested globs", () => {
    expect(globParent("path/to/*/sub/**")).toBe("path/to");
    expect(globParent("path/**/*")).toBe("path");
  });

  it("should return '.' for root-level globs", () => {
    expect(globParent("*.js")).toBe(".");
    expect(globParent("**/*.js")).toBe(".");
  });

  it("should handle absolute paths", () => {
    expect(globParent("/root/path/to/*.js")).toBe("/root/path/to");
    expect(globParent("/*.js")).toBe("/");
  });

  it("should handle non-glob paths (last segment treated as filename by dirname)", () => {
    expect(globParent("path/foo")).toBe("path");
    expect(globParent("path/foo/bar.js")).toBe("path/foo");
  });

  it("should handle escaped characters by stripping the escaped glob segment", () => {
    // \* is a literal filename, not a glob; dirname strips the last segment
    expect(globParent("path/\\*")).toBe("path");
  });

  it("should handle the common lerna use case", () => {
    expect(globParent("packages/*")).toBe("packages");
  });

  it("should handle bracket patterns", () => {
    expect(globParent("path/[abc]")).toBe("path");
  });

  it("should handle negation patterns", () => {
    expect(globParent("!path")).toBe(".");
  });
});
