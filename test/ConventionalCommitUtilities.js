"use strict";

const dedent = require("dedent");
const path = require("path");
const Package = require("../src/Package");

// mocked modules
const getStream = require("get-stream");
const conventionalChangelogCore = require("conventional-changelog-core");
const conventionalRecommendedBump = require("conventional-recommended-bump");
const FileSystemUtilities = require("../src/FileSystemUtilities");

// helpers
const callsBack = require("./helpers/callsBack");

// file under test
const ConventionalCommitUtilities = require("../src/ConventionalCommitUtilities");

jest.mock("get-stream");
jest.mock("conventional-changelog-core");
jest.mock("conventional-recommended-bump");
jest.mock("../src/FileSystemUtilities");

describe("ConventionalCommitUtilities", () => {
  beforeEach(() => {
    FileSystemUtilities.readFile.mockImplementation(() => Promise.resolve(""));
    FileSystemUtilities.writeFile.mockImplementation(() => Promise.resolve());
  });

  afterEach(() => jest.resetAllMocks());

  describe(".recommendVersion()", () => {
    it("invokes conventional-changelog-recommended bump to fetch next version", async () => {
      conventionalRecommendedBump.mockImplementation(callsBack(null, { releaseType: "major" }));

      const bumpedVersion = await ConventionalCommitUtilities.recommendVersion(
        new Package({ name: "bar", version: "1.0.0" }, "/foo/bar"),
        "fixed",
        {}
      );

      expect(bumpedVersion).toBe("2.0.0");
      expect(conventionalRecommendedBump).lastCalledWith(
        {
          config: expect.objectContaining({
            recommendedBumpOpts: {
              parserOpts: expect.any(Object),
              whatBump: expect.any(Function),
            },
          }),
          path: "/foo/bar",
        },
        expect.any(Function)
      );
    });

    it("passes package-specific arguments in independent mode", async () => {
      conventionalRecommendedBump.mockImplementation(callsBack(null, { releaseType: "minor" }));

      const bumpedVersion = await ConventionalCommitUtilities.recommendVersion(
        new Package({ name: "bar", version: "1.0.0" }, "/foo/bar"),
        "independent",
        { changelogPreset: "angular" }
      );

      expect(bumpedVersion).toBe("1.1.0");
      expect(conventionalRecommendedBump).lastCalledWith(
        {
          config: expect.objectContaining({
            recommendedBumpOpts: {
              parserOpts: expect.any(Object),
              whatBump: expect.any(Function),
            },
          }),
          path: "/foo/bar",
          lernaPackage: "bar",
        },
        expect.any(Function)
      );
    });
  });

  describe(".updateChangelog()", () => {
    beforeEach(() => {
      getStream.mockReturnValue(
        Promise.resolve(
          dedent`
            <a name="1.0.0"></a>

            ### Features

            * feat: I should be placed in the CHANGELOG`
        )
      );
    });

    it("populates initial CHANGELOG.md if it does not exist", async () => {
      const changelogLocation = await ConventionalCommitUtilities.updateChangelog(
        new Package({ name: "bar", version: "1.0.0" }, "/foo/bar"),
        "fixed",
        { changelogPreset: "angular" }
      );

      expect(changelogLocation).toBe(path.normalize("/foo/bar/CHANGELOG.md"));

      expect(FileSystemUtilities.readFile).lastCalledWith(changelogLocation);
      expect(FileSystemUtilities.writeFile).lastCalledWith(
        changelogLocation,
        dedent`
          # Change Log

          All notable changes to this project will be documented in this file.
          See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

          <a name="1.0.0"></a>

          ### Features

          * feat: I should be placed in the CHANGELOG`
      );
    });

    it("appends to existing CHANGELOG.md", async () => {
      getStream.mockReturnValueOnce(
        Promise.resolve(
          dedent`
            <a name='change2' /></a>
            ## 1.0.1 (2017-08-11)(/compare/v1.0.1...v1.0.0) (2017-08-09)


            ### Bug Fixes

            * fix: a second commit for our CHANGELOG`
        )
      );

      FileSystemUtilities.readFile.mockReturnValueOnce(
        Promise.resolve(
          dedent`
          # Change Log

          All notable changes to this project will be documented in this file.
          See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

          <a name="1.0.0"></a>

          ### Features

          * feat: I should be placed in the CHANGELOG`
        )
      );

      const changelogLocation = await ConventionalCommitUtilities.updateChangelog(
        new Package({ name: "bar", version: "1.0.0" }, "/foo/bar"),
        "fixed",
        { changelogPreset: "angular" }
      );

      expect(FileSystemUtilities.writeFile).lastCalledWith(
        changelogLocation,
        dedent`
          # Change Log

          All notable changes to this project will be documented in this file.
          See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

          <a name='change2' /></a>
          ## 1.0.1 (2017-08-11)(/compare/v1.0.1...v1.0.0) (2017-08-09)


          ### Bug Fixes

          * fix: a second commit for our CHANGELOG

          <a name="1.0.0"></a>

          ### Features

          * feat: I should be placed in the CHANGELOG`
      );
    });

    it("appends version bump message if no commits have been recorded", async () => {
      getStream.mockReturnValueOnce(
        Promise.resolve(
          dedent`
            <a name="1.0.1"></a>
            ## 1.0.1 (2017-08-11)(/compare/v1.0.1...v1.0.0) (2017-08-09)`
        )
      );
      FileSystemUtilities.readFile.mockReturnValueOnce(
        Promise.resolve(
          dedent`
          # Change Log

          All notable changes to this project will be documented in this file.
          See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

          <a name="1.0.0"></a>

          ### Features

          * add a feature aaa1111`
        )
      );

      const changelogLocation = await ConventionalCommitUtilities.updateChangelog(
        new Package({ name: "bar", version: "1.0.0" }, "/foo/bar"),
        "fixed",
        { changelogPreset: "angular" }
      );

      expect(FileSystemUtilities.writeFile).lastCalledWith(
        changelogLocation,
        dedent`
          # Change Log

          All notable changes to this project will be documented in this file.
          See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

          <a name="1.0.1"></a>
          ## 1.0.1 (2017-08-11)(/compare/v1.0.1...v1.0.0) (2017-08-09)

          **Note:** Version bump only for package bar

          <a name="1.0.0"></a>

          ### Features

          * add a feature aaa1111`
      );
    });

    it("passes package-specific arguments in independent mode", async () => {
      const pkg = new Package({ name: "bar", version: "1.0.0" }, "/foo/bar");

      await ConventionalCommitUtilities.updateChangelog(pkg, "independent", {
        changelogPreset: "angular",
      });

      expect(conventionalChangelogCore).lastCalledWith(
        {
          config: {
            parserOpts: expect.any(Object),
            writerOpts: expect.any(Object),
          },
          pkg: {
            path: pkg.manifestLocation,
          },
          lernaPackage: pkg.name,
        },
        undefined,
        {
          // gitRawCommitsOpts
          path: pkg.location,
        }
      );
    });

    it("passes package-specific arguments in fixed mode", async () => {
      const pkg = new Package({ name: "bar", version: "1.0.0" }, "/foo/bar");

      await ConventionalCommitUtilities.updateChangelog(pkg, "fixed", {
        changelogPreset: "conventional-changelog-angular",
      });

      expect(conventionalChangelogCore).lastCalledWith(
        {
          config: {
            parserOpts: expect.any(Object),
            writerOpts: expect.any(Object),
          },
          pkg: {
            path: pkg.manifestLocation,
          },
        },
        undefined,
        {
          // gitRawCommitsOpts
          path: pkg.location,
        }
      );
    });

    it("passes custom context in fixed root mode", async () => {
      await ConventionalCommitUtilities.updateChangelog(
        {
          name: "bar",
          location: "/foo/bar",
        },
        "root",
        { changelogPreset: undefined, version: "1.0.0" }
      );

      expect(conventionalChangelogCore).lastCalledWith(
        {
          config: {
            parserOpts: expect.any(Object),
            writerOpts: expect.any(Object),
          },
        },
        { version: "1.0.0" },
        {
          // gitRawCommitsOpts
        }
      );
    });
  });
});
