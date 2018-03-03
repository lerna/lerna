"use strict";

const execa = require("execa");
const fs = require("fs-extra");
const globby = require("globby");
const normalizeNewline = require("normalize-newline");
const writeJsonFile = require("write-json-file");
const loadJsonFile = require("load-json-file");
const tempWrite = require("temp-write");
const path = require("path");
const os = require("os");

const cliRunner = require("../helpers/cli-runner");
const initFixture = require("../helpers/initFixture");
const loadPkgManifests = require("../helpers/loadPkgManifests");
const normalizeTestRoot = require("../helpers/normalize-test-root");

// stabilize changelog commit SHA and datestamp
expect.addSnapshotSerializer({
  print(val) {
    return normalizeNewline(val)
      .replace(/\b[a-f0-9]{7,8}\b/g, "SHA")
      .replace(/\(\d{4}-\d{2}-\d{2}\)/g, "(YYYY-MM-DD)");
  },
  test(val) {
    return val && typeof val === "string";
  },
});

const lastCommitMessage = cwd =>
  execa.stdout("git", ["log", "-1", "--format=%B"], { cwd }).then(normalizeNewline);

async function commitChangeToPackage(cwd, packageName, commitMsg, data) {
  const packageJSONPath = path.join(cwd, "packages", packageName, "package.json");
  const pkg = await loadJsonFile(packageJSONPath);

  await writeJsonFile(packageJSONPath, Object.assign(pkg, data));
  await execa("git", ["add", "."], { cwd });

  let gitCommit;

  if (commitMsg.indexOf(os.EOL) > -1) {
    // Use tempfile to allow multi\nline strings.
    const tmpFilePath = await tempWrite(commitMsg);

    gitCommit = execa("git", ["commit", "-F", tmpFilePath], { cwd });
  } else {
    gitCommit = execa("git", ["commit", "-m", commitMsg], { cwd });
  }

  return gitCommit;
}

describe("lerna publish", () => {
  const currentDirectory = process.cwd();

  afterEach(() => {
    // conventional-recommended-bump is incapable of accepting cwd config :P
    if (process.cwd() !== currentDirectory) {
      process.chdir(currentDirectory);
    }
  });

  test("exit 0 when no updates", async () => {
    const cwd = await initFixture("PublishCommand/normal");
    const args = ["publish"];

    await execa("git", ["tag", "-a", "v1.0.0", "-m", "v1.0.0"], { cwd });

    const { code, stdout } = await cliRunner(cwd)(...args);

    expect(code).toBe(0);
    expect(stdout).toBe("");
  });

  test("updates fixed versions", async () => {
    const cwd = await initFixture("PublishCommand/normal");
    const args = ["publish", "--skip-npm", "--cd-version=patch", "--yes"];

    const { stdout } = await cliRunner(cwd)(...args);
    expect(stdout).toMatchSnapshot("stdout");

    const [allPackageJsons, commitMessage] = await Promise.all([
      loadPkgManifests(cwd),
      lastCommitMessage(cwd),
    ]);

    expect(allPackageJsons).toMatchSnapshot("packages");
    expect(commitMessage).toMatchSnapshot("commit");
  });

  test("updates all transitive dependents", async () => {
    const cwd = await initFixture("PublishCommand/snake-graph");
    const args = ["publish", "--skip-npm", "--cd-version=major", "--yes"];

    await execa("git", ["tag", "v1.0.0", "-m", "v1.0.0"], { cwd });
    await commitChangeToPackage(cwd, "package-1", "change", { change: true });

    await cliRunner(cwd)(...args);

    expect(await loadPkgManifests(cwd)).toMatchSnapshot();
  });

  test("uses default suffix with canary flag", async () => {
    const cwd = await initFixture("PublishCommand/normal");
    const args = ["publish", "--canary", "--skip-npm", "--yes"];

    const { stdout } = await cliRunner(cwd)(...args);
    expect(stdout).toMatchSnapshot("stdout");
  });

  test("updates independent versions", async () => {
    const cwd = await initFixture("PublishCommand/independent");
    const args = ["publish", "--skip-npm", "--cd-version=major", "--yes"];

    const { stdout } = await cliRunner(cwd)(...args);
    expect(stdout).toMatchSnapshot("stdout");

    const [allPackageJsons, commitMessage] = await Promise.all([
      loadPkgManifests(cwd),
      lastCommitMessage(cwd),
    ]);

    expect(allPackageJsons).toMatchSnapshot("packages");
    expect(commitMessage).toMatchSnapshot("commit");
  });

  ["normal", "independent"].forEach(flavor =>
    test(`${flavor} mode --conventional-commits changelog`, async () => {
      const cwd = await initFixture(`PublishCommand/${flavor}`, "feat: init repo");
      const args = ["publish", "--conventional-commits", "--skip-git", "--skip-npm", "--yes"];

      await commitChangeToPackage(cwd, "package-1", "feat(package-1): Add foo", { foo: true });
      await commitChangeToPackage(cwd, "package-1", "fix(package-1): Fix foo", { foo: false });
      await commitChangeToPackage(cwd, "package-2", "fix(package-2): Fix bar", { bar: true });
      await commitChangeToPackage(
        cwd,
        "package-3",
        `feat(package-3): Add baz feature${os.EOL}${os.EOL}BREAKING CHANGE: yup`,
        { baz: true }
      );

      // conventional-recommended-bump is incapable of accepting cwd config :P
      process.chdir(cwd);

      const { stdout } = await cliRunner(cwd)(...args);
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

  it("replaces file: specifier with local version before npm publish but after git commit", async () => {
    const cwd = await initFixture("PublishCommand/relative-file-specs");

    await execa("git", ["tag", "v1.0.0", "-m", "v1.0.0"], { cwd });
    await commitChangeToPackage(cwd, "package-1", "feat(package-1): Add foo", { foo: true });

    await cliRunner(cwd)("publish", "--cd-version=major", "--skip-npm", "--yes");

    expect(
      await execa.stdout("git", ["show", "--unified=0", "--ignore-space-at-eol", "--format=%s"], { cwd })
    ).toMatchSnapshot("committed");

    expect(
      await execa.stdout("git", ["diff", "--unified=0", "--ignore-space-at-eol"], { cwd })
    ).toMatchSnapshot("unstaged");
  });

  test("calls lifecycle scripts", async () => {
    const cwd = await initFixture("PublishCommand/lifecycle");
    const args = ["publish", "--skip-npm", "--cd-version", "minor", "--yes"];

    const { stdout } = await cliRunner(cwd)(...args);
    expect(normalizeTestRoot(cwd)(stdout)).toMatchSnapshot();
  });

  test("silences lifecycle scripts with --loglevel=silent", async () => {
    const cwd = await initFixture("PublishCommand/lifecycle");
    const args = ["publish", "--skip-npm", "--cd-version", "minor", "--yes", "--loglevel", "silent"];

    const { stdout } = await cliRunner(cwd)(...args);
    expect(normalizeTestRoot(cwd)(stdout)).toMatchSnapshot();
  });
});
