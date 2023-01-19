import {
  cliRunner,
  commitChangeToPackage,
  gitCheckout,
  gitTag,
  initFixtureFactory,
} from "@lerna/test-helpers";
import fs from "fs-extra";
import path from "path";

const initFixture = initFixtureFactory(__dirname);

const LERNA_PACKAGE_NAME = process.platform === "win32" ? "%LERNA_PACKAGE_NAME%" : "$LERNA_PACKAGE_NAME";

test("lerna exec --since", async () => {
  const cwd = await initFixture("lerna-exec");
  const args = [
    "exec",
    // without tags, --since is largely ignored
    "--since",
    "--concurrency=1",
    "--",
    "echo",
    LERNA_PACKAGE_NAME,
  ];

  const { stdout } = await cliRunner(cwd)(...args);
  expect(stdout).toMatchInlineSnapshot(`
package-1
package-2
`);
});

test("lerna exec --since --scope package-1", async () => {
  const cwd = await initFixture("lerna-exec");
  const args = [
    "exec",
    // scopes overrule --since
    "--since",
    "--scope=package-1",
    "--concurrency=1",
    "--",
    "echo",
    LERNA_PACKAGE_NAME,
  ];

  const { stdout } = await cliRunner(cwd)(...args);
  expect(stdout).toBe("package-1");
});

test("lerna exec --since (last tag)", async () => {
  const cwd = await initFixture("lerna-exec");
  const args = [
    "exec",
    // --since defaults to the most recent release tag
    "--since",
    "--concurrency=1",
    "--",
    "echo",
    LERNA_PACKAGE_NAME,
  ];

  await gitTag(cwd, "v1.0.0");
  await commitChangeToPackage(cwd, "package-1", "change", { change: true });

  const { stdout } = await cliRunner(cwd)(...args);
  expect(stdout).toBe("package-1");
});

test("lerna exec --since v1.0.0", async () => {
  const cwd = await initFixture("lerna-exec");
  const args = [
    "exec",
    // this will override the default v1.0.1 "last tag"
    "--since=v1.0.0",
    "--concurrency=1",
    "--",
    "echo",
    LERNA_PACKAGE_NAME,
  ];

  await gitTag(cwd, "v1.0.0");
  await commitChangeToPackage(cwd, "package-2", "change", { change: true });

  await gitTag(cwd, "v1.0.1");
  await commitChangeToPackage(cwd, "package-1", "change", { change: true });

  const { stdout } = await cliRunner(cwd)(...args);
  expect(stdout).toMatchInlineSnapshot(`
package-1
package-2
`);
});

test("lerna exec --since main", async () => {
  const cwd = await initFixture("lerna-exec");
  const args = [
    "exec",
    // any git ref can be used with --since
    "--since=main",
    "--concurrency=1",
    "--",
    "echo",
    LERNA_PACKAGE_NAME,
  ];

  await gitTag(cwd, "v1.0.0");
  await commitChangeToPackage(cwd, "package-1", "change", { change: true });

  // Then we can checkout a new branch, update and commit.
  await gitCheckout(cwd, ["-b", "test"]);
  await commitChangeToPackage(cwd, "package-2", "change", { change: true });

  const { stdout } = await cliRunner(cwd)(...args);
  expect(stdout).toBe("package-2");
});

test("lerna exec --since (no git repo)", async () => {
  const cwd = await initFixture("lerna-exec");
  const args = [
    "exec",
    // always throws when a git repo is missing
    "--since=some-branch",
    "echo",
    LERNA_PACKAGE_NAME,
  ];

  await fs.remove(path.join(cwd, ".git"));

  await expect(cliRunner(cwd)(...args)).rejects.toThrow("this is not a git repository");
});
