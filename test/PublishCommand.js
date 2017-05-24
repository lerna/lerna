import chalk from "chalk";
import fs from "fs-extra";
import log from "npmlog";
import normalizeNewline from "normalize-newline";
import path from "path";
import pathExists from "path-exists";

// mocked or stubbed modules
import writeJsonFile from "write-json-file";
import writePkg from "write-pkg";
import ConventionalCommitUtilities from "../src/ConventionalCommitUtilities";
import GitUtilities from "../src/GitUtilities";
import NpmUtilities from "../src/NpmUtilities";
import PromptUtilities from "../src/PromptUtilities";
import output from "../src/utils/output";

// helpers
import callsBack from "./helpers/callsBack";
import exitWithCode from "./helpers/exitWithCode";
import initFixture from "./helpers/initFixture";
import normalizeRelativeDir from "./helpers/normalizeRelativeDir";

// file under test
import PublishCommand from "../src/commands/PublishCommand";

jest.mock("write-json-file");
jest.mock("write-pkg");
jest.mock("../src/GitUtilities");
jest.mock("../src/NpmUtilities");
jest.mock("../src/PromptUtilities");
jest.mock("../src/utils/output");

// silence logs
log.level = "silent";

// keep snapshots stable cross-platform
chalk.enabled = false;

const execOpts = (testDir) =>
  expect.objectContaining({
    cwd: testDir,
  });

const consoleOutput = () =>
  output.mock.calls.map((args) => normalizeNewline(args[0]));

const publishedTagInDirectories = (testDir) =>
  NpmUtilities.publishTaggedInDir.mock.calls.reduce((arr, args) => {
    const tag = args[0];
    const dir = normalizeRelativeDir(testDir, args[1]);
    arr.push({ dir, tag });
    return arr;
  }, []);

const removedDistTagInDirectories = (testDir) =>
  NpmUtilities.removeDistTag.mock.calls.reduce((obj, args) => {
    const location = normalizeRelativeDir(testDir, args[0]);
    const tag = args[2];
    obj[location] = tag;
    return obj;
  }, {});

const addedDistTagInDirectories = (testDir) =>
  NpmUtilities.addDistTag.mock.calls.reduce((obj, args) => {
    const location = normalizeRelativeDir(testDir, args[0]);
    const pkg = args[1];
    const version = args[2];
    const tag = args[3];
    obj[location] = `${pkg}@${version} ${tag}`;
    return obj;
  }, {});

const gitAddedFiles = (testDir) =>
  GitUtilities.addFile.mock.calls.map((args) =>
    normalizeRelativeDir(testDir, args[0])
  );

const gitCommitMessage = () =>
  normalizeNewline(GitUtilities.commit.mock.calls[0][0]);

const gitTagsAdded = () =>
  GitUtilities.addTag.mock.calls.map((args) => args[0]);

const updatedLernaJson = () =>
  writeJsonFile.sync.mock.calls[0][1];

const updatedPackageVersions = (testDir) =>
  writePkg.sync.mock.calls.reduce((obj, args) => {
    const location = normalizeRelativeDir(testDir, path.dirname(args[0]));
    const version = args[1].version;
    obj[location] = version;
    return obj;
  }, {});

const updatedPackageJSON = (name) =>
  writePkg.sync.mock.calls.reduce((arr, args) => {
    if (args[1].name === name) {
      arr.push(args[1]);
    }
    return arr;
  }, []).pop();

