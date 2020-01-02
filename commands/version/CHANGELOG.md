# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [3.20.2](https://github.com/lerna/lerna/compare/v3.20.1...v3.20.2) (2020-01-02)


### Bug Fixes

* **version:** Loosen `--atomic` fallback to catch incompatible CLI versions ([6f0e2bb](https://github.com/lerna/lerna/commit/6f0e2bb1b033b0579910cedcf0be84f1474c1580)), closes [#2400](https://github.com/lerna/lerna/issues/2400)





## [3.20.1](https://github.com/lerna/lerna/compare/v3.20.0...v3.20.1) (2019-12-29)


### Bug Fixes

* **version:** Support git clients that do not support `git push --atomic` ([2b9b210](https://github.com/lerna/lerna/commit/2b9b210c0b6ac69853ffb01f0dbac9109ab419c5))





# [3.20.0](https://github.com/lerna/lerna/compare/v3.19.0...v3.20.0) (2019-12-27)


### Bug Fixes

* **version:** pass `--atomic` to `git push` ([#2393](https://github.com/lerna/lerna/issues/2393)) ([ec0f92a](https://github.com/lerna/lerna/commit/ec0f92aac03cea27168d3982601f40b863943a3c)), closes [#2392](https://github.com/lerna/lerna/issues/2392)





## [3.18.5](https://github.com/lerna/lerna/compare/v3.18.4...v3.18.5) (2019-11-20)


### Bug Fixes

* Auto-fix prettier formatting ([5344820](https://github.com/lerna/lerna/commit/5344820fc65da081d17f7fd2adb50ffe7101905b))





## [3.18.4](https://github.com/lerna/lerna/compare/v3.18.3...v3.18.4) (2019-11-08)


### Bug Fixes

* **version:** Clarify `--include-merged-tags` description ([b0bbfcf](https://github.com/lerna/lerna/commit/b0bbfcfa867fea420376232d2af0d80a97454c9e))





## [3.18.3](https://github.com/lerna/lerna/compare/v3.18.2...v3.18.3) (2019-10-22)


### Bug Fixes

* **version:** Correct warning message ([384cd15](https://github.com/lerna/lerna/commit/384cd15f7024201da530e8c47d2e6277f2a89f59))
* **version:** Workaround yargs bug with spurious `--` arguments ([46be9dc](https://github.com/lerna/lerna/commit/46be9dc14999e0dbe933d562a0363fba6ff2f115)), closes [#2315](https://github.com/lerna/lerna/issues/2315)





## [3.18.2](https://github.com/lerna/lerna/compare/v3.18.1...v3.18.2) (2019-10-21)


### Bug Fixes

* **version:** Update lockfile version, if present ([5b1b40b](https://github.com/lerna/lerna/commit/5b1b40b60ebd442d766236fad19bb6073ccb045b)), closes [#1998](https://github.com/lerna/lerna/issues/1998) [#2160](https://github.com/lerna/lerna/issues/2160) [#1415](https://github.com/lerna/lerna/issues/1415)





# [3.18.0](https://github.com/lerna/lerna/compare/v3.17.0...v3.18.0) (2019-10-15)


### Bug Fixes

* **options:** Explicit `--conventional-graduate` ([f73e6ed](https://github.com/lerna/lerna/commit/f73e6ed8966b06c25de973f2c7f90eea2d4f2d3a))
* **options:** Explicit `--conventional-prerelease` ([f3581ae](https://github.com/lerna/lerna/commit/f3581aede1d8c7613c0549fbe1bfbb2dfddf46f4))
* **options:** Explicit `--force-publish` ([343a751](https://github.com/lerna/lerna/commit/343a751739eda514c047037cc3b3a4ebc40932ba))
* **options:** Explicit `--ignore-scripts` ([efcb3bd](https://github.com/lerna/lerna/commit/efcb3bd2a9591f5380abb349a09ae1f1b802de29))





## [3.16.5](https://github.com/lerna/lerna/compare/v3.16.4...v3.16.5) (2019-10-07)

**Note:** Version bump only for package @lerna/version





## [3.16.4](https://github.com/lerna/lerna/compare/v3.16.3...v3.16.4) (2019-07-24)

**Note:** Version bump only for package @lerna/version





## [3.16.2](https://github.com/lerna/lerna/compare/v3.16.1...v3.16.2) (2019-07-22)

**Note:** Version bump only for package @lerna/version





## [3.16.1](https://github.com/lerna/lerna/compare/v3.16.0...v3.16.1) (2019-07-19)

**Note:** Version bump only for package @lerna/version





# [3.16.0](https://github.com/lerna/lerna/compare/v3.15.0...v3.16.0) (2019-07-18)


### Bug Fixes

* **package-graph:** Flatten cycles to avoid skipping packages ([#2185](https://github.com/lerna/lerna/issues/2185)) ([b335763](https://github.com/lerna/lerna/commit/b335763))


### Features

* **deps:** `p-map@^2.1.0` ([9e58394](https://github.com/lerna/lerna/commit/9e58394))
* **deps:** `semver@^6.2.0` ([d8016d9](https://github.com/lerna/lerna/commit/d8016d9))
* **deps:** `slash@^2.0.0` ([bedd6af](https://github.com/lerna/lerna/commit/bedd6af))





# [3.15.0](https://github.com/lerna/lerna/compare/v3.14.2...v3.15.0) (2019-06-09)


### Features

* **version:** Add `--create-release=[gitlab|github]` option ([#2073](https://github.com/lerna/lerna/issues/2073)) ([4974b78](https://github.com/lerna/lerna/commit/4974b78))





## [3.14.2](https://github.com/lerna/lerna/compare/v3.14.1...v3.14.2) (2019-06-09)


### Bug Fixes

* **version:** Remove unused dependency ([285bd7e](https://github.com/lerna/lerna/commit/285bd7e))





## [3.14.1](https://github.com/lerna/lerna/compare/v3.14.0...v3.14.1) (2019-05-15)

**Note:** Version bump only for package @lerna/version





# [3.14.0](https://github.com/lerna/lerna/compare/v3.13.4...v3.14.0) (2019-05-14)


### Features

* **conventional-commits:** Add conventional prerelease/graduation ([#1991](https://github.com/lerna/lerna/issues/1991)) ([5d84b61](https://github.com/lerna/lerna/commit/5d84b61)), closes [#1433](https://github.com/lerna/lerna/issues/1433) [#1675](https://github.com/lerna/lerna/issues/1675)
* **version:** Add just-in-time queue management ([290539b](https://github.com/lerna/lerna/commit/290539b))





## [3.13.4](https://github.com/lerna/lerna/compare/v3.13.3...v3.13.4) (2019-04-24)


### Bug Fixes

* **version:** Resolve prerelease for version without bump ([#2041](https://github.com/lerna/lerna/issues/2041)) ([aa11325](https://github.com/lerna/lerna/commit/aa11325))
* **version:** Search for complete tag prefix when composing GitHub releases ([024a6ab](https://github.com/lerna/lerna/commit/024a6ab)), closes [#2038](https://github.com/lerna/lerna/issues/2038)





## [3.13.3](https://github.com/lerna/lerna/compare/v3.13.2...v3.13.3) (2019-04-17)


### Bug Fixes

* **docs:** Add missing docs for `--tag-version-prefix` ([#2035](https://github.com/lerna/lerna/issues/2035)) ([ff9c476](https://github.com/lerna/lerna/commit/ff9c476)), closes [#1924](https://github.com/lerna/lerna/issues/1924)





## [3.13.2](https://github.com/lerna/lerna/compare/v3.13.1...v3.13.2) (2019-04-08)


### Bug Fixes

* **lifecycles:** Avoid duplicating 'rooted leaf' lifecycles ([a7ad9b6](https://github.com/lerna/lerna/commit/a7ad9b6))





## [3.13.1](https://github.com/lerna/lerna/compare/v3.13.0...v3.13.1) (2019-02-26)

**Note:** Version bump only for package @lerna/version





# [3.13.0](https://github.com/lerna/lerna/compare/v3.12.1...v3.13.0) (2019-02-15)


### Features

* **meta:** Add `repository.directory` field to package.json ([aec5023](https://github.com/lerna/lerna/commit/aec5023))
* **meta:** Normalize package.json `homepage` field ([abeb4dc](https://github.com/lerna/lerna/commit/abeb4dc))





## [3.12.1](https://github.com/lerna/lerna/compare/v3.12.0...v3.12.1) (2019-02-14)

**Note:** Version bump only for package @lerna/version





# [3.12.0](https://github.com/lerna/lerna/compare/v3.11.1...v3.12.0) (2019-02-14)


### Bug Fixes

* **version:** Log message when git repository validation is skipped ([2c40ffd](https://github.com/lerna/lerna/commit/2c40ffd))


### Features

* **version:** Skip repository validation when git is unused ([#1908](https://github.com/lerna/lerna/issues/1908)) ([b9e887e](https://github.com/lerna/lerna/commit/b9e887e)), closes [#1869](https://github.com/lerna/lerna/issues/1869)





## [3.11.1](https://github.com/lerna/lerna/compare/v3.11.0...v3.11.1) (2019-02-11)


### Bug Fixes

* **version:** Exit with an error when `--github-release` is combined with `--no-changelog` ([030de9d](https://github.com/lerna/lerna/commit/030de9d))
* **version:** Passing `--no-changelog` should not disable root versioning ([83c33a3](https://github.com/lerna/lerna/commit/83c33a3))





# [3.11.0](https://github.com/lerna/lerna/compare/v3.10.8...v3.11.0) (2019-02-08)


### Bug Fixes

* **deps:** Explicit npmlog ^4.1.2 ([571c2e2](https://github.com/lerna/lerna/commit/571c2e2))
* **deps:** Remove unused libnpm (replaced by direct sub-packages) ([1caeb28](https://github.com/lerna/lerna/commit/1caeb28))


### Features

* **version:** Create Github releases with `--github-release` ([#1864](https://github.com/lerna/lerna/issues/1864)) ([f84a631](https://github.com/lerna/lerna/commit/f84a631)), closes [#1513](https://github.com/lerna/lerna/issues/1513)





## [3.10.8](https://github.com/lerna/lerna/compare/v3.10.7...v3.10.8) (2019-02-01)


### Bug Fixes

* **version:** Fix negated option links in readme ([0908212](https://github.com/lerna/lerna/commit/0908212))





## [3.10.6](https://github.com/lerna/lerna/compare/v3.10.5...v3.10.6) (2019-01-19)


### Bug Fixes

* **options:** Document negated boolean options explicitly ([8bc9669](https://github.com/lerna/lerna/commit/8bc9669))





## [3.10.5](https://github.com/lerna/lerna/compare/v3.10.4...v3.10.5) (2019-01-11)

**Note:** Version bump only for package @lerna/version





## [3.10.1](https://github.com/lerna/lerna/compare/v3.10.0...v3.10.1) (2019-01-09)


### Bug Fixes

* **collect-updates:** Avoid improper bumps from prompt selections ([06a1cff](https://github.com/lerna/lerna/commit/06a1cff)), closes [#1357](https://github.com/lerna/lerna/issues/1357)





# [3.10.0](https://github.com/lerna/lerna/compare/v3.9.1...v3.10.0) (2019-01-08)


### Features

* **version:** Add `--no-changelog` option ([#1854](https://github.com/lerna/lerna/issues/1854)) ([d73d823](https://github.com/lerna/lerna/commit/d73d823)), closes [#1852](https://github.com/lerna/lerna/issues/1852)





# [3.9.0](https://github.com/lerna/lerna/compare/v3.8.5...v3.9.0) (2019-01-08)

**Note:** Version bump only for package @lerna/version





## [3.8.5](https://github.com/lerna/lerna/compare/v3.8.4...v3.8.5) (2019-01-05)

**Note:** Version bump only for package @lerna/version





## [3.8.2](https://github.com/lerna/lerna/compare/v3.8.1...v3.8.2) (2019-01-03)


### Bug Fixes

* **version:** Avoid recursive root lifecycle execution ([089392d](https://github.com/lerna/lerna/commit/089392d)), closes [#1844](https://github.com/lerna/lerna/issues/1844)





## [3.8.1](https://github.com/lerna/lerna/compare/v3.8.0...v3.8.1) (2018-12-31)

**Note:** Version bump only for package @lerna/version





# [3.8.0](https://github.com/lerna/lerna/compare/v3.7.2...v3.8.0) (2018-12-21)


### Bug Fixes

* **publish:** Unhide options shared with version command ([09fccd3](https://github.com/lerna/lerna/commit/09fccd3))





## [3.7.2](https://github.com/lerna/lerna/compare/v3.7.1...v3.7.2) (2018-12-21)


### Bug Fixes

* **version:** Prevent clobbering composed --yes option ([f3816be](https://github.com/lerna/lerna/commit/f3816be))





## [3.7.1](https://github.com/lerna/lerna/compare/v3.7.0...v3.7.1) (2018-12-20)

**Note:** Version bump only for package @lerna/version





# [3.7.0](https://github.com/lerna/lerna/compare/v3.6.0...v3.7.0) (2018-12-19)


### Features

* **version:** Refresh package manifests after preversion lifecycle ([7c7bf9a](https://github.com/lerna/lerna/commit/7c7bf9a))





# [3.6.0](https://github.com/lerna/lerna/compare/v3.5.1...v3.6.0) (2018-12-07)


### Bug Fixes

* **pkg:** Exclude __mocks__ from package tarball ([4017f37](https://github.com/lerna/lerna/commit/4017f37))


### Features

* Migrate existing usage to libnpm ([0d3a786](https://github.com/lerna/lerna/commit/0d3a786)), closes [#1767](https://github.com/lerna/lerna/issues/1767)





# [3.5.0](https://github.com/lerna/lerna/compare/v3.4.3...v3.5.0) (2018-11-27)


### Bug Fixes

* **version:** Add friendly error message when remote branch doesn't exist ([#1741](https://github.com/lerna/lerna/issues/1741)) ([cd34b48](https://github.com/lerna/lerna/commit/cd34b48))
* **version:** Don't version private packages lacking a version field ([#1654](https://github.com/lerna/lerna/issues/1654)) ([578bb19](https://github.com/lerna/lerna/commit/578bb19))


### Features

* **version:** Add `--include-merged-tags` option ([#1712](https://github.com/lerna/lerna/issues/1712)) ([7ee05d7](https://github.com/lerna/lerna/commit/7ee05d7))





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
