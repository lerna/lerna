"use strict";

// we're actually testing integration with git
jest.unmock("@lerna/collect-updates");

// local modules _must_ be explicitly mocked
jest.mock("../lib/get-packages-without-license");
jest.mock("../lib/get-two-factor-auth-required");
jest.mock("../lib/verify-npm-package-access");
jest.mock("../lib/get-npm-username");
// FIXME: better mock for version command
jest.mock("../../version/lib/git-push");
jest.mock("../../version/lib/is-anything-committed");
jest.mock("../../version/lib/is-behind-upstream");
jest.mock("../../version/lib/remote-branch-exists");

const fs = require("fs-extra");
const path = require("path");

// mocked modules
const writePkg = require("write-pkg");

// helpers
const initFixture = require("@lerna-test/init-fixture")(__dirname);
const gitAdd = require("@lerna-test/git-add");
const gitTag = require("@lerna-test/git-tag");
const gitCommit = require("@lerna-test/git-commit");

// test command
const lernaPublish = require("@lerna-test/command-runner")(require("../command"));

describe("relative 'file:' specifiers", () => {
  const setupChanges = async (cwd, pkgRoot = "packages") => {
    await gitTag(cwd, "v1.0.0");
    await fs.outputFile(path.join(cwd, `${pkgRoot}/package-1/hello.js`), "world");
    await gitAdd(cwd, ".");
    await gitCommit(cwd, "setup");
  };

  it("overwrites relative link with local version before npm publish but after git commit", async () => {
    const cwd = await initFixture("relative-file-specs");

    await setupChanges(cwd);
    await lernaPublish(cwd)("major", "--yes");

    expect(writePkg.updatedVersions()).toEqual({
      "package-1": "2.0.0",
      "package-2": "2.0.0",
      "package-3": "2.0.0",
      "package-4": "2.0.0",
      "package-5": "2.0.0",
      "package-6": "2.0.0",
      "package-7": "2.0.0",
    });

    // notably missing is package-1, which has no relative file: dependencies
    expect(writePkg.updatedManifest("package-2").dependencies).toMatchObject({
      "package-1": "^2.0.0",
    });
    expect(writePkg.updatedManifest("package-3").dependencies).toMatchObject({
      "package-2": "^2.0.0",
    });
    expect(writePkg.updatedManifest("package-4").optionalDependencies).toMatchObject({
      "package-3": "^2.0.0",
    });
    expect(writePkg.updatedManifest("package-5").dependencies).toMatchObject({
      "package-4": "^2.0.0",
      // all fixed versions are bumped when major
      "package-6": "^2.0.0",
    });
    // private packages do not need local version resolution
    expect(writePkg.updatedManifest("package-7").dependencies).toMatchObject({
      "package-1": "file:../package-1",
    });
  });

  it("falls back to existing relative version when it is not updated", async () => {
    const cwd = await initFixture("relative-independent");

    await setupChanges(cwd);
    await lernaPublish(cwd)("minor", "--yes");

    expect(writePkg.updatedVersions()).toEqual({
      "package-1": "1.1.0",
      "package-2": "2.1.0",
      "package-3": "3.1.0",
      "package-4": "4.1.0",
      "package-5": "5.1.0",
    });

    // package-4 was updated, but package-6 was not
    expect(writePkg.updatedManifest("package-5").dependencies).toMatchObject({
      "package-4": "^4.1.0",
      "package-6": "^6.0.0",
    });
  });

  it("respects --exact", async () => {
    const cwd = await initFixture("relative-independent");

    await setupChanges(cwd);
    await lernaPublish(cwd)("patch", "--yes", "--exact");

    // package-4 was updated, but package-6 was not
    expect(writePkg.updatedManifest("package-5").dependencies).toMatchObject({
      "package-4": "4.0.1",
      "package-6": "6.0.0",
    });
  });

  it("works around npm-incompatible link: specifiers", async () => {
    const cwd = await initFixture("yarn-link-spec");

    await setupChanges(cwd, "workspaces");
    await lernaPublish(cwd)("major", "--yes");

    expect(writePkg.updatedManifest("package-2").dependencies).toMatchObject({
      "package-1": "^2.0.0",
    });
  });
});
