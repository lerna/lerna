import {
  changelogSerializer,
  cliRunner,
  cloneFixtureFactory,
  commitChangeToPackage,
  gitStatus,
  gitTag,
} from "@lerna/test-helpers";
import path from "path";

const cloneFixture = cloneFixtureFactory(path.resolve(__dirname, "../../libs/commands/publish"));

// stabilize changelog commit SHA and datestamp
expect.addSnapshotSerializer(changelogSerializer);

const env = {
  // never actually upload when calling `npm publish`
  npm_config_dry_run: true,
  // skip npm package validation, none of the stubs are real
  LERNA_INTEGRATION: "SKIP",
};

test("lerna publish --canary uses default prerelease id", async () => {
  const { cwd } = await cloneFixture("normal");
  const args = ["publish", "--canary", "--yes"];

  await gitTag(cwd, "v1.0.0");
  await commitChangeToPackage(cwd, "package-1", "change", { change: true });

  const { stdout } = await cliRunner(cwd, env)(...args);
  expect(stdout).toMatchInlineSnapshot(`

Found 3 packages to publish:
 - package-1 => 1.0.1-alpha.0+SHA
 - package-2 => 1.0.1-alpha.0+SHA
 - package-3 => 1.0.1-alpha.0+SHA

Successfully published:
 - package-1@1.0.1-alpha.0+SHA
 - package-2@1.0.1-alpha.0+SHA
 - package-3@1.0.1-alpha.0+SHA
`);
});

test("lerna publish --canary --no-git-reset leaves the working tree dirty", async () => {
  const { cwd } = await cloneFixture("normal");
  const args = ["publish", "--canary", "--yes", "--no-git-reset"];

  await gitTag(cwd, "v1.0.0");
  await commitChangeToPackage(cwd, "package-1", "change", { change: true });

  const { stdout } = await cliRunner(cwd, env)(...args);
  expect(stdout).toMatchInlineSnapshot(`

Found 3 packages to publish:
 - package-1 => 1.0.1-alpha.0+SHA
 - package-2 => 1.0.1-alpha.0+SHA
 - package-3 => 1.0.1-alpha.0+SHA

Successfully published:
 - package-1@1.0.1-alpha.0+SHA
 - package-2@1.0.1-alpha.0+SHA
 - package-3@1.0.1-alpha.0+SHA
`);

  const result = gitStatus();
  // snapshot is unstable because whitespace is trimmed from both sides
  expect(result.stdout.trimRight().split("\n")).toStrictEqual([
    " M packages/package-1/package.json",
    " M packages/package-2/package.json",
    " M packages/package-3/package.json",
  ]);
});
