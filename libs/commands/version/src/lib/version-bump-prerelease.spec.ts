import { promptSelectOne as _promptSelectOne, promptTextInput as _promtTextInput } from "@lerna/core";
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
import path from "path";
import Tacks from "tacks";
import tempy from "tempy";

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
  // eslint-disable-next-line jest/no-mocks-import, @typescript-eslint/no-var-requires
  const mockCore = require("@lerna/test-helpers/__mocks__/@lerna/core");
  return {
    ...mockCore,
    recommendVersion: realCore.recommendVersion,
    updateChangelog: realCore.updateChangelog,
    // we're actually testing integration with git
    collectUpdates: realCore.collectUpdates,
  };
});

const promptTextInput = jest.mocked(_promtTextInput);

// The mocked version isn't the same as the real one
const promptSelectOne = _promptSelectOne as any;

const initFixture = initFixtureFactory(path.resolve(__dirname, "../../../publish"));

const { File, Dir } = Tacks;

// test command
// eslint-disable-next-line @typescript-eslint/no-var-requires
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
  const cwd = tempy.directory();
  const fixture = new Tacks(
    Dir({
      "lerna.json": File({
        version: "independent",
      }),
      "package.json": File({
        name: "unrelated-bumps",
      }),
      packages: Dir({
        "pkg-a": Dir({
          "package.json": File({
            name: "pkg-a",
            version: "1.0.0",
          }),
        }),
        "pkg-b": Dir({
          "package.json": File({
            name: "pkg-b",
            version: "1.0.0-bumps.1",
            // TODO: (major) make --no-private the default
            private: true,
          }),
        }),
      }),
    })
  );

  fixture.create(cwd);

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
  const cwd = tempy.directory();
  const fixture = new Tacks(
    Dir({
      "lerna.json": File({
        version: "independent",
      }),
      "package.json": File({
        name: "no-private-versioning",
      }),
      packages: Dir({
        "pkg-1": Dir({
          "package.json": File({
            name: "pkg-1",
            version: "1.0.0",
            devDependencies: {
              "pkg-2": "^2.0.0",
            },
          }),
        }),
        "pkg-2": Dir({
          "package.json": File({
            name: "pkg-2",
            version: "2.0.0",
            private: true,
          }),
        }),
      }),
    })
  );
  fixture.create(cwd);

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
