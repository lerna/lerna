import { promptSelectOne as _promptSelectOne, promptTextInput as _promptTextInput } from "@lerna/core";
import {
  changelogSerializer,
  commandRunner,
  getCommitMessage,
  gitAdd,
  gitCommit,
  gitInit,
  gitTag,
  initFixtureFactory,
  showCommit,
} from "@lerna/test-helpers";
import fs from "fs-extra";
import os from "node:os";
import path from "node:path";

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

jest.mock("@lerna/core", () => {
  const realCore = jest.requireActual("@lerna/core");

  const mockCore = require("@lerna/test-helpers/__mocks__/@lerna/core");
  return {
    ...mockCore,
    collectProjectUpdates: realCore.collectProjectUpdates,
    recommendVersion: realCore.recommendVersion,
    updateChangelog: realCore.updateChangelog,
  };
});

const promptTextInput = jest.mocked(_promptTextInput);

// The mocked version isn't the same as the real one
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const promptSelectOne = _promptSelectOne as any;

const initFixture = initFixtureFactory(path.resolve(__dirname, "../../../publish"));

// test command

const lernaVersion = commandRunner(require("../command"));

// remove quotes around top-level strings
expect.addSnapshotSerializer({
  test(val) {
    return typeof val === "string";
  },
  serialize(val, config, indentation, depth) {
    // top-level strings don't need quotes, but nested ones do (object properties, etc)
    return depth ? `"${val}"` : val;
  },
});

// stabilize commit SHA
expect.addSnapshotSerializer(changelogSerializer);

const setupChanges = async (cwd) => {
  await gitTag(cwd, "v1.0.1-beta.3");
  await fs.outputFile(path.join(cwd, "packages/package-3/hello.js"), "world");
  await gitAdd(cwd, ".");
  await gitCommit(cwd, "feat: setup");
};

