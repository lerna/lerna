"use strict";

jest.mock("temp-write");
jest.mock("@lerna/child-process");

const { EOL } = require("os");
const { sync: mockWrite } = require("temp-write");
const { exec: mockExec } = require("@lerna/child-process");
const gitCommit = require("../lib/git-commit");

describe("git commit", () => {
  mockExec.mockResolvedValue();
  mockWrite.mockReturnValue("temp-file-path");

  test("--message", async () => {
    const opts = { cwd: "message" };
    await gitCommit("subject", {}, opts);
    expect(mockExec).toHaveBeenLastCalledWith("git", ["commit", "-m", "subject"], opts);
  });

  test("--message <multiline>", async () => {
    const message = `subject${EOL}${EOL}body`;
    const opts = { cwd: "multi-line" };
    await gitCommit(message, {}, opts);
    expect(mockWrite).toHaveBeenLastCalledWith(message, "lerna-commit.txt");
    expect(mockExec).toHaveBeenLastCalledWith("git", ["commit", "-F", "temp-file-path"], opts);
  });

  test("--amend", async () => {
    const opts = { cwd: "no-edit" };
    await gitCommit("whoops", { amend: true }, opts);
    expect(mockExec).toHaveBeenLastCalledWith("git", ["commit", "--amend", "--no-edit"], opts);
  });

  test("--no-commit-hooks", async () => {
    const opts = { cwd: "no-verify" };
    await gitCommit("yolo", { commitHooks: false }, opts);
    expect(mockExec).toHaveBeenLastCalledWith("git", ["commit", "--no-verify", "-m", "yolo"], opts);
  });

  test("--sign-git-commit", async () => {
    const opts = { cwd: "signed" };
    await gitCommit("nice", { signGitCommit: true }, opts);
    expect(mockExec).toHaveBeenLastCalledWith("git", ["commit", "--gpg-sign", "-m", "nice"], opts);
  });
});
