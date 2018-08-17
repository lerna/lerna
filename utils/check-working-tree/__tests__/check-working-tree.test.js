"use strict";

jest.mock("@lerna/describe-ref");

const describeRef = require("@lerna/describe-ref");
const checkWorkingTree = require("../lib/check-working-tree");

describe("check-working-tree", () => {
  it("resolves on a clean tree with no release tags", async () => {
    describeRef.mockResolvedValueOnce({ refCount: "1" });

    const result = await checkWorkingTree({ cwd: "foo" });

    expect(result).toEqual({ refCount: "1" });
    expect(describeRef).lastCalledWith({ cwd: "foo" });
  });

  it("rejects when current commit has already been released", async () => {
    describeRef.mockResolvedValueOnce({ refCount: "0" });

    try {
      await checkWorkingTree();
    } catch (err) {
      expect(err.message).toMatch("The current commit has already been released");
    }

    expect.assertions(1);
  });

  it("rejects when working tree has uncommitted changes", async () => {
    describeRef.mockResolvedValueOnce({ isDirty: true });

    try {
      await checkWorkingTree();
    } catch (err) {
      expect(err.message).toMatch("Working tree has uncommitted changes");
    }

    expect.assertions(1);
  });
});
