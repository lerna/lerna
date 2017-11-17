import execa from "execa";
import path from "path";

import initFixture from "./helpers/initFixture";

const BIN = path.join(__dirname, "../bin/lerna.js");
const bin = (args, options) => execa(BIN, args, options);

describe("cli", () => {
  it("should throw without command", async () => {
    try {
      await bin([]);
      fail(`Expected an exception, but it didn"t throw anything`); // eslint-disable-line
    } catch (err) {
    }
  });

  it("should not throw for --help", async () => {
    try {
      await bin(["--help"]);
    } catch (err) {
      fail(`Unexpected exception: ${err.message}`); // eslint-disable-line
    }
  });

  it("should prefer local installs", async () => {
    const cwd = await initFixture("cli/local-install");
    const result = await bin(["--help"], {cwd});
    expect(result.stdout).toBe("fixtures/cli/local-install/node_modules/lib/cli.js");
  });
});
