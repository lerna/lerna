"use strict";

const { getPacked } = require("..");

describe("@lerna/get-packed", () => {
  it("is tested by pack-directory", () => {
    expect(getPacked).toBeDefined();
  });
});
