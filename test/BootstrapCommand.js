import log from "npmlog";

// mocked or stubbed modules
import FileSystemUtilities from "../src/FileSystemUtilities";
import NpmUtilities from "../src/NpmUtilities";

// helpers
import callsBack from "./helpers/callsBack";
import exitWithCode from "./helpers/exitWithCode";
import initFixture from "./helpers/initFixture";
import normalizeRelativeDir from "./helpers/normalizeRelativeDir";

// file under test
import BootstrapCommand from "../src/commands/BootstrapCommand";

jest.mock("../src/NpmUtilities");

// silence logs
log.level = "silent";

// stub rimraf because we trust isaacs
const fsRimraf = FileSystemUtilities.rimraf;
const resetRimraf = () => {
  FileSystemUtilities.rimraf = fsRimraf;
};
const stubRimraf = () => {
  FileSystemUtilities.rimraf = jest.fn(callsBack());
};

// stub symlink in certain tests to reduce redundancy
const fsSymlink = FileSystemUtilities.symlink;
const resetSymlink = () => {
  FileSystemUtilities.symlink = fsSymlink;
};
const stubSymlink = () => {
  FileSystemUtilities.symlink = jest.fn(callsBack());
};

// object snapshots have sorted keys
const installedPackagesInDirectories = (testDir) =>
  NpmUtilities.installInDir.mock.calls.reduce((obj, args) => {
    const location = normalizeRelativeDir(testDir, args[0]);
    const dependencies = args[1];
    obj[location] = dependencies;
    return obj;
  }, {});

const ranScriptsInDirectories = (testDir) =>
  NpmUtilities.runScriptInDir.mock.calls.reduce((obj, args) => {
    const location = normalizeRelativeDir(testDir, args[2]);
    const script = args[0];

    if (!obj[location]) {
      obj[location] = [];
    }
    obj[location].push(script);

    return obj;
  }, {});

const removedDirectories = (testDir) =>
  FileSystemUtilities.rimraf.mock.calls.map((args) =>
    normalizeRelativeDir(testDir, args[0])
  );

const symlinkedDirectories = (testDir) =>
  FileSystemUtilities.symlink.mock.calls.map((args) => {
    return {
      _src: normalizeRelativeDir(testDir, args[0]),
      dest: normalizeRelativeDir(testDir, args[1]),
      type: args[2],
    };
  });

