import { output as _output } from "@lerna/core";
import { commandRunner, initFixtureFactory } from "@lerna/test-helpers";
import _envinfo from "envinfo";

const initFixture = initFixtureFactory(__dirname);

jest.mock("envinfo");

const envinfo = jest.mocked(_envinfo);

envinfo.run.mockResolvedValue("MOCK_ENVINFO");

// file under test

const lernaInfo = commandRunner(require("../command"));

jest.mock("@lerna/core", () => require("@lerna/test-helpers/__mocks__/@lerna/core"));

// The mock modifies the exported symbols and therefore types
const output = _output as any;

describe("lerna info", () => {
  describe("in a basic repo", () => {
    let testDir: string;

    beforeAll(async () => {
      testDir = await initFixture("basic");
    });

    it("outputs result of envinfo()", async () => {
      await lernaInfo(testDir)();

      expect(envinfo.run).toHaveBeenLastCalledWith(
        expect.objectContaining({
          npmPackages: ["lerna"],
        })
      );
      expect(output.logged()).toMatch("MOCK_ENVINFO");
    });
  });
});
