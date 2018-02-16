"use strict";

jest.mock("cmd-shim");
jest.mock("fs-extra");

const cmdShim = require("cmd-shim");
const fs = require("fs-extra");
const path = require("path");
const callsBack = require("./helpers/callsBack");
const createSymlink = require("../src/utils/create-symlink");

const linkRelative = (from, to) => path.relative(path.dirname(to), from);

describe("create-symlink", () => {
  fs.lstat.mockImplementation(callsBack("ENOENT"));
  fs.unlink.mockImplementation(callsBack());
  fs.symlink.mockImplementation(callsBack());

  if (process.platform !== "win32") {
    it("creates relative symlink to a directory", done => {
      const src = path.resolve("./packages/package-2");
      const dst = path.resolve("./packages/package-1/node_modules/package-2");
      const type = "junction"; // even in posix environments :P

      createSymlink(src, dst, type, () => {
        try {
          expect(fs.unlink).not.toBeCalled();
          expect(fs.symlink).lastCalledWith(linkRelative(src, dst), dst, type, expect.any(Function));
          done();
        } catch (ex) {
          done.fail(ex);
        }
      });
    });

    it("creates relative symlink to an executable file", done => {
      const src = path.resolve("./packages/package-2/cli.js");
      const dst = path.resolve("./packages/package-1/node_modules/.bin/package-2");
      const type = "exec";

      createSymlink(src, dst, type, () => {
        try {
          expect(fs.unlink).not.toBeCalled();
          expect(fs.symlink).lastCalledWith(linkRelative(src, dst), dst, "file", expect.any(Function));
          done();
        } catch (ex) {
          done.fail(ex);
        }
      });
    });

    it("overwrites an existing symlink", done => {
      const src = path.resolve("./packages/package-2");
      const dst = path.resolve("./packages/package-1/node_modules/package-2");
      const type = "junction"; // even in posix environments :P

      fs.lstat.mockImplementationOnce(callsBack()); // something _does_ exist at destination

      createSymlink(src, dst, type, () => {
        try {
          expect(fs.unlink).lastCalledWith(dst, expect.any(Function));
          expect(fs.symlink).lastCalledWith(linkRelative(src, dst), dst, type, expect.any(Function));
          done();
        } catch (ex) {
          done.fail(ex);
        }
      });
    });
  } else {
    it("creates command shim to an executable file", done => {
      const src = path.resolve("./packages/package-2/cli.js");
      const dst = path.resolve("./packages/package-1/node_modules/.bin/package-2");
      const type = "exec";

      cmdShim.mockImplementationOnce(callsBack());

      createSymlink(src, dst, type, () => {
        try {
          expect(fs.lstat).not.toBeCalled();
          expect(cmdShim).lastCalledWith(src, dst, expect.any(Function));
          done();
        } catch (ex) {
          done.fail(ex);
        }
      });
    });

    it("always uses absolute paths when creating symlinks", done => {
      const src = path.resolve("./packages/package-2");
      const dst = path.resolve("./packages/package-1/node_modules/package-2");
      const type = "junction"; // only _actually_ matters in windows

      fs.lstat.mockImplementationOnce(callsBack()); // something _does_ exist at destination

      createSymlink(src, dst, type, () => {
        try {
          expect(fs.unlink).lastCalledWith(dst, expect.any(Function));
          expect(fs.symlink).lastCalledWith(src, dst, type, expect.any(Function));
          done();
        } catch (ex) {
          done.fail(ex);
        }
      });
    });
  }
});
