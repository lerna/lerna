"use strict";

const fs = require("fs-extra");
const globby = require("globby");
const path = require("path");
const os = require("os");

const cliRunner = require("@lerna-test/cli-runner");
const commitChangeToPackage = require("@lerna-test/commit-change-to-package");
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

test(`lerna publish --conventional-commits independent changelog`, async () => {
  const { cwd } = await cloneFixture("independent", "feat: init repo");
  const args = ["publish", "--conventional-commits", "--yes"];

  await commitChangeToPackage(cwd, "package-1", "feat(package-1): Add foo", { foo: true });
  await commitChangeToPackage(cwd, "package-1", "fix(package-1): Fix foo", { foo: false });
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
 - package-1: 1.0.0 => 1.1.0
 - package-2: 2.0.0 => 2.1.0
 - package-3: 3.0.0 => 4.0.0
 - package-4: 4.0.0 => 4.1.0
 - package-5: 5.0.0 => 5.1.0 (private)

Successfully published:
 - package-1@1.1.0
 - package-2@2.1.0
 - package-3@4.0.0
 - package-4@4.1.0
`);

  const changelogFilePaths = await globby(["**/CHANGELOG.md"], {
    cwd,
    absolute: true,
    followSymlinkedDirectories: false,
  });
  const [
    // no root changelog
    pkg1Changelog,
    pkg2Changelog,
    pkg3Changelog,
    pkg4Changelog,
    pkg5Changelog,
  ] = await Promise.all(changelogFilePaths.sort().map(fp => fs.readFile(fp, "utf8")));

  /**
   * ./packages/package-1/CHANGELOG.md
   */
  expect(pkg1Changelog).toMatchInlineSnapshot(`
# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

<a name="1.1.0"></a>
# 1.1.0 (YYYY-MM-DD)


### Bug Fixes

* **package-1:** Fix foo ([SHA](COMMIT_URL))


### Features

* init repo ([SHA](COMMIT_URL))
* **package-1:** Add foo ([SHA](COMMIT_URL))

`);

  /**
   * ./packages/package-2/CHANGELOG.md
   */
  expect(pkg2Changelog).toMatchInlineSnapshot(`
# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

<a name="2.1.0"></a>
# 2.1.0 (YYYY-MM-DD)


### Bug Fixes

* **package-2:** Fix bar ([SHA](COMMIT_URL))


### Features

* init repo ([SHA](COMMIT_URL))

`);

  /**
   * ./packages/package-3/CHANGELOG.md
   */
  expect(pkg3Changelog).toMatchInlineSnapshot(`
# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

<a name="4.0.0"></a>
# 4.0.0 (YYYY-MM-DD)


### Features

* init repo ([SHA](COMMIT_URL))
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

<a name="4.1.0"></a>
# 4.1.0 (YYYY-MM-DD)


### Features

* init repo ([SHA](COMMIT_URL))

`);

  /**
   * ./packages/package-5/CHANGELOG.md
   */
  expect(pkg5Changelog).toMatchInlineSnapshot(`
# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

<a name="5.1.0"></a>
# 5.1.0 (YYYY-MM-DD)


### Features

* init repo ([SHA](COMMIT_URL))

`);
});
