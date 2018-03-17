"use strict";

const path = require("path");
const execa = require("execa");
const slash = require("slash");

// helpers
const initFixture = require("@lerna-test/init-fixture")(__dirname);
const gitAdd = require("@lerna-test/git-add");

// file under test
const lernaCreate = require("@lerna-test/command-runner")(require("../command"));

// stabilize commit SHA
expect.addSnapshotSerializer(require("@lerna-test/serialize-git-sha"));

// assertion helpers
const diffStaged = (cwd, ...args) => execa.stdout("git", ["diff", "--cached", ...args], { cwd });

const initRemoteFixture = (name, remote = "origin", url = "git@github.com:test/test.git") =>
  initFixture(name).then(cwd => execa("git", ["remote", "add", remote, url], { cwd }).then(() => cwd));

const listUntracked = cwd =>
  execa
    .stdout("git", ["ls-files", "--others", "--exclude-standard", "-z"], { cwd })
    .then(list => list.split("\0").map(fp => slash(fp)));

describe("CreateCommand", () => {
  it("requires a name argument", async () => {
    const cwd = await initFixture("basic");

    try {
      await lernaCreate(cwd)();
    } catch (err) {
      expect(err.message).toMatch("Not enough non-option arguments");
    }
  });

  it("creates a stub package", async () => {
    const cwd = await initRemoteFixture("basic");

    await lernaCreate(cwd)("my-pkg");
    await gitAdd(cwd, ".");

    const result = await diffStaged(cwd);
    expect(result).toMatchSnapshot();
  });

  it("creates a stub package with a scoped name", async () => {
    const cwd = await initRemoteFixture("basic");

    await lernaCreate(cwd)("@my-org/my-pkg");

    const result = await listUntracked(cwd);
    expect(result).toContain("packages/my-pkg/lib/my-pkg.js");
  });

  it("creates a stub package with transpiled output", async () => {
    const cwd = await initRemoteFixture("basic");

    await lernaCreate(cwd)("my-pkg", "--es-module");
    await gitAdd(cwd, ".");

    const result = await diffStaged(cwd);
    expect(result).toMatchSnapshot();
  });

  it.skip("creates a stub cli", async () => {
    const cwd = await initRemoteFixture("basic");

    await lernaCreate(cwd)("my-cli", "--bin");

    // windows sucks at file permissions
    if (process.platform === "win32") {
      await gitAdd(cwd, "--chmod=+x", "--", "packages/my-cli/bin/my-cli");
    }

    await gitAdd(cwd, ".");

    const result = await diffStaged(cwd);
    expect(result).toMatchSnapshot();
  });

  it("creates a stub cli with a custom name", async () => {
    const cwd = await initRemoteFixture("basic");

    await lernaCreate(cwd)("my-cli", "--bin", "yay");

    const result = await listUntracked(cwd);
    expect(result).toContain("packages/my-cli/bin/yay");
  });

  it("creates a stub cli with transpiled output", async () => {
    const cwd = await initRemoteFixture("basic");

    await lernaCreate(cwd)("my-es-cli", "--bin", "--es-module");
    await gitAdd(cwd, ".");

    // windows sucks at file permissions
    if (process.platform === "win32") {
      await gitAdd(cwd, "--chmod=+x", "--", path.normalize("packages/my-cli/bin/my-es-cli"));
    }

    const result = await diffStaged(cwd);
    expect(result).toMatchSnapshot();
  });
});
