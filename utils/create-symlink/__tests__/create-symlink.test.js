"use strict";

jest.mock("@zkochan/cmd-shim");
jest.mock("fs-extra");

const cmdShim = require("@zkochan/cmd-shim");
const fs = require("fs-extra");
const path = require("path");
const createSymlink = require("..");

const linkRelative = (from, to) => path.relative(path.dirname(to), from);

describe("create-symlink", () => {
  fs.lstat.mockImplementation(() => Promise.reject(new Error("MOCK")));
  fs.unlink.mockResolvedValue();
  fs.symlink.mockResolvedValue();
  fs.pathExists.mockResolvedValue(true);
  fs.outputFile.mockResolvedValue();
  fs.remove.mockResolvedValue();
  cmdShim.mockResolvedValue();

  if (process.platform !== "win32") {
    it("creates relative symlink to a directory", async () => {
      const src = path.resolve("./packages/package-2");
      const dst = path.resolve("./packages/package-1/node_modules/package-2");
      const type = "junction"; // even in posix environments :P

      await createSymlink(src, dst, type);

      expect(fs.unlink).not.toHaveBeenCalled();
      expect(fs.symlink).toHaveBeenLastCalledWith(linkRelative(src, dst), dst, type);
    });

    it("creates relative symlink to an executable file", async () => {
      const src = path.resolve("./packages/package-2/cli.js");
      const dst = path.resolve("./packages/package-1/node_modules/.bin/package-2");
      const type = "exec";

      await createSymlink(src, dst, type);

      expect(fs.unlink).not.toHaveBeenCalled();
      expect(fs.symlink).toHaveBeenLastCalledWith(linkRelative(src, dst), dst, "file");
    });

    it("overwrites an existing symlink", async () => {
      const src = path.resolve("./packages/package-2");
      const dst = path.resolve("./packages/package-1/node_modules/package-2");
      const type = "junction"; // even in posix environments :P

      fs.lstat.mockImplementationOnce(() => Promise.resolve()); // something _does_ exist at destination

      await createSymlink(src, dst, type);

      expect(fs.unlink).toHaveBeenLastCalledWith(dst);
      expect(fs.symlink).toHaveBeenLastCalledWith(linkRelative(src, dst), dst, type);
    });
  } else {
    it("creates command shim to an executable file", async () => {
      const src = path.resolve("./packages/package-2/cli.js");
      const dst = path.resolve("./packages/package-1/node_modules/.bin/package-2");
      const type = "exec";

      await createSymlink(src, dst, type);

      expect(fs.lstat).not.toHaveBeenCalled();
      expect(cmdShim).toHaveBeenLastCalledWith(src, dst);
    });

    it("rejects when cmd-shim errors", async () => {
      cmdShim.mockImplementationOnce(() => Promise.reject(new Error("yikes")));

      await expect(createSymlink("src", "dst", "exec")).rejects.toThrow("yikes");
    });

    it("always uses absolute paths when creating symlinks", async () => {
      const src = path.resolve("./packages/package-2");
      const dst = path.resolve("./packages/package-1/node_modules/package-2");
      const type = "junction"; // only _actually_ matters in windows

      fs.lstat.mockImplementationOnce(() => Promise.resolve()); // something _does_ exist at destination

      await createSymlink(src, dst, type);

      expect(fs.unlink).toHaveBeenLastCalledWith(dst);
      expect(fs.symlink).toHaveBeenLastCalledWith(src, dst, type);
    });

    it("creates stub symlink to executable that doesn't exist yet", async () => {
      const src = path.resolve("./packages/package-3/cli.js");
      const dst = path.resolve("./packages/package-1/node_modules/.bin/package-3");
      const type = "exec";

      fs.pathExists.mockResolvedValueOnce(false);

      await createSymlink(src, dst, type);

      expect(fs.outputFile).toHaveBeenLastCalledWith(src, "");
      expect(cmdShim).toHaveBeenLastCalledWith(src, dst);
      expect(fs.remove).toHaveBeenLastCalledWith(src);
    });

    it("does not swallow cmd-shim errors when executable doesn't exist yet", async () => {
      cmdShim.mockImplementationOnce(() => Promise.reject(new Error("oh no")));
      fs.pathExists.mockResolvedValueOnce(false);

      await expect(createSymlink("src", "dst", "exec")).rejects.toThrow("oh no");
      expect(fs.remove).toHaveBeenLastCalledWith("src");
    });
  }
});
