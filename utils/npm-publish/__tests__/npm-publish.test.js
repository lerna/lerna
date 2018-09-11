"use strict";

jest.mock("@lerna/child-process");
jest.mock("@lerna/has-npm-version");
jest.mock("@lerna/log-packed");
jest.mock("fs-extra");

// mocked modules
const ChildProcessUtilities = require("@lerna/child-process");
const hasNpmVersion = require("@lerna/has-npm-version");
const logPacked = require("@lerna/log-packed");
const fs = require("fs-extra");

// helpers
const EE = require("events");
const path = require("path");
const Package = require("@lerna/package");

// file under test
const npmPublish = require("..");

describe("npm-publish", () => {
  fs.remove.mockResolvedValue();
  ChildProcessUtilities.exec.mockResolvedValue();

  const rootPath = path.normalize("/test");
  const pkg = new Package(
    { name: "test", version: "1.10.100" },
    path.join(rootPath, "npmPublish/test"),
    rootPath
  );

  // technically decorated in npmPack, stubbed here
  pkg.tarball = {
    filename: "test-1.10.100.tgz",
  };

  it("runs npm publish in a directory with --tag support", async () => {
    const result = await npmPublish(pkg, "published-tag", { npmClient: "npm" });

    expect(result).toBe(pkg);
    expect(ChildProcessUtilities.exec).lastCalledWith(
      "npm",
      ["publish", "--ignore-scripts", "--tag", "published-tag", "test-1.10.100.tgz"],
      {
        cwd: pkg.location,
        env: {},
        pkg,
      }
    );
    expect(fs.remove).lastCalledWith(path.join(pkg.location, pkg.tarball.filename));
  });

  it("does not pass --tag when none present (npm default)", async () => {
    await npmPublish(pkg, undefined, { npmClient: "npm" });

    expect(ChildProcessUtilities.exec).lastCalledWith(
      "npm",
      ["publish", "--ignore-scripts", "test-1.10.100.tgz"],
      {
        cwd: pkg.location,
        env: {},
        pkg,
      }
    );
  });

  it("trims trailing whitespace in tag parameter", async () => {
    await npmPublish(pkg, "trailing-tag ", { npmClient: "npm" });

    expect(ChildProcessUtilities.exec).lastCalledWith(
      "npm",
      ["publish", "--ignore-scripts", "--tag", "trailing-tag", "test-1.10.100.tgz"],
      {
        cwd: pkg.location,
        env: {},
        pkg,
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
        cwd: pkg.location,
        env: {
          npm_config_registry: registry,
        },
        pkg,
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
          "--no-git-tag-version",
          "test-1.10.100.tgz",
        ],
        {
          cwd: pkg.location,
          env: {},
          pkg,
        }
      );
    });
  });
});

describe("npmPack", () => {
  fs.move.mockResolvedValue();
  hasNpmVersion.mockReturnValueOnce(true);

  const origStdoutWrite = process.stdout.write;

  afterEach(() => {
    process.stdout.write = origStdoutWrite;
  });

  it("runs npm pack with all target packages", async () => {
    const [rootManifest, pkg1, pkg2] = setupPackages("pkg-1", "pkg-2");
    const expectedJSON = setupRecords(pkg1, pkg2);
    const mockStream = setupExecStream();

    // obtain promise
    const cmd = npmPublish.npmPack(rootManifest, [pkg1, pkg2]);

    // match upstream 2-space indent of --json output
    const str = JSON.stringify(expectedJSON, null, 2);

    // split the result into chunks to simulate large output
    const chunkDelim = str.indexOf("},") + 2;
    const chunk1 = str.substring(0, chunkDelim);
    const chunk2 = str.substring(chunkDelim);

    // trigger --json chunked output
    mockStream.emit("data", chunk1);
    mockStream.emit("data", chunk2);

    // resolve promise
    const result = await cmd;

    expect(result).toEqual([pkg1, pkg2]);

    expect(pkg1.tarball.filename).toBe("mocked-pkg-1-pack.tgz");
    expect(pkg2.tarball.filename).toBe("mocked-pkg-2-pack.tgz");

    expect(hasNpmVersion).lastCalledWith(">=5.10.0");
    expect(logPacked.mock.calls.map(call => call[0])).toEqual(expectedJSON);

    expect(ChildProcessUtilities.exec).lastCalledWith("npm", ["pack", pkg1.location, pkg2.location], {
      cwd: rootManifest.location,
      env: {
        npm_config_json: true,
      },
      stdio: ["ignore", "pipe", "inherit"],
    });
  });

  it("adapts to legacy npm pack without --json option", async () => {
    hasNpmVersion.mockReturnValueOnce(false);
    // catch output that skips logger
    process.stdout.write = jest.fn();

    const [rootManifest, pkg3, pkg4] = setupPackages("pkg-3", "pkg-4");
    const expectedJSON = setupRecords(pkg3, pkg4);
    const chunks = [
      "> npm pack mock\nwoo woo\naww yeah script logging\n\n",
      "LOUD SCRIPT IS LOUD\n",
      // nothing is emitted after the relative tarball list
      // @see https://git.io/fNFyh
      expectedJSON.map(record => record.filename).join("\n"),
    ];
    const mockStream = setupExecStream(chunks.join("\n"));

    // obtain promise
    const cmd = npmPublish.npmPack(rootManifest, [pkg3, pkg4]);

    // trigger legacy chunked output (no --json)
    for (const chunk of chunks) {
      mockStream.emit("data", chunk);
    }

    // resolve promise
    await cmd;

    expect(pkg3.tarball.filename).toBe("mocked-pkg-3-pack.tgz");
    expect(pkg4.tarball.filename).toBe("mocked-pkg-4-pack.tgz");

    expect(logPacked.mock.calls.map(call => call[0])).toEqual(expectedJSON);
    expect(process.stdout.write.mock.calls.map(call => call[0])).toEqual(chunks);

    expect(ChildProcessUtilities.exec).lastCalledWith("npm", ["pack", pkg3.location, pkg4.location], {
      cwd: rootManifest.location,
      env: {},
      stdio: ["ignore", "pipe", "inherit"],
    });

    // post-hoc moving from root to leaf
    expect(fs.move).toBeCalledWith(
      path.join(pkg3.rootPath, pkg3.tarball.filename),
      path.join(pkg3.location, pkg3.tarball.filename),
      { overwrite: true }
    );
    expect(fs.move).toBeCalledWith(
      path.join(pkg4.rootPath, pkg4.tarball.filename),
      path.join(pkg4.location, pkg4.tarball.filename),
      { overwrite: true }
    );
  });
});

