/* global jasmine */
const execa = require("execa");
const path = require("path");

const initFixture = require("./helpers/initFixture");

const BIN = path.join(__dirname, "../bin/lerna.js");
const bin = (args, options) => execa(BIN, args, options);

jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000;

describe("cli", () => {
  it("should throw without command", async () => {
    expect.assertions(1);

    try {
      await bin([]);
    } catch (err) {
      expect(err.message).toContain('Pass --help to see all available commands and options.');
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
    const cwd = await initFixture("cli/local-install");
    const result = await bin(["--verbose"], {cwd});
    expect(result.stdout).toContain("fixtures/cli/local-instal/node_modules/lerna/bin/lerna.js");
    expect(result.stdout).toContain("fixtures/cli/local-instal/node_modules/lerna/lib/cli.js");
  });
});
