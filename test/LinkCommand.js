import log from "npmlog";

// mocked or stubbed modules
import FileSystemUtilities from "../src/FileSystemUtilities";

// helpers
import callsBack from "./helpers/callsBack";
import exitWithCode from "./helpers/exitWithCode";
import initFixture from "./helpers/initFixture";
import normalizeRelativeDir from "./helpers/normalizeRelativeDir";

// file under test
import LinkCommand from "../src/commands/LinkCommand";

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
const symlinkedDirectories = (testDir) =>
  FileSystemUtilities.symlink.mock.calls.map((args) => {
    return {
      _src: normalizeRelativeDir(testDir, args[0]),
      dest: normalizeRelativeDir(testDir, args[1]),
      type: args[2],
    };
  });

describe("LinkCommand", () => {
  beforeEach(() => {
  });

  afterEach(() => jest.resetAllMocks());

  describe("with local package dependencies", () => {
    let testDir;

    beforeEach(() => initFixture("LinkCommand/basic").then((dir) => {
      testDir = dir;
    }));

    beforeEach(stubSymlink);
    afterEach(resetSymlink);

    it("should symlink all packages", (done) => {
      const linkCommand = new LinkCommand([], {}, testDir);

      linkCommand.runValidations();
      linkCommand.runPreparations();

      linkCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done.fail(err);

        try {
          expect(symlinkedDirectories(testDir)).toMatchSnapshot();

          done();
        } catch (ex) {
          done.fail(ex);
        }
      }));
    });
  });
});
