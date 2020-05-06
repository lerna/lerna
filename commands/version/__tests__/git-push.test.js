"use strict";

const execa = require("execa");
const childProcess = require("@lerna/child-process");
const cloneFixture = require("@lerna-test/clone-fixture")(__dirname);
const gitPush = require("../lib/git-push");

const listRemoteTags = (cwd) => execa("git", ["ls-remote", "--tags", "--refs", "--quiet"], { cwd });

beforeEach(() => {
  jest.spyOn(childProcess, "exec");
});

afterEach(() => {
  jest.restoreAllMocks();
});

test("gitPush", async () => {
  const { cwd } = await cloneFixture("root-manifest-only");

  await execa("git", ["commit", "--allow-empty", "-m", "change"], { cwd });
  await execa("git", ["tag", "v1.2.3", "-m", "v1.2.3"], { cwd });
  await execa("git", ["tag", "foo@2.3.1", "-m", "foo@2.3.1"], { cwd });
  await execa("git", ["tag", "bar@3.2.1", "-m", "bar@3.2.1"], { cwd });

  await gitPush("origin", "master", { cwd });

  expect(childProcess.exec).toHaveBeenLastCalledWith(
    "git",
    ["push", "--follow-tags", "--no-verify", "--atomic", "origin", "master"],
    { cwd }
  );

  const { stdout } = await listRemoteTags(cwd);
  expect(stdout).toMatch("v1.2.3");
  expect(stdout).toMatch("foo@2.3.1");
  expect(stdout).toMatch("bar@3.2.1");
});

test("remote that does not support --atomic", async () => {
  const { cwd } = await cloneFixture("root-manifest-only");

  await execa("git", ["commit", "--allow-empty", "-m", "change"], { cwd });
  await execa("git", ["tag", "v4.5.6", "-m", "v4.5.6"], { cwd });

  // the first time the command is executed, simulate remote error
  childProcess.exec.mockImplementationOnce(async () => {
    const stderr = "fatal: the receiving end does not support --atomic push";
    const error = new Error(
      ["Command failed: git push --follow-tags --atomic --no-verify origin master", stderr].join("\n")
    );

    error.stderr = stderr;

    throw error;
  });

  // this call should _not_ throw
  await gitPush("origin", "master", { cwd });

  expect(childProcess.exec).toHaveBeenCalledTimes(2);
  expect(childProcess.exec).toHaveBeenLastCalledWith(
    "git",
    ["push", "--follow-tags", "--no-verify", "origin", "master"],
    { cwd }
  );

  const list = await listRemoteTags(cwd);
  expect(list.stdout).toMatch("v4.5.6");
});

test("git cli that does not support --atomic", async () => {
  const { cwd } = await cloneFixture("root-manifest-only");

  await execa("git", ["commit", "--allow-empty", "-m", "change"], { cwd });
  await execa("git", ["tag", "v7.8.9", "-m", "v7.8.9"], { cwd });

  // the first time the command is executed, simulate remote error
  childProcess.exec.mockImplementationOnce(async () => {
    const stderr = "error: unknown option `atomic'";
    const error = new Error(
      ["Command failed: git push --follow-tags --atomic --no-verify origin master", stderr].join("\n")
    );

    error.stderr = stderr;

    throw error;
  });

  await gitPush("origin", "master", { cwd });
  const result = (await listRemoteTags(cwd)).stdout;
  await expect(result).toMatch("v7.8.9");
});

test("unexpected git error", async () => {
  const { cwd } = await cloneFixture("root-manifest-only");

  childProcess.exec.mockImplementationOnce(async () => {
    const stderr = "fatal: some unexpected error";
    const error = new Error(
      ["Command failed: git push --follow-tags --atomic --no-verify origin master", stderr].join("\n")
    );

    error.stderr = stderr;

    throw error;
  });

  await expect(gitPush("origin", "master", { cwd })).rejects.toThrowError(/some unexpected error/);
});
