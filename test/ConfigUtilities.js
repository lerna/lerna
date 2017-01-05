import assert from "assert";

import ConfigUtilities from "../src/ConfigUtilities";
import FileSystemUtilities from "../src/FileSystemUtilities";
import stub from "./_stub";
import path from "path";

describe("ConfigUtilities", () => {
  it("should exist", () => {
    assert.ok(ConfigUtilities);
  });

  it("should read lerna.json from the file system", () => {
    const expected = {
      "lerna":"2.0.0-beta.32",
      "owners":["douglas.wade"]
    };

    stub(FileSystemUtilities, "readFileSync", () => {
      return JSON.stringify(expected);
    });

    const actual = ConfigUtilities.readSync("fake/path");
    assert.deepEqual(actual, expected);
  });

  it("should write lerna.json from the file system", () => {
    const expected = {
      "lerna":"2.0.0-beta.32",
      "owners":["douglas.wade"]
    };

    stub(FileSystemUtilities, "writeFileSync", (actualFilePath, actualFileContents) => {
      assert.equal(actualFilePath, path.join("fake", "path", "lerna.json"));
      assert.equal(actualFileContents, JSON.stringify(expected));
    });

    ConfigUtilities.writeSync("fake/path", expected);
  });
});
