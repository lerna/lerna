"use strict";

jest.mock("../src/utils/create-symlink");

// mocked or stubbed modules
const createSymlink = require("../src/utils/create-symlink");

// helpers
const initFixture = require("./helpers/initFixture");
const normalizeRelativeDir = require("./helpers/normalizeRelativeDir");

// file under test
const lernaLink = require("./helpers/command-runner")(require("../src/commands/LinkCommand"));

// assertion helpers
const symlinkedDirectories = testDir =>
  createSymlink.mock.calls.map(([src, dest, type]) => ({
    _src: normalizeRelativeDir(testDir, src),
    dest: normalizeRelativeDir(testDir, dest),
    type,
  }));

describe("LinkCommand", () => {
  // the underlying implementation of symlinkDependencies
  createSymlink.mockResolvedValue();

  describe("with local package dependencies", () => {
    it("should symlink all packages", async () => {
      const testDir = await initFixture("LinkCommand/basic");
      await lernaLink(testDir)();

      expect(symlinkedDirectories(testDir)).toMatchSnapshot();
    });
  });

  describe("with --force-local", () => {
    it("should force symlink of all packages", async () => {
      const testDir = await initFixture("LinkCommand/force-local");
      await lernaLink(testDir)();

      expect(symlinkedDirectories(testDir)).toMatchSnapshot();
    });
  });
});
