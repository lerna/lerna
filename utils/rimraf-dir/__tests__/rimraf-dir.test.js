"use strict";

jest.mock("path-exists");
jest.mock("@lerna/child-process");

const path = require("path");

// mocked modules
const pathExists = require("path-exists");
const childProcess = require("@lerna/child-process");

// file under test
const { rimrafDir } = require("..");

describe("rimrafDir()", () => {
  it("calls rimraf CLI with arguments", async () => {
    const dirPath = "rimraf/test";

    pathExists.mockResolvedValueOnce(true);
    childProcess.spawn.mockResolvedValueOnce();

    const removedPath = await rimrafDir(dirPath);

    expect(removedPath).toBe(dirPath);
    expect(childProcess.spawn).toHaveBeenLastCalledWith(process.execPath, [
      require.resolve("rimraf/bin"),
      "--no-glob",
      path.normalize(`${dirPath}/`),
    ]);
  });

  it("does not attempt to delete a non-existent directory", async () => {
    pathExists.mockResolvedValueOnce(false);

    const removedPath = await rimrafDir("rimraf/non-existent");

    expect(removedPath).toBe(undefined);
    expect(childProcess.spawn).not.toHaveBeenCalled();
  });
});
