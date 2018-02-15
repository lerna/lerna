"use strict";

// mocked modules
const GitUtilities = require("../src/GitUtilities");

// file under test
const UpdatedPackagesCollector = require("../src/UpdatedPackagesCollector");

jest.mock("../src/GitUtilities");

describe("UpdatedPackagesCollector", () => {
  GitUtilities.getShortSHA.mockReturnValue("deadbeef");
  GitUtilities.hasTags.mockReturnValue(true);
  GitUtilities.diffSinceIn.mockReturnValue("");
  GitUtilities.getLastTag.mockReturnValue("lastTag");

  describe(".collectUpdatedPackages()", () => {
    const filteredPackages = [
      { name: "package-1", location: "location-1" },
      { name: "package-2", location: "location-2" },
    ];
    const packageGraph = new Map(filteredPackages.map(pkg => [pkg.name, pkg]));
    const logger = {
      silly: () => {},
      info: () => {},
      verbose: () => {},
    };
    const execOpts = { cwd: "test-cwd" };
    const repository = {
      rootPath: "root-path",
    };

    it("should use the current SHA for commit ranges when the canary flag has been passed", () => {
      new UpdatedPackagesCollector({
        options: {
          canary: true,
        },
        execOpts,
        repository,
        logger,
        filteredPackages,
        packageGraph,
      }).getUpdates();

      expect(GitUtilities.diffSinceIn).toBeCalledWith("deadbeef^..deadbeef", "location-1", execOpts);
      expect(GitUtilities.diffSinceIn).toBeCalledWith("deadbeef^..deadbeef", "location-2", execOpts);
    });

    it("should use the current SHA for commit ranges when the canary flag is a string", () => {
      new UpdatedPackagesCollector({
        options: {
          canary: "my-tag",
        },
        execOpts,
        repository,
        logger,
        filteredPackages,
        packageGraph,
      }).getUpdates();

      expect(GitUtilities.diffSinceIn).toBeCalledWith("deadbeef^..deadbeef", "location-1", execOpts);
      expect(GitUtilities.diffSinceIn).toBeCalledWith("deadbeef^..deadbeef", "location-2", execOpts);
    });

    it("should use the last tag in non-canary mode for commit ranges when a repo has tags", () => {
      new UpdatedPackagesCollector({
        options: {},
        execOpts,
        repository,
        logger,
        filteredPackages,
        packageGraph,
      }).getUpdates();

      expect(GitUtilities.diffSinceIn).toBeCalledWith("lastTag", "location-1", execOpts);
      expect(GitUtilities.diffSinceIn).toBeCalledWith("lastTag", "location-2", execOpts);
    });
  });
});
