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

const runner = require("../helpers/cliRunner");
const consoleOutput = require("../helpers/consoleOutput");
const initFixture = require("../helpers/initFixture");
const loadPkgManifests = require("../helpers/loadPkgManifests");

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

    const { exitCode } = await runner(cwd)(...args);

    expect(exitCode).toBe(0);
    expect(consoleOutput()).toBe("");
  });

  test("updates fixed versions", async () => {
    const cwd = await initFixture("PublishCommand/normal");
    const args = ["publish", "--skip-npm", "--cd-version=patch", "--yes"];

    await runner(cwd)(...args);
    expect(consoleOutput()).toMatchSnapshot("stdout");

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

    await runner(cwd)(...args);

    expect(await loadPkgManifests(cwd)).toMatchSnapshot();
  });

  test("uses default suffix with canary flag", async () => {
    const cwd = await initFixture("PublishCommand/normal");
    const args = ["publish", "--canary", "--skip-npm", "--yes"];

    await runner(cwd)(...args);
    expect(consoleOutput()).toMatchSnapshot("stdout");
  });

  test("uses meta suffix from canary flag", async () => {
    const cwd = await initFixture("PublishCommand/normal");
    const args = ["publish", "--canary=beta", "--skip-npm", "--yes"];

    await runner(cwd)(...args);
    expect(consoleOutput()).toMatchSnapshot("stdout");
  });

  test("updates independent versions", async () => {
    const cwd = await initFixture("PublishCommand/independent");
    const args = ["publish", "--skip-npm", "--cd-version=major", "--yes"];

    await runner(cwd)(...args);
    expect(consoleOutput()).toMatchSnapshot("stdout");

    const [allPackageJsons, commitMessage] = await Promise.all([
      loadPkgManifests(cwd),
      lastCommitMessage(cwd),
    ]);

    expect(allPackageJsons).toMatchSnapshot("packages");
    expect(commitMessage).toMatchSnapshot("commit");
  });

  test("fixed mode --conventional-commits recommends versions for each publish", async () => {
    const cwd = await initFixture("PublishCommand/normal-no-inter-dependencies", "chore: Init repo");

    // conventional-recommended-bump is incapable of accepting cwd config :P
    process.chdir(cwd);

    const lerna = runner(cwd);
    const args = [
      "publish",
      "--conventional-commits",
      // "--skip-git", Note: git is not skipped to ensure creating tags for each publish execution works
      "--skip-npm",
      "--yes",
    ];

    // publish patch (all)
    await lerna(...args);

    await commitChangeToPackage(cwd, "package-1", "feat: foo", { foo: true });

    // publish minor (package-1)
    await lerna(...args);

    await commitChangeToPackage(cwd, "package-2", "feat: bar", { bar: true });

    // publish minor (package-2)
    await lerna(...args);

    await commitChangeToPackage(cwd, "package-2", `fix: flip${os.EOL}${os.EOL}BREAKING CHANGE: yup`, {
      bar: false,
    });

    // publish major (force all)
    await lerna(...args, "--force-publish");

    expect(consoleOutput()).toMatchSnapshot();
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

      await runner(cwd)(...args);
      expect(consoleOutput()).toMatchSnapshot();

      const changelogFilePaths = await globby(["CHANGELOG.md"], { cwd, absolute: true, matchBase: true });
      const changelogContents = await Promise.all(changelogFilePaths.map(fp => fs.readFile(fp, "utf8")));

      expect(changelogContents).toMatchSnapshot();
    })
  );

  it("replaces file: specifier with local version before npm publish but after git commit", async () => {
    const cwd = await initFixture("PublishCommand/relative-file-specs");

    await execa("git", ["tag", "v1.0.0", "-m", "v1.0.0"], { cwd });
    await commitChangeToPackage(cwd, "package-1", "feat(package-1): Add foo", { foo: true });

    await runner(cwd)("publish", "--cd-version=major", "--skip-npm", "--yes");

    expect(
      await execa.stdout("git", ["show", "--unified=0", "--ignore-space-at-eol", "--format=%s"], { cwd })
    ).toMatchSnapshot("committed");

    expect(
      await execa.stdout("git", ["diff", "--unified=0", "--ignore-space-at-eol"], { cwd })
    ).toMatchSnapshot("unstaged");
  });
});
