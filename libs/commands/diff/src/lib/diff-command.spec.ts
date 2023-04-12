import { getPackages } from "@lerna/core";
import {
  commandRunner,
  gitAdd,
  gitCommit,
  gitInit,
  gitSHASerializer,
  gitTag,
  initFixtureFactory,
} from "@lerna/test-helpers";
import execa from "execa";
import fs from "fs-extra";
import path from "path";

// mocked modules
// eslint-disable-next-line @typescript-eslint/no-var-requires
const childProcess = require("@lerna/child-process");

const initFixture = initFixtureFactory(__dirname);

// file under test
// eslint-disable-next-line @typescript-eslint/no-var-requires
const lernaDiff = commandRunner(require("../command"));

// stabilize commit SHA
expect.addSnapshotSerializer(gitSHASerializer);

describe("DiffCommand", () => {
  // overwrite spawn so we get piped stdout, not inherited
  // TODO: refactor based on TS feedback
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  childProcess.spawn = jest.fn((...args) => execa(...args));

  it("should diff packages from the first commit", async () => {
    const cwd = await initFixture("basic");
    const [pkg1] = await getPackages(cwd);
    const rootReadme = path.join(cwd, "README.md");

    // TODO: refactor based on TS feedback
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    await pkg1.set("changed", 1).serialize();
    await fs.outputFile(rootReadme, "change outside packages glob");
    await gitAdd(cwd, "-A");
    await gitCommit(cwd, "changed");

    // TODO: refactor based on TS feedback
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const { stdout } = await lernaDiff(cwd)();
    expect(stdout).toMatchSnapshot();
  });

  it("should diff packages from the most recent tag", async () => {
    const cwd = await initFixture("basic");
    const [pkg1] = await getPackages(cwd);

    // TODO: refactor based on TS feedback
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    await pkg1.set("changed", 1).serialize();
    await gitAdd(cwd, "-A");
    await gitCommit(cwd, "changed");
    await gitTag(cwd, "v1.0.1");

    // TODO: refactor based on TS feedback
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    await pkg1.set("sinceLastTag", true).serialize();
    await gitAdd(cwd, "-A");
    await gitCommit(cwd, "changed");

    // TODO: refactor based on TS feedback
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const { stdout } = await lernaDiff(cwd)();
    expect(stdout).toMatchSnapshot();
  });

  it("should diff a specific package", async () => {
    const cwd = await initFixture("basic");
    const [pkg1, pkg2] = await getPackages(cwd);

    // TODO: refactor based on TS feedback
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    await pkg1.set("changed", 1).serialize();
    // TODO: refactor based on TS feedback
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    await pkg2.set("changed", 1).serialize();
    await gitAdd(cwd, "-A");
    await gitCommit(cwd, "changed");

    // TODO: refactor based on TS feedback
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const { stdout } = await lernaDiff(cwd)("package-2");
    expect(stdout).toMatchSnapshot();
  });

  it("passes diff exclude globs configured with --ignored-changes", async () => {
    const cwd = await initFixture("basic");
    const [pkg1] = await getPackages(cwd);

    // TODO: refactor based on TS feedback
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    await pkg1.set("changed", 1).serialize();
    await fs.outputFile(path.join(pkg1.location, "README.md"), "ignored change");
    await gitAdd(cwd, "-A");
    await gitCommit(cwd, "changed");

    // TODO: refactor based on TS feedback
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const { stdout } = await lernaDiff(cwd)("--ignore-changes", "**/README.md");
    expect(stdout).toMatchSnapshot();
  });

  it("should error when attempting to diff a package that doesn't exist", async () => {
    const cwd = await initFixture("basic");
    const command = lernaDiff(cwd)("missing");

    await expect(command).rejects.toThrow("Cannot diff, the package 'missing' does not exist.");
  });

  it("should error when running in a repository without commits", async () => {
    const cwd = await initFixture("basic");

    await fs.remove(path.join(cwd, ".git"));
    await gitInit(cwd);

    const command = lernaDiff(cwd)("package-1");
    await expect(command).rejects.toThrow("Cannot diff, there are no commits in this repository yet.");
  });

  it("should error when git diff exits non-zero", async () => {
    const cwd = await initFixture("basic");

    childProcess.spawn.mockImplementationOnce(() => {
      const nonZero = new Error("An actual non-zero, not git diff pager SIGPIPE") as any;
      nonZero.exitCode = 1;

      throw nonZero;
    });

    const command = lernaDiff(cwd)("package-1");
    await expect(command).rejects.toThrow("An actual non-zero, not git diff pager SIGPIPE");
  });
});
