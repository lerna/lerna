"use strict";

jest.mock("cmd-shim");
jest.mock("fs-extra");

const cmdShim = require("cmd-shim");
const fs = require("fs-extra");
const path = require("path");
const callsBack = require("@lerna-test/calls-back");
const createSymlink = require("..");

const linkRelative = (from, to) => path.relative(path.dirname(to), from);

describe("create-symlink", () => {
  fs.lstat.mockImplementation(() => Promise.reject(new Error("MOCK")));
  fs.unlink.mockResolvedValue();
  fs.symlink.mockResolvedValue();
  // cmdShim is a traditional errback
  cmdShim.mockImplementation(callsBack());

  if (process.platform !== "win32") {
    it("creates relative symlink to a directory", async () => {
      const src = path.resolve("./packages/package-2");
      const dst = path.resolve("./packages/package-1/node_modules/package-2");
      const type = "junction"; // even in posix environments :P

      await createSymlink(src, dst, type);

      expect(fs.unlink).not.toBeCalled();
      expect(fs.symlink).lastCalledWith(linkRelative(src, dst), dst, type);
    });

    it("creates relative symlink to an executable file", async () => {
      const src = path.resolve("./packages/package-2/cli.js");
      const dst = path.resolve("./packages/package-1/node_modules/.bin/package-2");
      const type = "exec";

      await createSymlink(src, dst, type);

      expect(fs.unlink).not.toBeCalled();
      expect(fs.symlink).lastCalledWith(linkRelative(src, dst), dst, "file");
    });

    it("overwrites an existing symlink", async () => {
      const src = path.resolve("./packages/package-2");
      const dst = path.resolve("./packages/package-1/node_modules/package-2");
      const type = "junction"; // even in posix environments :P

      fs.lstat.mockImplementationOnce(() => Promise.resolve()); // something _does_ exist at destination

      await createSymlink(src, dst, type);

      expect(fs.unlink).lastCalledWith(dst);
      expect(fs.symlink).lastCalledWith(linkRelative(src, dst), dst, type);
    });
  } else {
    it("creates command shim to an executable file", async () => {
      const src = path.resolve("./packages/package-2/cli.js");
      const dst = path.resolve("./packages/package-1/node_modules/.bin/package-2");
      const type = "exec";

      await createSymlink(src, dst, type);

      expect(fs.lstat).not.toBeCalled();
      expect(cmdShim).lastCalledWith(src, dst, expect.any(Function));
    });

    it("rejects when cmd-shim errors", async () => {
      cmdShim.mockImplementationOnce(callsBack(new Error("yikes")));

      try {
        await createSymlink("src", "dst", "exec");
      } catch (err) {
        expect(err.message).toBe("yikes");
      }
    });

    it("always uses absolute paths when creating symlinks", async () => {
      const src = path.resolve("./packages/package-2");
      const dst = path.resolve("./packages/package-1/node_modules/package-2");
      const type = "junction"; // only _actually_ matters in windows

      fs.lstat.mockImplementationOnce(() => Promise.resolve()); // something _does_ exist at destination

      await createSymlink(src, dst, type);

      expect(fs.unlink).lastCalledWith(dst);
      expect(fs.symlink).lastCalledWith(src, dst, type);
    });
  }
});
