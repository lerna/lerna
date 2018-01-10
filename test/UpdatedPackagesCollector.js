// mocked modules
import GitUtilities from "../src/GitUtilities";

// file under test
import UpdatedPackagesCollector from "../src/UpdatedPackagesCollector";

jest.mock("../src/GitUtilities");

const filteredPackages = [
  {
    name: "package-1",
    location: "location-1",
  },
  {
    name: "package-2",
    location: "location-2",
  },
];

const logger = {
  silly: () => {},
  info: () => {},
  verbose: () => {},
};

const repository = {
  rootPath: "root-path",
};

describe("UpdatedPackagesCollector", () => {
  it("should exist", () => {
    expect(UpdatedPackagesCollector).toBeDefined();
  });

  describe(".collectUpdatedPackages()", () => {
    beforeEach(() => {
      GitUtilities.getCurrentSHA = jest.fn(() => "deadbeefcafe");
      GitUtilities.hasTags = jest.fn(() => true);
      GitUtilities.diffSinceIn = jest.fn(() => "");
      GitUtilities.getLastTag = jest.fn(() => "lastTag");
    });

    afterEach(() => jest.resetAllMocks());

    it("should use the current SHA for commit ranges when the canary flag has been passed", () => {
      new UpdatedPackagesCollector({
        options: {
          canary: true,
        },
        repository,
        logger,
        filteredPackages,
      }).getUpdates();

      expect(GitUtilities.diffSinceIn).toBeCalledWith("deadbeef^..deadbeef", "location-1", undefined);
      expect(GitUtilities.diffSinceIn).toBeCalledWith("deadbeef^..deadbeef", "location-2", undefined);
    });

    it("should use the current SHA for commit ranges when the canary flag is a string", () => {
      new UpdatedPackagesCollector({
        options: {
          canary: "my-tag",
        },
        repository,
        logger,
        filteredPackages,
      }).getUpdates();

      expect(GitUtilities.diffSinceIn).toBeCalledWith("deadbeef^..deadbeef", "location-1", undefined);
      expect(GitUtilities.diffSinceIn).toBeCalledWith("deadbeef^..deadbeef", "location-2", undefined);
    });

    it("should use the last tag in non-canary mode for commit ranges when a repo has tags", () => {
      new UpdatedPackagesCollector({
        options: {},
        repository,
        logger,
        filteredPackages,
      }).getUpdates();

      expect(GitUtilities.diffSinceIn).toBeCalledWith("lastTag", "location-1", undefined);
      expect(GitUtilities.diffSinceIn).toBeCalledWith("lastTag", "location-2", undefined);
    });
  });
});
