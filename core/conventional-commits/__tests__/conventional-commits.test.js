"use strict";

const fs = require("fs-extra");
const path = require("path");
const { getPackages } = require("@lerna/project");

// helpers
const initFixture = require("@lerna-test/init-fixture")(__dirname);
const gitAdd = require("@lerna-test/git-add");
const gitCommit = require("@lerna-test/git-commit");
const gitTag = require("@lerna-test/git-tag");

// file under test
const { recommendVersion, updateChangelog } = require("..");

// stabilize changelog commit SHA and datestamp
expect.addSnapshotSerializer(require("@lerna-test/serialize-changelog"));

describe("conventional-commits", () => {
  describe("recommendVersion()", () => {
    it("returns next version bump", async () => {
      const cwd = await initFixture("fixed");
      const [pkg1] = await getPackages(cwd);

      // make a change in package-1
      await pkg1.set("changed", 1).serialize();
      await gitAdd(cwd, pkg1.manifestLocation);
      await gitCommit(cwd, "feat: changed 1");

      const bump = await recommendVersion(pkg1, "fixed", {});
      expect(bump).toBe("1.1.0");
    });

    it("returns next version prerelease bump with prereleaseId", async () => {
      const cwd = await initFixture("fixed");
      const [pkg1] = await getPackages(cwd);

      // make a change in package-1
      await pkg1.set("changed", 1).serialize();
      await gitAdd(cwd, pkg1.manifestLocation);
      await gitCommit(cwd, "feat: changed 1");

      const bump = await recommendVersion(pkg1, "fixed", { prereleaseId: "alpha" });
      expect(bump).toBe("1.1.0-alpha.0");
    });

    it("returns package-specific bumps in independent mode", async () => {
      const cwd = await initFixture("independent");
      const [pkg1, pkg2] = await getPackages(cwd);
      const opts = { changelogPreset: "angular" };

      // make a change in package-1 and package-2
      await pkg1.set("changed", 1).serialize();
      await pkg2.set("changed", 2).serialize();

      await gitAdd(cwd, pkg1.manifestLocation);
      await gitCommit(cwd, "fix: changed 1");

      await gitAdd(cwd, pkg2.manifestLocation);
      await gitCommit(cwd, "feat: changed 2");

      const [bump1, bump2] = await Promise.all([
        recommendVersion(pkg1, "independent", opts),
        recommendVersion(pkg2, "independent", opts),
      ]);
      expect(bump1).toBe("1.0.1");
      expect(bump2).toBe("1.1.0");
    });

    it("returns package-specific prerelease bumps in independent mode with prereleaseId", async () => {
      const cwd = await initFixture("independent");
      const [pkg1, pkg2] = await getPackages(cwd);
      const opts = { changelogPreset: "angular" };

      // make a change in package-1 and package-2
      await pkg1.set("changed", 1).serialize();
      await pkg2.set("changed", 2).serialize();

      await gitAdd(cwd, pkg1.manifestLocation);
      await gitCommit(cwd, "fix: changed 1");

      await gitAdd(cwd, pkg2.manifestLocation);
      await gitCommit(cwd, "feat: changed 2");

      const [bump1, bump2] = await Promise.all([
        recommendVersion(pkg1, "independent", Object.assign(opts, { prereleaseId: "alpha" })),
        recommendVersion(pkg2, "independent", Object.assign(opts, { prereleaseId: "beta" })),
      ]);
      expect(bump1).toBe("1.0.1-alpha.0");
      expect(bump2).toBe("1.1.0-beta.0");
    });

    it("falls back to patch bumps for non-bumping commit types", async () => {
      const cwd = await initFixture("independent");
      const [pkg1, pkg2] = await getPackages(cwd);
      const opts = {
        // sometimes presets return null for the level, with no actual releaseType...
        changelogPreset: path.resolve(__dirname, "__fixtures__/fixed/scripts/null-preset.js"),
      };

      // make a change in package-1 and package-2
      await pkg1.set("changed", 1).serialize();
      await pkg2.set("changed", 2).serialize();

      await gitAdd(cwd, pkg1.manifestLocation);
      await gitCommit(cwd, "fix: changed 1");

      await gitAdd(cwd, pkg2.manifestLocation);
      await gitCommit(cwd, "chore: changed 2");

      const [bump1, bump2] = await Promise.all([
        recommendVersion(pkg1, "independent", opts),
        recommendVersion(pkg2, "independent", opts),
      ]);
      expect(bump1).toBe("1.0.1");
      expect(bump2).toBe("1.0.1");
    });

    it("supports local preset paths", async () => {
      const cwd = await initFixture("fixed");
      const [pkg1] = await getPackages(cwd);

      // make a change in package-1
      await pkg1.set("changed", 1).serialize();
      await gitAdd(cwd, pkg1.manifestLocation);
      await gitCommit(cwd, "feat: changed 1");

      const bump = await recommendVersion(pkg1, "fixed", {
        changelogPreset: "./scripts/local-preset.js",
      });
      expect(bump).toBe("1.1.0");
    });

    it("supports custom tagPrefix in fixed mode", async () => {
      const cwd = await initFixture("fixed");

      await gitTag(cwd, "dragons-are-awesome1.0.0");

      const [pkg1] = await getPackages(cwd);

      // make a change in package-1
      await pkg1.set("changed", 1).serialize();
      await gitAdd(cwd, pkg1.manifestLocation);
      await gitCommit(cwd, "fix: changed 1");

      const bump = await recommendVersion(pkg1, "fixed", {
        tagPrefix: "dragons-are-awesome",
      });
      expect(bump).toBe("1.0.1");
    });

    it("propagates errors from callback", async () => {
      const cwd = await initFixture("fixed");
      const [pkg1] = await getPackages(cwd);

      await expect(
        recommendVersion(pkg1, "fixed", {
          changelogPreset: "./scripts/erroring-preset.js",
        })
      ).rejects.toThrow("whatBump must be a function");
    });

    it("throws an error when an implicit changelog preset cannot be loaded", async () => {
      const cwd = await initFixture("fixed");
      const [pkg1] = await getPackages(cwd);

      await expect(
        recommendVersion(pkg1, "fixed", {
          changelogPreset: "garbage",
        })
      ).rejects.toThrow(
        "Unable to load conventional-changelog preset 'garbage' (conventional-changelog-garbage)"
      );
    });

    it("throws an error when an implicit changelog preset with scope cannot be loaded", async () => {
      const cwd = await initFixture("fixed");
      const [pkg1] = await getPackages(cwd);

      await expect(
        recommendVersion(pkg1, "fixed", {
          changelogPreset: "@scope/garbage",
        })
      ).rejects.toThrow("preset '@scope/garbage' (@scope/conventional-changelog-garbage)");
    });

    it("throws an error when an implicit changelog preset with scoped subpath cannot be loaded", async () => {
      const cwd = await initFixture("fixed");
      const [pkg1] = await getPackages(cwd);

      await expect(
        recommendVersion(pkg1, "fixed", {
          changelogPreset: "@scope/garbage/pail",
        })
      ).rejects.toThrow("preset '@scope/garbage/pail' (@scope/conventional-changelog-garbage/pail)");
    });

    it("throws an error when an explicit changelog preset cannot be loaded", async () => {
      const cwd = await initFixture("fixed");
      const [pkg1] = await getPackages(cwd);

      await expect(
        recommendVersion(pkg1, "fixed", {
          changelogPreset: "conventional-changelog-garbage",
        })
      ).rejects.toThrow("Unable to load conventional-changelog preset 'conventional-changelog-garbage'");
    });

    it("throws an error when an explicit changelog preset with subpath cannot be loaded", async () => {
      const cwd = await initFixture("fixed");
      const [pkg1] = await getPackages(cwd);

      await expect(
        recommendVersion(pkg1, "fixed", {
          changelogPreset: "conventional-changelog-garbage/pail",
        })
      ).rejects.toThrow("Unable to load conventional-changelog preset 'conventional-changelog-garbage/pail'");
    });

    describe("prerelease bumps", () => {
      let cwd;
      let pkg;
      let opts;
      let recommend;

      beforeEach(async () => {
        let value = 0;
        cwd = await initFixture("independent");
        [pkg] = await getPackages(cwd);
        opts = { changelogPreset: "angular" };
        recommend = async (commitMessage, { initVersion } = {}) => {
          if (initVersion) {
            await pkg.set("version", initVersion).serialize();
            await gitAdd(cwd, pkg.manifestLocation);
            await gitCommit(cwd, commitMessage);
          }
          await pkg.set("changed", (value += 1)).serialize();
          await gitAdd(cwd, pkg.manifestLocation);
          await gitCommit(cwd, commitMessage);
          return recommendVersion(pkg, "independent", Object.assign(opts, { prereleaseId: "beta" }));
        };
      });

      it("stable + fix/minor/major => prepatch/preminor/premajor", async () => {
        // default initial version is "1.0.0"
        expect(await recommend("fix: changed")).toBe("1.0.1-beta.0");
        expect(await recommend("feat: changed")).toBe("1.1.0-beta.0");
        expect(await recommend("feat: changed\n\nBREAKING CHANGE: changed")).toBe("2.0.0-beta.0");
      });

      it("prepatch + fix/minor/major => prerelease/preminor/premajor", async () => {
        expect(await recommend("fix: changed", { initVersion: "1.0.1-beta.0" })).toBe("1.0.1-beta.1");
        expect(await recommend("feat: changed")).toBe("1.1.0-beta.0");
        expect(await recommend("feat: changed\n\nBREAKING CHANGE: changed")).toBe("2.0.0-beta.0");
      });

      it("preminor + fix/minor/major => prerelease/prerelease/premajor", async () => {
        expect(await recommend("fix: changed", { initVersion: "1.1.0-beta.0" })).toBe("1.1.0-beta.1");
        expect(await recommend("feat: changed")).toBe("1.1.0-beta.1");
        expect(await recommend("feat: changed\n\nBREAKING CHANGE: changed")).toBe("2.0.0-beta.0");
      });

      it("premajor + fix/minor/major => prerelease", async () => {
        expect(await recommend("fix: changed", { initVersion: "2.0.0-beta.0" })).toBe("2.0.0-beta.1");
        expect(await recommend("feat: changed")).toBe("2.0.0-beta.1");
        expect(await recommend("feat: changed\n\nBREAKING CHANGE: changed")).toBe("2.0.0-beta.1");
      });
    });
  });

  describe("updateChangelog()", () => {
    const getFileContent = ({ logPath }) => fs.readFile(logPath, "utf8");

    it("creates files if they do not exist", async () => {
      const cwd = await initFixture("changelog-missing");

      const [pkg1] = await getPackages(cwd);
      const rootPkg = {
        name: "root",
        location: cwd,
      };

      // make a change in package-1
      await pkg1.set("changed", 1).serialize();
      await gitAdd(cwd, pkg1.manifestLocation);
      await gitCommit(cwd, "feat: I should be placed in the CHANGELOG");

      // update version
      await pkg1.set("version", "1.1.0").serialize();

      const [leafChangelog, rootChangelog] = await Promise.all([
        updateChangelog(pkg1, "fixed", { changelogPreset: "angular" }),
        updateChangelog(rootPkg, "root", { version: "1.1.0" }),
      ]);

      expect(leafChangelog.logPath).toBe(path.join(pkg1.location, "CHANGELOG.md"));
      expect(rootChangelog.logPath).toBe(path.join(rootPkg.location, "CHANGELOG.md"));

      const [leafChangelogContent, rootChangelogContent] = await Promise.all([
        getFileContent(leafChangelog),
        getFileContent(rootChangelog),
      ]);

      expect(leafChangelogContent).toMatchSnapshot("leaf");
      expect(rootChangelogContent).toMatchSnapshot("root");
    });

    it("updates fixed changelogs", async () => {
      const cwd = await initFixture("fixed");
      const rootPkg = {
        // no name
        location: cwd,
      };

      await gitTag(cwd, "v1.0.0");

      const [pkg1] = await getPackages(cwd);

      // make a change in package-1
      await pkg1.set("changed", 1).serialize();
      await gitAdd(cwd, pkg1.manifestLocation);
      await gitCommit(cwd, "fix: A second commit for our CHANGELOG");

      // update version
      await pkg1.set("version", "1.0.1").serialize();

      const [leafChangelogContent, rootChangelogContent] = await Promise.all([
        updateChangelog(pkg1, "fixed", /* default preset */ {}).then(getFileContent),
        updateChangelog(rootPkg, "root", { version: "1.0.1" }).then(getFileContent),
      ]);

      expect(leafChangelogContent).toMatchSnapshot("leaf");
      expect(rootChangelogContent).toMatchSnapshot("root");
    });

    it("supports custom tagPrefix in fixed mode", async () => {
      const cwd = await initFixture("fixed");

      await gitTag(cwd, "dragons-are-awesome1.0.0");

      const [pkg1] = await getPackages(cwd);

      // make a change in package-1
      await pkg1.set("changed", 1).serialize();
      await gitAdd(cwd, pkg1.manifestLocation);
      await gitCommit(cwd, "fix: A second commit for our CHANGELOG");

      // update version
      await pkg1.set("version", "1.0.1").serialize();

      const [leafChangelog, rootChangelog] = await Promise.all([
        updateChangelog(pkg1, "fixed", {
          tagPrefix: "dragons-are-awesome",
        }),
        updateChangelog({ location: cwd }, "root", {
          tagPrefix: "dragons-are-awesome",
          version: "1.0.1",
        }),
      ]);

      expect(leafChangelog.newEntry.trimRight()).toMatchInlineSnapshot(`
        ## [1.0.1](/compare/dragons-are-awesome1.0.0...dragons-are-awesome1.0.1) (YYYY-MM-DD)


        ### Bug Fixes

        * A second commit for our CHANGELOG ([SHA](https://github.com/lerna/conventional-commits-fixed/commit/GIT_HEAD))
      `);
      expect(rootChangelog.newEntry.trimRight()).toMatchInlineSnapshot(`
        ## [1.0.1](/compare/dragons-are-awesome1.0.0...dragons-are-awesome1.0.1) (YYYY-MM-DD)


        ### Bug Fixes

        * A second commit for our CHANGELOG ([SHA](https://github.com/lerna/conventional-commits-fixed/commit/GIT_HEAD))
      `);

      await gitAdd(cwd, pkg1.manifestLocation);
      await gitCommit(cwd, "chore(release): Publish v1.0.1");
      await gitTag(cwd, "dragons-are-awesome1.0.1");

      // subsequent change
      await pkg1.set("changed", 2).serialize();
      await gitAdd(cwd, pkg1.manifestLocation);
      await gitCommit(cwd, "fix: A third commit for our CHANGELOG");

      const lastRootChangelog = await updateChangelog({ location: cwd }, "root", {
        tagPrefix: "dragons-are-awesome",
        version: "1.0.2",
      });

      // second commit should not show up again
      expect(lastRootChangelog.newEntry.trimRight()).toMatchInlineSnapshot(`
        ## [1.0.2](/compare/dragons-are-awesome1.0.1...dragons-are-awesome1.0.2) (YYYY-MM-DD)


        ### Bug Fixes

        * A third commit for our CHANGELOG ([SHA](https://github.com/lerna/conventional-commits-fixed/commit/GIT_HEAD))
      `);
    });

    it("appends version bump message if no commits have been recorded", async () => {
      const cwd = await initFixture("fixed");

      await gitTag(cwd, "v1.0.0");

      const [pkg1, pkg2] = await getPackages(cwd);

      // make a change in package-1
      await pkg1.set("changed", 1).serialize();
      await gitAdd(cwd, pkg1.manifestLocation);
      await gitCommit(cwd, "fix(pkg1): A dependency-triggered bump");

      // update version
      await pkg2.set("version", "1.0.1").serialize();

      const leafChangelog = await updateChangelog(pkg2, "fixed", {
        changelogPreset: "./scripts/local-preset",
      });

      expect(leafChangelog.newEntry.trimRight()).toMatchInlineSnapshot(`
        <a name="1.0.1"></a>
        ## <small>1.0.1 (YYYY-MM-DD)</small>

        **Note:** Version bump only for package package-2
      `);
    });

    it("supports old preset API", async () => {
      const cwd = await initFixture("fixed");

      await gitTag(cwd, "v1.0.0");

      const [pkg1] = await getPackages(cwd);

      // make a change in package-1
      await pkg1.set("changed", 1).serialize();
      await gitAdd(cwd, pkg1.manifestLocation);
      await gitCommit(cwd, "fix(pkg1): A commit using the old preset API");

      // update version
      await pkg1.set("version", "1.0.1").serialize();

      const leafChangelog = await updateChangelog(pkg1, "fixed", {
        changelogPreset: "./scripts/old-api-preset",
      });

      expect(leafChangelog.newEntry).toMatchInlineSnapshot(`
        <a name="1.0.1"></a>
        ## <small>1.0.1 (YYYY-MM-DD)</small>
        * fix(pkg1): A commit using the old preset API

      `);
    });

    it("supports legacy callback presets", async () => {
      const cwd = await initFixture("fixed");

      await gitTag(cwd, "v1.0.0");

      const [, pkg2] = await getPackages(cwd);

      // make a change in package-2
      await pkg2.set("changed", 1).serialize();
      await gitAdd(cwd, pkg2.manifestLocation);
      await gitCommit(cwd, "fix(pkg2): A commit using a legacy callback preset");

      // update version
      await pkg2.set("version", "1.0.1").serialize();

      const leafChangelog = await updateChangelog(pkg2, "fixed", {
        changelogPreset: "./scripts/legacy-callback-preset",
      });

      expect(leafChangelog.newEntry).toMatchInlineSnapshot(`
        <a name="1.0.1"></a>
        ## <small>1.0.1 (YYYY-MM-DD)</small>
        * fix(pkg2): A commit using a legacy callback preset

      `);
    });

    it("updates independent changelogs", async () => {
      const cwd = await initFixture("independent");

      await gitTag(cwd, "package-1@1.0.0");
      await gitTag(cwd, "package-2@1.0.0");

      const [pkg1, pkg2] = await getPackages(cwd);

      // make a change in package-1 and package-2
      await pkg1.set("changed", 1).serialize();
      await pkg2.set("changed", 2).serialize();

      await gitAdd(cwd, pkg1.manifestLocation);
      await gitCommit(cwd, "fix(stuff): changed");

      await gitAdd(cwd, pkg2.manifestLocation);
      await gitCommit(cwd, "feat(thing): added");

      // update versions
      await pkg1.set("version", "1.0.1").serialize();
      await pkg2.set("version", "1.1.0").serialize();

      const opts = {
        changelogPreset: "conventional-changelog-angular",
      };
      const [changelogOne, changelogTwo] = await Promise.all([
        updateChangelog(pkg1, "independent", opts),
        updateChangelog(pkg2, "independent", opts),
      ]);

      expect(changelogOne.newEntry.trimRight()).toMatchInlineSnapshot(`
        ## [1.0.1](/compare/package-1@1.0.0...package-1@1.0.1) (YYYY-MM-DD)


        ### Bug Fixes

        * **stuff:** changed ([SHA](https://github.com/lerna/conventional-commits-independent/commit/GIT_HEAD))
      `);
      expect(changelogTwo.newEntry.trimRight()).toMatchInlineSnapshot(`
        # [1.1.0](/compare/package-2@1.0.0...package-2@1.1.0) (YYYY-MM-DD)


        ### Features

        * **thing:** added ([SHA](https://github.com/lerna/conventional-commits-independent/commit/GIT_HEAD))
      `);
    });
  });
});
