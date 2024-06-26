import { commandRunner, gitAdd, gitCommit, gitTag, initFixtureFactory } from "@lerna/test-helpers";
import fs from "fs-extra";
import path from "path";
import _writePkg from "write-pkg";
import { setupLernaVersionMocks } from "../../__fixtures__/lerna-version-mocks";

// eslint-disable-next-line jest/no-mocks-import
jest.mock("write-pkg", () => require("@lerna/test-helpers/__mocks__/write-pkg"));

jest.mock("@lerna/core", () => {
  // eslint-disable-next-line jest/no-mocks-import, @typescript-eslint/no-var-requires
  const mockCore = require("@lerna/test-helpers/__mocks__/@lerna/core");
  return {
    ...mockCore,
    // we're actually testing integration with git
    collectProjectUpdates: jest.requireActual("@lerna/core").collectProjectUpdates,
    gitCheckout: jest.requireActual("@lerna/core").gitCheckout,
  };
});

// lerna publish mocks
jest.mock("./get-packages-without-license", () => {
  return {
    getPackagesWithoutLicense: jest.fn().mockResolvedValue([]),
  };
});
jest.mock("./verify-npm-package-access");
jest.mock("./get-npm-username");
jest.mock("./get-two-factor-auth-required");

// lerna version mocks
setupLernaVersionMocks();

// The mock differs from the real thing
const writePkg = _writePkg as any;

const initFixture = initFixtureFactory(__dirname);

// test command
// eslint-disable-next-line @typescript-eslint/no-var-requires
const lernaPublish = commandRunner(require("../command"));

describe("relative 'file:' specifiers", () => {
  const setupChanges = async (cwd, pkgRoot = "packages") => {
    await fs.outputFile(path.join(cwd, `${pkgRoot}/package-1/hello.js`), "world");
    await gitAdd(cwd, ".");
    await gitCommit(cwd, "setup");
  };

  it("overwrites relative link with local version before npm publish but after git commit", async () => {
    const cwd = await initFixture("relative-file-specs");

    await gitTag(cwd, "v1.0.0");
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
      "package-8": "2.0.0",
      "package-9": "2.0.0",
      "package-a": "2.0.0",
      "package-b": "2.0.0",
      "package-c": "2.0.0",
      "package-d": "2.0.0",
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
    // peerDependencies which are relative are resolved to the semantic version
    expect(writePkg.updatedManifest("package-8").peerDependencies).toMatchObject({
      // TODO: Why do we get a caret here, rather than the exact range?
      // "package-1": "^2.0.0",  // if #4009 supported
      "package-1": "file:../package-1", // otherwise
    });
    // peerDependencies which are not relative are left unchanged
    expect(writePkg.updatedManifest("package-9").peerDependencies).toMatchObject({
      "package-1": "^1.0.0",
    });
    // peerDependencies which are "workspace:*" are transformed to the exact target workspace version.
    expect(writePkg.updatedManifest("package-a").peerDependencies).toMatchObject({
      "package-1": "2.0.0", // if #4009 supported
      // "package-1": "workspace:*",  // otherwise
    });
    // peerDependencies which are "workspace:^" are transformed to the corresponding (^) target workspace version.
    expect(writePkg.updatedManifest("package-b").peerDependencies).toMatchObject({
      "package-1": "^2.0.0", // if #4009 supported
      // "package-1": "workspace:^",  // otherwise
    });
    // peerDependencies which are "workspace:~" are transformed to the corresponding (~) target workspace version.
    expect(writePkg.updatedManifest("package-c").peerDependencies).toMatchObject({
      "package-1": "~2.0.0", // if #4009 supported
      // "package-1": "workspace:~", // otherwise
    });
    // peerDependencies which are "workspace:" followed by a semver range (SHOULD BE) are transformed to the corresponding semver range.
    expect(writePkg.updatedManifest("package-d").peerDependencies).toMatchObject({
      "package-1": "^2.3.4", // if #4009 supported
      // "package-1": "workspace:^2.3.4",  // otherwise
    });
  });

  it("falls back to existing relative version when it is not updated", async () => {
    const cwd = await initFixture("relative-independent");

    await gitTag(cwd, "package-1@1.0.0");
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

    await gitTag(cwd, "package-1@1.0.0");
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

    await gitTag(cwd, "v1.0.0");
    await setupChanges(cwd, "workspaces");
    await lernaPublish(cwd)("major", "--yes");

    expect(writePkg.updatedManifest("package-2").dependencies).toMatchObject({
      "package-1": "^2.0.0",
    });
  });
});
