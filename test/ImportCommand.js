import execa from "execa";
import fs from "fs-extra";
import log from "npmlog";
import path from "path";
import pathExists from "path-exists";

// mocked or stubbed modules
import PromptUtilities from "../src/PromptUtilities";

// helpers
import callsBack from "./helpers/callsBack";
import exitWithCode from "./helpers/exitWithCode";
import initFixture from "./helpers/initFixture";
import updateLernaConfig from "./helpers/updateLernaConfig";

// file under test
import ImportCommand from "../src/commands/ImportCommand";

jest.mock("../src/PromptUtilities");

// silence logs
log.level = "silent";

const lastCommitInDir = (cwd) =>
  execa.sync("git", ["log", "-1", "--format=%s"], { cwd }).stdout;

describe("ImportCommand", () => {
  beforeEach(() => {
    PromptUtilities.confirm = jest.fn(callsBack(true));
  });

  afterEach(() => jest.resetAllMocks());

  describe("import", () => {
    let testDir;
    let externalDir;

    beforeEach(() =>
      Promise.all([
        initFixture("ImportCommand/external", "Init external commit"),
        initFixture("ImportCommand/basic"),
      ]).then(([extDir, basicDir]) => {
        externalDir = extDir;
        testDir = basicDir;
      })
    );

    it("creates a module in packages location with imported commit history", (done) => {
      const importCommand = new ImportCommand([externalDir], {}, testDir);

      importCommand.runValidations();
      importCommand.runPreparations();

      importCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done.fail(err);

        try {
          expect(!pathExists.sync(path.join(testDir, "lerna-debug.log"))).toBe(true);

          expect(lastCommitInDir(testDir)).toBe("Init external commit");

          const packageJson = path.join(testDir, "packages", path.basename(externalDir), "package.json");
          expect(pathExists.sync(packageJson)).toBe(true);

          done();
        } catch (ex) {
          done.fail(ex);
        }
      }));
    });

    it("works with --max-buffer", (done) => {
      const ONE_HUNDRED_MEGABYTES = 1000 * 1000 * 100;
      const importCommand = new ImportCommand([externalDir], {
        maxBuffer: ONE_HUNDRED_MEGABYTES,
      }, testDir);

      importCommand.runValidations();
      importCommand.runPreparations();

      importCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done.fail(err);

        try {
          expect(importCommand.execOpts).toHaveProperty("maxBuffer", ONE_HUNDRED_MEGABYTES);
          expect(importCommand.externalExecOpts).toHaveProperty("maxBuffer", ONE_HUNDRED_MEGABYTES);

          done();
        } catch (ex) {
          done.fail(ex);
        }
      }));
    });

    it("supports moved files within the external repo", (done) => {
      execa.sync("git", ["mv", "old-file", "new-file"], { cwd: externalDir });
      execa.sync("git", ["commit", "-m", "Moved old-file to new-file"], { cwd: externalDir });

      const importCommand = new ImportCommand([externalDir], {}, testDir);

      importCommand.runValidations();
      importCommand.runPreparations();

      importCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done.fail(err);

        try {
          expect(lastCommitInDir(testDir)).toBe("Moved old-file to new-file");

          const newFilePath = path.join(testDir, "packages", path.basename(externalDir), "new-file");
          expect(pathExists.sync(newFilePath)).toBe(true);

          done();
        } catch (ex) {
          done.fail(ex);
        }
      }));
    });

    it("allows skipping confirmation prompt", (done) => {
      const importCommand = new ImportCommand([externalDir], {
        yes: true
      }, testDir);

      importCommand.runValidations();
      importCommand.runPreparations();

      importCommand.initialize(done);
    });

    it("errors without an argument", (done) => {
      const importCommand = new ImportCommand([], {}, testDir);

      importCommand.runValidations();
      importCommand.runPreparations();

      importCommand.runCommand(exitWithCode(1, (err) => {
        try {
          expect(err).toHaveProperty("message", "Missing argument: Path to external repository");
          done();
        } catch (ex) {
          done.fail(ex);
        }
      }));
    });

    it("errors when external directory is missing", (done) => {
      const missing = externalDir + "_invalidSuffix";
      const importCommand = new ImportCommand([missing], {}, testDir);

      importCommand.runValidations();
      importCommand.runPreparations();

      importCommand.runCommand(exitWithCode(1, (err) => {
        try {
          expect(err).toHaveProperty("message", `No repository found at "${missing}"`);
          done();
        } catch (ex) {
          done.fail(ex);
        }
      }));
    });

    it("errors when external package.json is missing", (done) => {
      fs.unlinkSync(path.join(externalDir, "package.json"));

      const importCommand = new ImportCommand([externalDir], {}, testDir);

      importCommand.runValidations();
      importCommand.runPreparations();

      importCommand.runCommand(exitWithCode(1, (err) => {
        try {
          expect(err.message).toMatch("package.json");
          expect(err.code).toBe("MODULE_NOT_FOUND");
          done();
        } catch (ex) {
          done.fail(ex);
        }
      }));
    });

    it("errors when external package.json has no name property", (done) => {
      const importCommand = new ImportCommand([externalDir], {}, testDir);

      const packageJson = path.join(externalDir, "package.json");

      fs.writeFileSync(packageJson, "{}");

      importCommand.runValidations();
      importCommand.runPreparations();

      importCommand.runCommand(exitWithCode(1, (err) => {
        try {
          expect(err).toHaveProperty("message", `No package name specified in "${packageJson}"`);
          done();
        } catch (ex) {
          done.fail(ex);
        }
      }));
    });

    it("errors if target directory exists", (done) => {
      const targetDir = path.join(testDir, "packages", path.basename(externalDir));

      fs.ensureDirSync(targetDir);

      const importCommand = new ImportCommand([externalDir], {}, testDir);

      importCommand.runValidations();
      importCommand.runPreparations();

      importCommand.runCommand(exitWithCode(1, (err) => {
        try {
          const relativePath = path.relative(testDir, targetDir);
          expect(err).toHaveProperty("message", `Target directory already exists "${relativePath}"`);
          done();
        } catch (ex) {
          done.fail(ex);
        }
      }));
    });

    it("infers correct target directory given packages glob", (done) => {
      const targetDir = path.join(testDir, "pkg", path.basename(externalDir));

      fs.ensureDirSync(targetDir);

      updateLernaConfig(testDir, {
        packages: ["pkg/*"],
      });

      const importCommand = new ImportCommand([externalDir], {}, testDir);

      importCommand.runValidations();
      importCommand.runPreparations();

      importCommand.runCommand(exitWithCode(1, (err) => {
        try {
          const relativePath = path.relative(testDir, targetDir);
          expect(err).toHaveProperty("message", `Target directory already exists "${relativePath}"`);
          done();
        } catch (ex) {
          done.fail(ex);
        }
      }));
    });

    it("errors if repo has uncommitted changes", (done) => {
      const uncommittedFile = path.join(testDir, "uncommittedFile");

      fs.writeFileSync(uncommittedFile, "stuff");
      execa.sync("git", ["add", uncommittedFile], { cwd: testDir });

      const importCommand = new ImportCommand([externalDir], {}, testDir);

      importCommand.runValidations();
      importCommand.runPreparations();

      importCommand.runCommand(exitWithCode(1, (err) => {
        try {
          expect(err).toHaveProperty("message", "Local repository has un-committed changes");
          done();
        } catch (ex) {
          done.fail(ex);
        }
      }));
    });
  });
});
