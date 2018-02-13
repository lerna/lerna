import execa from "execa";
// import fs from "fs-extra";
// import globby from "globby";
import normalizeNewline from "normalize-newline";
import writeJsonFile from "write-json-file";
import loadJsonFile from "load-json-file";
import path from "path";

import { LERNA_BIN } from "../helpers/constants";
import initFixture from "../helpers/initFixture";
import loadPkgManifests from "../helpers/loadPkgManifests";

const lastCommitMessage = cwd =>
  execa.stdout("git", ["log", "-1", "--format=%B"], { cwd }).then(normalizeNewline);

const lastCommitId = cwd =>
  execa.stdout("git", ["rev-parse", "HEAD"], { cwd }).then(line => line.substring(0, 8));

async function pkgManifestsAndCommitMsg(cwd) {
  return Promise.all([loadPkgManifests(cwd), lastCommitMessage(cwd)]);
}

async function commitChangeToPackage(cwd, packageName, commitMsg, data) {
  const packageJSONPath = path.join(cwd, "packages", packageName, "package.json");
  const pkg = await loadJsonFile(packageJSONPath);
  await writeJsonFile(packageJSONPath, Object.assign(pkg, data));
  await execa("git", ["add", "."], { cwd });
  return execa("git", ["commit", "-m", commitMsg], { cwd });
}

