import execa from "execa";
import fs from "fs-extra";
import globby from "globby";
import normalizeNewline from "normalize-newline";
import writeJsonFile from "write-json-file";
import loadJsonFile from "load-json-file";
import path from "path";

import { LERNA_BIN } from "../helpers/constants";
import initFixture from "../helpers/initFixture";
import loadPkgManifests from "../helpers/loadPkgManifests";

const lastCommitMessage = (cwd) =>
  execa.stdout("git", ["log", "-1", "--format=%B"], { cwd }).then(normalizeNewline);

async function performAndVerifyLernaPublish(cwd, args, stdoutSnapshot, stderrSnapshot) {
  const {stdout, stderr} = await execa(LERNA_BIN, args, {cwd});
  expect(stdout).toMatchSnapshot(stdoutSnapshot);
  expect(stderr).toMatchSnapshot(stderrSnapshot);
}

async function verifyPkgsAndCommitMsg(cwd, pkgSnapshot, commitMsgSnapshot) {
  const [allPackageJsons, commitMessage] = await Promise.all([
    loadPkgManifests(cwd),
    lastCommitMessage(cwd),
  ]);

  expect(allPackageJsons).toMatchSnapshot(pkgSnapshot);
  expect(commitMessage).toMatchSnapshot(commitMsgSnapshot);
}

async function commitChangeToPackage(cwd, packageName, commitMsg, data) {
  const packageJSONPath = path.join(cwd, 'packages', packageName, 'package.json');
  const pkg = await loadJsonFile(packageJSONPath);
  await writeJsonFile(packageJSONPath, Object.assign(pkg, data));
  await execa("git", ["add", "."], {cwd});
  return await execa("git", ["commit", "-m", commitMsg], {cwd});
}

describe("lerna publish", () => {
  test.concurrent("exit 0 when no updates", async () => {
    const cwd = await initFixture("PublishCommand/normal");
    await execa("git", ["tag", "-a", "v1.0.0", "-m", "v1.0.0"], { cwd });

    const args = [
      "publish",
    ];

    const { stdout, stderr, code } = await execa(LERNA_BIN, args, { cwd });

    expect(code).toBe(0);
    expect(stdout).toMatchSnapshot("stdout: exit 0 when no updates");
    expect(stderr).toMatchSnapshot("stderr: exit 0 when no updates");
  });

  test.concurrent("updates fixed versions", async () => {
    const cwd = await initFixture("PublishCommand/normal");
    const args = [
      "publish",
      "--skip-npm",
      "--cd-version=patch",
      "--yes",
    ];

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

  test.concurrent("updates independent versions", async () => {
    const cwd = await initFixture("PublishCommand/independent");
    const args = [
      "publish",
      "--skip-npm",
      "--cd-version=major",
      "--yes",
    ];

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

    await performAndVerifyLernaPublish(
      cwd, args,
      "stdout: initial commit in fixed mode --conventional-commits",
      "stderr: initial commit in fixed mode --conventional-commits");

    await verifyPkgsAndCommitMsg(cwd,
      "packages: initial commit in fixed mode --conventional-commits",
      "commit: initial commit in fixed mode --conventional-commits"
    );

    await commitChangeToPackage(cwd, 'package-1', "feat: Add foo feature", {foo: true});

    await performAndVerifyLernaPublish(
      cwd, args,
      "stdout: first feature added in fixed mode --conventional-commits",
      "stderr: first feature added in fixed mode --conventional-commits");

    await verifyPkgsAndCommitMsg(cwd,
      "packages: first feature added in fixed mode --conventional-commits",
      "commit: first feature added in fixed mode --conventional-commits"
    );

    await commitChangeToPackage(cwd, 'package-2', "feat: Add bar feature", {bar: true});

    await performAndVerifyLernaPublish(
      cwd, args,
      "stdout: second feature added in fixed mode --conventional-commits",
      "stderr: second feature added in fixed mode --conventional-commits");

    await verifyPkgsAndCommitMsg(cwd,
      "packages: second feature added in fixed mode --conventional-commits",
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

    await performAndVerifyLernaPublish(
      cwd, args,
      "stdout: initial commit in fixed mode --conventional-commits --force-publish=*",
      "stderr: initial commit in fixed mode --conventional-commits --force-publish=*");

    await verifyPkgsAndCommitMsg(cwd,
      "packages: initial commit in fixed mode --conventional-commits --force-publish=*",
      "commit: initial commit in fixed mode --conventional-commits --force-publish=*"
    );

    await commitChangeToPackage(cwd, 'package-1', "feat: Add foo feature", {foo: true});

    await performAndVerifyLernaPublish(
      cwd, args,
      "stdout: first feature added in fixed mode --conventional-commits --force-publish=*",
      "stderr: first feature added in fixed mode --conventional-commits --force-publish=*");

    await verifyPkgsAndCommitMsg(cwd,
      "packages: first feature added in fixed mode --conventional-commits --force-publish=*",
      "commit: first feature added in fixed mode --conventional-commits --force-publish=*"
    );

    await commitChangeToPackage(cwd, 'package-2', "feat: Add bar feature", {bar: true});

    await performAndVerifyLernaPublish(
      cwd, args,
      "stdout: second feature added in fixed mode --conventional-commits --force-publish=*",
      "stderr: second feature added in fixed mode --conventional-commits --force-publish=*");

    await verifyPkgsAndCommitMsg(cwd,
      "packages: second feature added in fixed mode --conventional-commits --force-publish=*",
      "commit: second feature added in fixed mode --conventional-commits --force-publish=*"
    );

  });

  // TODO: stabilize timestamp of changelog output
  // TODO: make interesting git history for meaningful snapshots
  test.skip("--conventional-commits", async () => {
    const cwd = await initFixture("PublishCommand/independent");
    const args = [
      "publish",
      "--conventional-commits",
      "--skip-git",
      "--skip-npm",
      "--yes",
    ];

    const { stdout, stderr } = await execa(LERNA_BIN, args, { cwd });
    expect(stdout).toMatchSnapshot("stdout: --conventional-commits");
    expect(stderr).toMatchSnapshot("stderr: --conventional-commits");

    const [allPackageJsons, changelogFiles] = await Promise.all([
      loadPkgManifests(cwd),
      globby(["CHANGELOG.md"], { cwd, absolute: true, matchBase: true })
        .then((changelogs) => Promise.all(
          changelogs.map((fp) => fs.readFile(fp, "utf8"))
        )),
    ]);

    expect(allPackageJsons).toMatchSnapshot("packages: --conventional-commits");
    expect(changelogFiles).toMatchSnapshot("changelog: --conventional-commits");
  });
});
