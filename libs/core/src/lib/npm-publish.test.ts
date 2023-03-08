// mocked modules
import _fs from "fs-extra";
import { publish as _publish } from "libnpmpublish";
import { otplease as _otplease } from "./otplease";
import { runLifecycle as _runLifecycle } from "./run-lifecycle";

jest.mock("./run-lifecycle");
jest.mock("./otplease");
jest.mock("read-package-json");
jest.mock("libnpmpublish");
jest.mock("fs-extra");

// eslint-disable-next-line @typescript-eslint/no-var-requires
const readJSON = require("read-package-json");

// helpers
import path from "path";
import { Package } from "./package";

// file under test
import { npmPublish } from "./npm-publish";

const fs = jest.mocked(_fs);
const publish = jest.mocked(_publish);
const runLifecycle = jest.mocked(_runLifecycle);
const otplease = jest.mocked(_otplease);

describe("npm-publish", () => {
  const mockTarData = Buffer.from("MOCK");
  const mockManifest = { _normalized: true };

  fs.readFile.mockName("fs.readFile").mockResolvedValue(mockTarData);
  // TODO: refactor based on TS feedback
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  publish.mockName("libnpmpublish").mockResolvedValue();
  readJSON.mockName("read-package-json").mockImplementation((file: any, cb: any) => cb(null, mockManifest));
  // TODO: refactor based on TS feedback
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  runLifecycle.mockName("./run-lifecycle").mockResolvedValue();
  otplease.mockName("./otplease").mockImplementation((cb, opts) => Promise.resolve(cb(opts)));

  const tarFilePath = "/tmp/test-1.10.100.tgz";
  const rootPath = path.normalize("/test");
  const pkg = new Package(
    { name: "@scope/test", version: "1.10.100" },
    path.join(rootPath, "npmPublish/test"),
    rootPath
  );

  it("calls external libraries with correct arguments", async () => {
    const opts = { tag: "published-tag" };

    await npmPublish(pkg, tarFilePath, opts);

    expect(fs.readFile).toHaveBeenCalledWith(tarFilePath);
    expect(readJSON).toHaveBeenCalledWith(pkg.manifestLocation, expect.any(Function));
    expect(publish).toHaveBeenCalledWith(
      mockManifest,
      mockTarData,
      expect.objectContaining({
        defaultTag: "published-tag",
        projectScope: "@scope",
      })
    );
  });

  it("defaults opts.tag to 'latest'", async () => {
    await npmPublish(pkg, tarFilePath);

    expect(publish).toHaveBeenCalledWith(
      mockManifest,
      mockTarData,
      expect.objectContaining({
        defaultTag: "latest",
      })
    );
  });

  it("overrides pkg.publishConfig.tag when opts.tag is explicitly configured", async () => {
    readJSON.mockImplementationOnce((file: any, cb: any) =>
      cb(null, {
        publishConfig: {
          tag: "beta",
        },
      })
    );
    const opts = { tag: "temp-tag" };

    await npmPublish(pkg, tarFilePath, opts);

    expect(publish).toHaveBeenCalledWith(
      expect.objectContaining({
        publishConfig: {
          tag: "temp-tag",
        },
      }),
      mockTarData,
      expect.objectContaining({
        defaultTag: "temp-tag",
      })
    );
  });

  it("respects pkg.publishConfig.tag when opts.defaultTag matches default", async () => {
    readJSON.mockImplementationOnce((file: any, cb: any) =>
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
      expect.objectContaining({
        defaultTag: "beta",
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
      } as any,
      path.join(rootPath, "npmPublish/fancy"),
      rootPath
    );

    readJSON.mockImplementationOnce((file: any, cb: any) =>
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
      expect.objectContaining({
        defaultTag: "latest",
      })
    );
  });

  it("merges pkg.publishConfig.registry into options", async () => {
    readJSON.mockImplementationOnce((file: any, cb: any) =>
      cb(null, {
        publishConfig: {
          registry: "http://pkg-registry.com",
        },
      })
    );
    const opts = { registry: "https://global-registry.com" };

    await npmPublish(pkg, tarFilePath, opts);

    expect(publish).toHaveBeenCalledWith(
      expect.objectContaining({
        publishConfig: {
          registry: "http://pkg-registry.com",
        },
      }),
      mockTarData,
      expect.objectContaining({
        registry: "http://pkg-registry.com",
      })
    );
  });

  it("respects opts.dryRun", async () => {
    const opts = { dryRun: true };

    await npmPublish(pkg, tarFilePath, opts);

    expect(publish).not.toHaveBeenCalled();
    expect(runLifecycle).toHaveBeenCalledTimes(2);
  });

  it.each([["true"], [true], ["false"], [false]])(
    "aliases strict-ssl to strictSSL",
    async (strictSSLValue) => {
      const opts = { "strict-ssl": strictSSLValue };

      await npmPublish(pkg, tarFilePath, opts as any);

      expect(publish).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          strictSSL: strictSSLValue,
        })
      );
    }
  );

  it("calls publish lifecycles", async () => {
    const options = expect.objectContaining({
      projectScope: "@scope",
    });

    await npmPublish(pkg, tarFilePath);

    expect(runLifecycle).toHaveBeenCalledWith(pkg, "publish", options);
    expect(runLifecycle).toHaveBeenLastCalledWith(pkg, "postpublish", options);
  });
});
