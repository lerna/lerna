import _fetch from "npm-registry-fetch";
import * as npmDistTag from "./npm-dist-tag";

jest.mock("npm-registry-fetch");
jest.mock("@lerna/core", () => ({
  ...jest.requireActual("@lerna/core"),
  otplease: (cb: (arg0: any) => any, opts: any) => Promise.resolve(cb(opts)),
}));

const fetch = jest.mocked(_fetch);

const stubLog = {
  verbose: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
};
const baseOptions = Object.freeze({
  log: stubLog,
  defaultTag: "latest",
});

fetch.mockImplementation(() => Promise.resolve() as any);
fetch.json.mockImplementation(() => Promise.resolve({}));

describe("npmDistTag.add()", () => {
  it("adds a dist-tag for a given package@version", async () => {
    const opts = { ...baseOptions };
    const tags = await npmDistTag.add("@scope/some-pkg@1.0.1", "added-tag", opts as any);

    expect(tags).toEqual({
      "added-tag": "1.0.1",
    });
    expect(fetch).toHaveBeenLastCalledWith(
      "/-/package/@scope%2fsome-pkg/dist-tags/added-tag",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify("1.0.1"),
        headers: {
          "content-type": "application/json",
        },
      })
    );
  });

  it("does not attempt to add duplicate of existing tag", async () => {
    fetch.json.mockImplementationOnce(() =>
      Promise.resolve({
        latest: "1.0.0",
        "dupe-tag": "1.0.1",
      })
    );

    const opts = { ...baseOptions };
    const tags = await npmDistTag.add("@scope/some-pkg@1.0.1", "dupe-tag", opts as any);

    expect(tags).toEqual({
      latest: "1.0.0",
      "dupe-tag": "1.0.1",
    });
    expect(fetch).not.toHaveBeenCalled();
    expect(stubLog.warn).toHaveBeenLastCalledWith(
      "dist-tag",
      "@scope/some-pkg@dupe-tag already set to 1.0.1"
    );
  });

  it("defaults tag argument to opts.defaultTag", async () => {
    fetch.json.mockImplementationOnce(() =>
      Promise.resolve({
        latest: "1.0.0",
      })
    );

    const opts = { ...baseOptions };
    const tags = await npmDistTag.add("@scope/some-pkg@1.0.1", undefined, opts as any);

    expect(tags).toEqual({
      latest: "1.0.1",
    });
  });

  it("supports npm v6 opts.tag fallback", async () => {
    fetch.json.mockImplementationOnce(() =>
      Promise.resolve({
        legacy: "1.0.0",
      })
    );

    const opts = { log: stubLog, tag: "legacy" };
    const tags = await npmDistTag.add("@scope/some-pkg@1.0.1", undefined, opts as any);

    expect(tags).toEqual({
      legacy: "1.0.1",
    });
  });
});

describe("npmDistTag.remove()", () => {
  it("removes an existing dist-tag for a given package", async () => {
    fetch.json.mockImplementationOnce(() =>
      Promise.resolve({
        latest: "1.0.0",
        "removed-tag": "1.0.1",
      })
    );

    const opts = { ...baseOptions };
    const tags = await npmDistTag.remove("@scope/some-pkg@1.0.1", "removed-tag", opts as any);

    expect(tags).not.toHaveProperty("removed-tag");
    expect(fetch).toHaveBeenLastCalledWith(
      "/-/package/@scope%2fsome-pkg/dist-tags/removed-tag",
      expect.objectContaining({
        method: "DELETE",
      })
    );
  });

  it("does not attempt removal of nonexistent tag", async () => {
    const opts = { ...baseOptions };
    const tags = await npmDistTag.remove("@scope/some-pkg@1.0.1", "missing-tag", opts as any);

    expect(tags).toEqual({});
    expect(fetch).not.toHaveBeenCalled();
    expect(stubLog.info).toHaveBeenLastCalledWith(
      "dist-tag",
      '"missing-tag" is not a dist-tag on @scope/some-pkg'
    );
  });
});

describe("npmDistTag.list()", () => {
  it("returns dictionary of dist-tags", async () => {
    fetch.json.mockImplementationOnce(() =>
      Promise.resolve({
        latest: "1.0.0",
        "other-tag": "1.0.1",
        _etag: "should-be-removed",
      })
    );

    const opts = { ...baseOptions };
    const tags = await npmDistTag.list("@scope/some-pkg", opts as any);

    expect(tags).toEqual({
      latest: "1.0.0",
      "other-tag": "1.0.1",
    });
    expect(fetch.json).toHaveBeenLastCalledWith(
      "/-/package/@scope%2fsome-pkg/dist-tags",
      expect.objectContaining({
        preferOnline: true,
        spec: expect.objectContaining({
          name: "@scope/some-pkg",
        }),
      })
    );
  });

  it("handles disastrous results gracefully", async () => {
    fetch.json.mockImplementationOnce(
      () =>
        // i mean, wut
        Promise.resolve(null) as any
    );

    const opts = { ...baseOptions };
    const tags = await npmDistTag.list("@scope/some-pkg", opts as any);

    expect(tags).toEqual({});
  });
});
