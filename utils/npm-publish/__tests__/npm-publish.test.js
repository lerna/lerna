"use strict";

jest.mock("@lerna/child-process");

// mocked modules
const ChildProcessUtilities = require("@lerna/child-process");

// helpers
const EE = require("events");
const path = require("path");
const Package = require("@lerna/package");

// file under test
const npmPublish = require("..");

describe("npm-publish", () => {
  ChildProcessUtilities.exec.mockResolvedValue();

  const rootPath = path.normalize("/test");
  const pkg = new Package(
    { name: "test", version: "1.10.100" },
    path.join(rootPath, "npmPublish/test"),
    rootPath
  );

  // technically decorated in npmPack, stubbed here
  pkg.tarball = "test-1.10.100.tgz";

  it("runs npm publish in a directory with --tag support", async () => {
    await npmPublish(pkg, "published-tag", { npmClient: "npm" });

    expect(ChildProcessUtilities.exec).lastCalledWith(
      "npm",
      ["publish", "--ignore-scripts", "--tag", "published-tag", "test-1.10.100.tgz"],
      {
        cwd: rootPath,
        env: {},
        pkg: { location: rootPath },
      }
    );
  });

  it("does not pass --tag when none present (npm default)", async () => {
    await npmPublish(pkg, undefined, { npmClient: "npm" });

    expect(ChildProcessUtilities.exec).lastCalledWith(
      "npm",
      ["publish", "--ignore-scripts", "test-1.10.100.tgz"],
      {
        cwd: rootPath,
        env: {},
        pkg: { location: rootPath },
      }
    );
  });

  it("trims trailing whitespace in tag parameter", async () => {
    await npmPublish(pkg, "trailing-tag ", { npmClient: "npm" });

    expect(ChildProcessUtilities.exec).lastCalledWith(
      "npm",
      ["publish", "--ignore-scripts", "--tag", "trailing-tag", "test-1.10.100.tgz"],
      {
        cwd: rootPath,
        env: {},
        pkg: { location: rootPath },
      }
    );
  });

  it("supports custom registry", async () => {
    const registry = "https://custom-registry/npmPublish";

    await npmPublish(pkg, "custom-registry", { npmClient: "npm", registry });

    expect(ChildProcessUtilities.exec).lastCalledWith(
      "npm",
      ["publish", "--ignore-scripts", "--tag", "custom-registry", "test-1.10.100.tgz"],
      {
        cwd: rootPath,
        env: {
          npm_config_registry: registry,
        },
        pkg: { location: rootPath },
      }
    );
  });

  describe("with npmClient yarn", () => {
    it("appends --new-version to avoid interactive prompt", async () => {
      await npmPublish(pkg, "yarn-publish", { npmClient: "yarn" });

      expect(ChildProcessUtilities.exec).lastCalledWith(
        "yarn",
        [
          "publish",
          "--ignore-scripts",
          "--tag",
          "yarn-publish",
          "--new-version",
          pkg.version,
          "--non-interactive",
          "test-1.10.100.tgz",
        ],
        {
          cwd: rootPath,
          env: {},
          pkg: { location: rootPath },
        }
      );
    });
  });
});

describe("npmPack", () => {
  it("runs npm pack with all target packages", async () => {
    const mockStream = new EE();
    mockStream.setEncoding = jest.fn();

    ChildProcessUtilities.exec.mockImplementationOnce(() => {
      const proc = Promise.resolve();
      proc.stdout = mockStream;
      return proc;
    });

    const rootManifest = new Package({ name: "root-manifest", private: true }, path.normalize("/test"));
    const pkg1 = new Package(
      { name: "pkg-1", version: "1.10.100" },
      path.join(rootManifest.location, "npmPublish/pkg-1"),
      rootManifest.location
    );
    const pkg2 = new Package(
      { name: "pkg-2", version: "1.10.100" },
      path.join(rootManifest.location, "npmPublish/pkg-2"),
      rootManifest.location
    );

    // obtain promise
    const cmd = npmPublish.npmPack(rootManifest, [pkg1, pkg2]);

    // match upstream 2-space indent of --json output
    const str = JSON.stringify(
      [
        // TODO: maybe just mock @lerna/log-packed?
        { filename: "mocked-pkg-1-pack.tgz", files: [], bundled: [], integrity: "MOCK" },
        { filename: "mocked-pkg-2-pack.tgz", files: [], bundled: [], integrity: "MOCK" },
      ],
      null,
      2
    );

    // split the result into chunks to simulate large output
    const chunkDelim = str.indexOf("},") + 2;
    const chunk1 = str.substring(0, chunkDelim);
    const chunk2 = str.substring(chunkDelim);

    // trigger --json chunked output
    mockStream.emit("data", chunk1);
    mockStream.emit("data", chunk2);

    // resolve promise
    await cmd;

    expect(pkg1.tarball).toBe("mocked-pkg-1-pack.tgz");
    expect(pkg2.tarball).toBe("mocked-pkg-2-pack.tgz");

    expect(ChildProcessUtilities.exec).lastCalledWith(
      "npm",
      ["pack", pkg1.location, pkg2.location, "--json"],
      {
        cwd: rootManifest.location,
        env: {},
        stdio: ["ignore", "pipe", "inherit"],
      }
    );
  });
});
