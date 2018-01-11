import log from "npmlog";

// mocked or stubbed modules
import FileSystemUtilities from "../src/FileSystemUtilities";

// helpers
import callsBack from "./helpers/callsBack";
import initFixture from "./helpers/initFixture";
import normalizeRelativeDir from "./helpers/normalizeRelativeDir";
import yargsRunner from "./helpers/yargsRunner";

// file under test
import * as commandModule from "../src/commands/LinkCommand";

const run = yargsRunner(commandModule);

// silence logs
log.level = "silent";

// stub symlink in certain tests to reduce redundancy
const fsSymlink = FileSystemUtilities.symlink;
const resetSymlink = () => {
  FileSystemUtilities.symlink = fsSymlink;
};
const stubSymlink = () => {
  FileSystemUtilities.symlink = jest.fn(callsBack());
};

// object snapshots have sorted keys
const symlinkedDirectories = testDir =>
  FileSystemUtilities.symlink.mock.calls.map(args => ({
    _src: normalizeRelativeDir(testDir, args[0]),
    dest: normalizeRelativeDir(testDir, args[1]),
    type: args[2],
  }));

describe("LinkCommand", () => {
  beforeEach(() => {});

  afterEach(() => jest.resetAllMocks());

  describe("with local package dependencies", () => {
    beforeEach(stubSymlink);
    afterEach(resetSymlink);

    it("should symlink all packages", async () => {
      const testDir = await initFixture("LinkCommand/basic");
      const lernaLink = run(testDir);
      await lernaLink();

      expect(symlinkedDirectories(testDir)).toMatchSnapshot();
    });
  });

  describe("with --force-local", () => {
    beforeEach(stubSymlink);
    afterEach(resetSymlink);

    it("should force symlink of all packages", async () => {
      const testDir = await initFixture("LinkCommand/force-local");
      const lernaLink = run(testDir);
      await lernaLink();

      expect(symlinkedDirectories(testDir)).toMatchSnapshot();
    });
  });
});
