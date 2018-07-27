"use strict";

// local modules _must_ be explicitly mocked
jest.mock("../lib/git-push");
jest.mock("../lib/is-anything-committed");
jest.mock("../lib/is-behind-upstream");

const path = require("path");

// mocked module(s)
const writePkg = require("write-pkg");

// helpers
const initFixture = require("@lerna-test/init-fixture")(path.resolve(__dirname, "../../publish/__tests__"));

// test command
const lernaVersion = require("@lerna-test/command-runner")(require("../command"));

describe("git-hosted sibling specifiers", () => {
  test("gitCommittish", async () => {
    const cwd = await initFixture("git-hosted-sibling-committish");

    await lernaVersion(cwd)("minor");

    expect(writePkg.updatedVersions()).toEqual({
      "package-1": "1.1.0",
      "package-2": "1.1.0",
      "package-3": "1.1.0",
      "package-4": "1.1.0",
      "package-5": "1.1.0",
    });

    // package-1 doesn't have any dependencies
    expect(writePkg.updatedManifest("package-2").dependencies).toMatchObject({
      "package-1": "github:user/package-1#v1.1.0",
    });
    expect(writePkg.updatedManifest("package-3").devDependencies).toMatchObject({
      "package-2": "git+ssh://git@github.com/user/package-2.git#v1.1.0",
    });
    expect(writePkg.updatedManifest("package-4").dependencies).toMatchObject({
      "package-1": "github:user/package-1#v0.0.0", // non-matching semver
    });
    expect(writePkg.updatedManifest("package-5").dependencies).toMatchObject({
      "package-1": "git+ssh://git@github.com/user/package-1.git#v1.1.0",
    });
  });

  test("gitRange", async () => {
    const cwd = await initFixture("git-hosted-sibling-semver");

    await lernaVersion(cwd)("prerelease", "--preid", "beta");

    expect(writePkg.updatedVersions()).toEqual({
      "package-1": "1.0.1-beta.0",
      "package-2": "1.0.1-beta.0",
      "package-3": "1.0.1-beta.0",
      "package-4": "1.0.1-beta.0",
      "package-5": "1.0.1-beta.0",
    });

    // package-1 doesn't have any dependencies
    expect(writePkg.updatedManifest("package-2").dependencies).toMatchObject({
      "package-1": "github:user/package-1#semver:^1.0.1-beta.0",
    });
    expect(writePkg.updatedManifest("package-3").devDependencies).toMatchObject({
      "package-2": "git+ssh://git@github.com/user/package-2.git#semver:^1.0.1-beta.0",
    });
    expect(writePkg.updatedManifest("package-4").dependencies).toMatchObject({
      "package-1": "github:user/package-1#semver:^0.1.0", // non-matching semver
    });
    expect(writePkg.updatedManifest("package-5").dependencies).toMatchObject({
      "package-1": "git+ssh://git@github.com/user/package-1.git#semver:^1.0.1-beta.0",
    });
  });

  test("gitlab", async () => {
    const cwd = await initFixture("git-hosted-sibling-gitlab");

    await lernaVersion(cwd)("premajor", "--preid", "rc");

    expect(writePkg.updatedVersions()).toEqual({
      "package-1": "2.0.0-rc.0",
      "package-2": "2.0.0-rc.0",
      "package-3": "2.0.0-rc.0",
      "package-4": "2.0.0-rc.0",
      "package-5": "2.0.0-rc.0",
    });

    // package-1 doesn't have any dependencies
    expect(writePkg.updatedManifest("package-2").dependencies).toMatchObject({
      "package-1": "gitlab:user/package-1#v2.0.0-rc.0",
    });
    expect(writePkg.updatedManifest("package-3").devDependencies).toMatchObject({
      "package-2": "git+ssh://git@gitlab.com/user/package-2.git#v2.0.0-rc.0",
    });
    expect(writePkg.updatedManifest("package-4").dependencies).toMatchObject({
      "package-1": "git+https://user:token@gitlab.com/user/package-1.git#v2.0.0-rc.0",
    });
    expect(writePkg.updatedManifest("package-5").dependencies).toMatchObject({
      "package-1": "git+ssh://git@gitlab.com/user/package-1.git#v2.0.0-rc.0",
    });
  });
});
