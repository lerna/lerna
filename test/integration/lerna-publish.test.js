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
  return execa("git", ["commit", "--no-gpg-sign", "-m", commitMsg], { cwd });
}

describe("lerna publish", () => {
  test("exit 0 when no updates", async () => {
    const cwd = await initFixture("PublishCommand/normal");
    await execa("git", ["tag", "-a", "v1.0.0", "-m", "v1.0.0"], { cwd });

    const args = ["publish"];

    const { stdout, stderr, code } = await execa(LERNA_BIN, args, { cwd });

    expect(code).toBe(0);
    expect(stdout).toBe("");
    expect(stderr).toMatchSnapshot("stderr");
  });

  test("updates fixed versions", async () => {
    const cwd = await initFixture("PublishCommand/normal");
    const args = ["publish", "--skip-npm", "--cd-version=patch", "--yes"];

    const { stdout, stderr } = await execa(LERNA_BIN, args, { cwd });
    expect(stdout).toMatchSnapshot("stdout");
    expect(stderr).toMatchSnapshot("stderr");

    const [allPackageJsons, commitMessage] = await Promise.all([
      loadPkgManifests(cwd),
      lastCommitMessage(cwd),
    ]);

    expect(allPackageJsons).toMatchSnapshot("packages");
    expect(commitMessage).toMatchSnapshot("commit");
  });

  test("uses detault suffix with canary flag", async () => {
    const cwd = await initFixture("PublishCommand/normal");
    const args = ["publish", "--canary", "--skip-npm", "--yes"];

    const { stdout, stderr } = await execa(LERNA_BIN, args, { cwd });
    const hash = await lastCommitId(cwd);
    expect(stdout.replace(new RegExp(hash, "g"), "hash")).toMatchSnapshot("stdout");
    expect(stderr).toMatchSnapshot("stderr");
  });

  test("uses meta suffix from canary flag", async () => {
    const cwd = await initFixture("PublishCommand/normal");
    const args = ["publish", "--canary=beta", "--skip-npm", "--yes"];

    const { stdout, stderr } = await execa(LERNA_BIN, args, { cwd });
    const hash = await lastCommitId(cwd);
    expect(stdout.replace(new RegExp(hash, "g"), "hash")).toMatchSnapshot("stdout");
    expect(stderr).toMatchSnapshot("stderr");
  });

  test("updates independent versions", async () => {
    const cwd = await initFixture("PublishCommand/independent");
    const args = ["publish", "--skip-npm", "--cd-version=major", "--yes"];

    const { stdout, stderr } = await execa(LERNA_BIN, args, { cwd });
    expect(stdout).toMatchSnapshot("stdout");
    expect(stderr).toMatchSnapshot("stderr");

    const [allPackageJsons, commitMessage] = await Promise.all([
      loadPkgManifests(cwd),
      lastCommitMessage(cwd),
    ]);

    expect(allPackageJsons).toMatchSnapshot("packages");
    expect(commitMessage).toMatchSnapshot("commit");
  });

  test("fixed mode --conventional-commits recommends versions for each publish", async () => {
    const cwd = await initFixture("PublishCommand/normal-no-inter-dependencies", "chore: Init repo");
    const runPublish = () =>
      execa.stdout(
        LERNA_BIN,
        [
          "publish",
          "--conventional-commits",
          // "--skip-git", Note: git is not skipped to ensure creating tags for each publish execution works
          "--skip-npm",
          "--yes",
        ],
        { cwd },
      );

    // initial publish
    expect(await runPublish()).toMatchSnapshot(); // 1

    const [initialAllPackageJsons, initialCommitMessage] = await pkgManifestsAndCommitMsg(cwd);

    expect(initialAllPackageJsons).toMatchSnapshot("packages");
    expect(initialCommitMessage).toMatchSnapshot("commit");

    await commitChangeToPackage(cwd, "package-1", "feat: Add foobar feature", { foobar: true });

    // second publish adding the first feature
    expect(await runPublish()).toMatchSnapshot(); // 2

    const [firstFeatPackageJsons, firstFeatCommitMessage] = await pkgManifestsAndCommitMsg(cwd);

    expect(firstFeatPackageJsons).toMatchSnapshot("packages");
    expect(firstFeatCommitMessage).toMatchSnapshot("commit");

    await commitChangeToPackage(cwd, "package-2", "feat: Add baz feature", { baz: true });

    // third publish adding a second feature
    expect(await runPublish()).toMatchSnapshot(); // 3

    const [secondFeatPackageJsons, secondFeatCommitMessage] = await pkgManifestsAndCommitMsg(cwd);

    expect(secondFeatPackageJsons).toMatchSnapshot("packages");
    expect(secondFeatCommitMessage).toMatchSnapshot("commit");
  });

  test("fixed mode --conventional-commits --force-publish=*", async () => {
    const cwd = await initFixture("PublishCommand/normal-no-inter-dependencies", "chore: Init repo");
    const runPublish = () =>
      execa.stdout(
        LERNA_BIN,
        [
          "publish",
          "--force-publish=*",
          "--conventional-commits",
          // "--skip-git", Note: git is not skipped to ensure creating tags for each publish execution works
          "--skip-npm",
          "--yes",
        ],
        { cwd },
      );

    // initial publish
    expect(await runPublish()).toMatchSnapshot(); // 1

    const [initialAllPackageJsons, initialCommitMessage] = await pkgManifestsAndCommitMsg(cwd);

    expect(initialAllPackageJsons).toMatchSnapshot("packages");
    expect(initialCommitMessage).toMatchSnapshot("commit");

    await commitChangeToPackage(cwd, "package-1", "feat: Add foo feature", { foo: true });

    // second publish adding the first feature
    expect(await runPublish()).toMatchSnapshot(); // 2

    const [firstFeatPackageJsons, firstFeatCommitMessage] = await pkgManifestsAndCommitMsg(cwd);

    expect(firstFeatPackageJsons).toMatchSnapshot("packages");
    expect(firstFeatCommitMessage).toMatchSnapshot("commit");

    await commitChangeToPackage(cwd, "package-2", "feat: Add bar feature", { bar: true });

    // third publish adding a second feature
    expect(await runPublish()).toMatchSnapshot(); // 3

    const [secondFeatPackageJsons, secondFeatCommitMessage] = await pkgManifestsAndCommitMsg(cwd);

    expect(secondFeatPackageJsons).toMatchSnapshot("packages");
    expect(secondFeatCommitMessage).toMatchSnapshot("commit");
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
    expect(stdout).toMatchSnapshot("stdout");
    expect(stderr).toMatchSnapshot("stderr");

    const [allPackageJsons, changelogFiles] = await Promise.all([
      loadPkgManifests(cwd),
      globby(["CHANGELOG.md"], { cwd, absolute: true, matchBase: true }).then(changelogs =>
        Promise.all(changelogs.map(async fp => [fp, await fs.readFile(fp, "utf8")])),
      ),
    ]);

    expect(allPackageJsons).toMatchSnapshot("packages");
    expect(changelogFiles).toMatchSnapshot("changelog");
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
    expect(stdout).toMatchSnapshot("stdout");
    expect(stderr).toMatchSnapshot("stderr");

    const [allPackageJsons, changelogFiles] = await Promise.all([
      loadPkgManifests(cwd),
      globby(["CHANGELOG.md"], { cwd, absolute: true, matchBase: true }).then(changelogs =>
        Promise.all(changelogs.map(async fp => [fp, await fs.readFile(fp, "utf8")])),
      ),
    ]);

    expect(allPackageJsons).toMatchSnapshot("packages");
    expect(changelogFiles).toMatchSnapshot("changelog");
  });
  */
});