describe("version bump prerelease", () => {
  test("version patch with previous prerelease also graduates prereleased", async () => {
    const testDir = await initFixture("republish-prereleased");
    // should republish 3, 4, and 5 because:
    // package 3 changed
    // package 5 has a prerelease version
    // package 4 depends on package 5

    await setupChanges(testDir);
    await lernaVersion(testDir)("patch");

    const patch = await showCommit(testDir);
    expect(patch).toMatchSnapshot();
  });

  test("version prerelease with previous prerelease bumps changed only", async () => {
    const testDir = await initFixture("republish-prereleased");
    // should republish only package 3, because only it changed

    await setupChanges(testDir);
    await lernaVersion(testDir)("prerelease");

    const patch = await showCommit(testDir);
    expect(patch).toMatchSnapshot();
  });

  test("version prerelease with previous prerelease supersedes --conventional-commits", async () => {
    const testDir = await initFixture("republish-prereleased");
    // version bump should stay prepatch --preid beta because ---conventional-commits is ignored

    await setupChanges(testDir);
    await lernaVersion(testDir)("prerelease", "--conventional-commits");

    const patch = await showCommit(testDir);
    expect(patch).toMatchSnapshot();
  });

  test("version prerelease with existing preid bumps with the preid provide as argument", async () => {
    const testDir = await initFixture("republish-prereleased");
    // Version bump should have the new rc preid
    await setupChanges(testDir);
    await lernaVersion(testDir)("prerelease", "--preid", "rc");

    const message = await getCommitMessage(testDir);
    expect(message).toBe("v1.0.1-rc.0");
  });

  test("version prerelease with immediate graduation", async () => {
    const testDir = await initFixture("republish-prereleased");

    await setupChanges(testDir);
    await lernaVersion(testDir)("prerelease", "--force-publish", "package-4");
    // package-4 had no changes, but should still be included for some mysterious reason

    const firstDiff = await showCommit(testDir);
    expect(firstDiff).toMatchSnapshot();

    // no changes, but force everything because the previous prerelease passed QA
    await lernaVersion(testDir)("patch", "--force-publish");

    const secondDiff = await showCommit(testDir);
    expect(secondDiff).toMatchSnapshot();
  });

  test("independent version prerelease does not bump on every unrelated change", async () => {
    const cwd = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), "lerna-test-"));

    fs.mkdirSync(path.join(cwd, "packages", "pkg-a"), { recursive: true });
    fs.mkdirSync(path.join(cwd, "packages", "pkg-b"), { recursive: true });
    fs.writeFileSync(
      path.join(cwd, "lerna.json"),
      JSON.stringify({ version: "independent", packages: ["packages/*"] })
    );
    fs.writeFileSync(path.join(cwd, "package.json"), JSON.stringify({ name: "unrelated-bumps" }));
    fs.writeFileSync(
      path.join(cwd, "packages", "pkg-a", "package.json"),
      JSON.stringify({ name: "pkg-a", version: "1.0.0" })
    );
    fs.writeFileSync(
      path.join(cwd, "packages", "pkg-b", "package.json"),
      // TODO: (major) make --no-private the default
      JSON.stringify({ name: "pkg-b", version: "1.0.0-bumps.1", private: true })
    );

    await gitInit(cwd, ".");
    await gitAdd(cwd, "-A");
    await gitCommit(cwd, "init");

    // simulate choices for pkg-a then pkg-b
    promptSelectOne.chooseBump("patch");
    promptSelectOne.chooseBump("PRERELEASE");
    promptTextInput.mockImplementationOnce((msg, cfg) =>
      // the _existing_ "bumps" prerelease ID should be preserved
      // TODO: refactor based on TS feedback
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      Promise.resolve(cfg.filter())
    );

    await lernaVersion(cwd)();

    const first = await getCommitMessage(cwd);
    expect(first).toMatchInlineSnapshot(`
Publish

 - pkg-a@1.0.1
 - pkg-b@1.0.0-bumps.2
`);

    await fs.outputFile(path.join(cwd, "packages/pkg-a/hello.js"), "world");
    await gitAdd(cwd, ".");
    await gitCommit(cwd, "feat: hello world");

    // all of this just to say...
    await lernaVersion(cwd)();

    const second = await getCommitMessage(cwd);
    expect(second).toMatchInlineSnapshot(`
Publish

 - pkg-a@1.0.2
`);
  });

  test("independent version prerelease respects --no-private", async () => {
    const cwd = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), "lerna-test-"));

    fs.mkdirSync(path.join(cwd, "packages", "pkg-1"), { recursive: true });
    fs.mkdirSync(path.join(cwd, "packages", "pkg-2"), { recursive: true });
    fs.writeFileSync(
      path.join(cwd, "lerna.json"),
      JSON.stringify({ version: "independent", packages: ["packages/*"] })
    );
    fs.writeFileSync(path.join(cwd, "package.json"), JSON.stringify({ name: "no-private-versioning" }));
    fs.writeFileSync(
      path.join(cwd, "packages", "pkg-1", "package.json"),
      JSON.stringify({ name: "pkg-1", version: "1.0.0", devDependencies: { "pkg-2": "^2.0.0" } })
    );
    fs.writeFileSync(
      path.join(cwd, "packages", "pkg-2", "package.json"),
      JSON.stringify({ name: "pkg-2", version: "2.0.0", private: true })
    );

    await gitInit(cwd, ".");
    await gitAdd(cwd, "-A");
    await gitCommit(cwd, "init");

    // TODO: (major) make --no-private the default
    await lernaVersion(cwd)("prerelease", "--no-private");

    const changedFiles = await showCommit(cwd, "--name-only");
    expect(changedFiles).toMatchInlineSnapshot(`
    Publish

     - pkg-1@1.0.1-alpha.0

    HEAD -> main, tag: pkg-1@1.0.1-alpha.0

    packages/pkg-1/package.json
  `);
  });
});
