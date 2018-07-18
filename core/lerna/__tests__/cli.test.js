"use strict";

const execa = require("execa");
const path = require("path");
const tempy = require("tempy");

// git init is not necessary
const copyFixture = require("@lerna-test/copy-fixture");

const CLI = path.join(__dirname, "../cli.js");
const bin = cwd => (...args) => execa(CLI, args, { cwd });

jest.setTimeout(30e3);

describe("cli", () => {
  it("should throw without command", async () => {
    expect.assertions(1);

    try {
      await bin()();
    } catch (err) {
      expect(err.message).toContain("Pass --help to see all available commands and options.");
    }
  });

  it("should not throw for --help", async () => {
    expect.assertions(1);
    let error = null;

    try {
      await bin()("--help");
    } catch (err) {
      error = err;
    }

    expect(error).toBe(null);
  });

  it("should prefer local installs", async () => {
    const cwd = tempy.directory();
    await copyFixture(cwd, "local-install", __dirname);

    const { stdout } = await bin(cwd)("--verbose");
    expect(stdout).toContain("__fixtures__/local-install/node_modules/lerna/cli.js");
    expect(stdout).toContain("__fixtures__/local-install/node_modules/@lerna/cli/index.js");
  });
});
