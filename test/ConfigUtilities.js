import assert from "assert";

import ConfigUtilities from "../src/ConfigUtilities";
import initFixture from "./_initFixture";

describe("ConfigUtilities", () => {
  it("should exist", () => {
    assert.ok(ConfigUtilities);
  });

  it("should throw a helpful error when you forget to pass the directory", () => {
    assert.throws(() => {
      ConfigUtilities.readSync();
    }, Error, "rootPath is required, please provide it as an argument.");
  });

  describe("basic tests", () => {
    let testDir;
    beforeEach((done) => {
      testDir = initFixture("CleanCommand/basic", done);
    });

    it("should read lerna.json", () => {
      const expected = {
        lerna: "__TEST_VERSION__",
        version: "1.0.0"
      };

      const actual = ConfigUtilities.readSync(testDir);

      assert.equal(actual.lerna, expected.lerna);
      assert.equal(actual.version, expected.version);
    });
  });
});
