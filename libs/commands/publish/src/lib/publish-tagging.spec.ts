import {
  collectProjectUpdates as _collectUpdates,
  npmDistTag as _npmDistTag,
  npmPublish as _npmPublish,
} from "@lerna/core";
import { commandRunner, initFixtureFactory } from "@lerna/test-helpers";
import { setupLernaVersionMocks } from "../../__fixtures__/lerna-version-mocks";

// NOTE: this mock registration is immediately superseded by the one below (matching the
// original jest spec, where the second jest.mock for the same module wins).
vi.mock("@lerna/core", async () => {
  const actual = (await vi.importActual("@lerna/core")) as any;
  return {
    ...actual,
    ...(await import("@lerna/test-helpers/__mocks__/@lerna/core")),
    gitCheckout: actual.gitCheckout,
  };
});

vi.mock("@lerna/core", async () => ({
  ...(await vi.importActual("@lerna/core")),
  ...(await import("@lerna/test-helpers/__mocks__/@lerna/core")),
}));

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

const npmDistTag = vi.mocked(_npmDistTag);

// The mock differs from the real thing
const npmPublish = _npmPublish as any;
const collectUpdates = _collectUpdates as any;

// helpers
const initFixture = initFixtureFactory(__dirname);

// test command

import command from "../command";

const lernaPublish = commandRunner(command);

describe("publish tagging", () => {
  test("publish --dist-tag next", async () => {
    const cwd = await initFixture("normal");

    collectUpdates.setUpdated(cwd, "package-1");

    await lernaPublish(cwd)("--dist-tag", "next");

    expect(npmPublish.registry.get("package-1")).toBe("next");
    expect(npmDistTag.remove).not.toHaveBeenCalled();
  });

  test("publish --dist-tag nightly --canary", async () => {
    const cwd = await initFixture("normal");

    collectUpdates.setUpdated(cwd, "package-2");

    await lernaPublish(cwd)("--dist-tag", "nightly", "--canary");

    expect(npmPublish.registry.get("package-2")).toBe("nightly");
    expect(npmDistTag.remove).not.toHaveBeenCalled();
  });

  test("publish --npm-tag deprecated", async () => {
    const cwd = await initFixture("normal");

    collectUpdates.setUpdated(cwd, "package-3");

    await lernaPublish(cwd)("--npm-tag", "deprecated");

    expect(npmPublish.registry.get("package-3")).toBe("deprecated");
    expect(npmDistTag.remove).not.toHaveBeenCalled();
  });

  test("publish --temp-tag", async () => {
    const cwd = await initFixture("integration");

    await lernaPublish(cwd)("--temp-tag");

    expect(npmPublish.registry).toMatchInlineSnapshot(`
  Map {
    "@integration/package-1" => "lerna-temp",
    "@integration/package-2" => "lerna-temp",
  }
  `);

    const conf = expect.objectContaining({
      tag: "latest",
    });
    const cache = expect.objectContaining({
      otp: undefined,
    });

    expect(npmDistTag.remove).toHaveBeenCalledWith("@integration/package-1@1.0.1", "lerna-temp", conf, cache);
    expect(npmDistTag.remove).toHaveBeenCalledWith("@integration/package-2@1.0.1", "lerna-temp", conf, cache);

    expect(npmDistTag.add).toHaveBeenCalledWith("@integration/package-1@1.0.1", "CUSTOM", conf, cache); // <--
    expect(npmDistTag.add).toHaveBeenCalledWith("@integration/package-2@1.0.1", "latest", conf, cache);
  });

  test("publish --dist-tag beta --temp-tag", async () => {
    const cwd = await initFixture("integration");

    await lernaPublish(cwd)("--dist-tag", "beta", "--temp-tag");

    expect(npmPublish.registry).toMatchInlineSnapshot(`
  Map {
    "@integration/package-1" => "lerna-temp",
    "@integration/package-2" => "lerna-temp",
  }
  `);

    const conf = expect.objectContaining({
      tag: "beta",
    });
    const cache = expect.objectContaining({
      otp: undefined,
    });

    expect(npmDistTag.add).toHaveBeenCalledWith("@integration/package-1@1.0.1", "beta", conf, cache); // <--
    expect(npmDistTag.add).toHaveBeenCalledWith("@integration/package-2@1.0.1", "beta", conf, cache);
  });

  test("publish prerelease --pre-dist-tag beta", async () => {
    const cwd = await initFixture("normal");

    collectUpdates.setUpdated(cwd, "package-1");

    await lernaPublish(cwd)("prerelease", "--pre-dist-tag", "beta");

    expect(npmPublish.registry.get("package-1")).toBe("beta");
    expect(npmDistTag.remove).not.toHaveBeenCalled();
  });

  test("publish non-prerelease --pre-dist-tag beta", async () => {
    const cwd = await initFixture("normal");

    collectUpdates.setUpdated(cwd, "package-1");

    await lernaPublish(cwd)("--pre-dist-tag", "beta");

    expect(npmPublish.registry.get("package-1")).toBe("latest");
    expect(npmDistTag.remove).not.toHaveBeenCalled();
  });

  test("publish non-prerelease --dist-tag next --pre-dist-tag beta", async () => {
    const cwd = await initFixture("normal");

    collectUpdates.setUpdated(cwd, "package-1");

    await lernaPublish(cwd)("--dist-tag", "next", "--pre-dist-tag", "beta");

    expect(npmPublish.registry.get("package-1")).toBe("next");
    expect(npmDistTag.remove).not.toHaveBeenCalled();
  });

  test("publish --pre-dist-tag beta --temp-tag", async () => {
    const cwd = await initFixture("integration");

    await lernaPublish(cwd)(
      "prerelease",
      "--dist-tag",
      "next",
      "--preid",
      "beta",
      "--pre-dist-tag",
      "beta",
      "--temp-tag"
    );

    expect(npmPublish.registry).toMatchInlineSnapshot(`
  Map {
    "@integration/package-1" => "lerna-temp",
    "@integration/package-2" => "lerna-temp",
  }
  `);

    const conf = expect.objectContaining({
      tag: "next",
    });
    const cache = expect.objectContaining({
      otp: undefined,
    });

    expect(npmDistTag.add).toHaveBeenCalledWith("@integration/package-1@1.0.1-beta.0", "beta", conf, cache);
    expect(npmDistTag.add).toHaveBeenCalledWith("@integration/package-2@1.0.1-beta.0", "beta", conf, cache);
  });
});
