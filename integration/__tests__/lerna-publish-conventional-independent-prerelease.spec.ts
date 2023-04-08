import {
  changelogSerializer,
  cliRunner,
  cloneFixtureFactory,
  commitChangeToPackage,
  gitTag,
} from "@lerna/test-helpers";
import fs from "fs-extra";
import globby from "globby";
import os from "os";
import path from "path";

const cloneFixture = cloneFixtureFactory(path.resolve(__dirname, "../../libs/commands/publish"));

// stabilize changelog commit SHA and datestamp
expect.addSnapshotSerializer(changelogSerializer);

const env = {
  // never actually upload when calling `npm publish`
  npm_config_dry_run: true,
  // skip npm package validation, none of the stubs are real
  LERNA_INTEGRATION: "SKIP",
};

describe(`lerna publish --conventional-prerelease/graduate independent w/ changelog`, () => {
  let cwd: string;

  beforeAll(async () => {
    ({ cwd } = await cloneFixture("independent", "chore: init repo"));
    await Promise.all([
      gitTag(cwd, "package-1@1.0.0"),
      gitTag(cwd, "package-2@2.0.0"),
      gitTag(cwd, "package-3@3.0.0"),
      gitTag(cwd, "package-4@4.0.0"),
      gitTag(cwd, "package-5@5.0.0"),
    ]);
  });

  test(`release specified stable packages as prerelease`, async () => {
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
 - package-1: 1.0.0 => 1.1.0
 - package-2: 2.0.0 => 2.0.1-alpha.0
 - package-3: 3.0.0 => 4.0.0-alpha.0
 - package-5: 5.0.0 => 5.0.1-alpha.0 (private)

Successfully published:
 - package-1@1.1.0
 - package-2@2.0.1-alpha.0
 - package-3@4.0.0-alpha.0
`);
  });

  test(`bump while maintaining current prerelease status`, async () => {
    const args = ["publish", "--conventional-commits", "--yes"];
    await commitChangeToPackage(cwd, "package-1", "fix(package-1): Fix foo", { foo: false });
    await commitChangeToPackage(cwd, "package-2", "feat(package-2): Add baz", { baz: true });

    const { stdout } = await cliRunner(cwd, env)(...args);
    expect(stdout).toMatchInlineSnapshot(`

Changes:
 - package-1: 1.1.0 => 1.1.1
 - package-2: 2.0.1-alpha.0 => 2.1.0-alpha.0
 - package-3: 4.0.0-alpha.0 => 4.0.0-alpha.1
 - package-5: 5.0.1-alpha.0 => 5.0.1-alpha.1 (private)

Successfully published:
 - package-1@1.1.1
 - package-2@2.1.0-alpha.0
 - package-3@4.0.0-alpha.1
`);
  });

  test(`release all changes as prerelease`, async () => {
    const args = ["publish", "--conventional-commits", "--conventional-prerelease", "--yes"];
    await commitChangeToPackage(cwd, "package-1", "fix(package-1): Unfix foo", { foo: true });

    const { stdout } = await cliRunner(cwd, env)(...args);
    expect(stdout).toMatchInlineSnapshot(`

Changes:
 - package-1: 1.1.1 => 1.1.2-alpha.0
 - package-2: 2.1.0-alpha.0 => 2.1.0-alpha.1
 - package-3: 4.0.0-alpha.1 => 4.0.0-alpha.2
 - package-5: 5.0.1-alpha.1 => 5.0.1-alpha.2 (private)

Successfully published:
 - package-1@1.1.2-alpha.0
 - package-2@2.1.0-alpha.1
 - package-3@4.0.0-alpha.2
`);
  });

  test(`graduate specific prerelease packages`, async () => {
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
 - package-1: 1.1.2-alpha.0 => 1.2.0-alpha.0
 - package-2: 2.1.0-alpha.1 => 2.1.0
 - package-3: 4.0.0-alpha.2 => 4.0.0-alpha.3
 - package-5: 5.0.1-alpha.2 => 5.0.1-alpha.3 (private)

Successfully published:
 - package-1@1.2.0-alpha.0
 - package-2@2.1.0
 - package-3@4.0.0-alpha.3
`);
  });

  test(`graduate all prerelease packages with released HEAD`, async () => {
    const args = ["publish", "--conventional-commits", "--conventional-graduate", "--yes"];
    const { stdout } = await cliRunner(cwd, env)(...args);
    expect(stdout).toMatchInlineSnapshot(`

Changes:
 - package-1: 1.2.0-alpha.0 => 1.2.0
 - package-2: 2.1.0 => 2.1.1
 - package-3: 4.0.0-alpha.3 => 4.0.0
 - package-5: 5.0.1-alpha.3 => 5.0.1 (private)

Successfully published:
 - package-1@1.2.0
 - package-2@2.1.1
 - package-3@4.0.0
`);
  });

  test(`generate accurate changelog`, async () => {
    const changelogFilePaths = await globby(["**/CHANGELOG.md"], {
      cwd,
      absolute: true,
      followSymbolicLinks: false,
    });
    const [
      // no root changelog
      pkg1Changelog,
      pkg2Changelog,
      pkg3Changelog,
      pkg5Changelog,
    ] = await Promise.all(changelogFilePaths.sort().map((fp) => fs.readFile(fp, "utf8")));

    /**
     * ./packages/package-1/CHANGELOG.md
     */
    expect(pkg1Changelog).toMatchInlineSnapshot(`
# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [1.2.0](/compare/package-1@1.2.0-alpha.0...package-1@1.2.0) (YYYY-MM-DD)

**Note:** Version bump only for package package-1





# [1.2.0-alpha.0](/compare/package-1@1.1.2-alpha.0...package-1@1.2.0-alpha.0) (YYYY-MM-DD)


### Features

* **package-1:** Add baz ([SHA](COMMIT_URL))





## [1.1.2-alpha.0](/compare/package-1@1.1.1...package-1@1.1.2-alpha.0) (YYYY-MM-DD)


### Bug Fixes

* **package-1:** Unfix foo ([SHA](COMMIT_URL))





## [1.1.1](/compare/package-1@1.1.0...package-1@1.1.1) (YYYY-MM-DD)


### Bug Fixes

* **package-1:** Fix foo ([SHA](COMMIT_URL))





# [1.1.0](/compare/package-1@1.0.0...package-1@1.1.0) (YYYY-MM-DD)


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

## [2.1.1](/compare/package-2@2.1.0...package-2@2.1.1) (YYYY-MM-DD)

**Note:** Version bump only for package package-2





# [2.1.0](/compare/package-2@2.1.0-alpha.1...package-2@2.1.0) (YYYY-MM-DD)

**Note:** Version bump only for package package-2





# [2.1.0-alpha.1](/compare/package-2@2.1.0-alpha.0...package-2@2.1.0-alpha.1) (YYYY-MM-DD)

**Note:** Version bump only for package package-2





# [2.1.0-alpha.0](/compare/package-2@2.0.1-alpha.0...package-2@2.1.0-alpha.0) (YYYY-MM-DD)


### Features

* **package-2:** Add baz ([SHA](COMMIT_URL))





## [2.0.1-alpha.0](/compare/package-2@2.0.0...package-2@2.0.1-alpha.0) (YYYY-MM-DD)


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

# [4.0.0](/compare/package-3@4.0.0-alpha.3...package-3@4.0.0) (YYYY-MM-DD)

**Note:** Version bump only for package package-3





# [4.0.0-alpha.3](/compare/package-3@4.0.0-alpha.2...package-3@4.0.0-alpha.3) (YYYY-MM-DD)

**Note:** Version bump only for package package-3





# [4.0.0-alpha.2](/compare/package-3@4.0.0-alpha.1...package-3@4.0.0-alpha.2) (YYYY-MM-DD)

**Note:** Version bump only for package package-3





# [4.0.0-alpha.1](/compare/package-3@4.0.0-alpha.0...package-3@4.0.0-alpha.1) (YYYY-MM-DD)

**Note:** Version bump only for package package-3





# [4.0.0-alpha.0](/compare/package-3@3.0.0...package-3@4.0.0-alpha.0) (YYYY-MM-DD)


### Features

* **package-3:** Add baz feature ([SHA](COMMIT_URL))


### BREAKING CHANGES

* **package-3:** yup

`);

    /**
     * ./packages/package-5/CHANGELOG.md
     */
    expect(pkg5Changelog).toMatchInlineSnapshot(`
# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [5.0.1](/compare/package-5@5.0.1-alpha.3...package-5@5.0.1) (YYYY-MM-DD)

**Note:** Version bump only for package package-5





## [5.0.1-alpha.3](/compare/package-5@5.0.1-alpha.2...package-5@5.0.1-alpha.3) (YYYY-MM-DD)

**Note:** Version bump only for package package-5





## [5.0.1-alpha.2](/compare/package-5@5.0.1-alpha.1...package-5@5.0.1-alpha.2) (YYYY-MM-DD)

**Note:** Version bump only for package package-5





## [5.0.1-alpha.1](/compare/package-5@5.0.1-alpha.0...package-5@5.0.1-alpha.1) (YYYY-MM-DD)

**Note:** Version bump only for package package-5





## [5.0.1-alpha.0](/compare/package-5@5.0.0...package-5@5.0.1-alpha.0) (YYYY-MM-DD)

**Note:** Version bump only for package package-5

`);
  });
});
