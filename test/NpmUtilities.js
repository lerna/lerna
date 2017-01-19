import assert from "assert";

import NpmUtilities from "../src/NpmUtilities";

describe("NpmUtilities", () => {
  it("should exist", () => {
    assert.ok(NpmUtilities);
  });

  describe(".getNpmClientVersion()", () => {
    it("should exist", () => {
      assert.ok(NpmUtilities.getNpmClientVersion);
    });
  });
});
