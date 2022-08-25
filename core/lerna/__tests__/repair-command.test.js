// @ts-check

"use strict";

const path = require("path");
const { loggingOutput } = require("@lerna-test/helpers/logging-output");

// file under test
const lernaRepair = require("@lerna-test/helpers").commandRunner(require("../commands/repair/command"));

describe("repair", () => {
  it("should output the result of running migrations", async () => {
    // project fixture is irrelevant, no actual changes are made
    await lernaRepair(path.resolve(__dirname, "../../.."))();

    expect(loggingOutput("info")).toContain("No changes were necessary. This workspace is up to date!");
  });
});
