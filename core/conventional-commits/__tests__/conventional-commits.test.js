"use strict";

const execa = require("execa");
const fs = require("fs-extra");
const normalizeNewline = require("normalize-newline");
const path = require("path");
const collectPackages = require("@lerna/collect-packages");

// helpers
const initFixture = require("@lerna-test/init-fixture")(__dirname);

// file under test
const { recommendVersion, updateChangelog } = require("..");

// stabilize changelog commit SHA and datestamp
expect.addSnapshotSerializer({
  print(val) {
    return normalizeNewline(val)
      .replace(/\b[0-9a-f]{7,8}\b/g, "SHA")
      .replace(/\b[0-9a-f]{40}\b/g, "GIT_HEAD")
      .replace(/\(\d{4}-\d{2}-\d{2}\)/g, "(YYYY-MM-DD)");
  },
  test(val) {
    return val && typeof val === "string";
  },
});

describe("conventional-commits", () => {
  const currentDirectory = process.cwd();

  afterEach(() => {
    // conventional-recommended-bump is incapable of accepting cwd config :P
    if (process.cwd() !== currentDirectory) {
      process.chdir(currentDirectory);
    }
  });

  describe("recommendVersion()", () => {
    it("returns next version bump", async () => {
      const cwd = await initFixture("fixed");
      const [pkg1] = await collectPackages(cwd);

      await fs.writeJSON(pkg1.manifestLocation, Object.assign(pkg1.toJSON(), { changed: 1 }));
      await execa("git", ["commit", "-am", "feat: changed"], { cwd });

      process.chdir(cwd);

      await expect(recommendVersion(pkg1, "fixed", {})).resolves.toBe("1.1.0");
    });

    it("returns package-specific bumps in independent mode", async () => {
      const cwd = await initFixture("independent");
      const [pkg1, pkg2] = await collectPackages(cwd);
      const opts = { changelogPreset: "angular" };

      await Promise.all([
        fs.writeJSON(pkg1.manifestLocation, Object.assign(pkg1.toJSON(), { changed: 1 })),
        fs.writeJSON(pkg2.manifestLocation, Object.assign(pkg2.toJSON(), { changed: 2 })),
      ]);

      await execa("git", ["add", pkg1.manifestLocation], { cwd });
      await execa("git", ["commit", "-m", "fix: changed 1"], { cwd });

      await execa("git", ["add", pkg2.manifestLocation], { cwd });
      await execa("git", ["commit", "-m", "feat: changed 2"], { cwd });

      process.chdir(cwd);

      await expect(recommendVersion(pkg1, "independent", opts)).resolves.toBe("1.0.1");
      await expect(recommendVersion(pkg2, "independent", opts)).resolves.toBe("1.1.0");
    });
  });

  describe("updateChangelog()", () => {
    const gitTag = (cwd, tag) => execa("git", ["tag", tag, "-m", tag], { cwd });
    const getFileContent = fp => fs.readFile(fp, "utf8");

    it("creates files if they do not exist", async () => {
      const cwd = await initFixture("changelog-missing");

      // conventional-changelog does not accept cwd config
      process.chdir(cwd);

      const [pkg1] = await collectPackages(cwd);
      const rootPkg = {
        name: "root", // TODO: no name
        location: cwd,
      };

      // make a change in package-1
      pkg1.json.changed = 1;
      await fs.writeJSON(pkg1.manifestLocation, pkg1.toJSON());
      await execa("git", ["commit", "-am", "feat: I should be placed in the CHANGELOG"], { cwd });

      // update version
      pkg1.version = "1.1.0";
      await fs.writeJSON(pkg1.manifestLocation, pkg1.toJSON());

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

      // conventional-changelog does not accept cwd config
      process.chdir(cwd);
      await gitTag(cwd, "v1.0.0");

      const [pkg1] = await collectPackages(cwd);

      // make a change in package-1
      pkg1.json.changed = 1;
      await fs.writeJSON(pkg1.manifestLocation, pkg1.toJSON());
      await execa("git", ["commit", "-am", "fix: A second commit for our CHANGELOG"], { cwd });

      // update version
      pkg1.version = "1.0.1";
      await fs.writeJSON(pkg1.manifestLocation, pkg1.toJSON());

      await expect(
        updateChangelog(pkg1, "fixed", /* default preset */ {}).then(getFileContent)
      ).resolves.toMatchSnapshot();

      await expect(
        updateChangelog(rootPkg, "root", { version: "1.0.1" }).then(getFileContent)
      ).resolves.toMatchSnapshot();
    });

    it("appends version bump message if no commits have been recorded", async () => {
      const cwd = await initFixture("fixed");

      // conventional-changelog does not accept cwd config
      process.chdir(cwd);
      await gitTag(cwd, "v1.0.0");

      const [pkg1, pkg2] = await collectPackages(cwd);

      // make a change in package-1
      pkg1.json.changed = 1;
      await fs.writeJSON(pkg1.manifestLocation, pkg1.toJSON());
      await execa("git", ["commit", "-am", "fix(pkg1): A dependency-triggered bump"], { cwd });

      // update version
      pkg2.version = "1.0.1";
      await fs.writeJSON(pkg2.manifestLocation, pkg2.toJSON());

      await expect(
        updateChangelog(pkg2, "fixed", { changelogPreset: "angular" }).then(getFileContent)
      ).resolves.toMatchSnapshot();
    });

    it("updates independent changelogs", async () => {
      const cwd = await initFixture("independent");

      // conventional-changelog does not accept cwd config
      process.chdir(cwd);

      await Promise.all([gitTag(cwd, "package-1@1.0.0"), gitTag(cwd, "package-2@1.0.0")]);

      const [pkg1, pkg2] = await collectPackages(cwd);

      // make a change in package-1 and package-2
      pkg1.json.changed = 1;
      pkg2.json.changed = 2;
      await Promise.all([
        fs.writeJSON(pkg1.manifestLocation, pkg1.toJSON()),
        fs.writeJSON(pkg2.manifestLocation, pkg2.toJSON()),
      ]);

      await execa("git", ["add", pkg1.manifestLocation], { cwd });
      await execa("git", ["commit", "-m", "fix(stuff): changed"], { cwd });

      await execa("git", ["add", pkg2.manifestLocation], { cwd });
      await execa("git", ["commit", "-m", "feat(thing): added"], { cwd });

      // update versions
      pkg1.version = "1.0.1";
      pkg2.version = "1.1.0";
      await Promise.all([
        fs.writeJSON(pkg1.manifestLocation, pkg1.toJSON()),
        fs.writeJSON(pkg2.manifestLocation, pkg2.toJSON()),
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
