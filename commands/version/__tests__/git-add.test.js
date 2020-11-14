"use strict";

const execa = require("execa");
const fs = require("fs-extra");
const path = require("path");
const slash = require("slash");
const initFixture = require("@lerna-test/init-fixture")(__dirname);
const gitAdd = require("../lib/git-add");

const getStagedFile = async (cwd) =>
  execa("git", ["diff", "--cached", "--name-only"], { cwd }).then((result) => slash(result.stdout));

test("relative files", async () => {
  const cwd = await initFixture("root-manifest-only");
  const file = path.join("packages", "pkg-1", "index.js");

  await fs.outputFile(path.join(cwd, file), "hello");
  await gitAdd([file], { granularPathspec: true }, { cwd });

  await expect(getStagedFile(cwd)).resolves.toBe("packages/pkg-1/index.js");
});

test("absolute files", async () => {
  const cwd = await initFixture("root-manifest-only");
  const file = path.join(cwd, "packages", "pkg-2", "index.js");

  await fs.outputFile(file, "hello");
  await gitAdd([file], { granularPathspec: true }, { cwd });

  await expect(getStagedFile(cwd)).resolves.toBe("packages/pkg-2/index.js");
});

test(".gitignore", async () => {
  const cwd = await initFixture("root-manifest-only");
  const file3 = path.join(cwd, "packages/version-3/package.json");
  const file4 = path.join(cwd, "packages/dynamic-4/package.json");

  await Promise.all([
    // a "dynamic" package is intentionally unversioned, yet still published
    fs.outputJSON(file3, { three: true }),
    fs.outputJSON(file4, { four: true }),
  ]);

  await gitAdd([file3, file4], { granularPathspec: false }, { cwd });

  await expect(getStagedFile(cwd)).resolves.toBe("packages/version-3/package.json");
});

test(".gitignore without naming files", async () => {
  const cwd = await initFixture("root-manifest-only");
  const file5 = path.join(cwd, "packages/version-5/package.json");
  const file6 = path.join(cwd, "packages/dynamic-6/package.json");

  await Promise.all([
    // a "dynamic" package is intentionally unversioned, yet still published
    fs.outputJSON(file5, { five: true }),
    fs.outputJSON(file6, { six: true }),
  ]);

  await gitAdd([], { granularPathspec: false }, { cwd });

  await expect(getStagedFile(cwd)).resolves.toBe("packages/version-5/package.json");
});