describe("lerna publish", () => {
  test.concurrent("exit 0 when no updates", async () => {
    const cwd = await initFixture("PublishCommand/normal");
    await execa("git", ["tag", "-a", "v1.0.0", "-m", "v1.0.0"], { cwd });

    const args = ["publish"];

    const { stdout, stderr, code } = await execa(LERNA_BIN, args, { cwd });

    expect(code).toBe(0);
    expect(stdout).toMatchSnapshot("stdout: exit 0 when no updates");
    expect(stderr).toMatchSnapshot("stderr: exit 0 when no updates");
  });

  test.concurrent("updates fixed versions", async () => {
    const cwd = await initFixture("PublishCommand/normal");
    const args = ["publish", "--skip-npm", "--cd-version=patch", "--yes"];

    const { stdout, stderr } = await execa(LERNA_BIN, args, { cwd });
    expect(stdout).toMatchSnapshot("stdout: updates fixed versions");
    expect(stderr).toMatchSnapshot("stderr: updates fixed versions");

    const [allPackageJsons, commitMessage] = await Promise.all([
      loadPkgManifests(cwd),
      lastCommitMessage(cwd),
    ]);

    expect(allPackageJsons).toMatchSnapshot("packages: updates fixed versions");
    expect(commitMessage).toMatchSnapshot("commit: updates fixed versions");
  });

  test("updates all transitive dependents", async () => {
    const cwd = await initFixture("PublishCommand/snake-graph-2.x");
    const args = ["publish", "--skip-npm", "--cd-version=major", "--yes"];

    await execa("git", ["tag", "v1.0.0", "-m", "v1.0.0"], { cwd });
    await commitChangeToPackage(cwd, "package-1", "feat(package-1): Add foo", { foo: true });

    const stdout = await execa.stdout(LERNA_BIN, args, { cwd });
    expect(stdout).toMatchSnapshot("stdout: updates all transitive dependents");

    expect(await loadPkgManifests(cwd)).toMatchSnapshot("packages: updates all transitive dependents");
  });

  test.concurrent("uses detault suffix with canary flag", async () => {
    const cwd = await initFixture("PublishCommand/normal");
    const args = ["publish", "--canary", "--skip-npm", "--yes"];

    const { stdout, stderr } = await execa(LERNA_BIN, args, { cwd });
    const hash = await lastCommitId(cwd);
    expect(stdout.replace(new RegExp(hash, "g"), "hash")).toMatchSnapshot("stdout: canary default version");
    expect(stderr).toMatchSnapshot("stderr: canary default version");
  });

  test.concurrent("uses meta suffix from canary flag", async () => {
    const cwd = await initFixture("PublishCommand/normal");
    const args = ["publish", "--canary=beta", "--skip-npm", "--yes"];

    const { stdout, stderr } = await execa(LERNA_BIN, args, { cwd });
    const hash = await lastCommitId(cwd);
    expect(stdout.replace(new RegExp(hash, "g"), "hash")).toMatchSnapshot("stdout: canary beta version");
    expect(stderr).toMatchSnapshot("stderr: canary beta version");
  });

  test.concurrent("updates independent versions", async () => {
    const cwd = await initFixture("PublishCommand/independent");
    const args = ["publish", "--skip-npm", "--cd-version=major", "--yes"];

    const { stdout, stderr } = await execa(LERNA_BIN, args, { cwd });
    expect(stdout).toMatchSnapshot("stdout: updates independent versions");
    expect(stderr).toMatchSnapshot("stderr: updates independent versions");

    const [allPackageJsons, commitMessage] = await Promise.all([
      loadPkgManifests(cwd),
      lastCommitMessage(cwd),
    ]);

    expect(allPackageJsons).toMatchSnapshot("packages: updates independent versions");
    expect(commitMessage).toMatchSnapshot("commit: updates independent versions");
  });

  test.concurrent("fixed mode --conventional-commits recommends versions for each publish", async () => {
    const cwd = await initFixture("PublishCommand/normal-no-inter-dependencies", "chore: Init repo");
    const args = [
      "publish",
      "--conventional-commits",
      // "--skip-git", Note: git is not skipped to ensure creating tags for each publish execution works
      "--skip-npm",
      "--yes",
    ];

    // initial publish
    const { stdout: initialStdout } = await execa(LERNA_BIN, args, { cwd });

    expect(initialStdout).toMatchSnapshot("stdout: initial commit in fixed mode --conventional-commits");

    const [initialAllPackageJsons, initialCommitMessage] = await pkgManifestsAndCommitMsg(cwd);

    expect(initialAllPackageJsons).toMatchSnapshot(
      "packages: initial commit in fixed mode --conventional-commits"
    );

    expect(initialCommitMessage).toMatchSnapshot(
      "commit: initial commit in fixed mode --conventional-commits"
    );

    await commitChangeToPackage(cwd, "package-1", "feat: Add foobar feature", { foobar: true });

    // second publish adding the first feature
    const { stdout: firstFeatureStdout } = await execa(LERNA_BIN, args, { cwd });

    expect(firstFeatureStdout).toMatchSnapshot(
      "stdout: first feature added in fixed mode --conventional-commits"
    );

    const [firstFeatPackageJsons, firstFeatCommitMessage] = await pkgManifestsAndCommitMsg(cwd);

    expect(firstFeatPackageJsons).toMatchSnapshot(
      "packages: first feature added in fixed mode --conventional-commits"
    );

    expect(firstFeatCommitMessage).toMatchSnapshot(
      "commit: first feature added in fixed mode --conventional-commits"
    );

    await commitChangeToPackage(cwd, "package-2", "feat: Add baz feature", { baz: true });

    // third publish adding a second feature
    const { stdout: secondFeatureStdout } = await execa(LERNA_BIN, args, { cwd });

    expect(secondFeatureStdout).toMatchSnapshot(
      "stdout: second feature added in fixed mode --conventional-commits"
    );

    const [secondFeatPackageJsons, secondFeatCommitMessage] = await pkgManifestsAndCommitMsg(cwd);

    expect(secondFeatPackageJsons).toMatchSnapshot(
      "packages: second feature added in fixed mode --conventional-commits"
    );

    expect(secondFeatCommitMessage).toMatchSnapshot(
      "commit: second feature added in fixed mode --conventional-commits"
    );
  });

  test.concurrent("fixed mode --conventional-commits --force-publish=*", async () => {
    const cwd = await initFixture("PublishCommand/normal-no-inter-dependencies", "chore: Init repo");
    const args = [
      "publish",
      "--force-publish=*",
      "--conventional-commits",
      // "--skip-git", Note: git is not skipped to ensure creating tags for each publish execution works
      "--skip-npm",
      "--yes",
    ];

    // initial publish
    const { stdout: initialStdout } = await execa(LERNA_BIN, args, { cwd });

    expect(initialStdout).toMatchSnapshot(
      "stdout: initial commit in fixed mode --conventional-commits --force-publish=*"
    );

    const [initialAllPackageJsons, initialCommitMessage] = await pkgManifestsAndCommitMsg(cwd);

    expect(initialAllPackageJsons).toMatchSnapshot(
      "packages: initial commit in fixed mode --conventional-commits --force-publish=*"
    );

    expect(initialCommitMessage).toMatchSnapshot(
      "commit: initial commit in fixed mode --conventional-commits --force-publish=*"
    );

    await commitChangeToPackage(cwd, "package-1", "feat: Add foo feature", { foo: true });

    // second publish adding the first feature
    const { stdout: firstFeatureStdout } = await execa(LERNA_BIN, args, { cwd });

    expect(firstFeatureStdout).toMatchSnapshot(
      "stdout: first feature added in fixed mode --conventional-commits --force-publish=*"
    );

    const [firstFeatPackageJsons, firstFeatCommitMessage] = await pkgManifestsAndCommitMsg(cwd);

    expect(firstFeatPackageJsons).toMatchSnapshot(
      "packages: first feature added in fixed mode --conventional-commits --force-publish=*"
    );

    expect(firstFeatCommitMessage).toMatchSnapshot(
      "commit: first feature added in fixed mode --conventional-commits --force-publish=*"
    );

    await commitChangeToPackage(cwd, "package-2", "feat: Add bar feature", { bar: true });

    // third publish adding a second feature
    const { stdout: secondFeatureStdout } = await execa(LERNA_BIN, args, { cwd });

    expect(secondFeatureStdout).toMatchSnapshot(
      "stdout: second feature added in fixed mode --conventional-commits --force-publish=*"
    );

    const [secondFeatPackageJsons, secondFeatCommitMessage] = await pkgManifestsAndCommitMsg(cwd);

    expect(secondFeatPackageJsons).toMatchSnapshot(
      "packages: second feature added in fixed mode --conventional-commits --force-publish=*"
    );

    expect(secondFeatCommitMessage).toMatchSnapshot(
      "commit: second feature added in fixed mode --conventional-commits --force-publish=*"
    );
  });

  /* TODO: stabilize timestamp and commit sha of changelog output
  test("fixed mode --conventional-commits changelog", async () => {
    const cwd = await initFixture("PublishCommand/normal", "feat: init repo");
    const args = ["publish", "--conventional-commits", "--skip-git", "--skip-npm", "--yes"];

    await commitChangeToPackage(cwd, "package-1", "feat(package-1): Add foo feature", { foo: true });
    await commitChangeToPackage(cwd, "package-1", "fix(package-1): Fix foo feature", { foo: false });
    await commitChangeToPackage(cwd, "package-2", "fix(package-2): Fix bar feature", { bar: true });
    await commitChangeToPackage(
      cwd,
      "package-3",
      "feat(package-3): Add baz feature\n\nBREAKING CHANGE: ... more information...",
      { baz: true },
    );

    const { stdout, stderr } = await execa(LERNA_BIN, args, { cwd });
    expect(stdout).toMatchSnapshot("stdout: --conventional-commits fixed mode");
    expect(stderr).toMatchSnapshot("stderr: --conventional-commits fixed mode");

    const [allPackageJsons, changelogFiles] = await Promise.all([
      loadPkgManifests(cwd),
      globby(["CHANGELOG.md"], { cwd, absolute: true, matchBase: true }).then(changelogs =>
        Promise.all(changelogs.map(async fp => [fp, await fs.readFile(fp, "utf8")])),
      ),
    ]);

    expect(allPackageJsons).toMatchSnapshot("packages: --conventional-commits fixed mode");
    expect(changelogFiles).toMatchSnapshot("changelog: --conventional-commits fixed mode");
  });
  */

  /* TODO: stabilize timestamp of and commit sha changelog output
  test("independent mode --conventional-commits changelog", async () => {
    const cwd = await initFixture("PublishCommand/independent", "feat: init repo");
    const args = ["publish", "--conventional-commits", "--skip-git", "--skip-npm", "--yes"];

    await commitChangeToPackage(cwd, "package-1", "feat(package-1): Add foo feature", { foo: true });
    await commitChangeToPackage(cwd, "package-1", "fix(package-1): Fix foo feature", { foo: false });
    await commitChangeToPackage(cwd, "package-2", "fix(package-2): Fix bar feature", { bar: true });
    await commitChangeToPackage(
      cwd,
      "package-3",
      "feat(package-3): Add baz feature\n\nBREAKING CHANGE: ... more information...",
      { baz: true },
    );

    const { stdout, stderr } = await execa(LERNA_BIN, args, { cwd });
    expect(stdout).toMatchSnapshot("stdout: --conventional-commits independent mode");
    expect(stderr).toMatchSnapshot("stderr: --conventional-commits independent mode");

    const [allPackageJsons, changelogFiles] = await Promise.all([
      loadPkgManifests(cwd),
      globby(["CHANGELOG.md"], { cwd, absolute: true, matchBase: true }).then(changelogs =>
        Promise.all(changelogs.map(async fp => [fp, await fs.readFile(fp, "utf8")])),
      ),
    ]);

    expect(allPackageJsons).toMatchSnapshot("packages: --conventional-commits independent mode");
    expect(changelogFiles).toMatchSnapshot("changelog: --conventional-commits independent mode");
  });
  */
});
