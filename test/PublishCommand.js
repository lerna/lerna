import chalk from "chalk";
import log from "npmlog";
import normalizeNewline from "normalize-newline";
import path from "path";

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
import initFixture from "./helpers/initFixture";
import normalizeRelativeDir from "./helpers/normalizeRelativeDir";
import yargsRunner from "./helpers/yargsRunner";

// file under test
import * as commandModule from "../src/commands/PublishCommand";

const PublishCommand = commandModule.default;
const run = yargsRunner(commandModule);

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

const execOpts = testDir =>
  expect.objectContaining({
    cwd: testDir,
  });

const consoleOutput = () => output.mock.calls.map(args => normalizeNewline(args[0]));

const publishedTagInDirectories = testDir =>
  NpmUtilities.publishTaggedInDir.mock.calls.reduce((arr, args) => {
    const tag = args[0];
    const dir = normalizeRelativeDir(testDir, args[1].location);
    arr.push({ dir, tag });
    return arr;
  }, []);

const removedDistTagInDirectories = testDir =>
  NpmUtilities.removeDistTag.mock.calls.reduce((obj, args) => {
    const location = normalizeRelativeDir(testDir, args[0]);
    const tag = args[2];
    obj[location] = tag;
    return obj;
  }, {});

const addedDistTagInDirectories = testDir =>
  NpmUtilities.addDistTag.mock.calls.reduce((obj, args) => {
    const location = normalizeRelativeDir(testDir, args[0]);
    const pkg = args[1];
    const version = args[2];
    const tag = args[3];
    obj[location] = `${pkg}@${version} ${tag}`;
    return obj;
  }, {});

const gitAddedFiles = testDir =>
  GitUtilities.addFile.mock.calls.map(args => normalizeRelativeDir(testDir, args[0]));

const gitCommitMessage = () => normalizeNewline(GitUtilities.commit.mock.calls[0][0]);

const gitTagsAdded = () => GitUtilities.addTag.mock.calls.map(args => args[0]);

const updatedLernaJson = () => writeJsonFile.sync.mock.calls[0][1];

const updatedPackageVersions = testDir =>
  writePkg.sync.mock.calls.reduce((obj, args) => {
    const location = normalizeRelativeDir(testDir, path.dirname(args[0]));
    obj[location] = args[1].version;
    return obj;
  }, {});