describe("makePacker", () => {
  fs.move.mockResolvedValue();

  it("returns memoized npmPack", async () => {
    const [rootManifest, ...packages] = setupPackages("pkg-5", "pkg-6", "pkg-7", "pkg-8");
    const expectedJSON = setupRecords(...packages);
    const batches = [packages.slice(0, 2), packages.slice(2)];
    const records = [expectedJSON.slice(0, 2), expectedJSON.slice(2)];

    hasNpmVersion.mockReturnValueOnce(true);

    // create memoized function
    const npmPack = npmPublish.makePacker(rootManifest);

    const commands = batches.map((batch, idx) => {
      const mockStream = setupExecStream();

      // obtain promise
      const cmd = npmPack(batch);

      // match upstream 2-space indent of --json output
      mockStream.emit("data", JSON.stringify(records[idx], null, 2));

      return cmd;
    });

    // resolve all promises
    const results = await Promise.all(commands);

    expect(results[0]).toEqual(batches[0]);
    expect(results[1]).toEqual(batches[1]);

    expect(packages[0].tarball.filename).toBe("mocked-pkg-5-pack.tgz");
    expect(packages[1].tarball.filename).toBe("mocked-pkg-6-pack.tgz");
    expect(packages[2].tarball.filename).toBe("mocked-pkg-7-pack.tgz");
    expect(packages[3].tarball.filename).toBe("mocked-pkg-8-pack.tgz");

    expect(hasNpmVersion).toHaveBeenCalledTimes(1);
    expect(logPacked.mock.calls.map(call => call[0])).toEqual(expectedJSON);

    expect(ChildProcessUtilities.exec).toBeCalledWith(
      "npm",
      ["pack", ...batches[0].map(pkg => pkg.location)],
      expect.any(Object)
    );
    expect(ChildProcessUtilities.exec).lastCalledWith(
      "npm",
      ["pack", ...batches[1].map(pkg => pkg.location)],
      {
        cwd: rootManifest.location,
        env: {
          npm_config_json: true,
        },
        stdio: ["ignore", "pipe", "inherit"],
      }
    );
  });
});

function setupExecStream(stdout) {
  const mockStream = new EE();
  mockStream.setEncoding = jest.fn();

  ChildProcessUtilities.exec.mockImplementationOnce(() => {
    const proc = Promise.resolve({ stdout });
    proc.stdout = mockStream;
    return proc;
  });

  return mockStream;
}

function setupPackages(...names) {
  const rootManifest = new Package({ name: "root-manifest", private: true }, path.normalize("/test"));
  const packages = names.map(
    name =>
      new Package(
        { name, version: "1.10.100" },
        path.join(rootManifest.location, `npmPack/${name}`),
        rootManifest.location
      )
  );

  return [rootManifest, ...packages];
}

function setupRecords(...packages) {
  // real --json output has more properties, but this is sufficient here
  return packages.map(({ name, version }) => ({
    name,
    version,
    // a completely artificial filename
    filename: `mocked-${name}-pack.tgz`,
  }));
}
