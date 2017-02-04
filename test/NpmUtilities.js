import assert from "assert";

import NpmUtilities from "../src/NpmUtilities";

describe("NpmUtilities", () => {
  it("should exist", () => {
    assert.ok(NpmUtilities);
  });

  describe(".splitVersion()", () => {
    [
      ["foo", ["foo", undefined], "no version"],
      ["foo@1.0.0", ["foo", "1.0.0"], "exact version"],
      ["foo@^1.0.0", ["foo", "^1.0.0"], "caret range"],
      ["@foo/bar", ["@foo/bar", undefined], "scoped with no version"],
      ["@foo/bar@1.0.0",  ["@foo/bar", "1.0.0"], "scoped with exact version"],
      ["@foo/bar@^1.0.0", ["@foo/bar", "^1.0.0"], "scoped with caret range"],
    ].forEach(([have, want, desc]) => {
      it("should handle " + desc, () => {
        assert.deepEqual(NpmUtilities.splitVersion(have), want);
      });
    });
  });
});
