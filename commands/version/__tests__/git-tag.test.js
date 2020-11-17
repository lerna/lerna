"use strict";

jest.mock("@lerna/child-process");

const childProcess = require("@lerna/child-process");
const { gitTag } = require("../lib/git-tag");

describe("gitTag", () => {
  childProcess.exec.mockResolvedValue();

  it("creates an annotated git tag", async () => {
    const tag = "v1.2.3";
    const opts = { cwd: "default" };

    await gitTag(tag, {}, opts);

    expect(childProcess.exec).toHaveBeenLastCalledWith("git", ["tag", tag, "-m", tag], opts);
  });

  it("signs the tag when configured", async () => {
    const tag = "v3.2.1";
    const opts = { cwd: "signed" };

    await gitTag(tag, { signGitTag: true }, opts);

    expect(childProcess.exec).toHaveBeenLastCalledWith("git", ["tag", tag, "-m", tag, "--sign"], opts);
  });

  it("forces the tag when configured", async () => {
    const tag = "v1.1.1";
    const opts = { cwd: "forced" };

    await gitTag(tag, { forceGitTag: true }, opts);

    expect(childProcess.exec).toHaveBeenLastCalledWith("git", ["tag", tag, "-m", tag, "--force"], opts);
  });

  it("creates an annotated git tag using the wrapper arguments", async () => {
    const tag = "v1.2.4";
    const opts = { cwd: "default" };

    await gitTag(tag, {}, opts, "git-wrapper gh-tag %s -m %s");

    expect(childProcess.exec).toHaveBeenLastCalledWith("git-wrapper", ["gh-tag", tag, "-m", tag], opts);
  });
});
