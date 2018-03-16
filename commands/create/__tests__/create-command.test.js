"use strict";

const execa = require("execa");

// helpers
const initFixture = require("@lerna-test/init-fixture")(__dirname);
const gitAdd = require("@lerna-test/git-add");

// file under test
const lernaCreate = require("@lerna-test/command-runner")(require("../command"));

// stabilize commit SHA
expect.addSnapshotSerializer(require("@lerna-test/serialize-git-sha"));

// assertion helpers
const diffStaged = (cwd, ...args) =>
  gitAdd(cwd, ".").then(() => execa.stdout("git", ["diff", "--cached", ...args], { cwd }));

const initRemoteFixture = (name, remote = "origin", url = "git@github.com:test/test.git") =>
  initFixture(name).then(cwd => execa("git", ["remote", "add", remote, url], { cwd }).then(() => cwd));

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

    const result = await diffStaged(cwd);
    expect(result).toMatchSnapshot();
  });

  it("creates a stub cli", async () => {
    const cwd = await initRemoteFixture("basic");

    await lernaCreate(cwd)("my-cli", "--bin");

    const result = await diffStaged(cwd);
    expect(result).toMatchSnapshot();
  });

  it("creates a stub cli with a custom name", async () => {
    const cwd = await initRemoteFixture("basic");

    await lernaCreate(cwd)("my-cli", "--bin", "yay");

    const result = await diffStaged(cwd, "--name-only", "-z");
    expect(result.split("\0")).toContain("packages/my-cli/bin/yay");
  });
});
