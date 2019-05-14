# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [3.14.0](https://github.com/lerna/lerna/compare/v3.13.4...v3.14.0) (2019-05-14)

**Note:** Version bump only for package @lerna/bootstrap





## [3.13.3](https://github.com/lerna/lerna/compare/v3.13.2...v3.13.3) (2019-04-17)

**Note:** Version bump only for package @lerna/bootstrap





## [3.13.1](https://github.com/lerna/lerna/compare/v3.13.0...v3.13.1) (2019-02-26)

**Note:** Version bump only for package @lerna/bootstrap





# [3.13.0](https://github.com/lerna/lerna/compare/v3.12.1...v3.13.0) (2019-02-15)


### Features

* **meta:** Add `repository.directory` field to package.json ([aec5023](https://github.com/lerna/lerna/commit/aec5023))
* **meta:** Normalize package.json `homepage` field ([abeb4dc](https://github.com/lerna/lerna/commit/abeb4dc))





## [3.12.1](https://github.com/lerna/lerna/compare/v3.12.0...v3.12.1) (2019-02-14)

**Note:** Version bump only for package @lerna/bootstrap





# [3.12.0](https://github.com/lerna/lerna/compare/v3.11.1...v3.12.0) (2019-02-14)

**Note:** Version bump only for package @lerna/bootstrap





# [3.11.0](https://github.com/lerna/lerna/compare/v3.10.8...v3.11.0) (2019-02-08)


### Bug Fixes

* **deps:** Explicit npm-package-arg ^6.1.0 ([4b20791](https://github.com/lerna/lerna/commit/4b20791))
* **deps:** Explicit npmlog ^4.1.2 ([571c2e2](https://github.com/lerna/lerna/commit/571c2e2))
* **deps:** Remove unused libnpm (replaced by direct sub-packages) ([1caeb28](https://github.com/lerna/lerna/commit/1caeb28))





## [3.10.6](https://github.com/lerna/lerna/compare/v3.10.5...v3.10.6) (2019-01-19)

**Note:** Version bump only for package @lerna/bootstrap





## [3.10.5](https://github.com/lerna/lerna/compare/v3.10.4...v3.10.5) (2019-01-11)

**Note:** Version bump only for package @lerna/bootstrap





## [3.10.4](https://github.com/lerna/lerna/compare/v3.10.3...v3.10.4) (2019-01-10)


### Bug Fixes

* **bootstrap:** Do not `npm ci` when hoisting ([27516b9](https://github.com/lerna/lerna/commit/27516b9)), closes [#1865](https://github.com/lerna/lerna/issues/1865)





## [3.10.3](https://github.com/lerna/lerna/compare/v3.10.2...v3.10.3) (2019-01-10)


### Bug Fixes

* **bootstrap:** When filtering, only bootstrap filtered packages ([71174e4](https://github.com/lerna/lerna/commit/71174e4)), closes [#1421](https://github.com/lerna/lerna/issues/1421) [#1766](https://github.com/lerna/lerna/issues/1766)





## [3.10.2](https://github.com/lerna/lerna/compare/v3.10.1...v3.10.2) (2019-01-09)


### Bug Fixes

* **bootstrap:** Remove fancy root lifecycle execution, it was foolish ([9f80722](https://github.com/lerna/lerna/commit/9f80722)), closes [#1857](https://github.com/lerna/lerna/issues/1857)





## [3.10.1](https://github.com/lerna/lerna/compare/v3.10.0...v3.10.1) (2019-01-09)

**Note:** Version bump only for package @lerna/bootstrap





# [3.10.0](https://github.com/lerna/lerna/compare/v3.9.1...v3.10.0) (2019-01-08)

**Note:** Version bump only for package @lerna/bootstrap





## [3.9.1](https://github.com/lerna/lerna/compare/v3.9.0...v3.9.1) (2019-01-08)


### Bug Fixes

* **bootstrap:** Don't pass `--ignore-scripts` to `npm install` ([e602838](https://github.com/lerna/lerna/commit/e602838)), closes [#1855](https://github.com/lerna/lerna/issues/1855)
* **bootstrap:** Prevent recursive execution from all install lifecycles ([ea9dbbe](https://github.com/lerna/lerna/commit/ea9dbbe))





# [3.9.0](https://github.com/lerna/lerna/compare/v3.8.5...v3.9.0) (2019-01-08)


### Bug Fixes

* **bootstrap:** Only run install lifecycles once-per-package, in topological order ([929ae22](https://github.com/lerna/lerna/commit/929ae22))


### Features

* **bootstrap:** Add `--ignore-prepublish` option ([f14fc06](https://github.com/lerna/lerna/commit/f14fc06))
* **bootstrap:** Run root install lifecycles where appropriate ([944e36f](https://github.com/lerna/lerna/commit/944e36f))





## [3.8.5](https://github.com/lerna/lerna/compare/v3.8.4...v3.8.5) (2019-01-05)

**Note:** Version bump only for package @lerna/bootstrap





## [3.8.2](https://github.com/lerna/lerna/compare/v3.8.1...v3.8.2) (2019-01-03)


### Bug Fixes

* **bootstrap:** Bail out of hoisted recursive lifecycles ([169c943](https://github.com/lerna/lerna/commit/169c943)), closes [#1125](https://github.com/lerna/lerna/issues/1125)





## [3.8.1](https://github.com/lerna/lerna/compare/v3.8.0...v3.8.1) (2018-12-31)


### Bug Fixes

* **progress:** Correctly avoid progress where we don't want it ([0de3df9](https://github.com/lerna/lerna/commit/0de3df9))
* **progress:** Enable progress during logging setup, correcting default ([da81e60](https://github.com/lerna/lerna/commit/da81e60))





## [3.7.2](https://github.com/lerna/lerna/compare/v3.7.1...v3.7.2) (2018-12-21)

**Note:** Version bump only for package @lerna/bootstrap





## [3.7.1](https://github.com/lerna/lerna/compare/v3.7.0...v3.7.1) (2018-12-20)


### Bug Fixes

* **bootstrap:** Pulse progress bar during execution ([b38a151](https://github.com/lerna/lerna/commit/b38a151))





# [3.7.0](https://github.com/lerna/lerna/compare/v3.6.0...v3.7.0) (2018-12-19)


### Bug Fixes

* **bootstrap:** Use run-lifecycle factory instead of manual filtering ([d32feaa](https://github.com/lerna/lerna/commit/d32feaa))





# [3.6.0](https://github.com/lerna/lerna/compare/v3.5.1...v3.6.0) (2018-12-07)


### Features

* **bootstrap:** Support `--force-local` option ([#1807](https://github.com/lerna/lerna/issues/1807)) ([25572af](https://github.com/lerna/lerna/commit/25572af)), closes [#1763](https://github.com/lerna/lerna/issues/1763)
* Migrate existing usage to libnpm ([0d3a786](https://github.com/lerna/lerna/commit/0d3a786)), closes [#1767](https://github.com/lerna/lerna/issues/1767)





# [3.5.0](https://github.com/lerna/lerna/compare/v3.4.3...v3.5.0) (2018-11-27)


### Bug Fixes

* prettier ([001a6df](https://github.com/lerna/lerna/commit/001a6df))





## [3.4.1](https://github.com/lerna/lerna/compare/v3.4.0...v3.4.1) (2018-10-04)


### Bug Fixes

* **bootstrap:** Constrain npm-conf argument object to options.registry only ([987fd26](https://github.com/lerna/lerna/commit/987fd26))





<a name="3.3.2"></a>
## [3.3.2](https://github.com/lerna/lerna/compare/v3.3.1...v3.3.2) (2018-09-12)

**Note:** Version bump only for package @lerna/bootstrap





<a name="3.3.1"></a>
## [3.3.1](https://github.com/lerna/lerna/compare/v3.3.0...v3.3.1) (2018-09-11)

**Note:** Version bump only for package @lerna/bootstrap





<a name="3.3.0"></a>
# [3.3.0](https://github.com/lerna/lerna/compare/v3.2.1...v3.3.0) (2018-09-06)


### Bug Fixes

* **run-lifecycle:** Propagate exit code when execution fails ([4763f95](https://github.com/lerna/lerna/commit/4763f95)), closes [#1495](https://github.com/lerna/lerna/issues/1495)





<a name="3.2.0"></a>
# [3.2.0](https://github.com/lerna/lerna/compare/v3.1.4...v3.2.0) (2018-08-28)

**Note:** Version bump only for package @lerna/bootstrap





<a name="3.1.4"></a>
## [3.1.4](https://github.com/lerna/lerna/compare/v3.1.3...v3.1.4) (2018-08-21)

**Note:** Version bump only for package @lerna/bootstrap





<a name="3.1.3"></a>
## [3.1.3](https://github.com/lerna/lerna/compare/v3.1.2...v3.1.3) (2018-08-21)


### Bug Fixes

* **global-options:** Move env defaults to command superclass ([6d8e405](https://github.com/lerna/lerna/commit/6d8e405)), closes [#1449](https://github.com/lerna/lerna/issues/1449)





<a name="3.1.2"></a>
## [3.1.2](https://github.com/lerna/lerna/compare/v3.1.1...v3.1.2) (2018-08-20)


### Bug Fixes

* Setup instance.filteredPackages explicitly ([32357f8](https://github.com/lerna/lerna/commit/32357f8))
* **bootstrap:** Remove redundant duplicate name check ([c2405a1](https://github.com/lerna/lerna/commit/c2405a1))





<a name="3.1.0"></a>
# [3.1.0](https://github.com/lerna/lerna/compare/v3.0.6...v3.1.0) (2018-08-17)

**Note:** Version bump only for package @lerna/bootstrap





<a name="3.0.6"></a>
## [3.0.6](https://github.com/lerna/lerna/compare/v3.0.5...v3.0.6) (2018-08-16)

**Note:** Version bump only for package @lerna/bootstrap





<a name="3.0.5"></a>
## [3.0.5](https://github.com/lerna/lerna/compare/v3.0.4...v3.0.5) (2018-08-15)

**Note:** Version bump only for package @lerna/bootstrap





<a name="3.0.4"></a>
## [3.0.4](https://github.com/lerna/lerna/compare/v3.0.3...v3.0.4) (2018-08-14)

**Note:** Version bump only for package @lerna/bootstrap





<a name="3.0.0"></a>
# [3.0.0](https://github.com/lerna/lerna/compare/v3.0.0-rc.0...v3.0.0) (2018-08-10)

**Note:** Version bump only for package @lerna/bootstrap





<a name="3.0.0-rc.0"></a>
# [3.0.0-rc.0](https://github.com/lerna/lerna/compare/v3.0.0-beta.21...v3.0.0-rc.0) (2018-07-27)


### Features

* Add description from --help summary [skip ci] ([9b65d8e](https://github.com/lerna/lerna/commit/9b65d8e))
* **cli:** Upgrade to Yargs 12 ([7899ab8](https://github.com/lerna/lerna/commit/7899ab8))





<a name="3.0.0-beta.21"></a>
# [3.0.0-beta.21](https://github.com/lerna/lerna/compare/v3.0.0-beta.20...v3.0.0-beta.21) (2018-05-12)

**Note:** Version bump only for package @lerna/bootstrap





<a name="3.0.0-beta.20"></a>
# [3.0.0-beta.20](https://github.com/lerna/lerna/compare/v3.0.0-beta.19...v3.0.0-beta.20) (2018-05-07)

**Note:** Version bump only for package @lerna/bootstrap





<a name="3.0.0-beta.19"></a>
# [3.0.0-beta.19](https://github.com/lerna/lerna/compare/v3.0.0-beta.18...v3.0.0-beta.19) (2018-05-03)

**Note:** Version bump only for package @lerna/bootstrap





<a name="3.0.0-beta.18"></a>
# [3.0.0-beta.18](https://github.com/lerna/lerna/compare/v3.0.0-beta.17...v3.0.0-beta.18) (2018-04-24)

**Note:** Version bump only for package @lerna/bootstrap





<a name="3.0.0-beta.17"></a>
# [3.0.0-beta.17](https://github.com/lerna/lerna/compare/v3.0.0-beta.16...v3.0.0-beta.17) (2018-04-13)


### Bug Fixes

* **bootstrap:** Pass npm-conf to feature predicate instead of directly reading process.env ([b4af3c9](https://github.com/lerna/lerna/commit/b4af3c9))
* **bootstrap:** Pluralize log text ([#1232](https://github.com/lerna/lerna/issues/1232)) ([5c74760](https://github.com/lerna/lerna/commit/5c74760))





<a name="3.0.0-beta.15"></a>
# [3.0.0-beta.15](https://github.com/lerna/lerna/compare/v3.0.0-beta.14...v3.0.0-beta.15) (2018-04-09)


### Features

* **bootstrap:** Use `npm ci` with `--ci` option ([#1360](https://github.com/lerna/lerna/issues/1360)) ([d7e33c6](https://github.com/lerna/lerna/commit/d7e33c6))





<a name="3.0.0-beta.14"></a>
# [3.0.0-beta.14](https://github.com/lerna/lerna/compare/v3.0.0-beta.13...v3.0.0-beta.14) (2018-04-03)


### Bug Fixes

* **logging:** Log failures from package scripts once, not twice ([436cfe1](https://github.com/lerna/lerna/commit/436cfe1))





<a name="3.0.0-beta.13"></a>
# [3.0.0-beta.13](https://github.com/lerna/lerna/compare/v3.0.0-beta.12...v3.0.0-beta.13) (2018-03-31)


### Features

* Enable progress bars only when necessary ([b766c83](https://github.com/lerna/lerna/commit/b766c83))





<a name="3.0.0-beta.12"></a>
# [3.0.0-beta.12](https://github.com/lerna/lerna/compare/v3.0.0-beta.11...v3.0.0-beta.12) (2018-03-30)


### Features

* **package:** Add Map-like get/set methods, remove raw json getter ([707d1f0](https://github.com/lerna/lerna/commit/707d1f0))
* **project:** Merge `package` and `packageJson` into `manifest` ([9a47ff7](https://github.com/lerna/lerna/commit/9a47ff7))


### BREAKING CHANGES

* **package:** The `Package` class no longer provides direct access to the JSON object
used to construct the instance. Map-like `get()`/`set(val)` methods are
available to modify the internal representation.





<a name="3.0.0-beta.11"></a>
# [3.0.0-beta.11](https://github.com/lerna/lerna/compare/v3.0.0-beta.10...v3.0.0-beta.11) (2018-03-29)


### Features

* **bootstrap:** Inherit stdio during root-only install ([fd8c391](https://github.com/lerna/lerna/commit/fd8c391))
* **bootstrap:** Short-circuit when local file: specifiers are detected in the root ([d8a8f03](https://github.com/lerna/lerna/commit/d8a8f03))
* Support `optionalDependencies` ([b73e19d](https://github.com/lerna/lerna/commit/b73e19d)), closes [#121](https://github.com/lerna/lerna/issues/121)





<a name="3.0.0-beta.10"></a>
# [3.0.0-beta.10](https://github.com/lerna/lerna/compare/v3.0.0-beta.9...v3.0.0-beta.10) (2018-03-27)


### Features

* **commands:** Delay require of command instantiation ([a1284f3](https://github.com/lerna/lerna/commit/a1284f3))


### BREAKING CHANGES

* **commands:** The default export of command packages is now a factory, not the subclass (which is now a named export).





<a name="3.0.0-beta.9"></a>
# [3.0.0-beta.9](https://github.com/lerna/lerna/compare/v3.0.0-beta.8...v3.0.0-beta.9) (2018-03-24)


### Features

* **command:** Rename this.repository -> this.project ([43e98a0](https://github.com/lerna/lerna/commit/43e98a0))
* **project:** Normalize config.commands -> config.command ([24e55e3](https://github.com/lerna/lerna/commit/24e55e3))





<a name="3.0.0-beta.8"></a>
# [3.0.0-beta.8](https://github.com/lerna/lerna/compare/v3.0.0-beta.7...v3.0.0-beta.8) (2018-03-22)


### Features

* **utils:** Add "vendored" npm-conf ([9c24a25](https://github.com/lerna/lerna/commit/9c24a25))





<a name="3.0.0-beta.7"></a>
# [3.0.0-beta.7](https://github.com/lerna/lerna/compare/v3.0.0-beta.6...v3.0.0-beta.7) (2018-03-20)

**Note:** Version bump only for package @lerna/bootstrap





<a name="3.0.0-beta.6"></a>
# [3.0.0-beta.6](https://github.com/lerna/lerna/compare/v3.0.0-beta.5...v3.0.0-beta.6) (2018-03-19)

**Note:** Version bump only for package @lerna/bootstrap





<a name="3.0.0-beta.5"></a>
# [3.0.0-beta.5](https://github.com/lerna/lerna/compare/v3.0.0-beta.4...v3.0.0-beta.5) (2018-03-19)


### Bug Fixes

* **bootstrap:** Move --hoist/--nohoist coerce into class ([8877aa0](https://github.com/lerna/lerna/commit/8877aa0)), closes [#1337](https://github.com/lerna/lerna/issues/1337)





<a name="3.0.0-beta.4"></a>
# [3.0.0-beta.4](https://github.com/lerna/lerna/compare/v3.0.0-beta.3...v3.0.0-beta.4) (2018-03-19)


### Bug Fixes

* Respect durable hoist configuration ([2081640](https://github.com/lerna/lerna/commit/2081640)), closes [#1325](https://github.com/lerna/lerna/issues/1325)





<a name="3.0.0-beta.3"></a>
# [3.0.0-beta.3](https://github.com/lerna/lerna/compare/v3.0.0-beta.2...v3.0.0-beta.3) (2018-03-15)

**Note:** Version bump only for package @lerna/bootstrap





<a name="3.0.0-beta.2"></a>
# [3.0.0-beta.2](https://github.com/lerna/lerna/compare/v3.0.0-beta.1...v3.0.0-beta.2) (2018-03-10)


### Bug Fixes

* Move @lerna/has-dependency-installed into bootstrap/lib ([c09ccbd](https://github.com/lerna/lerna/commit/c09ccbd))


### Features

* Rename @lerna/fs-utils => @lerna/rimraf-dir ([30451ed](https://github.com/lerna/lerna/commit/30451ed))
* Replace @lerna/match-package-name with multimatch ([423f82c](https://github.com/lerna/lerna/commit/423f82c))





<a name="3.0.0-beta.1"></a>
# [3.0.0-beta.1](https://github.com/lerna/lerna/compare/v3.0.0-beta.0...v3.0.0-beta.1) (2018-03-09)


### Bug Fixes

* **filter-options:** require a git repo when using --since ([d21b66e](https://github.com/lerna/lerna/commit/d21b66e)), closes [#822](https://github.com/lerna/lerna/issues/822)
