"use strict";

const execa = require("execa");
const fs = require("fs-extra");
const { EOL } = require("os");
const path = require("path");
const initFixture = require("@lerna-test/init-fixture")(__dirname);
const gitCommit = require("../lib/git-commit");

test("commit message", async () => {
  const cwd = await initFixture("root-manifest-only");

  await fs.outputFile(path.join(cwd, "packages", "pkg-3", "index.js"), "hello");
  await execa("git", ["add", "."], { cwd });
  await gitCommit("foo", { cwd });

  const message = await execa.stdout("git", ["log", "-1", "--pretty=format:%B"], { cwd });
  expect(message).toBe("foo");
});

test("multiline message", async () => {
  const cwd = await initFixture("root-manifest-only");

  await fs.outputFile(path.join(cwd, "packages", "pkg-4", "index.js"), "hello");
  await execa("git", ["add", "."], { cwd });
  await gitCommit(`foo${EOL}${EOL}bar`, { cwd });

  const subject = await execa.stdout("git", ["log", "-1", "--pretty=format:%s"], { cwd });
  const body = await execa.stdout("git", ["log", "-1", "--pretty=format:%b"], { cwd });

  expect(subject).toBe("foo");
  expect(body).toBe("bar");
});
