import { cloneFixtureFactory } from "@lerna/test-helpers";
import execa from "execa";

const cloneFixture = cloneFixtureFactory(__dirname);

// eslint-disable-next-line @typescript-eslint/no-var-requires
const childProcess = require("@lerna/child-process");

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { gitPush } = require("./git-push");

async function listRemoteTags(cwd) {
  return execa("git", ["ls-remote", "--tags", "--refs", "--quiet"], { cwd }).then((result) => result.stdout);
}

beforeEach(() => {
  jest.spyOn(childProcess, "exec");
});

afterEach(() => {
  jest.restoreAllMocks();
  delete process.env.GIT_REDIRECT_STDERR;
});

test("gitPush", async () => {
  const { cwd } = await cloneFixture("root-manifest-only");

  await execa("git", ["commit", "--allow-empty", "-m", "change"], { cwd });
  await execa("git", ["tag", "v1.2.3", "-m", "v1.2.3"], { cwd });
  await execa("git", ["tag", "foo@2.3.1", "-m", "foo@2.3.1"], { cwd });
  await execa("git", ["tag", "bar@3.2.1", "-m", "bar@3.2.1"], { cwd });

  await gitPush("origin", "main", { cwd });

  expect(childProcess.exec).toHaveBeenLastCalledWith(
    "git",
    ["push", "--follow-tags", "--no-verify", "--atomic", "origin", "main"],
    { cwd }
  );

  const list = await listRemoteTags(cwd);
  expect(list).toMatch("v1.2.3");
  expect(list).toMatch("foo@2.3.1");
  expect(list).toMatch("bar@3.2.1");
});

test("remote that does not support --atomic", async () => {
  const { cwd } = await cloneFixture("root-manifest-only");

  await execa("git", ["commit", "--allow-empty", "-m", "change"], { cwd });
  await execa("git", ["tag", "v4.5.6", "-m", "v4.5.6"], { cwd });

  // the first time the command is executed, simulate remote error
  childProcess.exec.mockImplementationOnce(async () => {
    const stderr = "fatal: the receiving end does not support --atomic push";
    const error = new Error(
      ["Command failed: git push --follow-tags --atomic --no-verify origin main", stderr].join("\n")
    ) as any;

    error.stderr = stderr;

    throw error;
  });

  // this call should _not_ throw
  await gitPush("origin", "main", { cwd });

  expect(childProcess.exec).toHaveBeenCalledTimes(2);
  expect(childProcess.exec).toHaveBeenLastCalledWith(
    "git",
    ["push", "--follow-tags", "--no-verify", "origin", "main"],
    { cwd }
  );

  const list = await listRemoteTags(cwd);
  expect(list).toMatch("v4.5.6");
});

test("remote that does not support --atomic and git stderr redirected to stdout", async () => {
  const { cwd } = await cloneFixture("root-manifest-only");

  process.env.GIT_REDIRECT_STDERR = "2>&1";

  await execa("git", ["commit", "--allow-empty", "-m", "change"], { cwd });
  await execa("git", ["tag", "v4.5.6", "-m", "v4.5.6"], { cwd });

  // the first time the command is executed, simulate remote error
  childProcess.exec.mockImplementationOnce(async () => {
    const stdout = "fatal: the receiving end does not support --atomic push";
    const error = new Error(
      ["Command failed: git push --follow-tags --atomic --no-verify origin main", stdout].join("\n")
    ) as any;

    error.stdout = stdout;

    throw error;
  });

  // this call should _not_ throw
  await gitPush("origin", "main", { cwd });

  expect(childProcess.exec).toHaveBeenCalledTimes(2);
  expect(childProcess.exec).toHaveBeenLastCalledWith(
    "git",
    ["push", "--follow-tags", "--no-verify", "origin", "main"],
    { cwd }
  );

  const list = await listRemoteTags(cwd);
  expect(list).toMatch("v4.5.6");
});

test("git cli that does not support --atomic", async () => {
  const { cwd } = await cloneFixture("root-manifest-only");

  await execa("git", ["commit", "--allow-empty", "-m", "change"], { cwd });
  await execa("git", ["tag", "v7.8.9", "-m", "v7.8.9"], { cwd });

  // the first time the command is executed, simulate remote error
  childProcess.exec.mockImplementationOnce(async () => {
    const stderr = "error: unknown option `atomic'";
    const error = new Error(
      ["Command failed: git push --follow-tags --atomic --no-verify origin main", stderr].join("\n")
    ) as any;

    error.stderr = stderr;

    throw error;
  });

  await gitPush("origin", "main", { cwd });

  await expect(listRemoteTags(cwd)).resolves.toMatch("v7.8.9");
});

test("unexpected git error", async () => {
  const { cwd } = await cloneFixture("root-manifest-only");

  childProcess.exec.mockImplementationOnce(async () => {
    const stderr = "fatal: some unexpected error";
    const error = new Error(
      ["Command failed: git push --follow-tags --atomic --no-verify origin main", stderr].join("\n")
    ) as any;

    error.stderr = stderr;

    throw error;
  });

  await expect(gitPush("origin", "main", { cwd })).rejects.toThrowError(/some unexpected error/);
});
