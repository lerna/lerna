"use strict";

jest.mock("libnpm/fetch");

// mocked modules
const fetch = require("libnpm/fetch");

// file under test
const npmDistTag = require("..");

expect.extend(require("@lerna-test/figgy-pudding-matchers"));

const stubLog = {
  verbose: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
};
const baseOptions = new Map([["log", stubLog], ["tag", "latest"]]);

fetch.mockImplementation(() => Promise.resolve());
fetch.json.mockImplementation(() => Promise.resolve({}));

describe("npmDistTag.add()", () => {
  it("adds a dist-tag for a given package@version", async () => {
    const opts = new Map(baseOptions);
    const tags = await npmDistTag.add("@scope/some-pkg@1.0.1", "added-tag", opts);

    expect(tags).toEqual({
      "added-tag": "1.0.1",
    });
    expect(fetch).toHaveBeenLastCalledWith(
      "-/package/@scope%2fsome-pkg/dist-tags/added-tag",
      expect.figgyPudding({
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

    const opts = new Map(baseOptions);
    const tags = await npmDistTag.add("@scope/some-pkg@1.0.1", "dupe-tag", opts);

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

  it("defaults tag argument to opts.tag", async () => {
    fetch.json.mockImplementationOnce(() =>
      Promise.resolve({
        latest: "1.0.0",
      })
    );

    const opts = new Map(baseOptions);
    const tags = await npmDistTag.add("@scope/some-pkg@1.0.1", undefined, opts);

    expect(tags).toEqual({
      latest: "1.0.1",
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

    const opts = new Map(baseOptions);
    const tags = await npmDistTag.remove("@scope/some-pkg@1.0.1", "removed-tag", opts);

    expect(tags).not.toHaveProperty("removed-tag");
    expect(fetch).toHaveBeenLastCalledWith(
      "-/package/@scope%2fsome-pkg/dist-tags/removed-tag",
      expect.figgyPudding({
        method: "DELETE",
      })
    );
  });

  it("does not attempt removal of nonexistent tag", async () => {
    const opts = new Map(baseOptions);
    const tags = await npmDistTag.remove("@scope/some-pkg@1.0.1", "missing-tag", opts);

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
      })
    );

    const opts = new Map(baseOptions);
    const tags = await npmDistTag.list("@scope/some-pkg", opts);

    expect(tags).toEqual({
      latest: "1.0.0",
      "other-tag": "1.0.1",
    });
    expect(fetch.json).toHaveBeenLastCalledWith(
      "-/package/@scope%2fsome-pkg/dist-tags",
      expect.figgyPudding({
        spec: expect.objectContaining({
          name: "@scope/some-pkg",
        }),
      })
    );
  });
});
