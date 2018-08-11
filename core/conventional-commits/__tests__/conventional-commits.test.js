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

      try {
        await recommendVersion(pkg1, "fixed", { changelogPreset: "./scripts/erroring-preset.js" });
      } catch (err) {
        expect(err.message).toBe("whatBump must be a function");
      }

      expect.hasAssertions();
    });

    it("throws an error when an implicit changelog preset cannot be loaded", async () => {
      const cwd = await initFixture("fixed");
      const [pkg1] = await getPackages(cwd);

      try {
        await recommendVersion(pkg1, "fixed", { changelogPreset: "garbage" });
      } catch (err) {
        expect(err.message).toBe(
          "Unable to load conventional-commits preset 'garbage' (conventional-changelog-garbage)"
        );
      }

      expect.hasAssertions();
    });

    it("throws an error when an implicit changelog preset with scope cannot be loaded", async () => {
      const cwd = await initFixture("fixed");
      const [pkg1] = await getPackages(cwd);

      try {
        await recommendVersion(pkg1, "fixed", { changelogPreset: "@scope/garbage" });
      } catch (err) {
        expect(err.message).toMatch("preset '@scope/garbage' (@scope/conventional-changelog-garbage)");
      }

      expect.hasAssertions();
    });

    it("throws an error when an implicit changelog preset with scoped subpath cannot be loaded", async () => {
      const cwd = await initFixture("fixed");
      const [pkg1] = await getPackages(cwd);

      try {
        await recommendVersion(pkg1, "fixed", { changelogPreset: "@scope/garbage/pail" });
      } catch (err) {
        expect(err.message).toMatch(
          "preset '@scope/garbage/pail' (@scope/conventional-changelog-garbage/pail)"
        );
      }

      expect.hasAssertions();
    });

    it("throws an error when an explicit changelog preset cannot be loaded", async () => {
      const cwd = await initFixture("fixed");
      const [pkg1] = await getPackages(cwd);

      try {
        await recommendVersion(pkg1, "fixed", { changelogPreset: "conventional-changelog-garbage" });
      } catch (err) {
        expect(err.message).toBe(
          "Unable to load conventional-commits preset 'conventional-changelog-garbage'"
        );
      }

      expect.hasAssertions();
    });

    it("throws an error when an explicit changelog preset with subpath cannot be loaded", async () => {
      const cwd = await initFixture("fixed");
      const [pkg1] = await getPackages(cwd);

      try {
        await recommendVersion(pkg1, "fixed", { changelogPreset: "conventional-changelog-garbage/pail" });
      } catch (err) {
        expect(err.message).toMatch(
          "Unable to load conventional-commits preset 'conventional-changelog-garbage/pail'"
        );
      }

      expect.hasAssertions();
    });
  });

  describe("updateChangelog()", () => {
    const getFileContent = fp => fs.readFile(fp, "utf8");

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

      const [leafChangelogFile, rootChangelogFile] = await Promise.all([
        updateChangelog(pkg1, "fixed", { changelogPreset: "angular" }),
        updateChangelog(rootPkg, "root", { version: "1.1.0" }),
      ]);

      expect(leafChangelogFile).toBe(path.join(pkg1.location, "CHANGELOG.md"));
      expect(rootChangelogFile).toBe(path.join(rootPkg.location, "CHANGELOG.md"));

      const [leafChangelogContent, rootChangelogContent] = await Promise.all([
        getFileContent(leafChangelogFile),
        getFileContent(rootChangelogFile),
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

      const leafChangelogContent = await updateChangelog(pkg1, "fixed", {
        tagPrefix: "dragons-are-awesome",
      }).then(getFileContent);

      expect(leafChangelogContent).toMatch("A second commit for our CHANGELOG");
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

      const leafChangelogContent = await updateChangelog(pkg2, "fixed", {
        changelogPreset: "./scripts/local-preset",
      }).then(getFileContent);

      expect(leafChangelogContent).toMatchSnapshot();
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

      const leafChangelogContent = await updateChangelog(pkg1, "fixed", {
        changelogPreset: "./scripts/old-api-preset",
      }).then(getFileContent);

      expect(leafChangelogContent).toMatchSnapshot();
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
        updateChangelog(pkg1, "independent", opts).then(getFileContent),
        updateChangelog(pkg2, "independent", opts).then(getFileContent),
      ]);

      expect(changelogOne).toMatchSnapshot();
      expect(changelogTwo).toMatchSnapshot();
    });
  });
});
