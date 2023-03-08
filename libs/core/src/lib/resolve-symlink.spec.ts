import _fs from "fs-extra";
import path from "path";
import { resolveSymlink } from "./resolve-symlink";

jest.mock("read-cmd-shim");
jest.mock("fs-extra");

const fs = jest.mocked(_fs);

// read-cmd-shim does not have any types
// eslint-disable-next-line @typescript-eslint/no-var-requires
const readCmdShim = require("read-cmd-shim");

const linkRelative = (from: string, to: string) => path.relative(path.dirname(to), from);

describe("resolve-symlink", () => {
  if (process.platform !== "win32") {
    it("returns false when filePath is not a symlink", () => {
      const filePath = path.resolve("./not/a/symlink");

      fs.lstatSync.mockReturnValueOnce({
        isSymbolicLink: () => false,
      } as any);

      expect(resolveSymlink(filePath)).toBe(false);
    });

    it("returns resolved path of an existing symlink", () => {
      const original = path.resolve("./packages/package-2");
      const filePath = path.resolve("./packages/package-1/node_modules/package-2");

      fs.lstatSync.mockReturnValueOnce({
        isSymbolicLink: () => true,
      } as any);
      fs.readlinkSync.mockReturnValueOnce(linkRelative(original, filePath));

      expect(resolveSymlink(filePath)).toBe(original);
    });
  } else {
    it("returns false when filePath is not a symlink (windows)", () => {
      const filePath = path.resolve("./not/a/symlink");

      fs.lstatSync.mockReturnValueOnce({
        isSymbolicLink: () => false,
        isFile: () => false,
      } as any);

      expect(resolveSymlink(filePath)).toBe(false);
    });

    it("returns resolved path of an existing symlink (windows)", () => {
      const original = path.resolve("./packages/package-2");
      const filePath = path.resolve("./packages/package-1/node_modules/package-2");

      fs.lstatSync.mockReturnValueOnce({
        isSymbolicLink: () => true,
        isFile: () => false,
      } as any);
      fs.readlinkSync.mockReturnValueOnce(linkRelative(original, filePath));

      expect(resolveSymlink(filePath)).toBe(original);
    });

    it("returns false when filePath is not a shimmed executable", () => {
      const filePath = path.resolve("./packages/package-1/node_modules/.bin/package-2");

      fs.lstatSync.mockReturnValueOnce({
        isSymbolicLink: () => false,
        isFile: () => true,
      } as any);
      readCmdShim.sync.mockImplementationOnce(() => {
        throw new Error("ENOTASHIM");
      });

      expect(resolveSymlink(filePath)).toBe(false);
    });

    it("returns resolved path of a shimmed executable", () => {
      const original = path.resolve("./packages/package-2/cli.js");
      const filePath = path.resolve("./packages/package-1/node_modules/.bin/package-2.cmd");

      fs.lstatSync.mockReturnValueOnce({
        isSymbolicLink: () => false,
        isFile: () => true,
      } as any);
      readCmdShim.sync.mockReturnValueOnce(linkRelative(original, filePath));

      expect(resolveSymlink(filePath)).toBe(original);
    });
  }
});
