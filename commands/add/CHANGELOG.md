# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [4.0.0](https://github.com/lerna/lerna/compare/v3.22.1...v4.0.0) (2021-02-10)


### Features

* **deps:** Bump dependencies ([affed1c](https://github.com/lerna/lerna/commit/affed1ce0fce91f01b0a9eafe357db2d985b974f))
* Consume named exports of sibling modules ([63499e3](https://github.com/lerna/lerna/commit/63499e33652bc78fe23751875d74017e2f16a689))
* **deps:** @evocateur/pacote -> pacote@^11.1.13 ([99b4217](https://github.com/lerna/lerna/commit/99b4217ed143527a45969f3a46f1bd9b84999d68))
* **deps:** npm-package-arg@^8.1.0 ([12c8923](https://github.com/lerna/lerna/commit/12c892342d33b86a00ee2cf9079f9b26fe316dc6))
* **deps:** p-map@^4.0.0 ([92b1364](https://github.com/lerna/lerna/commit/92b1364735e1f2cf379cf1047c60c4fb897d55f5))
* **deps:** semver@^7.3.2 ([003ad66](https://github.com/lerna/lerna/commit/003ad6641fab8b4e3a82251ebffd27061bd6a31b))
* Drop support for Node v6.x & v8.x ([ff4bb4d](https://github.com/lerna/lerna/commit/ff4bb4da215555e3bb136f5af09b5cbc631e57bb))


### BREAKING CHANGES

* Node v6.x & v8.x are no longer supported. Please upgrade to the latest LTS release.

Here's the gnarly one-liner I used to make these changes:
```
npx lerna exec --concurrency 1 --stream -- 'json -I -f package.json -e '"'"'this.engines=this.engines||{};this.engines.node=">= 10.18.0"'"'"
```
(requires `npm i -g json` beforehand)





# [3.21.0](https://github.com/lerna/lerna/compare/v3.20.2...v3.21.0) (2020-05-13)

**Note:** Version bump only for package @lerna/add





# [3.20.0](https://github.com/lerna/lerna/compare/v3.19.0...v3.20.0) (2019-12-27)

**Note:** Version bump only for package @lerna/add





# [3.19.0](https://github.com/lerna/lerna/compare/v3.18.5...v3.19.0) (2019-11-20)


### Features

* **add:** Add `--peer` option to save target in `peerDependencies` ([#2334](https://github.com/lerna/lerna/issues/2334)) ([e12bf6a](https://github.com/lerna/lerna/commit/e12bf6a6af636e8ac0c0085144325f36505fc8d9))





## [3.18.5](https://github.com/lerna/lerna/compare/v3.18.4...v3.18.5) (2019-11-20)

**Note:** Version bump only for package @lerna/add





## [3.18.4](https://github.com/lerna/lerna/compare/v3.18.3...v3.18.4) (2019-11-08)


### Bug Fixes

* **filter-options:** Ensure `--include-merged-tags` is available to all `--since`-filterable commands ([287bcd8](https://github.com/lerna/lerna/commit/287bcd8b5c8dbb2dc4def5c933d0b4917c34813e)), closes [#2332](https://github.com/lerna/lerna/issues/2332)





# [3.18.0](https://github.com/lerna/lerna/compare/v3.17.0...v3.18.0) (2019-10-15)


### Features

* **filter-options:** Add `--exclude-dependents` option ([ff50e29](https://github.com/lerna/lerna/commit/ff50e299aa990b121e1bd987548252376177c68a)), closes [#2198](https://github.com/lerna/lerna/issues/2198)
* **filter-options:** Rename `--include-filtered-*` options ([f2c3a92](https://github.com/lerna/lerna/commit/f2c3a92fe41b6fdc5d11269f0f2c3e27761b4c85))





# [3.17.0](https://github.com/lerna/lerna/compare/v3.16.5...v3.17.0) (2019-10-10)

**Note:** Version bump only for package @lerna/add





## [3.16.5](https://github.com/lerna/lerna/compare/v3.16.4...v3.16.5) (2019-10-07)

**Note:** Version bump only for package @lerna/add





## [3.16.2](https://github.com/lerna/lerna/compare/v3.16.1...v3.16.2) (2019-07-22)

**Note:** Version bump only for package @lerna/add





## [3.16.1](https://github.com/lerna/lerna/compare/v3.16.0...v3.16.1) (2019-07-19)

**Note:** Version bump only for package @lerna/add





# [3.16.0](https://github.com/lerna/lerna/compare/v3.15.0...v3.16.0) (2019-07-18)


### Bug Fixes

* **deps:** Bump `@evocateur/pacote` ([03e4797](https://github.com/lerna/lerna/commit/03e4797))
* **deps:** Update forked npm libs ([4d67426](https://github.com/lerna/lerna/commit/4d67426))


### Features

* **deps:** `p-map@^2.1.0` ([9e58394](https://github.com/lerna/lerna/commit/9e58394))
* **deps:** `semver@^6.2.0` ([d8016d9](https://github.com/lerna/lerna/commit/d8016d9))





# [3.15.0](https://github.com/lerna/lerna/compare/v3.14.2...v3.15.0) (2019-06-09)


### Bug Fixes

* **deps:** Consume forked npm libs ([bdd4fa1](https://github.com/lerna/lerna/commit/bdd4fa1))





## [3.14.2](https://github.com/lerna/lerna/compare/v3.14.1...v3.14.2) (2019-06-09)

**Note:** Version bump only for package @lerna/add





# [3.14.0](https://github.com/lerna/lerna/compare/v3.13.4...v3.14.0) (2019-05-14)


### Bug Fixes

* **add:** Never pass filter options to nested bootstrap ([9a5a29c](https://github.com/lerna/lerna/commit/9a5a29c)), closes [#1989](https://github.com/lerna/lerna/issues/1989)





## [3.13.3](https://github.com/lerna/lerna/compare/v3.13.2...v3.13.3) (2019-04-17)

**Note:** Version bump only for package @lerna/add





## [3.13.1](https://github.com/lerna/lerna/compare/v3.13.0...v3.13.1) (2019-02-26)


### Bug Fixes

* **deps:** pacote ^9.5.0 ([cdc2e17](https://github.com/lerna/lerna/commit/cdc2e17))





# [3.13.0](https://github.com/lerna/lerna/compare/v3.12.1...v3.13.0) (2019-02-15)


### Features

* **meta:** Add `repository.directory` field to package.json ([aec5023](https://github.com/lerna/lerna/commit/aec5023))
* **meta:** Normalize package.json `homepage` field ([abeb4dc](https://github.com/lerna/lerna/commit/abeb4dc))





## [3.12.1](https://github.com/lerna/lerna/compare/v3.12.0...v3.12.1) (2019-02-14)

**Note:** Version bump only for package @lerna/add





# [3.12.0](https://github.com/lerna/lerna/compare/v3.11.1...v3.12.0) (2019-02-14)

**Note:** Version bump only for package @lerna/add





# [3.11.0](https://github.com/lerna/lerna/compare/v3.10.8...v3.11.0) (2019-02-08)


### Bug Fixes

* **deps:** Explicit npm-package-arg ^6.1.0 ([4b20791](https://github.com/lerna/lerna/commit/4b20791))
* **deps:** Explicit pacote ^9.4.1 ([44d05bf](https://github.com/lerna/lerna/commit/44d05bf))
* **deps:** Remove unused libnpm (replaced by direct sub-packages) ([1caeb28](https://github.com/lerna/lerna/commit/1caeb28))





## [3.10.6](https://github.com/lerna/lerna/compare/v3.10.5...v3.10.6) (2019-01-19)


### Bug Fixes

* **options:** Document negated boolean options explicitly ([8bc9669](https://github.com/lerna/lerna/commit/8bc9669))





## [3.10.5](https://github.com/lerna/lerna/compare/v3.10.4...v3.10.5) (2019-01-11)

**Note:** Version bump only for package @lerna/add





## [3.10.4](https://github.com/lerna/lerna/compare/v3.10.3...v3.10.4) (2019-01-10)


### Bug Fixes

* **add:** Do not scope chained bootstrap ([d9d4bc4](https://github.com/lerna/lerna/commit/d9d4bc4))





## [3.10.3](https://github.com/lerna/lerna/compare/v3.10.2...v3.10.3) (2019-01-10)

**Note:** Version bump only for package @lerna/add





## [3.10.2](https://github.com/lerna/lerna/compare/v3.10.1...v3.10.2) (2019-01-09)

**Note:** Version bump only for package @lerna/add





## [3.10.1](https://github.com/lerna/lerna/compare/v3.10.0...v3.10.1) (2019-01-09)

**Note:** Version bump only for package @lerna/add





# [3.10.0](https://github.com/lerna/lerna/compare/v3.9.1...v3.10.0) (2019-01-08)

**Note:** Version bump only for package @lerna/add





## [3.9.1](https://github.com/lerna/lerna/compare/v3.9.0...v3.9.1) (2019-01-08)

**Note:** Version bump only for package @lerna/add





# [3.9.0](https://github.com/lerna/lerna/compare/v3.8.5...v3.9.0) (2019-01-08)

**Note:** Version bump only for package @lerna/add





## [3.8.5](https://github.com/lerna/lerna/compare/v3.8.4...v3.8.5) (2019-01-05)

**Note:** Version bump only for package @lerna/add





## [3.8.2](https://github.com/lerna/lerna/compare/v3.8.1...v3.8.2) (2019-01-03)

**Note:** Version bump only for package @lerna/add





## [3.8.1](https://github.com/lerna/lerna/compare/v3.8.0...v3.8.1) (2018-12-31)

**Note:** Version bump only for package @lerna/add





## [3.7.2](https://github.com/lerna/lerna/compare/v3.7.1...v3.7.2) (2018-12-21)

**Note:** Version bump only for package @lerna/add





## [3.7.1](https://github.com/lerna/lerna/compare/v3.7.0...v3.7.1) (2018-12-20)

**Note:** Version bump only for package @lerna/add





# [3.7.0](https://github.com/lerna/lerna/compare/v3.6.0...v3.7.0) (2018-12-19)


### Bug Fixes

* **add:** Snapshot opts passed to pacote.manifest() ([d0f0dbc](https://github.com/lerna/lerna/commit/d0f0dbc))





# [3.6.0](https://github.com/lerna/lerna/compare/v3.5.1...v3.6.0) (2018-12-07)


### Bug Fixes

* **add:** Validate local package version ([#1804](https://github.com/lerna/lerna/issues/1804)) ([ed6e2db](https://github.com/lerna/lerna/commit/ed6e2db)), closes [#1799](https://github.com/lerna/lerna/issues/1799)


### Features

* **add:** Add --no-bootstrap option ([89bb928](https://github.com/lerna/lerna/commit/89bb928))
* Migrate existing usage to libnpm ([0d3a786](https://github.com/lerna/lerna/commit/0d3a786)), closes [#1767](https://github.com/lerna/lerna/issues/1767)





# [3.5.0](https://github.com/lerna/lerna/compare/v3.4.3...v3.5.0) (2018-11-27)

**Note:** Version bump only for package @lerna/add





## [3.4.1](https://github.com/lerna/lerna/compare/v3.4.0...v3.4.1) (2018-10-04)


### Bug Fixes

* **add:** Allow --registry option ([597606c](https://github.com/lerna/lerna/commit/597606c))





<a name="3.3.2"></a>
## [3.3.2](https://github.com/lerna/lerna/compare/v3.3.1...v3.3.2) (2018-09-12)

**Note:** Version bump only for package @lerna/add





<a name="3.3.1"></a>
## [3.3.1](https://github.com/lerna/lerna/compare/v3.3.0...v3.3.1) (2018-09-11)

**Note:** Version bump only for package @lerna/add





<a name="3.3.0"></a>
# [3.3.0](https://github.com/lerna/lerna/compare/v3.2.1...v3.3.0) (2018-09-06)

**Note:** Version bump only for package @lerna/add





<a name="3.2.0"></a>
# [3.2.0](https://github.com/lerna/lerna/compare/v3.1.4...v3.2.0) (2018-08-28)


### Bug Fixes

* **add:** Order short flags first in help output, clarify description ([8efb549](https://github.com/lerna/lerna/commit/8efb549))


### Features

* **add:** Add examples to `--help` output ([#1612](https://github.com/lerna/lerna/issues/1612)) ([2ab62c1](https://github.com/lerna/lerna/commit/2ab62c1)), closes [#1608](https://github.com/lerna/lerna/issues/1608)





<a name="3.1.4"></a>
## [3.1.4](https://github.com/lerna/lerna/compare/v3.1.3...v3.1.4) (2018-08-21)

**Note:** Version bump only for package @lerna/add





<a name="3.1.3"></a>
## [3.1.3](https://github.com/lerna/lerna/compare/v3.1.2...v3.1.3) (2018-08-21)


### Bug Fixes

* **add:** Avoid passing bad scope to pacote ([ad649bf](https://github.com/lerna/lerna/commit/ad649bf)), closes [#1592](https://github.com/lerna/lerna/issues/1592)





<a name="3.1.2"></a>
## [3.1.2](https://github.com/lerna/lerna/compare/v3.1.1...v3.1.2) (2018-08-20)


### Bug Fixes

* Setup instance.filteredPackages explicitly ([32357f8](https://github.com/lerna/lerna/commit/32357f8))





<a name="3.1.1"></a>
## [3.1.1](https://github.com/lerna/lerna/compare/v3.1.0...v3.1.1) (2018-08-17)


### Bug Fixes

* **add:** Compose bootstrap to avoid extra logs ([3c534eb](https://github.com/lerna/lerna/commit/3c534eb))
* **add:** Use `pacote` to resolve third-party registry authentication woes ([a0fbf46](https://github.com/lerna/lerna/commit/a0fbf46)), closes [#1572](https://github.com/lerna/lerna/issues/1572) [#1539](https://github.com/lerna/lerna/issues/1539)





<a name="3.1.0"></a>
# [3.1.0](https://github.com/lerna/lerna/compare/v3.0.6...v3.1.0) (2018-08-17)

**Note:** Version bump only for package @lerna/add





<a name="3.0.6"></a>
## [3.0.6](https://github.com/lerna/lerna/compare/v3.0.5...v3.0.6) (2018-08-16)

**Note:** Version bump only for package @lerna/add





<a name="3.0.5"></a>
## [3.0.5](https://github.com/lerna/lerna/compare/v3.0.4...v3.0.5) (2018-08-15)

**Note:** Version bump only for package @lerna/add





<a name="3.0.4"></a>
## [3.0.4](https://github.com/lerna/lerna/compare/v3.0.3...v3.0.4) (2018-08-14)

**Note:** Version bump only for package @lerna/add





<a name="3.0.0"></a>
# [3.0.0](https://github.com/lerna/lerna/compare/v3.0.0-rc.0...v3.0.0) (2018-08-10)


### Bug Fixes

* **add:** Always use POSIX paths when computing relative file: specifiers ([ffe354f](https://github.com/lerna/lerna/commit/ffe354f))
* **add:** Support explicit & implicit relative file: specifiers ([41f231f](https://github.com/lerna/lerna/commit/41f231f))





<a name="3.0.0-rc.0"></a>
# [3.0.0-rc.0](https://github.com/lerna/lerna/compare/v3.0.0-beta.21...v3.0.0-rc.0) (2018-07-27)


### Features

* Add description from --help summary [skip ci] ([9b65d8e](https://github.com/lerna/lerna/commit/9b65d8e))
* **add:** Add `--exact` option to `lerna add` ([#1478](https://github.com/lerna/lerna/issues/1478)) ([346d156](https://github.com/lerna/lerna/commit/346d156)), closes [#1470](https://github.com/lerna/lerna/issues/1470)





<a name="3.0.0-beta.21"></a>
# [3.0.0-beta.21](https://github.com/lerna/lerna/compare/v3.0.0-beta.20...v3.0.0-beta.21) (2018-05-12)

**Note:** Version bump only for package @lerna/add





<a name="3.0.0-beta.20"></a>
# [3.0.0-beta.20](https://github.com/lerna/lerna/compare/v3.0.0-beta.19...v3.0.0-beta.20) (2018-05-07)

**Note:** Version bump only for package @lerna/add





<a name="3.0.0-beta.19"></a>
# [3.0.0-beta.19](https://github.com/lerna/lerna/compare/v3.0.0-beta.18...v3.0.0-beta.19) (2018-05-03)


### Bug Fixes

* **add:** Configure `--dev` as boolean option ([#1390](https://github.com/lerna/lerna/issues/1390)) ([75b91bd](https://github.com/lerna/lerna/commit/75b91bd))





<a name="3.0.0-beta.18"></a>
# [3.0.0-beta.18](https://github.com/lerna/lerna/compare/v3.0.0-beta.17...v3.0.0-beta.18) (2018-04-24)

**Note:** Version bump only for package @lerna/add





<a name="3.0.0-beta.17"></a>
# [3.0.0-beta.17](https://github.com/lerna/lerna/compare/v3.0.0-beta.16...v3.0.0-beta.17) (2018-04-13)


### Features

* **add:** Use directory globs to filter targeted packages ([39fa7b6](https://github.com/lerna/lerna/commit/39fa7b6))


### BREAKING CHANGES

* **add:** `lerna add` now only supports adding one dependency at a time. It is much more valuable to filter by directory globs, anyway.





<a name="3.0.0-beta.15"></a>
# [3.0.0-beta.15](https://github.com/lerna/lerna/compare/v3.0.0-beta.14...v3.0.0-beta.15) (2018-04-09)

**Note:** Version bump only for package @lerna/add





<a name="3.0.0-beta.14"></a>
# [3.0.0-beta.14](https://github.com/lerna/lerna/compare/v3.0.0-beta.13...v3.0.0-beta.14) (2018-04-03)

**Note:** Version bump only for package @lerna/add





<a name="3.0.0-beta.13"></a>
# [3.0.0-beta.13](https://github.com/lerna/lerna/compare/v3.0.0-beta.12...v3.0.0-beta.13) (2018-03-31)

**Note:** Version bump only for package @lerna/add





<a name="3.0.0-beta.12"></a>
# [3.0.0-beta.12](https://github.com/lerna/lerna/compare/v3.0.0-beta.11...v3.0.0-beta.12) (2018-03-30)


### Features

* **package:** Add `serialize()` method ([fdec3ac](https://github.com/lerna/lerna/commit/fdec3ac))
* **package:** Add Map-like get/set methods, remove raw json getter ([707d1f0](https://github.com/lerna/lerna/commit/707d1f0))


### BREAKING CHANGES

* **package:** The `Package` class no longer provides direct access to the JSON object
used to construct the instance. Map-like `get()`/`set(val)` methods are
available to modify the internal representation.





<a name="3.0.0-beta.11"></a>
# [3.0.0-beta.11](https://github.com/lerna/lerna/compare/v3.0.0-beta.10...v3.0.0-beta.11) (2018-03-29)

**Note:** Version bump only for package @lerna/add





<a name="3.0.0-beta.10"></a>
# [3.0.0-beta.10](https://github.com/lerna/lerna/compare/v3.0.0-beta.9...v3.0.0-beta.10) (2018-03-27)


### Bug Fixes

* **add:** Use bootstrap factory, not handler ([dbfc891](https://github.com/lerna/lerna/commit/dbfc891))


### Features

* **commands:** Delay require of command instantiation ([a1284f3](https://github.com/lerna/lerna/commit/a1284f3))


### BREAKING CHANGES

* **commands:** The default export of command packages is now a factory, not the subclass (which is now a named export).





<a name="3.0.0-beta.9"></a>
# [3.0.0-beta.9](https://github.com/lerna/lerna/compare/v3.0.0-beta.8...v3.0.0-beta.9) (2018-03-24)


### Features

* **command:** Rename this.repository -> this.project ([43e98a0](https://github.com/lerna/lerna/commit/43e98a0))





<a name="3.0.0-beta.8"></a>
# [3.0.0-beta.8](https://github.com/lerna/lerna/compare/v3.0.0-beta.7...v3.0.0-beta.8) (2018-03-22)


### Bug Fixes

* **add:** Support tag and version specifiers ([5df0fc8](https://github.com/lerna/lerna/commit/5df0fc8)), closes [#1306](https://github.com/lerna/lerna/issues/1306)





<a name="3.0.0-beta.7"></a>
# [3.0.0-beta.7](https://github.com/lerna/lerna/compare/v3.0.0-beta.6...v3.0.0-beta.7) (2018-03-20)

**Note:** Version bump only for package @lerna/add





<a name="3.0.0-beta.6"></a>
# [3.0.0-beta.6](https://github.com/lerna/lerna/compare/v3.0.0-beta.5...v3.0.0-beta.6) (2018-03-19)

**Note:** Version bump only for package @lerna/add





<a name="3.0.0-beta.5"></a>
# [3.0.0-beta.5](https://github.com/lerna/lerna/compare/v3.0.0-beta.4...v3.0.0-beta.5) (2018-03-19)

**Note:** Version bump only for package @lerna/add





<a name="3.0.0-beta.4"></a>
# [3.0.0-beta.4](https://github.com/lerna/lerna/compare/v3.0.0-beta.3...v3.0.0-beta.4) (2018-03-19)


### Bug Fixes

* Use correct instance property override ([9249221](https://github.com/lerna/lerna/commit/9249221))





<a name="3.0.0-beta.3"></a>
# [3.0.0-beta.3](https://github.com/lerna/lerna/compare/v3.0.0-beta.2...v3.0.0-beta.3) (2018-03-15)

**Note:** Version bump only for package @lerna/add





<a name="3.0.0-beta.2"></a>
# [3.0.0-beta.2](https://github.com/lerna/lerna/compare/v3.0.0-beta.1...v3.0.0-beta.2) (2018-03-10)

**Note:** Version bump only for package @lerna/add





<a name="3.0.0-beta.1"></a>
# [3.0.0-beta.1](https://github.com/lerna/lerna/compare/v3.0.0-beta.0...v3.0.0-beta.1) (2018-03-09)

**Note:** Version bump only for package @lerna/add
