"use strict";

jest.mock("@lerna/run-lifecycle");
jest.mock("libnpm/read-json");
jest.mock("libnpm/publish");
jest.mock("fs-extra");

// mocked modules
const fs = require("fs-extra");
const publish = require("libnpm/publish");
const readJSON = require("libnpm/read-json");
const runLifecycle = require("@lerna/run-lifecycle");

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
  publish.mockName("libnpm/publish").mockResolvedValue();
  readJSON.mockName("libnpm/read-json").mockResolvedValue(mockManifest);
  runLifecycle.mockName("@lerna/run-lifecycle").mockResolvedValue();

  const tarFilePath = "/tmp/test-1.10.100.tgz";
  const rootPath = path.normalize("/test");
  const pkg = new Package(
    { name: "test", version: "1.10.100" },
    path.join(rootPath, "npmPublish/test"),
    rootPath
  );

  it("calls external libraries with correct arguments", async () => {
    const opts = new Map().set("tag", "published-tag");

    await npmPublish(pkg, tarFilePath, opts);

    expect(fs.readFile).toHaveBeenCalledWith(tarFilePath);
    expect(readJSON).toHaveBeenCalledWith(pkg.manifestLocation);
    expect(publish).toHaveBeenCalledWith(
      mockManifest,
      mockTarData,
      expect.figgyPudding({
        dryRun: false,
        projectScope: "test",
        tag: "published-tag",
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
    readJSON.mockResolvedValueOnce({
      publishConfig: {
        tag: "beta",
      },
    });
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
    readJSON.mockResolvedValueOnce({
      publishConfig: {
        tag: "beta",
      },
    });

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

  it("respects opts.dryRun", async () => {
    const opts = new Map().set("dryRun", true);

    await npmPublish(pkg, tarFilePath, opts);

    expect(publish).not.toHaveBeenCalled();
    expect(runLifecycle).toHaveBeenCalledTimes(2);
  });

  it("calls publish lifecycles", async () => {
    const aFiggyPudding = expect.figgyPudding({
      projectScope: "test",
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

    try {
      await npmPublish(pkg, tarFilePath, opts);
    } catch (err) {
      expect(err.message).toBe("whoopsy");
      expect(err.name).toBe("ValidationError");
      expect(log.error).toHaveBeenLastCalledWith("E401", "doodle");
      expect(process.exitCode).toBe(1);
    }

    publish.mockImplementationOnce(() => {
      const err = new Error("lolwut");
      err.code = "E404";
      err.errno = 9001;
      return Promise.reject(err);
    });

    try {
      await npmPublish(pkg, tarFilePath, opts);
    } catch (err) {
      expect(err.message).toBe("lolwut");
      expect(log.error).toHaveBeenLastCalledWith("E404", "lolwut");
      expect(process.exitCode).toBe(9001);
    }

    expect.hasAssertions();
  });
});
