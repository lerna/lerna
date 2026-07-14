import { changelogSerializer, cliRunner, cloneFixtureFactory, gitAdd, gitCommit } from "@lerna/test-helpers";
import execa from "execa";
import fs from "fs-extra";
import os from "node:os";
import path from "node:path";

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
  const cloneDir = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), "lerna-test-"));
  const getReleaseState = async () => {
    const [{ stdout: head }, { stdout: tags }, { stdout: status }] = await Promise.all([
      execa("git", ["rev-parse", "HEAD"], { cwd }),
      execa("git", ["tag", "--list"], { cwd }),
      execa("git", ["status", "--porcelain"], { cwd }),
    ]);

    return { head, tags, status };
  };

  // simulate upstream change from another clone
  await execa("git", ["clone", repository, cloneDir]);
  await execa("git", ["checkout", "-B", "main", "origin/main"], { cwd: cloneDir });
  await fs.outputFile(path.join(cloneDir, "README.md"), "upstream change");
  await gitAdd(cloneDir, "-A");
  await gitCommit(cloneDir, "upstream change");
  await execa("git", ["push", "origin", "main"], { cwd: cloneDir });

  // throws during interactive publish (local)
  await expect(cliRunner(cwd, env)("publish", "--no-ci")).rejects.toThrow(/EBEHIND/);

  // throws during non-interactive publish (CI)
  await expect(cliRunner(cwd, env)("publish", "--ci")).rejects.toThrow(/EBEHIND/);

  // warns and exits successfully when explicitly configured to skip in CI
  const beforeCliSkip = await getReleaseState();
  const { stderr } = await cliRunner(cwd, env)("publish", "--ci", "--ci-behind-behavior", "skip");
  expect(stderr).toMatch("EBEHIND");
  expect(await getReleaseState()).toEqual(beforeCliSkip);

  // consumes durable configuration when versioning is composed within publish
  const lernaJsonPath = path.join(cwd, "lerna.json");
  const lernaJson = await fs.readJSON(lernaJsonPath);
  await fs.writeJSON(
    lernaJsonPath,
    {
      ...lernaJson,
      command: {
        ...lernaJson.command,
        version: {
          ...lernaJson.command?.version,
          ciBehindBehavior: "skip",
        },
      },
    },
    { spaces: 2 }
  );
  await gitAdd(cwd, "lerna.json");
  await gitCommit(cwd, "configure CI behind behavior");

  const beforeConfigSkip = await getReleaseState();
  const configuredResult = await cliRunner(cwd, env)("publish", "--ci");
  expect(configuredResult.stderr).toMatch("EBEHIND");
  expect(await getReleaseState()).toEqual(beforeConfigSkip);
});
