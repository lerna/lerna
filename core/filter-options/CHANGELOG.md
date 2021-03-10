# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [4.0.0](https://github.com/lerna/lerna/compare/v3.22.1...v4.0.0) (2021-02-10)


### Bug Fixes

* Improve accuracy of JSDoc type annotations ([1ec69f0](https://github.com/lerna/lerna/commit/1ec69f0e0f7a3f1e0c74dbacb17fab2d7b7a8a44))


### Features

* Consume named exports of sibling modules ([63499e3](https://github.com/lerna/lerna/commit/63499e33652bc78fe23751875d74017e2f16a689))
* Drop support for Node v6.x & v8.x ([ff4bb4d](https://github.com/lerna/lerna/commit/ff4bb4da215555e3bb136f5af09b5cbc631e57bb))
* Expose named export ([c1303f1](https://github.com/lerna/lerna/commit/c1303f13adc4cf15f96ff25889b52149f8224c0e))
* Remove default export ([e2f1ec3](https://github.com/lerna/lerna/commit/e2f1ec3dd049d2a89880029908a2aa7c66f15082))
* **filter-options:** Remove figgy-pudding ([7d90289](https://github.com/lerna/lerna/commit/7d9028906098cf20c287c460da7d236bdb29007e))


### BREAKING CHANGES

* The default export has been removed, please use a named export instead.
* Node v6.x & v8.x are no longer supported. Please upgrade to the latest LTS release.

Here's the gnarly one-liner I used to make these changes:
```
npx lerna exec --concurrency 1 --stream -- 'json -I -f package.json -e '"'"'this.engines=this.engines||{};this.engines.node=">= 10.18.0"'"'"
```
(requires `npm i -g json` beforehand)





# [3.20.0](https://github.com/lerna/lerna/compare/v3.19.0...v3.20.0) (2019-12-27)

**Note:** Version bump only for package @lerna/filter-options





## [3.18.4](https://github.com/lerna/lerna/compare/v3.18.3...v3.18.4) (2019-11-08)


### Bug Fixes

* **filter-options:** Clarify `--since` description ([b649b35](https://github.com/lerna/lerna/commit/b649b35bccab97a0f8a5cdd3a37216b5f6db16dc))
* **filter-options:** Ensure `--include-merged-tags` is available to all `--since`-filterable commands ([287bcd8](https://github.com/lerna/lerna/commit/287bcd8b5c8dbb2dc4def5c933d0b4917c34813e)), closes [#2332](https://github.com/lerna/lerna/issues/2332)





# [3.18.0](https://github.com/lerna/lerna/compare/v3.17.0...v3.18.0) (2019-10-15)


### Bug Fixes

* **bootstrap:** Move all filter logging into get-filtered-packages method ([54dca56](https://github.com/lerna/lerna/commit/54dca563efb13ad88d478ac31668f6e13a1d99e7))


### Features

* **filter-options:** Add `--exclude-dependents` option ([ff50e29](https://github.com/lerna/lerna/commit/ff50e299aa990b121e1bd987548252376177c68a)), closes [#2198](https://github.com/lerna/lerna/issues/2198)
* **filter-options:** Allow command to continue if no packages are matched ([#2280](https://github.com/lerna/lerna/issues/2280)) ([a706023](https://github.com/lerna/lerna/commit/a706023b585846c8e43771657d65ba8797125504))
* **filter-options:** Rename `--include-filtered-*` options ([f2c3a92](https://github.com/lerna/lerna/commit/f2c3a92fe41b6fdc5d11269f0f2c3e27761b4c85))
* **filter-options:** Use figgy-pudding in getFilteredPackages() ([73badee](https://github.com/lerna/lerna/commit/73badee5da06745ff58ee96f762d7240e9b4d6f1))





## [3.16.5](https://github.com/lerna/lerna/compare/v3.16.4...v3.16.5) (2019-10-07)

**Note:** Version bump only for package @lerna/filter-options





# [3.16.0](https://github.com/lerna/lerna/compare/v3.15.0...v3.16.0) (2019-07-18)

**Note:** Version bump only for package @lerna/filter-options





## [3.14.2](https://github.com/lerna/lerna/compare/v3.14.1...v3.14.2) (2019-06-09)

**Note:** Version bump only for package @lerna/filter-options





# [3.14.0](https://github.com/lerna/lerna/compare/v3.13.4...v3.14.0) (2019-05-14)

**Note:** Version bump only for package @lerna/filter-options





## [3.13.3](https://github.com/lerna/lerna/compare/v3.13.2...v3.13.3) (2019-04-17)

**Note:** Version bump only for package @lerna/filter-options





# [3.13.0](https://github.com/lerna/lerna/compare/v3.12.1...v3.13.0) (2019-02-15)


### Features

* **meta:** Add `repository.directory` field to package.json ([aec5023](https://github.com/lerna/lerna/commit/aec5023))
* **meta:** Normalize package.json `homepage` field ([abeb4dc](https://github.com/lerna/lerna/commit/abeb4dc))





## [3.12.1](https://github.com/lerna/lerna/compare/v3.12.0...v3.12.1) (2019-02-14)

**Note:** Version bump only for package @lerna/filter-options





# [3.12.0](https://github.com/lerna/lerna/compare/v3.11.1...v3.12.0) (2019-02-14)

**Note:** Version bump only for package @lerna/filter-options





# [3.11.0](https://github.com/lerna/lerna/compare/v3.10.8...v3.11.0) (2019-02-08)


### Bug Fixes

* **filter-options:** Require arguments to --scope and --ignore ([4b81dad](https://github.com/lerna/lerna/commit/4b81dad))





## [3.10.6](https://github.com/lerna/lerna/compare/v3.10.5...v3.10.6) (2019-01-19)


### Bug Fixes

* **options:** Document negated boolean options explicitly ([8bc9669](https://github.com/lerna/lerna/commit/8bc9669))





## [3.10.1](https://github.com/lerna/lerna/compare/v3.10.0...v3.10.1) (2019-01-09)

**Note:** Version bump only for package @lerna/filter-options





# [3.10.0](https://github.com/lerna/lerna/compare/v3.9.1...v3.10.0) (2019-01-08)

**Note:** Version bump only for package @lerna/filter-options





# [3.9.0](https://github.com/lerna/lerna/compare/v3.8.5...v3.9.0) (2019-01-08)

**Note:** Version bump only for package @lerna/filter-options





## [3.8.1](https://github.com/lerna/lerna/compare/v3.8.0...v3.8.1) (2018-12-31)

**Note:** Version bump only for package @lerna/filter-options





# [3.6.0](https://github.com/lerna/lerna/compare/v3.5.1...v3.6.0) (2018-12-07)

**Note:** Version bump only for package @lerna/filter-options





# [3.5.0](https://github.com/lerna/lerna/compare/v3.4.3...v3.5.0) (2018-11-27)

**Note:** Version bump only for package @lerna/filter-options





<a name="3.3.2"></a>
## [3.3.2](https://github.com/lerna/lerna/compare/v3.3.1...v3.3.2) (2018-09-12)

**Note:** Version bump only for package @lerna/filter-options





<a name="3.3.0"></a>
# [3.3.0](https://github.com/lerna/lerna/compare/v3.2.1...v3.3.0) (2018-09-06)

**Note:** Version bump only for package @lerna/filter-options





<a name="3.1.2"></a>
## [3.1.2](https://github.com/lerna/lerna/compare/v3.1.1...v3.1.2) (2018-08-20)


### Bug Fixes

* **filter-options:** Move filterPackages logic into named export ([e863c28](https://github.com/lerna/lerna/commit/e863c28))





<a name="3.0.5"></a>
## [3.0.5](https://github.com/lerna/lerna/compare/v3.0.4...v3.0.5) (2018-08-15)


### Bug Fixes

* **filter-options:** Allow --private to be configured from file ([21e134c](https://github.com/lerna/lerna/commit/21e134c))
* **help:** Insert line break before describing boolean negations ([da2f886](https://github.com/lerna/lerna/commit/da2f886))





<a name="3.0.0"></a>
# [3.0.0](https://github.com/lerna/lerna/compare/v3.0.0-rc.0...v3.0.0) (2018-08-10)

**Note:** Version bump only for package @lerna/filter-options





<a name="3.0.0-rc.0"></a>
# [3.0.0-rc.0](https://github.com/lerna/lerna/compare/v3.0.0-beta.21...v3.0.0-rc.0) (2018-07-27)


### Features

* **cli:** Upgrade to Yargs 12 ([7899ab8](https://github.com/lerna/lerna/commit/7899ab8))





<a name="3.0.0-beta.18"></a>
# [3.0.0-beta.18](https://github.com/lerna/lerna/compare/v3.0.0-beta.17...v3.0.0-beta.18) (2018-04-24)


### Features

* **filters:** Add `--include-filtered-dependents` flag ([#1393](https://github.com/lerna/lerna/issues/1393)) ([2838260](https://github.com/lerna/lerna/commit/2838260))





<a name="3.0.0-beta.9"></a>
# [3.0.0-beta.9](https://github.com/lerna/lerna/compare/v3.0.0-beta.8...v3.0.0-beta.9) (2018-03-24)


### Bug Fixes

* **filter-options:** Move include/exclude validation into filter-packages ([503251d](https://github.com/lerna/lerna/commit/503251d))





<a name="3.0.0-beta.2"></a>
# [3.0.0-beta.2](https://github.com/lerna/lerna/compare/v3.0.0-beta.1...v3.0.0-beta.2) (2018-03-10)


### Features

* Replace @lerna/match-package-name with multimatch ([423f82c](https://github.com/lerna/lerna/commit/423f82c))





<a name="3.0.0-beta.1"></a>
# [3.0.0-beta.1](https://github.com/lerna/lerna/compare/v3.0.0-beta.0...v3.0.0-beta.1) (2018-03-09)


### Features

* **filter-options:** Exclude private packages with --no-private ([6674d18](https://github.com/lerna/lerna/commit/6674d18))
