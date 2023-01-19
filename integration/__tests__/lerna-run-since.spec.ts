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

const env = {
  // Hush timing information
  LERNA_INTEGRATION: "SKIP",
};

test("lerna run --since", async () => {
  const cwd = await initFixture("lerna-run");
  const args = [
    "run",
    "test",
    // without tags, --since is largely ignored
    "--since",
    "--concurrency=1",
    // args below tell npm to be quiet
    "--",
    "--silent",
  ];

  const { stdout } = await cliRunner(cwd, env)(...args);
  expect(stdout).toMatchInlineSnapshot(`
package-3
package-4
package-1
package-2
`);
});

test("lerna run --since --scope package-1", async () => {
  const cwd = await initFixture("lerna-run");
  const args = [
    "run",
    "test",
    // scopes overrule --since
    "--since",
    "--scope=package-1",
    "--concurrency=1",
    // args below tell npm to be quiet
    "--",
    "--silent",
  ];

  const { stdout } = await cliRunner(cwd, env)(...args);
  expect(stdout).toBe("package-1");
});

test("lerna run --since (last tag)", async () => {
  const cwd = await initFixture("lerna-run");
  const args = [
    "run",
    "test",
    // --since defaults to the most recent release tag
    "--since",
    "--concurrency=1",
    // args below tell npm to be quiet
    "--",
    "--silent",
  ];

  await gitTag(cwd, "v1.0.0");
  await commitChangeToPackage(cwd, "package-1", "change", { change: true });

  const { stdout } = await cliRunner(cwd, env)(...args);
  expect(stdout).toBe("package-1");
});

test("lerna run --since v1.0.0", async () => {
  const cwd = await initFixture("lerna-run");
  const args = [
    "run",
    "test",
    // this will override the default v1.0.1 "last tag"
    "--since=v1.0.0",
    "--concurrency=1",
    // args below tell npm to be quiet
    "--",
    "--silent",
  ];

  await gitTag(cwd, "v1.0.0");
  await commitChangeToPackage(cwd, "package-2", "change", { change: true });

  await gitTag(cwd, "v1.0.1");
  await commitChangeToPackage(cwd, "package-1", "change", { change: true });

  const { stdout } = await cliRunner(cwd, env)(...args);
  expect(stdout).toMatchInlineSnapshot(`
package-1
package-2
`);
});

test("lerna run --since main", async () => {
  const cwd = await initFixture("lerna-run");
  const args = [
    "run",
    "test",
    // any git ref can be used with --since
    "--since=main",
    "--concurrency=1",
    // args below tell npm to be quiet
    "--",
    "--silent",
  ];

  await gitTag(cwd, "v1.0.0");
  await commitChangeToPackage(cwd, "package-1", "change", { change: true });

  // Then we can checkout a new branch, update and commit.
  await gitCheckout(cwd, ["-b", "test"]);
  await commitChangeToPackage(cwd, "package-2", "change", { change: true });

  const { stdout } = await cliRunner(cwd, env)(...args);
  expect(stdout).toBe("package-2");
});

test("lerna run --since (no git repo)", async () => {
  const cwd = await initFixture("lerna-run");
  const args = [
    "run",
    "test",
    // always throws when a git repo is missing
    "--since=some-branch",
  ];

  await fs.remove(path.join(cwd, ".git"));

  await expect(cliRunner(cwd, env)(...args)).rejects.toThrow("this is not a git repository");
});