describe("PublishCommand", () => {
  beforeEach(() => {
    // we've already tested these utilities elsewhere
    GitUtilities.isInitialized = jest.fn(() => true);
    GitUtilities.getCurrentBranch = jest.fn(() => "master");
    GitUtilities.getCurrentSHA = jest.fn(() => "deadbeefcafe");

    NpmUtilities.publishTaggedInDir = jest.fn(callsBack());
    NpmUtilities.checkDistTag = jest.fn(() => true);

    PromptUtilities.select = jest.fn(callsBack("1.0.1"));
    PromptUtilities.confirm = jest.fn(callsBack(true));
  });

  afterEach(() => jest.resetAllMocks());

  /** =========================================================================
   * NORMAL
   * ======================================================================= */

  describe("normal mode", () => {
    let testDir;

    beforeEach(() => initFixture("PublishCommand/normal").then((dir) => {
      testDir = dir;
    }));

    it("should publish the changed packages", (done) => {
      const publishCommand = new PublishCommand([], {}, testDir);

      publishCommand.runValidations();
      publishCommand.runPreparations();

      publishCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done.fail(err);

        try {
          if (pathExists.sync(path.join(testDir, "lerna-debug.log"))) {
            // TODO: there has to be a better way to do this
            throw new Error(fs.readFileSync(path.join(testDir, "lerna-debug.log"), "utf8"));
          }

          expect(PromptUtilities.select.mock.calls).toMatchSnapshot("[normal] prompt");
          expect(PromptUtilities.confirm).toBeCalled();

          expect(updatedLernaJson()).toMatchObject({ version: "1.0.1" });
          expect(updatedPackageVersions(testDir)).toMatchSnapshot("[normal] bumps package versions");

          expect(updatedPackageJSON("package-2").dependencies).toMatchObject({
            "package-1": "^1.0.1",
          });
          expect(updatedPackageJSON("package-3").devDependencies).toMatchObject({
            "package-2": "^1.0.1",
          });
          expect(updatedPackageJSON("package-4").dependencies).toMatchObject({
            "package-1": "^0.0.0",
          });
          expect(updatedPackageJSON("package-5").dependencies).toMatchObject({
            "package-1": "^1.0.1",
          });

          expect(gitAddedFiles(testDir)).toMatchSnapshot("[normal] git adds changed files");
          expect(gitCommitMessage()).toEqual("v1.0.1");
          expect(gitTagsAdded()).toEqual(["v1.0.1"]);

          expect(publishedTagInDirectories(testDir)).toMatchSnapshot("[normal] npm publish --tag");

          expect(GitUtilities.pushWithTags).lastCalledWith("origin", gitTagsAdded(), execOpts(testDir));
          expect(consoleOutput()).toMatchSnapshot("[normal] console output");

          done();
        } catch (ex) {
          done.fail(ex);
        }
      }));
    });
  });

  /** =========================================================================
   * INDEPENDENT
   * ======================================================================= */

  describe("independent mode", () => {
    let testDir;

    beforeEach(() => initFixture("PublishCommand/independent").then((dir) => {
      testDir = dir;
    }));

    it("should publish the changed packages in independent mode", (done) => {
      const publishCommand = new PublishCommand([], {
        independent: true
      }, testDir);

      publishCommand.runValidations();
      publishCommand.runPreparations();

      const promptReplies = [
        "1.0.1",
        "1.1.0",
        "2.0.0",
        "1.1.0",
      ];
      PromptUtilities.select = jest.fn((...args) => {
        const reply = promptReplies.shift();
        return callsBack(reply)(...args);
      });

      publishCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done.fail(err);

        try {
          if (pathExists.sync(path.join(testDir, "lerna-debug.log"))) {
            // TODO: there has to be a better way to do this
            throw new Error(fs.readFileSync(path.join(testDir, "lerna-debug.log"), "utf8"));
          }

          expect(PromptUtilities.confirm).toBeCalled();

          expect(writeJsonFile.sync).not.toBeCalled();
          expect(updatedPackageVersions(testDir)).toMatchSnapshot("[independent] bumps package versions");

          expect(updatedPackageJSON("package-2").dependencies).toMatchObject({
            "package-1": "^1.0.1",
          });
          expect(updatedPackageJSON("package-3").devDependencies).toMatchObject({
            "package-2": "^1.1.0",
          });
          expect(updatedPackageJSON("package-4").dependencies).toMatchObject({
            "package-1": "^0.0.0",
          });

          expect(gitAddedFiles(testDir)).toMatchSnapshot("[independent] git adds changed files");
          expect(gitCommitMessage()).toMatchSnapshot("[independent] git commit message");
          expect(gitTagsAdded()).toMatchSnapshot("[independent] git tags added");
          expect(GitUtilities.checkoutChanges).not.toBeCalled();

          expect(publishedTagInDirectories(testDir)).toMatchSnapshot("[independent] npm publish --tag");

          expect(GitUtilities.pushWithTags).lastCalledWith("origin", gitTagsAdded(), execOpts(testDir));
          expect(consoleOutput()).toMatchSnapshot("[independent] console output");

          done();
        } catch (ex) {
          done.fail(ex);
        }
      }));
    });
  });

  /** =========================================================================
   * NORMAL - CANARY
   * ======================================================================= */

  describe("normal mode as canary", () => {
    let testDir;

    beforeEach(() => initFixture("PublishCommand/normal").then((dir) => {
      testDir = dir;
    }));

    it("should publish the changed packages", (done) => {
      const publishCommand = new PublishCommand([], {
        canary: true
      }, testDir);

      publishCommand.runValidations();
      publishCommand.runPreparations();

      publishCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done.fail(err);

        try {
          if (pathExists.sync(path.join(testDir, "lerna-debug.log"))) {
            // TODO: there has to be a better way to do this
            throw new Error(fs.readFileSync(path.join(testDir, "lerna-debug.log"), "utf8"));
          }

          expect(PromptUtilities.select).not.toBeCalled();

          expect(writeJsonFile.sync).not.toBeCalled();
          expect(updatedPackageVersions(testDir)).toMatchSnapshot("[normal --canary] bumps package versions");

          expect(updatedPackageJSON("package-2").dependencies).toMatchObject({
            "package-1": "^1.0.0-alpha.deadbeef",
          });
          expect(updatedPackageJSON("package-3").devDependencies).toMatchObject({
            "package-2": "^1.0.0-alpha.deadbeef",
          });
          expect(updatedPackageJSON("package-4").dependencies).toMatchObject({
            "package-1": "^0.0.0",
          });

          expect(GitUtilities.addFile).not.toBeCalled();
          expect(GitUtilities.commit).not.toBeCalled();
          expect(GitUtilities.addTag).not.toBeCalled();
          expect(GitUtilities.checkoutChanges).lastCalledWith("packages/*/package.json", execOpts(testDir));

          expect(GitUtilities.pushWithTags).not.toBeCalled();
          expect(publishedTagInDirectories(testDir))
            .toMatchSnapshot("[normal --canary] npm publish --tag");

          done();
        } catch (ex) {
          done.fail(ex);
        }
      }));
    });
  });

  /** =========================================================================
   * INDEPENDENT - CANARY
   * ======================================================================= */

  describe("independent mode as canary", () => {
    let testDir;

    beforeEach(() => initFixture("PublishCommand/independent").then((dir) => {
      testDir = dir;
    }));

    it("should publish the changed packages", (done) => {
      const publishCommand = new PublishCommand([], {
        independent: true,
        canary: true
      }, testDir);

      publishCommand.runValidations();
      publishCommand.runPreparations();

      publishCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done.fail(err);

        try {
          if (pathExists.sync(path.join(testDir, "lerna-debug.log"))) {
            // TODO: there has to be a better way to do this
            throw new Error(fs.readFileSync(path.join(testDir, "lerna-debug.log"), "utf8"));
          }

          expect(PromptUtilities.select).not.toBeCalled();

          expect(writeJsonFile.sync).not.toBeCalled();
          expect(updatedPackageVersions(testDir))
            .toMatchSnapshot("[independent --canary] bumps package versions");

          expect(updatedPackageJSON("package-2").dependencies).toMatchObject({
            "package-1": "^1.0.0-alpha.deadbeef",
          });
          expect(updatedPackageJSON("package-3").devDependencies).toMatchObject({
            "package-2": "^2.0.0-alpha.deadbeef",
          });
          expect(updatedPackageJSON("package-4").dependencies).toMatchObject({
            "package-1": "^0.0.0",
          });

          expect(publishedTagInDirectories(testDir))
            .toMatchSnapshot("[independent --canary] npm publish --tag");

          done();
        } catch (ex) {
          done.fail(ex);
        }
      }));
    });
  });

  /** =========================================================================
   * NORMAL - SKIP GIT
   * ======================================================================= */

  describe("normal mode with --skip-git", () => {
    let testDir;

    beforeEach(() => initFixture("PublishCommand/normal").then((dir) => {
      testDir = dir;
    }));

    it("should publish the changed packages", (done) => {
      const publishCommand = new PublishCommand([], {
        skipGit: true
      }, testDir);

      publishCommand.runValidations();
      publishCommand.runPreparations();

      publishCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done.fail(err);

        try {
          if (pathExists.sync(path.join(testDir, "lerna-debug.log"))) {
            // TODO: there has to be a better way to do this
            throw new Error(fs.readFileSync(path.join(testDir, "lerna-debug.log"), "utf8"));
          }

          expect(GitUtilities.addFile).not.toBeCalled();
          expect(GitUtilities.commit).not.toBeCalled();
          expect(GitUtilities.addTag).not.toBeCalled();
          expect(GitUtilities.pushWithTags).not.toBeCalled();

          expect(publishedTagInDirectories(testDir)).toMatchSnapshot("[normal --skip-git] npm publish --tag");

          done();
        } catch (ex) {
          done.fail(ex);
        }
      }));
    });
  });

  /** =========================================================================
   * NORMAL - SKIP NPM
   * ======================================================================= */

  describe("normal mode with --skip-npm", () => {
    let testDir;

    beforeEach(() => initFixture("PublishCommand/normal").then((dir) => {
      testDir = dir;
    }));

    it("should update versions and push changes but not publish", (done) => {
      const publishCommand = new PublishCommand([], {
        skipNpm: true
      }, testDir);

      publishCommand.runValidations();
      publishCommand.runPreparations();

      publishCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done.fail(err);

        try {
          if (pathExists.sync(path.join(testDir, "lerna-debug.log"))) {
            // TODO: there has to be a better way to do this
            throw new Error(fs.readFileSync(path.join(testDir, "lerna-debug.log"), "utf8"));
          }

          expect(NpmUtilities.publishTaggedInDir).not.toBeCalled();
          expect(NpmUtilities.checkDistTag).not.toBeCalled();
          expect(NpmUtilities.removeDistTag).not.toBeCalled();
          expect(NpmUtilities.addDistTag).not.toBeCalled();

          expect(gitCommitMessage()).toEqual("v1.0.1");
          // FIXME
          // expect(GitUtilities.pushWithTags).lastCalledWith("origin", ["v1.0.1"]);

          done();
        } catch (ex) {
          done.fail(ex);
        }
      }));
    });
  });

  /** =========================================================================
   * NORMAL - SKIP GIT AND SKIP NPM
   * ======================================================================= */

  describe("normal mode with --skip-git and --skip-npm", () => {
    let testDir;

    beforeEach(() => initFixture("PublishCommand/normal").then((dir) => {
      testDir = dir;
    }));

    it("should update versions but not push changes or publish", (done) => {
      const publishCommand = new PublishCommand([], {
        skipGit: true,
        skipNpm: true
      }, testDir);

      publishCommand.runValidations();
      publishCommand.runPreparations();

      publishCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done.fail(err);

        try {
          if (pathExists.sync(path.join(testDir, "lerna-debug.log"))) {
            // TODO: there has to be a better way to do this
            throw new Error(fs.readFileSync(path.join(testDir, "lerna-debug.log"), "utf8"));
          }

          expect(updatedLernaJson()).toMatchObject({ version: "1.0.1" });
          expect(updatedPackageVersions(testDir))
            .toMatchSnapshot("[normal --skip-git --skip-npm] bumps package versions");

          expect(updatedPackageJSON("package-2").dependencies).toMatchObject({
            "package-1": "^1.0.1",
          });
          expect(updatedPackageJSON("package-3").devDependencies).toMatchObject({
            "package-2": "^1.0.1",
          });
          expect(updatedPackageJSON("package-4").dependencies).toMatchObject({
            "package-1": "^0.0.0",
          });
          expect(updatedPackageJSON("package-5").dependencies).toMatchObject({
            "package-1": "^1.0.1",
          });

          expect(GitUtilities.addFile).not.toBeCalled();
          expect(GitUtilities.commit).not.toBeCalled();
          expect(GitUtilities.addTag).not.toBeCalled();
          expect(GitUtilities.pushWithTags).not.toBeCalled();

          expect(NpmUtilities.publishTaggedInDir).not.toBeCalled();
          expect(NpmUtilities.checkDistTag).not.toBeCalled();
          expect(NpmUtilities.removeDistTag).not.toBeCalled();
          expect(NpmUtilities.addDistTag).not.toBeCalled();

          done();
        } catch (ex) {
          done.fail(ex);
        }
      }));
    });
  });

  /** =========================================================================
   * NORMAL - TEMP TAG
   * ======================================================================= */

  describe("normal mode with --temp-tag", () => {
    let testDir;

    beforeEach(() => initFixture("PublishCommand/normal").then((dir) => {
      testDir = dir;
    }));

    it("should publish the changed packages with a temp tag", (done) => {
      const publishCommand = new PublishCommand([], {
        tempTag: true
      }, testDir);

      publishCommand.runValidations();
      publishCommand.runPreparations();

      publishCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done.fail(err);

        try {
          if (pathExists.sync(path.join(testDir, "lerna-debug.log"))) {
            // TODO: there has to be a better way to do this
            throw new Error(fs.readFileSync(path.join(testDir, "lerna-debug.log"), "utf8"));
          }

          expect(publishedTagInDirectories(testDir)).toMatchSnapshot("[normal --temp-tag] npm publish --tag");
          expect(removedDistTagInDirectories(testDir)).toMatchSnapshot("[normal --temp-tag] npm dist-tag rm");
          expect(addedDistTagInDirectories(testDir)).toMatchSnapshot("[normal --temp-tag] npm dist-tag add");

          expect(GitUtilities.pushWithTags).lastCalledWith("origin", ["v1.0.1"], execOpts(testDir));

          done();
        } catch (ex) {
          done.fail(ex);
        }
      }));
    });
  });

  /** =========================================================================
   * NORMAL - NPM TAG
   * ======================================================================= */

  describe("normal mode with --npm-tag", () => {
    let testDir;

    beforeEach(() => initFixture("PublishCommand/normal").then((dir) => {
      testDir = dir;
    }));

    it("should publish the changed packages with npm tag", (done) => {
      const publishCommand = new PublishCommand([], {
        npmTag: "custom"
      }, testDir);

      publishCommand.runValidations();
      publishCommand.runPreparations();

      publishCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done.fail(err);

        try {
          if (pathExists.sync(path.join(testDir, "lerna-debug.log"))) {
            // TODO: there has to be a better way to do this
            throw new Error(fs.readFileSync(path.join(testDir, "lerna-debug.log"), "utf8"));
          }

          expect(publishedTagInDirectories(testDir)).toMatchSnapshot("[normal --npm-tag] npm publish --tag");

          done();
        } catch (ex) {
          done.fail(ex);
        }
      }));
    });
  });

  /** =========================================================================
   * AUTO-ACCEPT
   * ======================================================================= */

  describe("with --yes", () => {
    it("skips confirmation prompt", (done) => {
      const publishCommand = new PublishCommand([], {
        yes: true
      });
      publishCommand.updates = [];
      publishCommand.confirmVersions((err) => {
        if (err) return done.fail(err);

        try {
          expect(PromptUtilities.confirm).not.toBeCalled();

          done();
        } catch (ex) {
          done.fail(ex);
        }
      });
    });
  });

  /** =========================================================================
   * NORMAL - REGISTRY
   * ======================================================================= */

  describe("normal mode with --registry", () => {
    let testDir;

    beforeEach(() => initFixture("PublishCommand/normal").then((dir) => {
      testDir = dir;
    }));

    it("passes registry to npm commands", (done) => {
      const registry = "https://my-private-registry";
      const publishCommand = new PublishCommand([], {
        registry,
      }, testDir);

      publishCommand.runValidations();
      publishCommand.runPreparations();

      publishCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done.fail(err);

        try {
          if (pathExists.sync(path.join(testDir, "lerna-debug.log"))) {
            // TODO: there has to be a better way to do this
            throw new Error(fs.readFileSync(path.join(testDir, "lerna-debug.log"), "utf8"));
          }

          expect(NpmUtilities.checkDistTag).not.toBeCalled();
          expect(NpmUtilities.removeDistTag).not.toBeCalled();
          expect(NpmUtilities.addDistTag).not.toBeCalled();
          expect(publishedTagInDirectories(testDir))
            .toMatchSnapshot("[normal --registry] npm publish --tag");

          done();
        } catch (ex) {
          done.fail(ex);
        }
      }));
    });
  });

  /** =========================================================================
   * NORMAL - REPO VERSION
   * ======================================================================= */

  describe("normal mode with --repo-version", () => {
    let testDir;

    beforeEach(() => initFixture("PublishCommand/normal").then((dir) => {
      testDir = dir;
    }));

    it("skips version prompt and publishes changed packages with designated version", (done) => {
      const publishCommand = new PublishCommand([], {
        repoVersion: "1.0.1-beta"
      }, testDir);

      publishCommand.runValidations();
      publishCommand.runPreparations();

      publishCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done.fail(err);

        try {
          if (pathExists.sync(path.join(testDir, "lerna-debug.log"))) {
            // TODO: there has to be a better way to do this
            throw new Error(fs.readFileSync(path.join(testDir, "lerna-debug.log"), "utf8"));
          }

          expect(PromptUtilities.select).not.toBeCalled();
          expect(updatedLernaJson()).toMatchObject({ version: "1.0.1-beta" });

          done();
        } catch (ex) {
          done.fail(ex);
        }
      }));
    });
  });

  /** =========================================================================
   * NORMAL - EXACT
   * ======================================================================= */

  describe("normal mode with --exact", () => {
    let testDir;

    beforeEach(() => initFixture("PublishCommand/normal").then((dir) => {
      testDir = dir;
    }));

    it("updates matching local dependencies of published packages with exact versions", (done) => {
      const publishCommand = new PublishCommand([], {
        exact: true
      }, testDir);

      publishCommand.runValidations();
      publishCommand.runPreparations();

      publishCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done.fail(err);

        try {
          if (pathExists.sync(path.join(testDir, "lerna-debug.log"))) {
            // TODO: there has to be a better way to do this
            throw new Error(fs.readFileSync(path.join(testDir, "lerna-debug.log"), "utf8"));
          }

          expect(updatedPackageJSON("package-2").dependencies).toMatchObject({
            "package-1": "1.0.1",
          });
          expect(updatedPackageJSON("package-3").devDependencies).toMatchObject({
            "package-2": "1.0.1",
          });
          // package-4's dependency on package-1 remains semver because
          // it does not match the version of package-1 being published
          expect(updatedPackageJSON("package-4").dependencies).toMatchObject({
            "package-1": "^0.0.0",
          });
          expect(updatedPackageJSON("package-5").dependencies).toMatchObject({
            "package-1": "1.0.1",
          });

          done();
        } catch (ex) {
          done.fail(ex);
        }
      }));
    });
  });

  /** =========================================================================
   * NORMAL MODE - CD VERSION
   * ======================================================================= */

  describe("normal mode with --cd-version", () => {
    let testDir;

    beforeEach(() => initFixture("PublishCommand/normal").then((dir) => {
      testDir = dir;
    }));

    it("should use semver increments when passed to cdVersion flag", (done) => {
      const publishCommand = new PublishCommand([], {
        cdVersion: "minor"
      }, testDir);

      publishCommand.runValidations();
      publishCommand.runPreparations();

      publishCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done.fail(err);

        try {
          if (pathExists.sync(path.join(testDir, "lerna-debug.log"))) {
            // TODO: there has to be a better way to do this
            throw new Error(fs.readFileSync(path.join(testDir, "lerna-debug.log"), "utf8"));
          }

          expect(PromptUtilities.select).not.toBeCalled();
          expect(gitCommitMessage()).toBe("v1.1.0");

          done();
        } catch (ex) {
          done.fail(ex);
        }
      }));
    });
  });

  /** =========================================================================
   * INDEPENDENT - CD VERSION
   * ======================================================================= */

  describe("indepdendent mode with --cd-version", () => {
    let testDir;

    beforeEach(() => initFixture("PublishCommand/independent").then((dir) => {
      testDir = dir;
    }));

    it("should use semver increments when passed to cdVersion flag", (done) => {
      const publishCommand = new PublishCommand([], {
        independent: true,
        cdVersion: "patch"
      }, testDir);

      publishCommand.runValidations();
      publishCommand.runPreparations();

      publishCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done.fail(err);

        try {
          if (pathExists.sync(path.join(testDir, "lerna-debug.log"))) {
            // TODO: there has to be a better way to do this
            throw new Error(fs.readFileSync(path.join(testDir, "lerna-debug.log"), "utf8"));
          }

          expect(PromptUtilities.select).not.toBeCalled();
          expect(gitCommitMessage()).toMatchSnapshot("[independent --cd-version] git commit message");

          done();
        } catch (ex) {
          done.fail(ex);
        }
      }));
    });
  });

  /** =========================================================================
   * NORMAL - GIT REMOTE
   * ======================================================================= */

  describe("normal mode with --git-remote", () => {
    let testDir;

    beforeEach(() => initFixture("PublishCommand/normal").then((dir) => {
      testDir = dir;
    }));

    it("pushes tags to specified remote", (done) => {
      const publishCommand = new PublishCommand([], {
        gitRemote: "upstream"
      }, testDir);

      publishCommand.runValidations();
      publishCommand.runPreparations();

      publishCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done.fail(err);

        try {
          if (pathExists.sync(path.join(testDir, "lerna-debug.log"))) {
            // TODO: there has to be a better way to do this
            throw new Error(fs.readFileSync(path.join(testDir, "lerna-debug.log"), "utf8"));
          }

          expect(GitUtilities.pushWithTags).lastCalledWith("upstream", ["v1.0.1"], execOpts(testDir));

          done();
        } catch (ex) {
          done.fail(ex);
        }
      }));
    });
  });

  /** =========================================================================
   * NORMAL - GIT REMOTE
   * ======================================================================= */

  describe("normal mode with --ignore", () => {
    let testDir;

    beforeEach(() => initFixture("PublishCommand/normal").then((dir) => {
      testDir = dir;
    }));

    it("does not publish ignored packages", (done) => {
      const publishCommand = new PublishCommand([], {
        ignore: ["package-2", "package-3", "package-4"],
      }, testDir);

      publishCommand.runValidations();
      publishCommand.runPreparations();

      publishCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done.fail(err);

        try {
          if (pathExists.sync(path.join(testDir, "lerna-debug.log"))) {
            // TODO: there has to be a better way to do this
            throw new Error(fs.readFileSync(path.join(testDir, "lerna-debug.log"), "utf8"));
          }

          expect(gitAddedFiles(testDir)).toMatchSnapshot("[normal --ignore] git adds changed files");
          expect(publishedTagInDirectories(testDir)).toMatchSnapshot("[normal --ignore] npm publish --tag");

          done();
        } catch (ex) {
          done.fail(ex);
        }
      }));
    });
  });

  /** =========================================================================
   * NORMAL - MESSAGE
   * ======================================================================= */

  describe("normal mode with --message", () => {
    let testDir;

    beforeEach(() => initFixture("PublishCommand/normal").then((dir) => {
      testDir = dir;
    }));

    it("commits changes with a custom message", (done) => {
      const publishCommand = new PublishCommand([], {
        message: "A custom publish message"
      }, testDir);

      publishCommand.runValidations();
      publishCommand.runPreparations();

      publishCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done.fail(err);

        try {
          if (pathExists.sync(path.join(testDir, "lerna-debug.log"))) {
            // TODO: there has to be a better way to do this
            throw new Error(fs.readFileSync(path.join(testDir, "lerna-debug.log"), "utf8"));
          }

          expect(GitUtilities.commit).lastCalledWith("A custom publish message", execOpts(testDir));

          done();
        } catch (ex) {
          done.fail(ex);
        }
      }));
    });
  });

  /** =========================================================================
   * INDEPENDENT - MESSAGE
   * ======================================================================= */

  describe("independent mode with --message", () => {
    let testDir;

    beforeEach(() => initFixture("PublishCommand/independent").then((dir) => {
      testDir = dir;
    }));

    it("commits changes with a custom message", (done) => {
      const publishCommand = new PublishCommand([], {
        independent: true,
        message: "chore: Custom publish message"
      }, testDir);

      publishCommand.runValidations();
      publishCommand.runPreparations();

      publishCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done.fail(err);

        try {
          if (pathExists.sync(path.join(testDir, "lerna-debug.log"))) {
            // TODO: there has to be a better way to do this
            throw new Error(fs.readFileSync(path.join(testDir, "lerna-debug.log"), "utf8"));
          }

          expect(GitUtilities.commit).lastCalledWith(
            expect.stringContaining("chore:"),
            execOpts(testDir)
          );
          expect(gitCommitMessage()).toMatchSnapshot("[independent --message] git commit message");

          done();
        } catch (ex) {
          done.fail(ex);
        }
      }));
    });
  });

  /** =========================================================================
   * INDEPENDENT - CONVENTIONAL COMMITS
   * ======================================================================= */

  describe("independent mode with --conventional-commits", () => {
    const recommendVersion = ConventionalCommitUtilities.recommendVersion;
    const updateChangelog = ConventionalCommitUtilities.updateChangelog;

    let testDir;

    beforeEach(() => initFixture("PublishCommand/independent").then((dir) => {
      testDir = dir;

      const reccomendReplies = [
        "1.0.1",
        "1.1.0",
        "2.0.0",
        "1.1.0",
      ];
      ConventionalCommitUtilities.recommendVersion = jest.fn(() => reccomendReplies.shift());
      ConventionalCommitUtilities.updateChangelog = jest.fn();
    }));

    afterEach(() => {
      ConventionalCommitUtilities.recommendVersion = recommendVersion;
      ConventionalCommitUtilities.updateChangelog = updateChangelog;
    });

    it("should use conventional-commits utility to guess version bump and generate CHANGELOG", (done) => {
      const publishCommand = new PublishCommand([], {
        independent: true,
        conventionalCommits: true
      }, testDir);

      publishCommand.runValidations();
      publishCommand.runPreparations();

      publishCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done.fail(err);

        try {
          if (pathExists.sync(path.join(testDir, "lerna-debug.log"))) {
            // TODO: there has to be a better way to do this
            throw new Error(fs.readFileSync(path.join(testDir, "lerna-debug.log"), "utf8"));
          }

          expect(gitAddedFiles(testDir))
            .toMatchSnapshot("[independent --conventional-commits] git adds changed files");
          expect(gitCommitMessage())
            .toMatchSnapshot("[independent --conventional-commits] git commit message");

          [
            ["package-1", "1.0.0"],
            ["package-2", "2.0.0"],
            ["package-3", "3.0.0"],
            ["package-4", "4.0.0"],
          ].forEach(([name, version]) => {
            const location = path.join(testDir, "packages", name);

            expect(ConventionalCommitUtilities.recommendVersion).toBeCalledWith(
              expect.objectContaining({ name, version }),
              execOpts(testDir)
            );
            expect(ConventionalCommitUtilities.updateChangelog).toBeCalledWith(
              expect.objectContaining({ name, location }),
              execOpts(testDir)
            );
          });

          done();
        } catch (ex) {
          done.fail(ex);
        }
      }));
    });
  });

  /** =========================================================================
   * INDEPENDENT - CANARY + NPMTAG + YES + EXACT
   * ======================================================================= */

  describe("independent mode --canary --npm-tag=next --yes --exact", () => {
    let testDir;

    beforeEach(() => initFixture("PublishCommand/independent").then((dir) => {
      testDir = dir;
    }));

    it("should publish the changed packages", (done) => {
      const publishCommand = new PublishCommand([], {
        independent: true,
        canary: true,
        npmTag: "next",
        yes: true,
        exact: true,
      }, testDir);

      publishCommand.runValidations();
      publishCommand.runPreparations();

      publishCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done.fail(err);

        try {
          if (pathExists.sync(path.join(testDir, "lerna-debug.log"))) {
            // TODO: there has to be a better way to do this
            throw new Error(fs.readFileSync(path.join(testDir, "lerna-debug.log"), "utf8"));
          }

          expect(publishedTagInDirectories(testDir))
            .toMatchSnapshot("[independent --canary --npm-tag=next --yes --exact] npm publish --tag");

          done();
        } catch (ex) {
          done.fail(ex);
        }
      }));
    });
  });
});
