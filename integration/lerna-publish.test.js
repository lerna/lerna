"use strict";

const execa = require("execa");
const fs = require("fs-extra");
const globby = require("globby");
const normalizeNewline = require("normalize-newline");
const writeJsonFile = require("write-json-file");
const loadJsonFile = require("load-json-file");
const path = require("path");
const os = require("os");
const tempy = require("tempy");

const cliRunner = require("@lerna-test/cli-runner");
const gitAdd = require("@lerna-test/git-add");
const gitCommit = require("@lerna-test/git-commit");
const gitTag = require("@lerna-test/git-tag");
const showCommit = require("@lerna-test/show-commit");
const cloneFixture = require("@lerna-test/clone-fixture")(
  path.resolve(__dirname, "../commands/publish/__tests__")
);
const loadManifests = require("@lerna-test/load-manifests");
const normalizeTestRoot = require("@lerna-test/normalize-test-root");

// stabilize changelog commit SHA and datestamp
expect.addSnapshotSerializer(require("@lerna-test/serialize-changelog"));

const lastCommitMessage = cwd =>
  execa.stdout("git", ["log", "-1", "--format=%B"], { cwd }).then(normalizeNewline);

async function commitChangeToPackage(cwd, packageName, commitMsg, data) {
  const packageJSONPath = path.join(cwd, "packages", packageName, "package.json");
  const pkg = await loadJsonFile(packageJSONPath);

  await writeJsonFile(packageJSONPath, Object.assign(pkg, data));
  await gitAdd(cwd, packageJSONPath);

  return gitCommit(cwd, commitMsg);
}

