import execa from "execa";
import fileUrl from "file-url";
import findUp from "find-up";
import { copy, ensureDir } from "fs-extra";
import { join } from "path";
import { directory } from "tempy";
import { gitAdd, gitCommit, gitInit } from "./git";

export function cloneFixtureFactory(startDir: any) {
  const initFixture = initFixtureFactory(startDir);

  return (...args: any[]) =>
    // TODO: refactor to address type issues
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    initFixture(...args).then((cwd) => {
      const repoDir = directory();
      const repoUrl = fileUrl(repoDir, { resolve: false });

      return execa("git", ["init", "--bare"], { cwd: repoDir })
        .then(() => execa("git", ["checkout", "-B", "main"], { cwd }))
        .then(() => execa("git", ["remote", "add", "origin", repoUrl], { cwd }))
        .then(() => execa("git", ["push", "-u", "origin", "main"], { cwd }))
        .then(() => ({
          cwd,
          repository: repoUrl,
        }));
    });
}

function findFixture(cwd: any, fixtureName: string) {
  return findUp(join("__fixtures__", fixtureName), { cwd, type: "directory" }).then((fixturePath) => {
    if (fixturePath === undefined) {
      throw new Error(`Could not find fixture with name "${fixtureName}"`);
    }

    return fixturePath;
  });
}

export function copyFixture(targetDir: string, fixtureName: string, cwd: any) {
  return findFixture(cwd, fixtureName).then((fp) => copy(fp, targetDir));
}

export function initFixtureFactory(startDir: any) {
  return (fixtureName: string, commitMessage: string | false = "Init commit") => {
    const cwd = directory();
    let chain = Promise.resolve();

    chain = chain.then(() => process.chdir(cwd));
    chain = chain.then(() => copyFixture(cwd, fixtureName, startDir));
    // TODO: refactor to address type issues
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    chain = chain.then(() => gitInit(cwd, "."));

    if (commitMessage) {
      // TODO: refactor to address type issues
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      chain = chain.then(() => gitAdd(cwd, "-A"));
      // TODO: refactor to address type issues
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      chain = chain.then(() => gitCommit(cwd, commitMessage));
    }

    return chain.then(() => cwd);
  };
}

export function initNamedFixtureFactory(startDir: any) {
  // TODO: refactor to address type issues
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return (dirName: string, fixtureName: string, commitMessage = "Init commit") => {
    const cwd = join(directory(), dirName);
    let chain = Promise.resolve();

    chain = chain.then(() => ensureDir(cwd));
    chain = chain.then(() => process.chdir(cwd));
    chain = chain.then(() => copyFixture(cwd, fixtureName, startDir));
    // TODO: refactor to address type issues
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    chain = chain.then(() => gitInit(cwd, "."));

    if (commitMessage) {
      // TODO: refactor to address type issues
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      chain = chain.then(() => gitAdd(cwd, "-A"));
      // TODO: refactor to address type issues
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      chain = chain.then(() => gitCommit(cwd, commitMessage));
    }

    return chain.then(() => cwd);
  };
}
