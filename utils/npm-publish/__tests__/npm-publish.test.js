"use strict";

jest.mock("@lerna/run-lifecycle");
jest.mock("@lerna/otplease");
jest.mock("read-package-json");
jest.mock("@evocateur/libnpmpublish");
jest.mock("fs-extra");

// mocked modules
const fs = require("fs-extra");
const { publish } = require("@evocateur/libnpmpublish");
const readJSON = require("read-package-json");
const runLifecycle = require("@lerna/run-lifecycle");
const otplease = require("@lerna/otplease");

// helpers
const path = require("path");
const Package = require("@lerna/package");

// file under test
const npmPublish = require("..");

expect.extend(require("@lerna-test/figgy-pudding-matchers"));

describe("npm-publish", () => {
  const mockTarData = Buffer.from("MOCK");
  const mockManifest = { _normalized: true };

  fs.readFile.mockName("fs.readFile").mockResolvedValue(mockTarData);
  publish.mockName("@evocateur/libnpmpublish").mockResolvedValue();
  readJSON.mockName("read-package-json").mockImplementation((file, cb) => cb(null, mockManifest));
  runLifecycle.mockName("@lerna/run-lifecycle").mockResolvedValue();
  otplease.mockName("@lerna/otplease").mockImplementation((cb, opts) => Promise.resolve(cb(opts)));

  const tarFilePath = "/tmp/test-1.10.100.tgz";
  const rootPath = path.normalize("/test");
  const pkg = new Package(
    { name: "@scope/test", version: "1.10.100" },
    path.join(rootPath, "npmPublish/test"),
    rootPath
  );

  it("calls external libraries with correct arguments", async () => {
    const opts = new Map().set("tag", "published-tag");

    await npmPublish(pkg, tarFilePath, opts);

    expect(fs.readFile).toHaveBeenCalledWith(tarFilePath);
    expect(readJSON).toHaveBeenCalledWith(pkg.manifestLocation, expect.any(Function));
    expect(publish).toHaveBeenCalledWith(
      mockManifest,
      mockTarData,
      expect.figgyPudding({
        dryRun: false,
        tag: "published-tag",
        projectScope: "@scope",
      })
    );
  });

  it("defaults opts.tag to 'latest'", async () => {
    await npmPublish(pkg, tarFilePath);

    expect(publish).toHaveBeenCalledWith(
      mockManifest,
      mockTarData,
      expect.figgyPudding({
        tag: "latest",
      })
    );
  });

  it("overrides pkg.publishConfig.tag when opts.tag is not defaulted", async () => {
    readJSON.mockImplementationOnce((file, cb) =>
      cb(null, {
        publishConfig: {
          tag: "beta",
        },
      })
    );
    const opts = new Map().set("tag", "temp-tag");

    await npmPublish(pkg, tarFilePath, opts);

    expect(publish).toHaveBeenCalledWith(
      expect.objectContaining({
        publishConfig: {
          tag: "temp-tag",
        },
      }),
      mockTarData,
      expect.figgyPudding({
        tag: "temp-tag",
      })
    );
  });

  it("respects pkg.publishConfig.tag when opts.tag matches default", async () => {
    readJSON.mockImplementationOnce((file, cb) =>
      cb(null, {
        publishConfig: {
          tag: "beta",
        },
      })
    );

    await npmPublish(pkg, tarFilePath);

    expect(publish).toHaveBeenCalledWith(
      expect.objectContaining({
        publishConfig: {
          tag: "beta",
        },
      }),
      mockTarData,
      expect.figgyPudding({
        tag: "latest",
      })
    );
  });

  it("uses pkg.contents manifest when pkg.publishConfig.directory is defined", async () => {
    const fancyPkg = new Package(
      {
        name: "fancy",
        version: "1.10.100",
        publishConfig: {
          directory: "dist",
        },
      },
      path.join(rootPath, "npmPublish/fancy"),
      rootPath
    );

    readJSON.mockImplementationOnce((file, cb) =>
      cb(null, {
        name: "fancy-fancy",
        version: "1.10.100",
      })
    );

    await npmPublish(fancyPkg, tarFilePath);

    expect(readJSON).toHaveBeenCalledWith(
      path.join(fancyPkg.location, "dist/package.json"),
      expect.any(Function)
    );
    expect(publish).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "fancy-fancy",
      }),
      mockTarData,
      expect.figgyPudding({
        tag: "latest",
      })
    );
  });

  it("respects opts.dryRun", async () => {
    const opts = new Map().set("dryRun", true);

    await npmPublish(pkg, tarFilePath, opts);

    expect(publish).not.toHaveBeenCalled();
    expect(runLifecycle).toHaveBeenCalledTimes(2);
  });

  it("calls publish lifecycles", async () => {
    const aFiggyPudding = expect.figgyPudding({
      projectScope: "@scope",
    });

    await npmPublish(pkg, tarFilePath);

    expect(runLifecycle).toHaveBeenCalledWith(pkg, "publish", aFiggyPudding);
    expect(runLifecycle).toHaveBeenLastCalledWith(pkg, "postpublish", aFiggyPudding);
  });

  it("catches libnpm errors", async () => {
    publish.mockImplementationOnce(() => {
      const err = new Error("whoopsy");
      err.code = "E401";
      err.body = {
        error: "doodle",
      };
      return Promise.reject(err);
    });

    const log = {
      verbose: jest.fn(),
      silly: jest.fn(),
      error: jest.fn(),
    };
    const opts = new Map().set("log", log);

    await expect(npmPublish(pkg, tarFilePath, opts)).rejects.toThrow(
      expect.objectContaining({
        message: "whoopsy",
        name: "ValidationError",
      })
    );

    expect(log.error).toHaveBeenLastCalledWith("E401", "doodle");
    expect(process.exitCode).toBe(1);

    publish.mockImplementationOnce(() => {
      const err = new Error("lolwut");
      err.code = "E404";
      err.errno = 9001;
      return Promise.reject(err);
    });

    await expect(npmPublish(pkg, tarFilePath, opts)).rejects.toThrow("lolwut");

    expect(log.error).toHaveBeenLastCalledWith("E404", "lolwut");
    expect(process.exitCode).toBe(9001);
  });
});
