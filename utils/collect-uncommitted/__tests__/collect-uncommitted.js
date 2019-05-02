"use strict";

jest.mock("@lerna/child-process");

const chalk = require("chalk");
const childProcess = require("@lerna/child-process");
const collectUncommitted = require("../lib/collect-uncommitted");

const stats = `AD file1
 D file2
 M path/to/file3
AM path/file4
MM path/file5
M  file6
D  file7
UU file8
?? file9`;

const GREEN_A = chalk.green("A");
const GREEN_M = chalk.green("M");
const GREEN_D = chalk.green("D");
const RED_D = chalk.red("D");
const RED_M = chalk.red("M");
const RED_UU = chalk.red("UU");
const RED_QQ = chalk.red("??");

const colorizedAry = [
  `${GREEN_A}${RED_D} file1`,
  ` ${RED_D} file2`,
  ` ${RED_M} path/to/file3`,
  `${GREEN_A}${RED_M} path/file4`,
  `${GREEN_M}${RED_M} path/file5`,
  `${GREEN_M}  file6`,
  `${GREEN_D}  file7`,
  `${RED_UU} file8`,
  `${RED_QQ} file9`,
];

childProcess.exec.mockResolvedValue(stats);
childProcess.execSync.mockReturnValue(stats);

describe("collectUncommitted()", () => {
  it("resolves an array of uncommitted changes", async () => {
    const result = await collectUncommitted();
    expect(childProcess.exec).toHaveBeenLastCalledWith("git", "status -s", {});
    expect(result).toEqual(colorizedAry);
  });

  it("empty array on clean repo", async () => {
    childProcess.exec.mockResolvedValueOnce("");
    const result = await collectUncommitted();
    expect(childProcess.exec).toHaveBeenLastCalledWith("git", "status -s", {});
    expect(result).toEqual([]);
  });

  it("accepts options.cwd", async () => {
    const options = { cwd: "foo" };
    await collectUncommitted(options);

    expect(childProcess.exec).toHaveBeenLastCalledWith("git", "status -s", options);
  });

  describe("collectUncommitted.sync()", () => {
    it("returns an array of uncommitted changes", async () => {
      const result = collectUncommitted.sync();

      expect(childProcess.execSync).toHaveBeenLastCalledWith("git", "status -s", {});
      expect(result).toEqual(colorizedAry);
    });

    it("accepts options.cwd", async () => {
      const options = { cwd: "foo" };
      collectUncommitted.sync(options);

      expect(childProcess.execSync).toHaveBeenLastCalledWith("git", "status -s", options);
    });
  });
});
