"use strict";

jest.mock("envinfo");

const envinfo = require("envinfo");

envinfo.run.mockResolvedValue("MOCK_ENVINFO");

it("outputs result of envinfo()", async () => {
    // project fixture is irrelevant, no actual changes are made
    await lernaInfo(process.cwd())();

    expect(envinfo.run).toHaveBeenLastCalledWith(
      expect.objectContaining({
        npmPackages: ["lerna"],
      })
    );
    expect(output.logged()).toMatch("MOCK_ENVINFO");
});
