/* global jasmine */
import execa from "execa";
import path from "path";

import {initFixture} from "@lerna/test";

const BIN = path.join(__dirname, "cli.js");
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
    const cwd = await initFixture("local-install");
    const result = await bin(["--verbose"], {cwd});
    expect(result.stdout).toContain("fixtures/local-instal/node_modules/@lerna/cli/cli.js");
  });
});
