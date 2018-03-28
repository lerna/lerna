"use strict";

const fs = require("fs-extra");
const path = require("path");
const collectPackages = require("@lerna/collect-packages");

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
      const [pkg1] = await collectPackages(cwd);

      // make a change in package-1
      pkg1.json.changed = 1;
      await fs.writeJSON(pkg1.manifestLocation, pkg1);
      await gitAdd(cwd, pkg1.manifestLocation);
      await gitCommit(cwd, "feat: changed 1");

      await expect(recommendVersion(pkg1, "fixed", {})).resolves.toBe("1.1.0");
    });

    it("returns package-specific bumps in independent mode", async () => {
      const cwd = await initFixture("independent");
      const [pkg1, pkg2] = await collectPackages(cwd);
      const opts = { changelogPreset: "angular" };

      // make a change in package-1 and package-2
      pkg1.json.changed = 1;
      pkg2.json.changed = 2;
      await Promise.all([
        fs.writeJSON(pkg1.manifestLocation, pkg1),
        fs.writeJSON(pkg2.manifestLocation, pkg2),
      ]);

      await gitAdd(cwd, pkg1.manifestLocation);
      await gitCommit(cwd, "fix: changed 1");

      await gitAdd(cwd, pkg2.manifestLocation);
      await gitCommit(cwd, "feat: changed 2");

      await expect(recommendVersion(pkg1, "independent", opts)).resolves.toBe("1.0.1");
      await expect(recommendVersion(pkg2, "independent", opts)).resolves.toBe("1.1.0");
    });
  });

  describe("updateChangelog()", () => {
    const getFileContent = fp => fs.readFile(fp, "utf8");

    it("creates files if they do not exist", async () => {
      const cwd = await initFixture("changelog-missing");

      const [pkg1] = await collectPackages(cwd);
      const rootPkg = {
        name: "root", // TODO: no name
        location: cwd,
      };

      // make a change in package-1
      pkg1.json.changed = 1;
      await fs.writeJSON(pkg1.manifestLocation, pkg1);
      await gitAdd(cwd, pkg1.manifestLocation);
      await gitCommit(cwd, "feat: I should be placed in the CHANGELOG");

      // update version
      pkg1.version = "1.1.0";
      await fs.writeJSON(pkg1.manifestLocation, pkg1);

      const changelogLocation = await updateChangelog(pkg1, "fixed", {
        changelogPreset: "angular",
      });

      expect(changelogLocation).toBe(path.join(pkg1.location, "CHANGELOG.md"));
      await expect(getFileContent(changelogLocation)).resolves.toMatchSnapshot("package-1");
      await expect(
        updateChangelog(rootPkg, "root", { version: "1.1.0" }).then(getFileContent)
      ).resolves.toMatchSnapshot("root");
    });

    it("updates fixed changelogs", async () => {
      const cwd = await initFixture("fixed");
      const rootPkg = {
        name: "root", // TODO: no name
        location: cwd,
      };

      await gitTag(cwd, "v1.0.0");

      const [pkg1] = await collectPackages(cwd);

      // make a change in package-1
      pkg1.json.changed = 1;
      await fs.writeJSON(pkg1.manifestLocation, pkg1);
      await gitAdd(cwd, pkg1.manifestLocation);
      await gitCommit(cwd, "fix: A second commit for our CHANGELOG");

      // update version
      pkg1.version = "1.0.1";
      await fs.writeJSON(pkg1.manifestLocation, pkg1);

      await expect(
        updateChangelog(pkg1, "fixed", /* default preset */ {}).then(getFileContent)
      ).resolves.toMatchSnapshot();

      await expect(
        updateChangelog(rootPkg, "root", { version: "1.0.1" }).then(getFileContent)
      ).resolves.toMatchSnapshot();
    });

    it("appends version bump message if no commits have been recorded", async () => {
      const cwd = await initFixture("fixed");

      await gitTag(cwd, "v1.0.0");

      const [pkg1, pkg2] = await collectPackages(cwd);

      // make a change in package-1
      pkg1.json.changed = 1;
      await fs.writeJSON(pkg1.manifestLocation, pkg1);
      await gitAdd(cwd, pkg1.manifestLocation);
      await gitCommit(cwd, "fix(pkg1): A dependency-triggered bump");

      // update version
      pkg2.version = "1.0.1";
      await fs.writeJSON(pkg2.manifestLocation, pkg2);

      await expect(
        updateChangelog(pkg2, "fixed", { changelogPreset: "angular" }).then(getFileContent)
      ).resolves.toMatchSnapshot();
    });

    it("updates independent changelogs", async () => {
      const cwd = await initFixture("independent");

      await Promise.all([gitTag(cwd, "package-1@1.0.0"), gitTag(cwd, "package-2@1.0.0")]);

      const [pkg1, pkg2] = await collectPackages(cwd);

      // make a change in package-1 and package-2
      pkg1.json.changed = 1;
      pkg2.json.changed = 2;
      await Promise.all([
        fs.writeJSON(pkg1.manifestLocation, pkg1),
        fs.writeJSON(pkg2.manifestLocation, pkg2),
      ]);

      await gitAdd(cwd, pkg1.manifestLocation);
      await gitCommit(cwd, "fix(stuff): changed");

      await gitAdd(cwd, pkg2.manifestLocation);
      await gitCommit(cwd, "feat(thing): added");

      // update versions
      pkg1.version = "1.0.1";
      pkg2.version = "1.1.0";
      await Promise.all([
        fs.writeJSON(pkg1.manifestLocation, pkg1),
        fs.writeJSON(pkg2.manifestLocation, pkg2),
      ]);

      const opts = {
        changelogPreset: "angular",
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