describe("BootstrapCommand", () => {
  beforeEach(() => {
    // we stub installInDir() in most tests because
    // we already have enough tests of installInDir()
    NpmUtilities.installInDir.mockImplementation(callsBack());

    // stub runScriptInDir() because it is a huge source
    // of slowness when running tests for no good reason
    NpmUtilities.runScriptInDir.mockImplementation(callsBack());
  });

  afterEach(() => jest.resetAllMocks());

  describe("lifecycle scripts", () => {
    let testDir;

    beforeEach(() => initFixture("BootstrapCommand/lifecycle-scripts").then((dir) => {
      testDir = dir;
    }));

    it("should run preinstall, postinstall and prepublish scripts", (done) => {
      const bootstrapCommand = new BootstrapCommand([], {}, testDir);

      bootstrapCommand.runValidations();
      bootstrapCommand.runPreparations();

      bootstrapCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done.fail(err);

        try {
          expect(NpmUtilities.installInDir).not.toBeCalled();
          expect(ranScriptsInDirectories(testDir)).toMatchSnapshot();

          done();
        } catch (ex) {
          done.fail(ex);
        }
      }));
    });
  });

  describe("with hoisting", () => {
    let testDir;

    beforeEach(() => initFixture("BootstrapCommand/basic").then((dir) => {
      testDir = dir;
    }));

    beforeEach(stubRimraf);
    afterEach(resetRimraf);

    it("should hoist", (done) => {
      const bootstrapCommand = new BootstrapCommand([], {
        hoist: true
      }, testDir);

      bootstrapCommand.runValidations();
      bootstrapCommand.runPreparations();

      bootstrapCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done.fail(err);

        try {
          expect(installedPackagesInDirectories(testDir)).toMatchSnapshot();
          expect(removedDirectories(testDir)).toMatchSnapshot();

          done();
        } catch (ex) {
          done.fail(ex);
        }
      }));
    });

    it("should not hoist when disallowed", (done) => {
      const bootstrapCommand = new BootstrapCommand([], {
        hoist: true,
        nohoist: "@test/package-1"
      }, testDir);

      bootstrapCommand.runValidations();
      bootstrapCommand.runPreparations();

      bootstrapCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done.fail(err);

        try {
          expect(installedPackagesInDirectories(testDir)).toMatchSnapshot();
          expect(removedDirectories(testDir)).toMatchSnapshot();

          done();
        } catch (ex) {
          done.fail(ex);
        }
      }));
    });

    it("should use global style to install disallowed external dependencies", (done) => {
      const bootstrapCommand = new BootstrapCommand([], {
        hoist: true
      }, testDir);

      bootstrapCommand.runValidations();
      bootstrapCommand.runPreparations();

      bootstrapCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done.fail(err);

        try {
          expect(installedPackagesInDirectories(testDir)).toMatchSnapshot();
          expect(removedDirectories(testDir)).toMatchSnapshot();

          // foo@^1.0.0 will be hoisted, and should not use global style
          expect(NpmUtilities.installInDir).toBeCalledWith(
            expect.any(String),
            expect.arrayContaining(["foo@^1.0.0"]),
            expect.any(Object),
            expect.any(Function)
          );

          // foo@0.1.2 differs from the more common foo@^1.0.0
          expect(NpmUtilities.installInDir).toBeCalledWith(
            expect.stringContaining("package-3"),
            expect.arrayContaining(["foo@0.1.12"]),
            expect.any(Object),
            true, // npmGlobalStyle
            expect.any(Function)
          );

          done();
        } catch (ex) {
          done.fail(ex);
        }
      }));
    });
  });

  describe("with local package dependencies", () => {
    let testDir;

    beforeEach(() => initFixture("BootstrapCommand/basic").then((dir) => {
      testDir = dir;
    }));

    beforeEach(stubSymlink);
    afterEach(resetSymlink);

    it("should bootstrap packages", (done) => {
      const bootstrapCommand = new BootstrapCommand([], {}, testDir);

      bootstrapCommand.runValidations();
      bootstrapCommand.runPreparations();

      bootstrapCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done.fail(err);

        try {
          expect(installedPackagesInDirectories(testDir)).toMatchSnapshot();
          expect(symlinkedDirectories(testDir)).toMatchSnapshot();

          done();
        } catch (ex) {
          done.fail(ex);
        }
      }));
    });

    it("should not bootstrap ignored packages", (done) => {
      const bootstrapCommand = new BootstrapCommand([], {
        ignore: "package-@(3|4)"
      }, testDir);

      bootstrapCommand.runValidations();
      bootstrapCommand.runPreparations();

      bootstrapCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done.fail(err);

        try {
          expect(installedPackagesInDirectories(testDir)).toMatchSnapshot();

          done();
        } catch (ex) {
          done.fail(ex);
        }
      }));
    });

    it("should only bootstrap scoped packages", (done) => {
      const bootstrapCommand = new BootstrapCommand([], {
        scope: "package-@(3|4)"
      }, testDir);

      bootstrapCommand.runValidations();
      bootstrapCommand.runPreparations();

      bootstrapCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done.fail(err);

        try {
          expect(installedPackagesInDirectories(testDir)).toMatchSnapshot();
          expect(symlinkedDirectories(testDir)).toMatchSnapshot();

          done();
        } catch (ex) {
          done.fail(ex);
        }
      }));
    });
  });

  describe("with multiple package locations", () => {
    let testDir;

    beforeEach(() => initFixture("BootstrapCommand/extra").then((dir) => {
      testDir = dir;
    }));

    beforeEach(stubSymlink);
    afterEach(resetSymlink);

    it("should bootstrap packages", (done) => {
      const bootstrapCommand = new BootstrapCommand([], {}, testDir);

      bootstrapCommand.runValidations();
      bootstrapCommand.runPreparations();

      bootstrapCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done.fail(err);

        try {
          expect(installedPackagesInDirectories(testDir)).toMatchSnapshot();
          expect(ranScriptsInDirectories(testDir)).toMatchSnapshot();
          expect(symlinkedDirectories(testDir)).toMatchSnapshot();

          done();
        } catch (ex) {
          done.fail(ex);
        }
      }));
    });

    it("should not bootstrap ignored packages", (done) => {
      const bootstrapCommand = new BootstrapCommand([], {
        ignore: "package-@(3|4)"
      }, testDir);

      bootstrapCommand.runValidations();
      bootstrapCommand.runPreparations();

      bootstrapCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done.fail(err);

        try {
          expect(installedPackagesInDirectories(testDir)).toMatchSnapshot();

          done();
        } catch (ex) {
          done.fail(ex);
        }
      }));
    });

    it("bootstraps dependencies not included by --scope with --include-filtered-dependencies", (done) => {
      // we scope to package-2 only but should still install package-1 as it is a dependency of package-2
      const bootstrapCommand = new BootstrapCommand([], {
        scope: "package-2",
        includeFilteredDependencies: true
      }, testDir);

      bootstrapCommand.runValidations();
      bootstrapCommand.runPreparations();

      bootstrapCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done.fail(err);

        try {
          expect(installedPackagesInDirectories(testDir)).toMatchSnapshot();

          done();
        } catch (ex) {
          done.fail(ex);
        }
      }));
    });

    it("bootstraps dependencies excluded by --ignore with --include-filtered-dependencies", (done) => {
      // we ignore package 1 but it should still be installed because it is a dependency of package-2
      const bootstrapCommand = new BootstrapCommand([], {
        ignore: "{@test/package-1,package-@(3|4)}",
        includeFilteredDependencies: true
      }, testDir);

      bootstrapCommand.runValidations();
      bootstrapCommand.runPreparations();

      bootstrapCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done.fail(err);

        try {
          expect(installedPackagesInDirectories(testDir)).toMatchSnapshot();

          done();
        } catch (ex) {
          done.fail(ex);
        }
      }));
    });
  });

  describe("with external dependencies that haven't been installed", () => {
    let testDir;

    beforeEach(() => initFixture("BootstrapCommand/cold").then((dir) => {
      testDir = dir;
    }));

    it("should get installed", (done) => {
      const bootstrapCommand = new BootstrapCommand([], {}, testDir);

      bootstrapCommand.runValidations();
      bootstrapCommand.runPreparations();

      bootstrapCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done.fail(err);

        try {
          expect(installedPackagesInDirectories(testDir)).toMatchSnapshot();

          done();
        } catch (ex) {
          done.fail(ex);
        }
      }));
    });

    it("gets network mutex when --npm-client=yarn", (done) => {
      const bootstrapCommand = new BootstrapCommand([], {
        npmClient: "yarn",
      }, testDir);

      bootstrapCommand.runValidations();
      bootstrapCommand.runPreparations();

      bootstrapCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done.fail(err);

        try {
          expect(NpmUtilities.installInDir.mock.calls[0][2]).toMatchObject({
            npmClient: "yarn",
            mutex: expect.stringMatching(/^network:\d+$/),
          });

          done();
        } catch (ex) {
          done.fail(ex);
        }
      }));
    });
  });

  describe("with external dependencies that have already been installed", () => {
    let testDir;

    beforeEach(() => initFixture("BootstrapCommand/warm").then((dir) => {
      testDir = dir;
    }));

    it("should not get re-installed", (done) => {
      const bootstrapCommand = new BootstrapCommand([], {}, testDir);

      bootstrapCommand.runValidations();
      bootstrapCommand.runPreparations();

      bootstrapCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done.fail(err);

        try {
          expect(NpmUtilities.installInDir).not.toBeCalled();

          done();
        } catch (ex) {
          done.fail(ex);
        }
      }));
    });
  });

  describe("with at least one external dependency to install", () => {
    let testDir;

    beforeEach(() => initFixture("BootstrapCommand/tepid").then((dir) => {
      testDir = dir;
    }));

    it("should install all dependencies", (done) => {
      const bootstrapCommand = new BootstrapCommand([], {}, testDir);

      bootstrapCommand.runValidations();
      bootstrapCommand.runPreparations();

      bootstrapCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done.fail(err);

        try {
          expect(installedPackagesInDirectories(testDir)).toMatchSnapshot();

          done();
        } catch (ex) {
          done.fail(ex);
        }
      }));
    });
  });

  describe("with package peerDependencies", () => {
    let testDir;

    beforeEach(() => initFixture("BootstrapCommand/peer").then((dir) => {
      testDir = dir;
    }));

    it("does not bootstrap peerDependencies", (done) => {
      const bootstrapCommand = new BootstrapCommand([], {}, testDir);

      bootstrapCommand.runValidations();
      bootstrapCommand.runPreparations();

      bootstrapCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done.fail(err);

        try {
          expect(NpmUtilities.installInDir).not.toBeCalled();

          done();
        } catch (ex) {
          done.fail(ex);
        }
      }));
    });
  });

  describe("zero packages", () => {
    let testDir;

    beforeEach(() => initFixture("BootstrapCommand/zero-pkgs").then((dir) => {
      testDir = dir;
    }));

    it("should succeed in repositories with zero packages", (done) => {
      const bootstrapCommand = new BootstrapCommand([], {}, testDir);

      bootstrapCommand.runValidations();
      bootstrapCommand.runPreparations();

      bootstrapCommand.runCommand(exitWithCode(0, done));
    });
  });

  describe("with registry config", () => {
    let testDir;

    beforeEach(() => initFixture("BootstrapCommand/registries").then((dir) => {
      testDir = dir;
    }));

    it("should install packages from registry", (done) => {
      const bootstrapCommand = new BootstrapCommand([], {}, testDir);

      bootstrapCommand.runValidations();
      bootstrapCommand.runPreparations();

      bootstrapCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done.fail(err);

        try {
          expect(installedPackagesInDirectories(testDir)).toMatchSnapshot();
          expect(NpmUtilities.installInDir.mock.calls[0][2]).toEqual({
            npmClient: undefined,
            registry: "https://my-secure-registry/npm",
          });

          done();
        } catch (ex) {
          done.fail(ex);
        }
      }));
    });
  });

  describe("with remaining arguments", () => {
    describe("by default", () => {
      let testDir;

      beforeEach(() => initFixture("BootstrapCommand/npm-client-args-1").then((dir) => {
        testDir = dir;
      }));

      it("should turn it into npmClientArgs", (done) => {
        const bootstrapCommand = new BootstrapCommand(["--production", "--no-optional"], {}, testDir);

        bootstrapCommand.runValidations();
        bootstrapCommand.runPreparations();

        bootstrapCommand.runCommand(exitWithCode(0, (err) => {
          if (err) return done.fail(err);

          try {
            expect(NpmUtilities.installInDir.mock.calls[0][2]).toMatchObject({
              npmClientArgs: ["--production", "--no-optional"],
            });

            done();
          } catch (ex) {
            done.fail(ex);
          }
        }));
      });
    });

    describe("and configured npmClientArgs option", () => {
      let testDir;

      beforeEach(() => initFixture("BootstrapCommand/npm-client-args-2").then((dir) => {
        testDir = dir;
      }));

      it("should merge both together", (done) => {
        const bootstrapCommand = new BootstrapCommand(["--no-optional"], {}, testDir);

        bootstrapCommand.runValidations();
        bootstrapCommand.runPreparations();

        bootstrapCommand.runCommand(exitWithCode(0, (err) => {
          if (err) return done.fail(err);

          try {
            expect(NpmUtilities.installInDir.mock.calls[0][2]).toMatchObject({
              npmClientArgs: ["--production", "--no-optional"],
            });

            done();
          } catch (ex) {
            done.fail(ex);
          }
        }));
      });
    });
  });
});
