import assert from "assert";

import NpmUtilities from "../src/NpmUtilities";
import ChildProcessUtilities from "../src/ChildProcessUtilities";
import stub from "./_stub";

describe("NpmUtilities", () => {
  it("should exist", () => {
    assert.ok(NpmUtilities);
  });

  describe("getWhoIAm", () => {
    it("should call npm whoami", () => {
      stub(ChildProcessUtilities, "execSync", (command) => {
        assert.equal(command, "npm whoami");
      });
    });

    it("should return undefined if execSync throws", () => {
      stub(ChildProcessUtilities, "execSync", () => {
        throw new Error("test error");
      });
      const actual = NpmUtilities.getWhoIAm();
      assert.equal(typeof actual, "undefined");
    });
  });
});
