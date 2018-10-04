# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [3.4.1](https://github.com/lerna/lerna/compare/v3.4.0...v3.4.1) (2018-10-04)


### Bug Fixes

* **conventional-commits:** Upgrade angular preset, ensure header is not duplicated ([159a0b0](https://github.com/lerna/lerna/commit/159a0b0)), closes [#1696](https://github.com/lerna/lerna/issues/1696)





<a name="3.3.2"></a>
## [3.3.2](https://github.com/lerna/lerna/compare/v3.3.1...v3.3.2) (2018-09-12)


### Bug Fixes

* **version:** Allow `--force-publish` to work on tagged releases ([7971bf3](https://github.com/lerna/lerna/commit/7971bf3)), closes [#1667](https://github.com/lerna/lerna/issues/1667) [#1671](https://github.com/lerna/lerna/issues/1671)





<a name="3.3.1"></a>
## [3.3.1](https://github.com/lerna/lerna/compare/v3.3.0...v3.3.1) (2018-09-11)

**Note:** Version bump only for package @lerna/version





<a name="3.3.0"></a>
# [3.3.0](https://github.com/lerna/lerna/compare/v3.2.1...v3.3.0) (2018-09-06)

**Note:** Version bump only for package @lerna/version





<a name="3.2.0"></a>
# [3.2.0](https://github.com/lerna/lerna/compare/v3.1.4...v3.2.0) (2018-08-28)


### Bug Fixes

* **version:** Make changes to packages in batched topological order ([d799fbf](https://github.com/lerna/lerna/commit/d799fbf))
* **version:** Skip working tree validation when `--no-git-tag-version` passed ([bd948cc](https://github.com/lerna/lerna/commit/bd948cc)), closes [#1613](https://github.com/lerna/lerna/issues/1613)





<a name="3.1.3"></a>
## [3.1.3](https://github.com/lerna/lerna/compare/v3.1.2...v3.1.3) (2018-08-21)

**Note:** Version bump only for package @lerna/version





<a name="3.1.2"></a>
## [3.1.2](https://github.com/lerna/lerna/compare/v3.1.1...v3.1.2) (2018-08-20)


### Bug Fixes

* Use packageGraph.rawPackageList instead of misleading instance.filteredPackages ([2e2abdc](https://github.com/lerna/lerna/commit/2e2abdc))





<a name="3.1.0"></a>
# [3.1.0](https://github.com/lerna/lerna/compare/v3.0.6...v3.1.0) (2018-08-17)


### Bug Fixes

* **command:** Detect composed commands more accurately ([1e51b39](https://github.com/lerna/lerna/commit/1e51b39))
* **command:** Log lerna CLI version with less ambiguity ([67494e7](https://github.com/lerna/lerna/commit/67494e7))
* **version:** Throw errors if tree is unclean or duplicating tagged release ([d8ee1cf](https://github.com/lerna/lerna/commit/d8ee1cf))





<a name="3.0.6"></a>
## [3.0.6](https://github.com/lerna/lerna/compare/v3.0.5...v3.0.6) (2018-08-16)


### Bug Fixes

* **command:** Silence goalpost logging when running a composed command ([12b4280](https://github.com/lerna/lerna/commit/12b4280))
* **version:** Pass --preid to selection prompt ([23a30a0](https://github.com/lerna/lerna/commit/23a30a0)), closes [#1214](https://github.com/lerna/lerna/issues/1214)
* **version:** Prioritize `--preid` over existing prerelease ID ([#1568](https://github.com/lerna/lerna/issues/1568)) ([f2c470a](https://github.com/lerna/lerna/commit/f2c470a))





<a name="3.0.5"></a>
## [3.0.5](https://github.com/lerna/lerna/compare/v3.0.4...v3.0.5) (2018-08-15)


### Bug Fixes

* **help:** Insert line break before describing boolean negations ([da2f886](https://github.com/lerna/lerna/commit/da2f886))
* **options:** Provide -y alias for --yes ([3ea460c](https://github.com/lerna/lerna/commit/3ea460c))
* **publish:** Add confirmation prompt before execution ([47766e5](https://github.com/lerna/lerna/commit/47766e5)), closes [#1566](https://github.com/lerna/lerna/issues/1566)
* **version:** Log skipped publish when composed ([89645b7](https://github.com/lerna/lerna/commit/89645b7))





<a name="3.0.2"></a>
## [3.0.2](https://github.com/lerna/lerna/compare/v3.0.1...v3.0.2) (2018-08-11)


### Bug Fixes

* **conventional-commits:** Pass --tag-version-prefix to changelog utilities ([8ed7d83](https://github.com/lerna/lerna/commit/8ed7d83))
* **version:** Allow config files to override defaults ([bb1cfb5](https://github.com/lerna/lerna/commit/bb1cfb5))
* **version:** Positional bump supersedes `--conventional-commits` when choosing version ([a74c866](https://github.com/lerna/lerna/commit/a74c866))





<a name="3.0.0"></a>
# [3.0.0](https://github.com/lerna/lerna/compare/v3.0.0-rc.0...v3.0.0) (2018-08-10)


### Features

* Split `lerna version` from of `lerna publish` ([#1522](https://github.com/lerna/lerna/issues/1522)) ([8b97394](https://github.com/lerna/lerna/commit/8b97394)), closes [#277](https://github.com/lerna/lerna/issues/277) [#936](https://github.com/lerna/lerna/issues/936) [#956](https://github.com/lerna/lerna/issues/956) [#961](https://github.com/lerna/lerna/issues/961) [#1056](https://github.com/lerna/lerna/issues/1056) [#1118](https://github.com/lerna/lerna/issues/1118) [#1385](https://github.com/lerna/lerna/issues/1385) [#1483](https://github.com/lerna/lerna/issues/1483) [#1494](https://github.com/lerna/lerna/issues/1494)


### BREAKING CHANGES

* * `--preid` now defaults to "alpha" during prereleases:

  The previous default for this option was undefined, which led to an awkward "1.0.1-0" result when passed to `semver.inc()`.

  The new default "alpha" yields a much more useful "1.0.1-alpha.0" result. Any previous prerelease ID will be preserved, just as it was before.

* `--no-verify` is no longer passed to `git commit` by default, but controlled by the new `--commit-hooks` option:

  The previous behavior was too overzealous, and the new option operates exactly like the corresponding [npm version](https://docs.npmjs.com/cli/version#commit-hooks) option of the same name.

  As long as your pre-commit hooks are properly scoped to ignore changes in package.json files, this change should not affect you. If that is not the case, you may pass `--no-commit-hooks` to restore the previous behavior.