const updatedPackageJSON = name =>
  writePkg.sync.mock.calls
    .reduce((arr, args) => {
      if (args[1].name === name) {
        arr.push(args[1]);
      }
      return arr;
    }, [])
    .pop();

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

    beforeEach(() =>
      initFixture("PublishCommand/normal").then(dir => {
        testDir = dir;
      })
    );

    it("should publish the changed packages", () =>
      run(testDir)().then(() => {
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
        // peerDependencies are _never_ modified automatically
        expect(updatedPackageJSON("package-3").peerDependencies).toMatchObject({
          "package-2": "^1.0.0",
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
      }));

    it("throws an error when --independent is passed", () =>
      run(testDir)("--independent").catch(error => {
        expect(error.exitCode).toBe(1);
      }));
  });

  /** =========================================================================
   * INDEPENDENT
   * ======================================================================= */

  describe("independent mode", () => {
    let testDir;

    beforeEach(() =>
      initFixture("PublishCommand/independent").then(dir => {
        testDir = dir;
      })
    );

    it("should publish the changed packages in independent mode", () => {
      const promptReplies = ["1.0.1", "1.1.0", "2.0.0", "1.1.0", "1.0.1"];
      PromptUtilities.select = jest.fn((...args) => {
        const reply = promptReplies.shift();
        return callsBack(reply)(...args);
      });

      return run(testDir)(
        "--independent" // not required due to lerna.json config, but here to assert it doesn't error
      ).then(() => {
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
        expect(updatedPackageJSON("package-5").dependencies).toMatchObject({
          "package-3": "^2.0.0",
        });

        expect(gitAddedFiles(testDir)).toMatchSnapshot("[independent] git adds changed files");
        expect(gitCommitMessage()).toMatchSnapshot("[independent] git commit message");
        expect(gitTagsAdded()).toMatchSnapshot("[independent] git tags added");
        expect(GitUtilities.checkoutChanges).not.toBeCalled();

        expect(publishedTagInDirectories(testDir)).toMatchSnapshot("[independent] npm publish --tag");

        expect(GitUtilities.pushWithTags).lastCalledWith("origin", gitTagsAdded(), execOpts(testDir));
        expect(consoleOutput()).toMatchSnapshot("[independent] console output");
      });
    });
  });

  /** =========================================================================
   * NORMAL - CANARY
   * ======================================================================= */

  describe("normal mode as canary", () => {
    let testDir;

    beforeEach(() =>
      initFixture("PublishCommand/normal").then(dir => {
        testDir = dir;
      })
    );

    it("should publish the changed packages", () =>
      run(testDir)("--canary").then(() => {
        expect(PromptUtilities.select).not.toBeCalled();

        expect(writeJsonFile.sync).not.toBeCalled();
        expect(updatedPackageVersions(testDir)).toMatchSnapshot("[normal --canary] bumps package versions");

        expect(updatedPackageJSON("package-2").dependencies).toMatchObject({
          "package-1": "^1.1.0-alpha.deadbeef",
        });
        expect(updatedPackageJSON("package-3").devDependencies).toMatchObject({
          "package-2": "^1.1.0-alpha.deadbeef",
        });
        expect(updatedPackageJSON("package-4").dependencies).toMatchObject({
          "package-1": "^0.0.0",
        });

        expect(GitUtilities.addFile).not.toBeCalled();
        expect(GitUtilities.commit).not.toBeCalled();
        expect(GitUtilities.addTag).not.toBeCalled();
        expect(GitUtilities.checkoutChanges).lastCalledWith(
          expect.stringContaining("packages/*/package.json"),
          execOpts(testDir)
        );

        expect(GitUtilities.pushWithTags).not.toBeCalled();
        expect(publishedTagInDirectories(testDir)).toMatchSnapshot("[normal --canary] npm publish --tag");
      }));

    it("should use the provided value as the meta suffix", () =>
      run(testDir)("--canary", "beta").then(() => {
        expect(updatedPackageVersions(testDir)).toMatchSnapshot(
          "[normal --canary=beta] bumps package versions"
        );

        expect(updatedPackageJSON("package-2").dependencies).toMatchObject({
          "package-1": "^1.1.0-beta.deadbeef",
        });
        expect(updatedPackageJSON("package-3").devDependencies).toMatchObject({
          "package-2": "^1.1.0-beta.deadbeef",
        });
        expect(updatedPackageJSON("package-4").dependencies).toMatchObject({
          "package-1": "^0.0.0",
        });
      }));

    it("should work with --canary and --cd-version=patch", () =>
      run(testDir)("--canary", "--cd-version", "patch").then(() => {
        expect(updatedPackageVersions(testDir)).toMatchSnapshot(
          "[normal --canary --cd-version=patch] bumps package versions"
        );

        expect(updatedPackageJSON("package-2").dependencies).toMatchObject({
          "package-1": "^1.0.1-alpha.deadbeef",
        });
        expect(updatedPackageJSON("package-3").devDependencies).toMatchObject({
          "package-2": "^1.0.1-alpha.deadbeef",
        });
        expect(updatedPackageJSON("package-4").dependencies).toMatchObject({
          "package-1": "^0.0.0",
        });
      }));
  });

  /** =========================================================================
   * INDEPENDENT - CANARY
   * ======================================================================= */

  describe("independent mode as canary", () => {
    let testDir;

    beforeEach(() =>
      initFixture("PublishCommand/independent").then(dir => {
        testDir = dir;
      })
    );

    it("should publish the changed packages", () =>
      run(testDir)("--canary").then(() => {
        expect(PromptUtilities.select).not.toBeCalled();

        expect(writeJsonFile.sync).not.toBeCalled();
        expect(updatedPackageVersions(testDir)).toMatchSnapshot(
          "[independent --canary] bumps package versions"
        );

        expect(updatedPackageJSON("package-2").dependencies).toMatchObject({
          "package-1": "^1.1.0-alpha.deadbeef",
        });
        expect(updatedPackageJSON("package-3").devDependencies).toMatchObject({
          "package-2": "^2.1.0-alpha.deadbeef",
        });
        expect(updatedPackageJSON("package-4").dependencies).toMatchObject({
          "package-1": "^0.0.0",
        });

        expect(publishedTagInDirectories(testDir)).toMatchSnapshot(
          "[independent --canary] npm publish --tag"
        );
      }));

    it("should use the provided value as the meta suffix", () =>
      run(testDir)("--canary", "beta").then(() => {
        expect(updatedPackageJSON("package-2").dependencies).toMatchObject({
          "package-1": "^1.1.0-beta.deadbeef",
        });
        expect(updatedPackageJSON("package-3").devDependencies).toMatchObject({
          "package-2": "^2.1.0-beta.deadbeef",
        });
        expect(updatedPackageJSON("package-4").dependencies).toMatchObject({
          "package-1": "^0.0.0",
        });
      }));
  });

  /** =========================================================================
   * NORMAL - SKIP GIT
   * ======================================================================= */

  describe("normal mode with --skip-git", () => {
    let testDir;

    beforeEach(() =>
      initFixture("PublishCommand/normal").then(dir => {
        testDir = dir;
      })
    );

    it("should publish the changed packages", () =>
      run(testDir)("--skip-git").then(() => {
        expect(GitUtilities.addFile).not.toBeCalled();
        expect(GitUtilities.commit).not.toBeCalled();
        expect(GitUtilities.addTag).not.toBeCalled();
        expect(GitUtilities.pushWithTags).not.toBeCalled();

        expect(publishedTagInDirectories(testDir)).toMatchSnapshot("[normal --skip-git] npm publish --tag");
      }));
  });

  /** =========================================================================
   * NORMAL - SKIP NPM
   * ======================================================================= */

  describe("normal mode with --skip-npm", () => {
    let testDir;

    beforeEach(() =>
      initFixture("PublishCommand/normal").then(dir => {
        testDir = dir;
      })
    );

    it("should update versions and push changes but not publish", () =>
      run(testDir)("--skip-npm").then(() => {
        expect(NpmUtilities.publishTaggedInDir).not.toBeCalled();
        expect(NpmUtilities.checkDistTag).not.toBeCalled();
        expect(NpmUtilities.removeDistTag).not.toBeCalled();
        expect(NpmUtilities.addDistTag).not.toBeCalled();

        expect(gitCommitMessage()).toEqual("v1.0.1");
        // FIXME
        // expect(GitUtilities.pushWithTags).lastCalledWith("origin", ["v1.0.1"]);
      }));
  });

  /** =========================================================================
   * NORMAL - SKIP GIT AND SKIP NPM
   * ======================================================================= */

  describe("normal mode with --skip-git and --skip-npm", () => {
    let testDir;

    beforeEach(() =>
      initFixture("PublishCommand/normal").then(dir => {
        testDir = dir;
      })
    );

    it("should update versions but not push changes or publish", () =>
      run(testDir)("--skip-git", "--skip-npm").then(() => {
        expect(updatedLernaJson()).toMatchObject({ version: "1.0.1" });
        expect(updatedPackageVersions(testDir)).toMatchSnapshot(
          "[normal --skip-git --skip-npm] bumps package versions"
        );

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
      }));
  });

  /** =========================================================================
   * NORMAL - TEMP TAG
   * ======================================================================= */

  describe("normal mode with --temp-tag", () => {
    let testDir;

    beforeEach(() =>
      initFixture("PublishCommand/normal").then(dir => {
        testDir = dir;
      })
    );

    it("should publish the changed packages with a temp tag", () =>
      run(testDir)("--temp-tag").then(() => {
        expect(publishedTagInDirectories(testDir)).toMatchSnapshot("[normal --temp-tag] npm publish --tag");
        expect(removedDistTagInDirectories(testDir)).toMatchSnapshot("[normal --temp-tag] npm dist-tag rm");
        expect(addedDistTagInDirectories(testDir)).toMatchSnapshot("[normal --temp-tag] npm dist-tag add");

        expect(GitUtilities.pushWithTags).lastCalledWith("origin", ["v1.0.1"], execOpts(testDir));
      }));
  });

  /** =========================================================================
   * NORMAL - NPM TAG
   * ======================================================================= */

  describe("normal mode with --npm-tag", () => {
    let testDir;

    beforeEach(() =>
      initFixture("PublishCommand/normal").then(dir => {
        testDir = dir;
      })
    );

    it("should publish the changed packages with npm tag", () =>
      run(testDir)("--npm-tag", "custom").then(() => {
        expect(publishedTagInDirectories(testDir)).toMatchSnapshot("[normal --npm-tag] npm publish --tag");
      }));
  });

  /** =========================================================================
   * AUTO-ACCEPT
   * ======================================================================= */

  describe("with --yes", () => {
    it("skips confirmation prompt", done => {
      const publishCommand = new PublishCommand([], {
        yes: true,
      });
      publishCommand.updates = [];
      publishCommand.confirmVersions(err => {
        if (err) {
          return done.fail(err);
        }

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

    beforeEach(() =>
      initFixture("PublishCommand/normal").then(dir => {
        testDir = dir;
      })
    );

    it("passes registry to npm commands", () => {
      const registry = "https://my-private-registry";

      return run(testDir)("--registry", registry).then(() => {
        expect(NpmUtilities.checkDistTag).not.toBeCalled();
        expect(NpmUtilities.removeDistTag).not.toBeCalled();
        expect(NpmUtilities.addDistTag).not.toBeCalled();
        // FIXME: this isn't actually asserting anything about --registry
        expect(publishedTagInDirectories(testDir)).toMatchSnapshot("[normal --registry] npm publish --tag");
      });
    });
  });

  /** =========================================================================
   * NORMAL - REPO VERSION
   * ======================================================================= */

  describe("normal mode with --repo-version", () => {
    let testDir;

    beforeEach(() =>
      initFixture("PublishCommand/normal").then(dir => {
        testDir = dir;
      })
    );

    it("skips version prompt and publishes changed packages with designated version", () =>
      run(testDir)("--repo-version", "1.0.1-beta").then(() => {
        expect(PromptUtilities.select).not.toBeCalled();
        expect(updatedLernaJson()).toMatchObject({ version: "1.0.1-beta" });
      }));
  });

  /** =========================================================================
   * NORMAL - EXACT
   * ======================================================================= */

  describe("normal mode with --exact", () => {
    let testDir;

    beforeEach(() =>
      initFixture("PublishCommand/normal").then(dir => {
        testDir = dir;
      })
    );

    it("updates matching local dependencies of published packages with exact versions", () =>
      run(testDir)("--exact").then(() => {
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
      }));
  });

  /** =========================================================================
   * NORMAL MODE - CD VERSION
   * ======================================================================= */

  describe("normal mode with --cd-version", () => {
    let testDir;

    beforeEach(() =>
      initFixture("PublishCommand/normal").then(dir => {
        testDir = dir;
      })
    );

    it("should use semver increments when passed to cdVersion flag", () =>
      run(testDir)("--cd-version", "minor").then(() => {
        expect(PromptUtilities.select).not.toBeCalled();
        expect(gitCommitMessage()).toBe("v1.1.0");
      }));

    it("throws an error when an invalid semver keyword is used", async () => {
      expect.assertions(1);
      try {
        await run(testDir)("--cd-version", "poopypants");
      } catch (err) {
        expect(err.message).toBe(
          "--cd-version must be one of: " +
            "'major', 'minor', 'patch', 'premajor', 'preminor', 'prepatch', or 'prerelease'."
        );
      }
    });
  });

  /** =========================================================================
   * CD VERSION - REPUBLISH PRERELEASED
   * ======================================================================= */

  describe("CD VERSION - REPUBLISH PRERELEASED ", () => {
    let testDir;

    beforeEach(async () => {
      testDir = await initFixture("PublishCommand/republish-prereleased");

      GitUtilities.hasTags.mockReturnValue(true);
      GitUtilities.getLastTag.mockReturnValue("v1.0.1-beta.3");
      GitUtilities.diffSinceIn.mockImplementation((since, location) => {
        if (location.endsWith("package-3")) {
          return "packages/package-3/newfile.json";
        }
        return "";
      });
    });

    it("publishes changed & prereleased packages if --cd-version is non-prerelease", async () => {
      // should republish 3, 4, and 5 because:
      // package 3 changed
      // package 5 has a prerelease version
      // package 4 depends on package 5
      await run(testDir)("--cd-version", "patch");
      expect(gitCommitMessage()).toBe("v1.0.1");
      expect(updatedPackageVersions(testDir)).toMatchSnapshot("[republish prereleased] patch");
      expect(updatedPackageJSON("package-4").dependencies).toMatchObject({
        "package-5": "^1.0.1",
      });
    });

    it("should not publish prereleased packages if --cd-version is a pre-* increment", async () => {
      // should republish only package 3, because it changed
      await run(testDir)("--cd-version", "prerelease", "---preid", "beta");
      expect(gitCommitMessage()).toBe("v1.0.1-beta.4");
      expect(updatedPackageVersions(testDir)).toMatchSnapshot("[republish prereleased] prerelease");
    });
  });

  /** =========================================================================
   * INDEPENDENT - CD VERSION
   * ======================================================================= */

  describe("indepdendent mode with --cd-version", () => {
    let testDir;

    beforeEach(() =>
      initFixture("PublishCommand/independent").then(dir => {
        testDir = dir;
      })
    );

    it("should use semver increments when passed to cdVersion flag", () =>
      run(testDir)("--cd-version", "patch").then(() => {
        expect(PromptUtilities.select).not.toBeCalled();
        expect(gitCommitMessage()).toMatchSnapshot("[independent --cd-version] git commit message");
      }));

    /** =========================================================================
     * INDEPENDENT - CD VERSION - PRERELEASE
     * ======================================================================= */

    it("should bump to prerelease versions with --cd-version=prerelease --preid=foo", () =>
      run(testDir)("--cd-version", "prerelease", "--preid", "foo").then(() => {
        expect(updatedPackageVersions(testDir)).toMatchSnapshot(
          "[independent --cd-version=prerelease --preid=foo] bumps package versions"
        );

        expect(updatedPackageJSON("package-2").dependencies).toMatchObject({
          "package-1": "^1.0.1-foo.0",
        });
        expect(updatedPackageJSON("package-3").devDependencies).toMatchObject({
          "package-2": "^2.0.1-foo.0",
        });
        expect(updatedPackageJSON("package-4").dependencies).toMatchObject({
          "package-1": "^0.0.0",
        });
      }));

    it("should bump to prerelease versions with --cd-version prerelease (no --preid)", () =>
      run(testDir)("--cd-version", "prerelease").then(() => {
        expect(updatedPackageVersions(testDir)).toMatchSnapshot(
          "[independent --cd-version=prerelease] bumps package versions"
        );

        expect(updatedPackageJSON("package-2").dependencies).toMatchObject({
          "package-1": "^1.0.1-0",
        });
        expect(updatedPackageJSON("package-3").devDependencies).toMatchObject({
          "package-2": "^2.0.1-0",
        });
        expect(updatedPackageJSON("package-4").dependencies).toMatchObject({
          "package-1": "^0.0.0",
        });
      }));
  });

  /** =========================================================================
   * NORMAL - GIT REMOTE
   * ======================================================================= */

  describe("normal mode with --git-remote", () => {
    let testDir;

    beforeEach(() =>
      initFixture("PublishCommand/normal").then(dir => {
        testDir = dir;
      })
    );

    it("pushes tags to specified remote", () =>
      run(testDir)("--git-remote", "upstream").then(() => {
        expect(GitUtilities.pushWithTags).lastCalledWith("upstream", ["v1.0.1"], execOpts(testDir));
      }));
  });

  /** =========================================================================
   * NORMAL - GIT REMOTE
   * ======================================================================= */

  describe("normal mode with --ignore", () => {
    let testDir;

    beforeEach(() =>
      initFixture("PublishCommand/normal").then(dir => {
        testDir = dir;
      })
    );

    it("does not publish ignored packages", () =>
      run(testDir)("--ignore", "package-2", "--ignore", "package-3", "--ignore", "package-4").then(() => {
        expect(gitAddedFiles(testDir)).toMatchSnapshot("[normal --ignore] git adds changed files");
        expect(publishedTagInDirectories(testDir)).toMatchSnapshot("[normal --ignore] npm publish --tag");
      }));
  });

  /** =========================================================================
   * NORMAL - MESSAGE
   * ======================================================================= */

  describe("normal mode with --message", () => {
    let testDir;

    beforeEach(() =>
      initFixture("PublishCommand/normal").then(dir => {
        testDir = dir;
      })
    );

    it("commits changes with a custom message using %s", () =>
      run(testDir)("--message", "chore: Release %s :rocket:").then(() => {
        expect(GitUtilities.commit).lastCalledWith("chore: Release v1.0.1 :rocket:", execOpts(testDir));
      }));

    it("commits changes with a custom message using %v", () =>
      run(testDir)("--message", "chore: Release %v :rocket:").then(() => {
        expect(GitUtilities.commit).lastCalledWith("chore: Release 1.0.1 :rocket:", execOpts(testDir));
      }));
  });

  /** =========================================================================
   * INDEPENDENT - MESSAGE
   * ======================================================================= */

  describe("independent mode with --message", () => {
    let testDir;

    beforeEach(() =>
      initFixture("PublishCommand/independent").then(dir => {
        testDir = dir;
      })
    );

    it("commits changes with a custom message", () =>
      run(testDir)("-m", "chore: Custom publish message").then(() => {
        expect(GitUtilities.commit).lastCalledWith(expect.stringContaining("chore:"), execOpts(testDir));
        expect(gitCommitMessage()).toMatchSnapshot("[independent --message] git commit message");
      }));
  });

  /** =========================================================================
   * CONVENTIONAL COMMITS
   * ======================================================================= */

  describe("--conventional-commits", () => {
    describe("independent mode", () => {
      const recommendIndependentVersionOriginal = ConventionalCommitUtilities.recommendIndependentVersion;
      const updateIndependentChangelogOriginal = ConventionalCommitUtilities.updateIndependentChangelog;

      beforeEach(() => {
        const reccomendReplies = ["1.0.1", "1.1.0", "2.0.0", "1.1.0", "5.1.1"];
        ConventionalCommitUtilities.recommendIndependentVersion = jest.fn(() => reccomendReplies.shift());
        ConventionalCommitUtilities.updateIndependentChangelog = jest.fn();
      });

      afterEach(() => {
        ConventionalCommitUtilities.recommendIndependentVersion = recommendIndependentVersionOriginal;
        ConventionalCommitUtilities.updateIndependentChangelog = updateIndependentChangelogOriginal;
      });

      it("should use conventional-commits utility to guess version bump and generate CHANGELOG", async () => {
        const testDir = await initFixture("PublishCommand/independent");

        await run(testDir)("--conventional-commits");

        expect(gitAddedFiles(testDir)).toMatchSnapshot(
          "[independent --conventional-commits] git adds changed files"
        );
        expect(gitCommitMessage()).toMatchSnapshot("[independent --conventional-commits] git commit message");

        [
          ["package-1", "1.0.0"],
          ["package-2", "2.0.0"],
          ["package-3", "3.0.0"],
          ["package-4", "4.0.0"],
          ["package-5", "5.0.0"],
        ].forEach(([name, version]) => {
          const location = path.join(testDir, "packages", name);

          expect(ConventionalCommitUtilities.recommendIndependentVersion).toBeCalledWith(
            expect.objectContaining({ name, version }),
            execOpts(testDir)
          );
          expect(ConventionalCommitUtilities.updateIndependentChangelog).toBeCalledWith(
            expect.objectContaining({ name, location }),
            execOpts(testDir)
          );
        });
      });

      it("accepts --changelog-preset option", async () => {
        const testDir = await initFixture("PublishCommand/independent");
        const name = "package-3";
        const version = "3.0.0";
        const location = path.join(testDir, "packages", name);

        await run(testDir)("--conventional-commits", "--changelog-preset", "foo-bar");

        expect(ConventionalCommitUtilities.recommendIndependentVersion).toBeCalledWith(
          expect.objectContaining({ name, version }),
          expect.objectContaining({
            cwd: testDir,
            changelogPreset: "foo-bar",
          })
        );
        expect(ConventionalCommitUtilities.updateIndependentChangelog).toBeCalledWith(
          expect.objectContaining({ name, location }),
          expect.objectContaining({
            cwd: testDir,
            changelogPreset: "foo-bar",
          })
        );
      });
    });

    describe("fixed mode", () => {
      const recommendFixedVersionOriginal = ConventionalCommitUtilities.recommendFixedVersion;
      const updateFixedRootChangelogOriginal = ConventionalCommitUtilities.updateFixedRootChangelog;
      const updateFixedChangelogOriginal = ConventionalCommitUtilities.updateFixedChangelog;

      beforeEach(() => {
        const reccomendReplies = ["1.0.1", "1.1.0", "2.0.0", "1.1.0", "5.1.1"];
        ConventionalCommitUtilities.recommendFixedVersion = jest.fn(() => reccomendReplies.shift());
        ConventionalCommitUtilities.updateFixedRootChangelog = jest.fn();
        ConventionalCommitUtilities.updateFixedChangelog = jest.fn();
      });

      afterEach(() => {
        ConventionalCommitUtilities.recommendFixedVersion = recommendFixedVersionOriginal;
        ConventionalCommitUtilities.updateFixedRootChangelog = updateFixedRootChangelogOriginal;
        ConventionalCommitUtilities.updateFixedChangelog = updateFixedChangelogOriginal;
      });

      it("should use conventional-commits utility to guess version bump and generate CHANGELOG", async () => {
        const testDir = await initFixture("PublishCommand/normal");

        await run(testDir)("--conventional-commits");

        expect(gitAddedFiles(testDir)).toMatchSnapshot(
          "[fixed --conventional-commits] git adds changed files"
        );
        expect(gitCommitMessage()).toMatchSnapshot("[fixed --conventional-commits] git commit message");

        [
          ["package-1", "1.0.0"],
          ["package-2", "1.0.0"],
          ["package-3", "1.0.0"],
          ["package-4", "1.0.0"],
          ["package-5", "1.0.0"],
        ].forEach(([name, version]) => {
          const location = path.join(testDir, "packages", name);

          expect(ConventionalCommitUtilities.recommendFixedVersion).toBeCalledWith(
            expect.objectContaining({ name, version, location }),
            execOpts(testDir)
          );

          expect(ConventionalCommitUtilities.updateFixedChangelog).toBeCalledWith(
            expect.objectContaining({ name, location }),
            execOpts(testDir)
          );
        });

        expect(ConventionalCommitUtilities.updateFixedRootChangelog).toBeCalledWith(
          expect.objectContaining({
            name: "normal",
            location: path.join(testDir),
          }),
          execOpts(testDir)
        );
      });

      it("accepts --changelog-preset option", async () => {
        const testDir = await initFixture("PublishCommand/normal");
        const name = "package-5";
        const version = "1.0.0";
        const location = path.join(testDir, "packages", name);

        await run(testDir)("--conventional-commits", "--changelog-preset", "baz-qux");

        expect(ConventionalCommitUtilities.recommendFixedVersion).toBeCalledWith(
          expect.objectContaining({ name, version, location }),
          expect.objectContaining({
            cwd: testDir,
            changelogPreset: "baz-qux",
          })
        );
        expect(ConventionalCommitUtilities.updateFixedChangelog).toBeCalledWith(
          expect.objectContaining({ name, location }),
          expect.objectContaining({
            cwd: testDir,
            changelogPreset: "baz-qux",
          })
        );
      });

      it("avoids double-updating root changelog that is also a package", async () => {
        const testDir = await initFixture("PublishCommand/fixed-root-conventional");
        await run(testDir)(); // { conventionalCommits: true } in lerna.json

        expect(ConventionalCommitUtilities.updateFixedRootChangelog).not.toBeCalled();
        expect(ConventionalCommitUtilities.updateFixedChangelog).toHaveBeenCalledTimes(3);
      });
    });
  });

  /** =========================================================================
   * INDEPENDENT - CANARY + NPMTAG + YES + EXACT
   * ======================================================================= */

  describe("independent mode --canary --npm-tag=next --yes --exact", () => {
    let testDir;

    beforeEach(() =>
      initFixture("PublishCommand/independent").then(dir => {
        testDir = dir;
      })
    );

    it("should publish the changed packages", () =>
      run(testDir)("--canary", "--npm-tag", "next", "--yes", "--exact").then(() => {
        expect(publishedTagInDirectories(testDir)).toMatchSnapshot(
          "[independent --canary --npm-tag=next --yes --exact] npm publish --tag"
        );
      }));
  });

  describe("--allow-branch", () => {
    describe("cli", () => {
      let testDir;

      beforeEach(async () => {
        testDir = await initFixture("PublishCommand/normal");
      });

      it("should reject a non matching branch", async () => {
        GitUtilities.getCurrentBranch.mockReturnValueOnce("unmatched");

        try {
          await run(testDir)("--allow-branch", "master");
        } catch (err) {
          expect(err.message).toMatch("Branch 'unmatched' is restricted from publishing");
        }
      });

      it("should accept an exactly matching branch", async () => {
        GitUtilities.getCurrentBranch.mockReturnValueOnce("exact-match");

        const { exitCode } = await run(testDir)("--allow-branch", "exact-match");
        expect(exitCode).toBe(0);
      });

      it("should accept a branch that matches by wildcard", async () => {
        GitUtilities.getCurrentBranch.mockReturnValueOnce("feature/awesome");

        const { exitCode } = await run(testDir)("--allow-branch", "feature/*");
        expect(exitCode).toBe(0);
      });

      it("should accept a branch that matches one of the items passed", async () => {
        GitUtilities.getCurrentBranch.mockReturnValueOnce("feature/awesome");

        const { exitCode } = await run(testDir)("--allow-branch", "master", "feature/*");
        expect(exitCode).toBe(0);
      });
    });

    describe("lerna.json", () => {
      let testDir;

      beforeEach(async () => {
        testDir = await initFixture("PublishCommand/allow-branch-lerna");
      });

      it("should reject a non matching branch", async () => {
        GitUtilities.getCurrentBranch.mockReturnValueOnce("unmatched");

        try {
          await run(testDir)();
        } catch (err) {
          expect(err.message).toMatch("Branch 'unmatched' is restricted from publishing");
        }
      });

      it("should accept a matching branch", async () => {
        GitUtilities.getCurrentBranch.mockReturnValueOnce("lerna");

        const { exitCode } = await run(testDir)();
        expect(exitCode).toBe(0);
      });

      it("should prioritize cli over defaults", async () => {
        GitUtilities.getCurrentBranch.mockReturnValueOnce("cli-override");

        const { exitCode } = await run(testDir)("--allow-branch", "cli-override");
        expect(exitCode).toBe(0);
      });
    });

    describe("with --canary", () => {
      it("does not restrict publishing canary versions", async () => {
        const testDir = await initFixture("PublishCommand/normal");
        GitUtilities.getCurrentBranch.mockReturnValueOnce("other");

        const { exitCode } = await run(testDir)("--allow-branch", "master", "--canary");
        expect(exitCode).toBe(0);
        expect(updatedPackageVersions(testDir)).toMatchSnapshot();
      });
    });
  });

  /** =========================================================================
   * VERSION LIFECYCLE SCRIPTS
   * ======================================================================= */

  describe("lifecycle scripts", () => {
    let testDir;

    const scripts = ["preversion", "version", "postversion"];

    beforeEach(async () => {
      testDir = await initFixture("PublishCommand/lifecycle");
    });

    it("should call version lifecycle scripts for a package", async () => {
      await run(testDir)();
      scripts.forEach(script => {
        expect(NpmUtilities.runScriptInDirSync).toHaveBeenCalledWith(
          script,
          {
            args: [],
            directory: path.resolve(testDir, "packages", "package-1"),
            npmClient: "npm",
          },
          expect.any(Function)
        );
      });
    });

    it("should not call version lifecycle scripts for a package missing them", async () => {
      await run(testDir)();
      scripts.forEach(script => {
        expect(NpmUtilities.runScriptInDirSync).not.toHaveBeenCalledWith(
          script,
          {
            args: [],
            directory: path.resolve(testDir, "packages", "package-2"),
            npmClient: "npm",
          },
          expect.any(Function)
        );
      });
    });

    it("should call version lifecycle scripts in the correct order", async () => {
      await run(testDir)();
      expect(NpmUtilities.runScriptInDirSync.mock.calls.map(args => args[0])).toEqual(scripts);
    });
  });
});
