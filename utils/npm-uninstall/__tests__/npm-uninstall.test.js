"use strict";

jest.mock("fs-extra");
// write-pkg mocked manually
jest.mock("@lerna/child-process");

const path = require("path");

// mocked modules
const fs = require("fs-extra");
const writePkg = require("write-pkg");
const ChildProcessUtilities = require("@lerna/child-process");

// helpers
const Package = require("@lerna/package");

// file under test
const npmUninstall = require("..");

describe("npm-uninstall", () => {
  ChildProcessUtilities.exec.mockResolvedValue();
  fs.rename.mockResolvedValue();
  writePkg.mockResolvedValue();

  describe("npmUninstall()", () => {
    it("returns a promise for a non-mangling install", async () => {});
  });
});
