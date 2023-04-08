import { changelogSerializer, cliRunner, cloneFixtureFactory, gitAdd, gitCommit } from "@lerna/test-helpers";
import execa from "execa";
import fs from "fs-extra";
import path from "path";
import tempy from "tempy";

const cloneFixture = cloneFixtureFactory(path.resolve(__dirname, "../../libs/commands/publish"));

// stabilize changelog commit SHA and datestamp
expect.addSnapshotSerializer(changelogSerializer);

const env = {
  // never actually upload when calling `npm publish`
  npm_config_dry_run: true,
  // skip npm package validation, none of the stubs are real
  LERNA_INTEGRATION: "SKIP",
};

test("lerna publish exits with EBEHIND when behind upstream remote", async () => {
  const { cwd, repository } = await cloneFixture("normal");
  const cloneDir = tempy.directory();

  // simulate upstream change from another clone
  await execa("git", ["clone", repository, cloneDir]);
  await execa("git", ["checkout", "-B", "main", "origin/main"], { cwd: cloneDir });
  await fs.outputFile(path.join(cloneDir, "README.md"), "upstream change");
  await gitAdd(cloneDir, "-A");
  await gitCommit(cloneDir, "upstream change");
  await execa("git", ["push", "origin", "main"], { cwd: cloneDir });

  // throws during interactive publish (local)
  await expect(cliRunner(cwd, env)("publish", "--no-ci")).rejects.toThrow(/EBEHIND/);

  // warns during non-interactive publish (CI)
  const { stderr } = await cliRunner(cwd, env)("publish", "--ci");
  expect(stderr).toMatch("EBEHIND");
});