describe("lerna publish", () => {
  const env = {
    // never actually upload when calling `npm install`
    npm_config_dry_run: true,
    // skip npm package validation, none of the stubs are real
    LERNA_INTEGRATION: "SKIP",
  };

  test("exit 0 when no updates", async () => {
    const { cwd } = await cloneFixture("normal");
    const args = ["publish"];

    await gitTag(cwd, "v1.0.0");

    const { code, stdout } = await cliRunner(cwd, env)(...args);

    expect(code).toBe(0);
    expect(stdout).toBe("");
  });

  test("exits with error when unknown options are passed", async () => {
    const { cwd } = await cloneFixture("normal");
    const args = ["publish", "--yes", "--scope", "package-1"];

    try {
      await cliRunner(cwd, env)(...args);
    } catch (err) {
      expect(err.code).toBe(1);
      expect(err.stderr).toMatch("Unknown argument: scope");
    }

    expect.assertions(2);
  });

  test("exits with error when package access validation fails", async () => {
    const { cwd } = await cloneFixture("normal");
    const args = ["publish", "prerelease", "--yes"];

    try {
      await cliRunner(cwd, { LERNA_INTEGRATION: "ALLOW" })(...args);
    } catch (err) {
      expect(err.code).toBe(1);
      expect(err.stderr).toMatch("ENEEDAUTH");
    }

    expect.assertions(2);
  });

  test("updates fixed versions", async () => {
    const { cwd } = await cloneFixture("normal");
    const args = ["publish", "patch", "--yes"];

    const { stdout } = await cliRunner(cwd, env)(...args);
    expect(stdout).toMatchSnapshot("stdout");

    const [allPackageJsons, commitMessage] = await Promise.all([loadManifests(cwd), lastCommitMessage(cwd)]);

    expect(allPackageJsons).toMatchSnapshot("packages");
    expect(commitMessage).toMatchSnapshot("commit");
  });

  test("updates all transitive dependents", async () => {
    const { cwd } = await cloneFixture("snake-graph");
    const args = ["publish", "major", "--yes"];

    await gitTag(cwd, "v1.0.0");
    await commitChangeToPackage(cwd, "package-1", "change", { change: true });

    await cliRunner(cwd, env)(...args);

    expect(await loadManifests(cwd)).toMatchSnapshot();
  });

  test("uses default suffix with canary flag", async () => {
    const { cwd } = await cloneFixture("normal");
    const args = ["publish", "--canary", "--yes"];

    await gitTag(cwd, "v1.0.0");
    await commitChangeToPackage(cwd, "package-1", "change", { change: true });

    const { stdout } = await cliRunner(cwd, env)(...args);
    expect(stdout).toMatchSnapshot("stdout");
  });

  test("updates independent versions", async () => {
    const { cwd } = await cloneFixture("independent");
    const args = ["publish", "major", "--yes"];

    const { stdout } = await cliRunner(cwd, env)(...args);
    expect(stdout).toMatchSnapshot("stdout");

    const [allPackageJsons, commitMessage] = await Promise.all([loadManifests(cwd), lastCommitMessage(cwd)]);

    expect(allPackageJsons).toMatchSnapshot("packages");
    expect(commitMessage).toMatchSnapshot("commit");
  });

  ["normal", "independent"].forEach(flavor =>
    test(`${flavor} mode --conventional-commits changelog`, async () => {
      const { cwd } = await cloneFixture(`${flavor}`, "feat: init repo");
      const args = ["publish", "--conventional-commits", "--yes"];

      await commitChangeToPackage(cwd, "package-1", "feat(package-1): Add foo", { foo: true });
      await commitChangeToPackage(cwd, "package-1", "fix(package-1): Fix foo", { foo: false });
      await commitChangeToPackage(cwd, "package-2", "fix(package-2): Fix bar", { bar: true });
      await commitChangeToPackage(
        cwd,
        "package-3",
        `feat(package-3): Add baz feature${os.EOL}${os.EOL}BREAKING CHANGE: yup`,
        { baz: true }
      );

      const { stdout } = await cliRunner(cwd, env)(...args);
      expect(stdout).toMatchSnapshot();

      const changelogFilePaths = await globby(["**/CHANGELOG.md"], {
        cwd,
        absolute: true,
        followSymlinkedDirectories: false,
      });
      const changelogContents = await Promise.all(
        changelogFilePaths.sort().map(fp => fs.readFile(fp, "utf8"))
      );

      expect(changelogContents).toMatchSnapshot();
    })
  );

  test("replaces file: specifier with local version before npm publish but after git commit", async () => {
    const { cwd } = await cloneFixture("relative-file-specs");

    await gitTag(cwd, "v1.0.0");
    await commitChangeToPackage(cwd, "package-1", "feat(package-1): changed", { changed: true });

    await cliRunner(cwd, env)("publish", "major", "--yes");

    expect(await showCommit(cwd)).toMatchSnapshot();
  });

  test("calls lifecycle scripts", async () => {
    const { cwd } = await cloneFixture("lifecycle");
    const args = ["publish", "minor", "--yes"];

    const { stdout } = await cliRunner(cwd, env)(...args);
    expect(normalizeTestRoot(cwd)(stdout)).toMatchSnapshot();
  });

  test("silences lifecycle scripts with --loglevel=silent", async () => {
    const { cwd } = await cloneFixture("lifecycle");
    const args = ["publish", "minor", "--yes", "--loglevel", "silent"];

    const { stdout } = await cliRunner(cwd, env)(...args);
    expect(normalizeTestRoot(cwd)(stdout)).toMatchSnapshot();
  });

  test("exits with EBEHIND when behind upstream remote", async () => {
    const { cwd, repository } = await cloneFixture("normal");
    const cloneDir = tempy.directory();

    // simulate upstream change from another clone
    await execa("git", ["clone", repository, cloneDir]);
    await fs.outputFile(path.join(cloneDir, "README.md"), "upstream change");
    await gitAdd(cloneDir, "-A");
    await gitCommit(cloneDir, "upstream change");
    await execa("git", ["push", "origin", "master"], { cwd: cloneDir });

    // throws during interactive publish (local)
    await expect(cliRunner(cwd, env)("publish", "--no-ci")).rejects.toThrowError(/EBEHIND/);

    // warns during non-interactive publish (CI)
    const { stderr } = await cliRunner(cwd, env)("publish", "--ci");
    expect(stderr).toMatch("EBEHIND");
  });
});
