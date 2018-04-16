"use strict";

const execa = require("execa");
const cloneFixture = require("@lerna-test/clone-fixture")(__dirname);
const gitPush = require("../lib/git-push");

test("gitPush", async () => {
  const { cwd } = await cloneFixture("root-manifest-only");

  await execa("git", ["commit", "--allow-empty", "-m", "change"], { cwd });
  await execa("git", ["tag", "v1.2.3", "-m", "v1.2.3"], { cwd });
  await execa("git", ["tag", "foo@2.3.1", "-m", "foo@2.3.1"], { cwd });
  await execa("git", ["tag", "bar@3.2.1", "-m", "bar@3.2.1"], { cwd });

  await gitPush("origin", "master", { cwd });

  const list = await execa.stdout("git", ["ls-remote", "--tags", "--refs", "--quiet"], { cwd });
  expect(list).toMatch("v1.2.3");
  expect(list).toMatch("foo@2.3.1");
  expect(list).toMatch("bar@3.2.1");
});
