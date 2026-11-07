import { npmPublish as _npmPublish, writePackage as _writePackage } from "@lerna/core";
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

// The mocks differ from the real things
const npmPublish = _npmPublish as any;
const writePackage = _writePackage as any;

const initFixture = initFixtureFactory(__dirname);

// test command

import command from "../command";

const lernaPublish = commandRunner(command);

describe("pnpm catalog: specifiers", () => {
  const setupChanges = async (cwd: string) => {
    await fs.outputFile(path.join(cwd, "packages/package-2/hello.js"), "world");
    await gitAdd(cwd, ".");
    await gitCommit(cwd, "setup");
  };

  it("replaces catalog: specs with the catalog version range before npm publish but after git commit", async () => {
    const cwd = await initFixture("pnpm-catalogs");

    await gitTag(cwd, "v1.0.0");
    await setupChanges(cwd);
    await lernaPublish(cwd)("major", "--yes");

    expect(npmPublish.order()).toContain("package-2");
    expect(writePackage.updatedManifest("package-2")).toMatchObject({
      version: "2.0.0",
      dependencies: {
        "package-1": "^1.0.0",
        foo: "^2.0.0",
      },
      devDependencies: {
        bar: "^3.0.0",
      },
      optionalDependencies: {
        qux: "~4.5.6",
      },
      peerDependencies: {
        baz: "~1.2.3",
      },
    });

    // the version commit keeps the catalog: specs, and the working tree is reset to it after publishing
    expect(await fs.readJson(path.join(cwd, "packages/package-2/package.json"))).toMatchObject({
      version: "2.0.0",
      dependencies: {
        "package-1": "catalog:",
        foo: "catalog:",
      },
      devDependencies: {
        bar: "catalog:default",
      },
      optionalDependencies: {
        qux: "catalog:legacy",
      },
      peerDependencies: {
        baz: "catalog:legacy",
      },
    });
  });

  it("throws instead of publishing when a catalog has no entry for a dependency", async () => {
    const cwd = await initFixture("pnpm-catalogs");
    const manifestPath = path.join(cwd, "packages/package-2/package.json");
    const manifest = await fs.readJson(manifestPath);
    manifest.dependencies["not-in-catalog"] = "catalog:";
    await fs.writeJson(manifestPath, manifest, { spaces: 2 });

    await gitTag(cwd, "v1.0.0");
    await setupChanges(cwd);

    await expect(lernaPublish(cwd)("major", "--yes")).rejects.toThrow(
      'No version found for "not-in-catalog" in the "default" catalog in pnpm-workspace.yaml'
    );
    expect(npmPublish).not.toHaveBeenCalled();
  });
});
