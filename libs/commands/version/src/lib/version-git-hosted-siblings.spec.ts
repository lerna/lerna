import { commandRunner, initFixtureFactory } from "@lerna/test-helpers";
import path from "path";
import _writePkg from "write-pkg";

// eslint-disable-next-line jest/no-mocks-import
jest.mock("write-pkg", () => require("@lerna/test-helpers/__mocks__/write-pkg"));

// eslint-disable-next-line jest/no-mocks-import
jest.mock("@lerna/core", () => require("@lerna/test-helpers/__mocks__/@lerna/core"));

jest.mock("./git-push");
jest.mock("./is-anything-committed", () => ({
  isAnythingCommitted: jest.fn().mockReturnValue(true),
}));
jest.mock("./is-behind-upstream", () => ({
  isBehindUpstream: jest.fn().mockReturnValue(false),
}));
jest.mock("./remote-branch-exists", () => ({
  remoteBranchExists: jest.fn().mockResolvedValue(true),
}));

// The mocked version isn't the same as the real one
const writePkg = _writePkg as any;

const initFixture = initFixtureFactory(path.resolve(__dirname, "../../../publish"));

// test command
// eslint-disable-next-line @typescript-eslint/no-var-requires
const lernaVersion = commandRunner(require("../command"));

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
