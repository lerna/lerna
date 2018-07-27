"use strict";

// we're actually testing integration with git
jest.unmock("@lerna/collect-updates");

// local modules _must_ be explicitly mocked
jest.mock("../lib/git-push");
jest.mock("../lib/is-anything-committed");
jest.mock("../lib/is-behind-upstream");

const fs = require("fs-extra");
const path = require("path");

// helpers
const initFixture = require("@lerna-test/init-fixture")(path.resolve(__dirname, "../../publish/__tests__"));
const gitAdd = require("@lerna-test/git-add");
const gitTag = require("@lerna-test/git-tag");
const gitCommit = require("@lerna-test/git-commit");
const showCommit = require("@lerna-test/show-commit");

// test command
const lernaVersion = require("@lerna-test/command-runner")(require("../command"));

// stabilize commit SHA
expect.addSnapshotSerializer(require("@lerna-test/serialize-git-sha"));

describe("version --ignore-changes", () => {
  const setupChanges = async (cwd, tuples) => {
    await gitTag(cwd, "v1.0.0");
    await Promise.all(
      tuples.map(([filePath, content]) => fs.outputFile(path.join(cwd, filePath), content, "utf8"))
    );
    await gitAdd(cwd, ".");
    await gitCommit(cwd, "setup");
  };

  it("does not version packages with ignored changes", async () => {
    const cwd = await initFixture("normal");

    await setupChanges(cwd, [
      ["packages/package-2/README.md", "oh"],
      ["packages/package-3/__tests__/pkg3.test.js", "hai"],
      ["packages/package-4/lib/foo.js", "there"],
    ]);

    await lernaVersion(cwd)(
      "--ignore-changes",
      "README.md",

      "--ignore-changes",
      "**/__tests__/**",

      "--ignore-changes",
      "package-4" // notably does NOT work, needs to be "**/package-4/**" to match
    );

    const changedFiles = await showCommit(cwd, "--name-only");
    expect(changedFiles).toMatchSnapshot();
  });

  it("is mapped from deprecated --ignore", async () => {
    const cwd = await initFixture("normal");

    await setupChanges(cwd, [
      ["packages/package-3/README.md", "wat"],
      ["packages/package-4/lib/foo.js", "hey"],
    ]);

    await lernaVersion(cwd)("--ignore", "*.md");

    const changedFiles = await showCommit(cwd, "--name-only");
    expect(changedFiles).toMatchSnapshot();
  });
});
