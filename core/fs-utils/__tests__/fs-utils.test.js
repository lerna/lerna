"use strict";

jest.mock("path-exists");
jest.mock("@lerna/child-process");

const path = require("path");

// mocked modules
const pathExists = require("path-exists");
const ChildProcessUtilities = require("@lerna/child-process");

// file under test
const FileSystemUtilities = require("..");

describe("FileSystemUtilities.rimraf()", () => {
  it("calls rimraf CLI with arguments", async () => {
    expect.assertions(1);
    const dirPath = "rimraf/test";

    pathExists.mockResolvedValueOnce(true);
    ChildProcessUtilities.spawn.mockResolvedValueOnce();

    await FileSystemUtilities.rimraf(dirPath);

    expect(ChildProcessUtilities.spawn).lastCalledWith(process.execPath, [
      require.resolve("rimraf/bin"),
      "--no-glob",
      path.normalize(`${dirPath}/`),
    ]);
  });

  it("does not attempt to delete a non-existent directory", async () => {
    expect.assertions(1);
    pathExists.mockResolvedValueOnce(false);

    await FileSystemUtilities.rimraf("rimraf/non-existent");
    expect(ChildProcessUtilities.spawn).not.toBeCalled();
  });
});
