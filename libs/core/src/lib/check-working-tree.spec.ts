import { checkWorkingTree } from "./check-working-tree";
import { collectUncommitted as _collectUncommitted } from "./collect-uncommitted";
import { describeRef as _describeRef } from "./describe-ref";

jest.mock("./describe-ref");
jest.mock("./collect-uncommitted");

const describeRef = jest.mocked(_describeRef);
const collectUncommitted = jest.mocked(_collectUncommitted);

describe("check-working-tree", () => {
  it("resolves on a clean tree with no release tags", async () => {
    describeRef.mockResolvedValueOnce({ refCount: "1" } as any);

    const result = await checkWorkingTree({ cwd: "foo" });

    expect(result).toEqual({ refCount: "1" });
    expect(describeRef).toHaveBeenLastCalledWith({ cwd: "foo" });
  });

  it("rejects when current commit has already been released", async () => {
    describeRef.mockResolvedValueOnce({ refCount: "0" } as any);

    await expect(checkWorkingTree()).rejects.toThrow("The current commit has already been released");
  });

  it("rejects when working tree has uncommitted changes", async () => {
    describeRef.mockResolvedValueOnce({ isDirty: true } as any);
    collectUncommitted.mockResolvedValueOnce(["AD file"]);

    await expect(checkWorkingTree()).rejects.toThrow("\nAD file");
  });

  it("passes cwd to collectUncommitted when working tree has uncommitted changes", async () => {
    describeRef.mockResolvedValueOnce({ isDirty: true } as any);
    collectUncommitted.mockResolvedValueOnce(["MM file"]);

    await expect(checkWorkingTree({ cwd: "foo" })).rejects.toThrow("Working tree has uncommitted changes");

    expect(collectUncommitted).toHaveBeenLastCalledWith({ cwd: "foo" });
  });
});
