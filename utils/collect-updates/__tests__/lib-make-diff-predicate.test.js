"use strict";

jest.mock("@lerna/child-process");

// mocked modules
const childProcess = require("@lerna/child-process");

// file under test
const makeDiffPredicate = require("../lib/make-diff-predicate");

function setup(changes) {
  childProcess.execSync.mockReturnValueOnce([].concat(changes).join("\n"));
}

test("git diff call", () => {
  setup([
    "packages/pkg-1/__tests__/index.test.js",
    "packages/pkg-1/index.js",
    "packages/pkg-1/package.json",
    "packages/pkg-1/README.md",
  ]);

  const hasDiff = makeDiffPredicate("v1.0.0", { cwd: "/test" });
  const result = hasDiff({
    location: "/test/packages/pkg-1",
  });

  expect(result).toBe(true);
  expect(childProcess.execSync).toHaveBeenLastCalledWith(
    "git",
    ["diff", "--name-only", "v1.0.0", "--", "packages/pkg-1"],
    { cwd: "/test" }
  );
});

test("empty diff", () => {
  setup("");

  const hasDiff = makeDiffPredicate("v1.0.0", { cwd: "/test" });
  const result = hasDiff({
    location: "/test/packages/pkg-1",
  });

  expect(result).toBe(false);
});

test("rooted package", () => {
  setup("package.json");

  const hasDiff = makeDiffPredicate("deadbeef", { cwd: "/test" });
  const result = hasDiff({
    location: "/test",
  });

  expect(result).toBe(true);
  expect(childProcess.execSync).toHaveBeenLastCalledWith("git", ["diff", "--name-only", "deadbeef"], {
    cwd: "/test",
  });
});

test("ignore changes (globstars)", () => {
  setup([
    "packages/pkg-2/examples/.eslintrc.yaml",
    "packages/pkg-2/examples/do-a-thing/index.js",
    "packages/pkg-2/examples/and-another-thing/package.json",
  ]);

  const hasDiff = makeDiffPredicate("v1.0.0", { cwd: "/test" }, ["**/examples/**", "*.md"]);
  const result = hasDiff({
    location: "/test/packages/pkg-2",
  });

  expect(result).toBe(false);
});

test("ignore changes (match base)", () => {
  setup("packages/pkg-3/README.md");

  const hasDiff = makeDiffPredicate("v1.0.0", { cwd: "/test" }, ["*.md"]);
  const result = hasDiff({
    location: "/test/packages/pkg-3",
  });

  expect(result).toBe(false);
});
