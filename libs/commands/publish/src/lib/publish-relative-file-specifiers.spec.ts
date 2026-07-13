import { writePackage as _writePackage } from "@lerna/core";
import { commandRunner, gitAdd, gitCommit, gitTag, initFixtureFactory } from "@lerna/test-helpers";
import fs from "fs-extra";
import path from "path";
import { setupLernaVersionMocks } from "../../__fixtures__/lerna-version-mocks";

vi.mock("@lerna/core", async () => {
  const actual = (await vi.importActual("@lerna/core")) as any;
  return {
    ...actual,
    ...(await import("@lerna/test-helpers/__mocks__/@lerna/core")),
    // we're actually testing integration with git
    collectProjectUpdates: actual.collectProjectUpdates,
    gitCheckout: actual.gitCheckout,
  };
});

// lerna publish mocks
vi.mock("./get-packages-without-license", async () => {
  return {
    getPackagesWithoutLicense: vi.fn().mockResolvedValue([]),
  };
});
vi.mock("./verify-npm-package-access");
vi.mock("./get-npm-username");
vi.mock("./get-two-factor-auth-required");

// lerna version mocks
setupLernaVersionMocks();

// The mock differs from the real thing
const writePackage = _writePackage as any;

const initFixture = initFixtureFactory(__dirname);

// test command

import command from "../command";

const lernaPublish = commandRunner(command);

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

    expect(writePackage.updatedVersions()).toEqual({
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
      "package-e": "2.0.0",
      "package-f": "2.0.0",
    });

    // notably missing is package-1, which has no relative file: dependencies
    expect(writePackage.updatedManifest("package-2").dependencies).toMatchObject({
      "package-1": "^2.0.0",
    });
    expect(writePackage.updatedManifest("package-3").dependencies).toMatchObject({
      "package-2": "^2.0.0",
    });
    expect(writePackage.updatedManifest("package-4").optionalDependencies).toMatchObject({
      "package-3": "^2.0.0",
    });
    expect(writePackage.updatedManifest("package-5").dependencies).toMatchObject({
      "package-4": "^2.0.0",
      // all fixed versions are bumped when major
      "package-6": "^2.0.0",
    });
    // private packages do not need local version resolution
    expect(writePackage.updatedManifest("package-7").dependencies).toMatchObject({
      "package-1": "file:../package-1",
    });
    // peerDependencies which are file protocol relative are not changed
    // this could change in future but for now we are being conservative in order to not introduce incorrect behavior.
    expect(writePackage.updatedManifest("package-8").peerDependencies).toMatchObject({
      "package-1": "file:../package-1",
    });
    // peerDependencies which are not relative are left unchanged
    expect(writePackage.updatedManifest("package-9").peerDependencies).toMatchObject({
      "package-1": "^1.0.0",
    });
    // peerDependencies which are "workspace:*" are transformed to the exact target workspace version.
    expect(writePackage.updatedManifest("package-a").peerDependencies).toMatchObject({
      "package-1": "2.0.0",
    });
    // peerDependencies which are "workspace:^" are transformed to the corresponding (^) target workspace version.
    expect(writePackage.updatedManifest("package-b").peerDependencies).toMatchObject({
      "package-1": "^2.0.0",
    });
    // peerDependencies which are "workspace:~" are transformed to the corresponding (~) target workspace version.
    expect(writePackage.updatedManifest("package-c").peerDependencies).toMatchObject({
      "package-1": "~2.0.0",
    });
    // peerDependencies which are "workspace:^" followed by a version should be transformed to the corresponding "^" semver range.
    expect(writePackage.updatedManifest("package-d").peerDependencies).toMatchObject({
      "package-1": "^2.3.4",
    });
    // peerDependencies which are "workspace:~" followed by a version should be transformed to the corresponding "~" semver range.
    expect(writePackage.updatedManifest("package-e").peerDependencies).toMatchObject({
      "package-1": "~2.3.4",
    });
    // peerDependencies which are "workspace:" followed by a version should be transformed to the corresponding version.
    expect(writePackage.updatedManifest("package-f").peerDependencies).toMatchObject({
      "package-1": "2.3.4",
    });
  });

  it("falls back to existing relative version when it is not updated", async () => {
    const cwd = await initFixture("relative-independent");

    await gitTag(cwd, "package-1@1.0.0");
    await setupChanges(cwd);
    await lernaPublish(cwd)("minor", "--yes");

    expect(writePackage.updatedVersions()).toEqual({
      "package-1": "1.1.0",
      "package-2": "2.1.0",
      "package-3": "3.1.0",
      "package-4": "4.1.0",
      "package-5": "5.1.0",
    });

    // package-4 was updated, but package-6 was not
    expect(writePackage.updatedManifest("package-5").dependencies).toMatchObject({
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
    expect(writePackage.updatedManifest("package-5").dependencies).toMatchObject({
      "package-4": "4.0.1",
      "package-6": "6.0.0",
    });
  });
});
