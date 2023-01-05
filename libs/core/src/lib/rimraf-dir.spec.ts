import path from "path";
import _pathExists from "path-exists";
import { rimrafDir } from "./rimraf-dir";

jest.mock("path-exists");
jest.mock("@lerna/child-process");

// eslint-disable-next-line @typescript-eslint/no-var-requires
const childProcess = require("@lerna/child-process");

const pathExists = jest.mocked(_pathExists);

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
