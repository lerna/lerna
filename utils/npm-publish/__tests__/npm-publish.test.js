"use strict";

jest.mock("@lerna/run-lifecycle");
jest.mock("libnpm/publish");
jest.mock("fs-extra");

// mocked modules
const fs = require("fs-extra");
const publish = require("libnpm/publish");
const runLifecycle = require("@lerna/run-lifecycle");

// helpers
const path = require("path");
const Package = require("@lerna/package");

// file under test
const npmPublish = require("..");

describe("npm-publish", () => {
  const mockTarData = Buffer.from("MOCK");

  fs.readFile.mockImplementation(() => Promise.resolve(mockTarData));
  fs.remove.mockResolvedValue();
  publish.mockResolvedValue();
  runLifecycle.mockResolvedValue();

  const rootPath = path.normalize("/test");
  const pkg = new Package(
    { name: "test", version: "1.10.100" },
    path.join(rootPath, "npmPublish/test"),
    rootPath
  );

  // technically decorated in ../../commands/publish, stubbed here
  pkg.tarball = {
    filename: "test-1.10.100.tgz",
  };

  it("pipelines input package", async () => {
    const opts = new Map();
    const result = await npmPublish(pkg, "latest", opts);

    expect(result).toBe(pkg);
  });

  it("calls libnpm/publish with correct arguments", async () => {
    const opts = new Map();

    await npmPublish(pkg, "published-tag", opts);

    expect(publish).toHaveBeenCalledWith(
      { name: "test", version: "1.10.100" },
      mockTarData,
      expect.objectContaining({
        dryRun: false,
        projectScope: "test",
        tag: "published-tag",
      })
    );
  });

  it("falls back to opts.tag for dist-tag", async () => {
    const opts = new Map([["tag", "custom-default"]]);

    await npmPublish(pkg, undefined, opts);

    expect(publish).toHaveBeenCalledWith(
      { name: "test", version: "1.10.100" },
      mockTarData,
      expect.objectContaining({ tag: "custom-default" })
    );
  });

  it("falls back to default tag", async () => {
    await npmPublish(pkg);

    expect(publish).toHaveBeenCalledWith(
      { name: "test", version: "1.10.100" },
      mockTarData,
      expect.objectContaining({ tag: "latest" })
    );
  });

  it("calls publish lifecycles", async () => {
    await npmPublish(pkg, "lifecycles");

    // figgy-pudding Proxy hanky-panky defeats jest wizardry
    const aFiggyPudding = expect.objectContaining({ __isFiggyPudding: true });

    expect(runLifecycle).toHaveBeenCalledWith(pkg, "publish", aFiggyPudding);
    expect(runLifecycle).toHaveBeenCalledWith(pkg, "postpublish", aFiggyPudding);

    runLifecycle.mock.calls.forEach(args => {
      const pud = args.slice().pop();

      expect(pud.toJSON()).toMatchObject({
        projectScope: "test",
        tag: "lifecycles",
      });
    });
  });

  it("omits opts.logstream", async () => {
    const opts = new Map([["logstream", "SKIPPED"]]);

    await npmPublish(pkg, "canary", opts);

    const pud = runLifecycle.mock.calls.pop().pop();

    expect(pud.toJSON()).not.toHaveProperty("logstream");
  });

  it("removes tarball after success", async () => {
    const opts = new Map();
    await npmPublish(pkg, "latest", opts);

    expect(fs.remove).toHaveBeenLastCalledWith(path.join(pkg.location, pkg.tarball.filename));
  });
});
