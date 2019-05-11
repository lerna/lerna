"use strict";

const fs = require("fs-extra");
const globby = require("globby");
const path = require("path");
const os = require("os");

const cliRunner = require("@lerna-test/cli-runner");
const commitChangeToPackage = require("@lerna-test/commit-change-to-package");
const gitTag = require("@lerna-test/git-tag");
const cloneFixture = require("@lerna-test/clone-fixture")(
  path.resolve(__dirname, "../commands/publish/__tests__")
);

// stabilize changelog commit SHA and datestamp
expect.addSnapshotSerializer(require("@lerna-test/serialize-changelog"));

const env = {
  // never actually upload when calling `npm publish`
  npm_config_dry_run: true,
  // skip npm package validation, none of the stubs are real
  LERNA_INTEGRATION: "SKIP",
};

describe(`lerna publish --conventional-prerelease/graduate fixed w/ changelog`, () => {
  let cwd;

  beforeAll(async () => {
    ({ cwd } = await cloneFixture("normal", "chore: init repo"));
    await gitTag(cwd, "v1.0.0");
  });

  test(`release specified stable packages as prerelease, ignoring specified packages`, async () => {
    const args = [
      "publish",
      "--conventional-commits",
      "--conventional-prerelease=package-2,package-3",
      "--yes",
    ];
    await commitChangeToPackage(cwd, "package-1", "feat(package-1): Add foo", { foo: true });
    await commitChangeToPackage(cwd, "package-2", "fix(package-2): Fix bar", { bar: true });
    await commitChangeToPackage(
      cwd,
      "package-3",
      `feat(package-3): Add baz feature${os.EOL}${os.EOL}BREAKING CHANGE: yup`,
      { baz: true }
    );

    const { stdout } = await cliRunner(cwd, env)(...args);
    expect(stdout).toMatchInlineSnapshot(`

Changes:
 - package-1: 1.0.0 => 2.0.0-alpha.0
 - package-2: 1.0.0 => 2.0.0-alpha.0
 - package-3: 1.0.0 => 2.0.0-alpha.0
 - package-5: 1.0.0 => 2.0.0-alpha.0 (private)

Successfully published:
 - package-1@2.0.0-alpha.0
 - package-2@2.0.0-alpha.0
 - package-3@2.0.0-alpha.0
`);
  });

  test(`bump while maintaining current prerelease status`, async () => {
    const args = ["publish", "--conventional-commits", "--yes"];
    await commitChangeToPackage(cwd, "package-1", "fix(package-1): Fix foo", { foo: false });
    await commitChangeToPackage(cwd, "package-2", "feat(package-2): Add baz", { baz: true });

    const { stdout } = await cliRunner(cwd, env)(...args);
    expect(stdout).toMatchInlineSnapshot(`

Changes:
 - package-1: 2.0.0-alpha.0 => 2.0.0-alpha.1
 - package-2: 2.0.0-alpha.0 => 2.0.0-alpha.1
 - package-3: 2.0.0-alpha.0 => 2.0.0-alpha.1
 - package-5: 2.0.0-alpha.0 => 2.0.0-alpha.1 (private)

Successfully published:
 - package-1@2.0.0-alpha.1
 - package-2@2.0.0-alpha.1
 - package-3@2.0.0-alpha.1
`);
  });

  test(`graduate prerelease packages`, async () => {
    const args = [
      "publish",
      "--conventional-commits",
      "--conventional-graduate=package-2,package-4",
      "--yes",
    ];
    await commitChangeToPackage(cwd, "package-1", "feat(package-1): Add baz", { baz: true });

    const { stdout } = await cliRunner(cwd, env)(...args);
    expect(stdout).toMatchInlineSnapshot(`

Changes:
 - package-1: 2.0.0-alpha.1 => 2.0.0
 - package-2: 2.0.0-alpha.1 => 2.0.0
 - package-3: 2.0.0-alpha.1 => 2.0.0
 - package-5: 2.0.0-alpha.1 => 2.0.0 (private)

Successfully published:
 - package-1@2.0.0
 - package-2@2.0.0
 - package-3@2.0.0
`);
  });

  test(`graduate all prerelease packages with released HEAD`, async () => {
    const args = ["publish", "--conventional-commits", "--conventional-prerelease", "--yes"];
    await commitChangeToPackage(cwd, "package-4", "fix(package-4): And another thing", { thing: true });
    await cliRunner(cwd, env)(...args);

    const graduateArgs = ["publish", "--conventional-commits", "--conventional-graduate", "--yes"];
    const { stdout } = await cliRunner(cwd, env)(...graduateArgs);
    expect(stdout).toMatchInlineSnapshot(`

Changes:
 - package-4: 2.0.1-alpha.0 => 2.0.1

Successfully published:
 - package-4@2.0.1
`);
  });

  test(`generate accurate changelog`, async () => {
    // ensure changelog header is not duplicated
    const args = ["publish", "--conventional-commits", "--yes"];
    await commitChangeToPackage(cwd, "package-2", "fix(package-2): And another thing", { thing: true });
    await cliRunner(cwd, env)(...args);

    const changelogFilePaths = await globby(["**/CHANGELOG.md"], {
      cwd,
      absolute: true,
      followSymlinkedDirectories: false,
    });
    const [
      rootChangelog,
      pkg1Changelog,
      pkg2Changelog,
      pkg3Changelog,
      pkg4Changelog,
      pkg5Changelog,
    ] = await Promise.all(changelogFilePaths.sort().map(fp => fs.readFile(fp, "utf8")));

    /**
     * ./CHANGELOG.md
     */
    expect(rootChangelog).toMatchInlineSnapshot(`
# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [2.0.2](/compare/v2.0.1...v2.0.2) (YYYY-MM-DD)


### Bug Fixes

* **package-2:** And another thing ([SHA](COMMIT_URL))





## [2.0.1](/compare/v2.0.1-alpha.0...v2.0.1) (YYYY-MM-DD)

**Note:** Version bump only for package normal





## [2.0.1-alpha.0](/compare/v2.0.0...v2.0.1-alpha.0) (YYYY-MM-DD)


### Bug Fixes

* **package-4:** And another thing ([SHA](COMMIT_URL))





# [2.0.0](/compare/v2.0.0-alpha.1...v2.0.0) (YYYY-MM-DD)


### Features

* **package-1:** Add baz ([SHA](COMMIT_URL))





# [2.0.0-alpha.1](/compare/v2.0.0-alpha.0...v2.0.0-alpha.1) (YYYY-MM-DD)


### Bug Fixes

* **package-1:** Fix foo ([SHA](COMMIT_URL))


### Features

* **package-2:** Add baz ([SHA](COMMIT_URL))





# [2.0.0-alpha.0](/compare/v1.0.0...v2.0.0-alpha.0) (YYYY-MM-DD)


### Bug Fixes

* **package-2:** Fix bar ([SHA](COMMIT_URL))


### Features

* **package-1:** Add foo ([SHA](COMMIT_URL))
* **package-3:** Add baz feature ([SHA](COMMIT_URL))


### BREAKING CHANGES

* **package-3:** yup

`);

    /**
     * ./packages/package-1/CHANGELOG.md
     */
    expect(pkg1Changelog).toMatchInlineSnapshot(`
# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [2.0.0](/compare/v2.0.0-alpha.1...v2.0.0) (YYYY-MM-DD)


### Features

* **package-1:** Add baz ([SHA](COMMIT_URL))





# [2.0.0-alpha.1](/compare/v2.0.0-alpha.0...v2.0.0-alpha.1) (YYYY-MM-DD)


### Bug Fixes

* **package-1:** Fix foo ([SHA](COMMIT_URL))





# [2.0.0-alpha.0](/compare/v1.0.0...v2.0.0-alpha.0) (YYYY-MM-DD)


### Features

* **package-1:** Add foo ([SHA](COMMIT_URL))

`);

    /**
     * ./packages/package-2/CHANGELOG.md
     */
    expect(pkg2Changelog).toMatchInlineSnapshot(`
# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [2.0.2](/compare/v2.0.1...v2.0.2) (YYYY-MM-DD)


### Bug Fixes

* **package-2:** And another thing ([SHA](COMMIT_URL))





# [2.0.0](/compare/v2.0.0-alpha.1...v2.0.0) (YYYY-MM-DD)

**Note:** Version bump only for package package-2





# [2.0.0-alpha.1](/compare/v2.0.0-alpha.0...v2.0.0-alpha.1) (YYYY-MM-DD)


### Features

* **package-2:** Add baz ([SHA](COMMIT_URL))





# [2.0.0-alpha.0](/compare/v1.0.0...v2.0.0-alpha.0) (YYYY-MM-DD)


### Bug Fixes

* **package-2:** Fix bar ([SHA](COMMIT_URL))

`);

    /**
     * ./packages/package-3/CHANGELOG.md
     */
    expect(pkg3Changelog).toMatchInlineSnapshot(`
# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [2.0.2](/compare/v2.0.1...v2.0.2) (YYYY-MM-DD)

**Note:** Version bump only for package package-3





# [2.0.0](/compare/v2.0.0-alpha.1...v2.0.0) (YYYY-MM-DD)

**Note:** Version bump only for package package-3





# [2.0.0-alpha.1](/compare/v2.0.0-alpha.0...v2.0.0-alpha.1) (YYYY-MM-DD)

**Note:** Version bump only for package package-3





# [2.0.0-alpha.0](/compare/v1.0.0...v2.0.0-alpha.0) (YYYY-MM-DD)


### Features

* **package-3:** Add baz feature ([SHA](COMMIT_URL))


### BREAKING CHANGES

* **package-3:** yup

`);

    /**
     * ./packages/package-4/CHANGELOG.md
     */
    expect(pkg4Changelog).toMatchInlineSnapshot(`
# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [2.0.1](/compare/v2.0.1-alpha.0...v2.0.1) (YYYY-MM-DD)

**Note:** Version bump only for package package-4





## [2.0.1-alpha.0](/compare/v2.0.0...v2.0.1-alpha.0) (YYYY-MM-DD)


### Bug Fixes

* **package-4:** And another thing ([SHA](COMMIT_URL))

`);

    /**
     * ./packages/package-5/CHANGELOG.md
     */
    expect(pkg5Changelog).toMatchInlineSnapshot(`
# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [2.0.2](/compare/v2.0.1...v2.0.2) (YYYY-MM-DD)

**Note:** Version bump only for package package-5





# [2.0.0](/compare/v2.0.0-alpha.1...v2.0.0) (YYYY-MM-DD)

**Note:** Version bump only for package package-5





# [2.0.0-alpha.1](/compare/v2.0.0-alpha.0...v2.0.0-alpha.1) (YYYY-MM-DD)

**Note:** Version bump only for package package-5





# [2.0.0-alpha.0](/compare/v1.0.0...v2.0.0-alpha.0) (YYYY-MM-DD)

**Note:** Version bump only for package package-5

`);
  });
});
