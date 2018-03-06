"use strict";

const execa = require("execa");
const path = require("path");

const initFixture = require("@lerna-test/init-fixture")(__dirname);

const BIN = path.join(__dirname, "../cli.js");
const bin = (args, options) => execa(BIN, args, options);

/* global jasmine */
jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000;

describe("cli", () => {
  it("should throw without command", async () => {
    expect.assertions(1);

    try {
      await bin([]);
    } catch (err) {
      expect(err.message).toContain("Pass --help to see all available commands and options.");
    }
  });

  it("should not throw for --help", async () => {
    expect.assertions(1);
    let error = null;

    try {
      await bin(["--help"]);
    } catch (err) {
      error = err;
    }

    expect(error).toBe(null);
  });

  it("should prefer local installs", async () => {
    const cwd = await initFixture("local-install");
    const result = await bin(["--verbose"], { cwd });
    expect(result.stdout).toContain("__fixtures__/local-install/node_modules/lerna/cli.js");
    expect(result.stdout).toContain("__fixtures__/local-install/node_modules/@lerna/cli/index.js");
  });
});
