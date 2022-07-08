# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [5.1.8](https://github.com/lerna/lerna/compare/v5.1.7...v5.1.8) (2022-07-07)

**Note:** Version bump only for package @lerna/command





## [5.1.7](https://github.com/lerna/lerna/compare/v5.1.6...v5.1.7) (2022-07-06)

**Note:** Version bump only for package @lerna/command





## [5.1.6](https://github.com/lerna/lerna/compare/v5.1.5...v5.1.6) (2022-06-24)

**Note:** Version bump only for package @lerna/command





## [5.1.5](https://github.com/lerna/lerna/compare/v5.1.4...v5.1.5) (2022-06-24)

**Note:** Version bump only for package @lerna/command





## [5.1.4](https://github.com/lerna/lerna/compare/v5.1.3...v5.1.4) (2022-06-15)

**Note:** Version bump only for package @lerna/command





## [5.1.3](https://github.com/lerna/lerna/compare/v5.1.2...v5.1.3) (2022-06-15)

**Note:** Version bump only for package @lerna/command





## [5.1.2](https://github.com/lerna/lerna/compare/v5.1.1...v5.1.2) (2022-06-13)


### Bug Fixes

* update all transitive inclusions of ansi-regex ([#3166](https://github.com/lerna/lerna/issues/3166)) ([56eaa15](https://github.com/lerna/lerna/commit/56eaa153283be3b1e7d7793d3266fc51801fad8e))





## [5.1.1](https://github.com/lerna/lerna/compare/v5.1.0...v5.1.1) (2022-06-09)


### Bug Fixes

* allow maintenance LTS node 14 engines starting at 14.15.0 ([#3161](https://github.com/lerna/lerna/issues/3161)) ([72305e4](https://github.com/lerna/lerna/commit/72305e4dbab607a2d87ae4efa6ee577c93a9dda9))





# [5.1.0](https://github.com/lerna/lerna/compare/v5.0.0...v5.1.0) (2022-06-07)

**Note:** Version bump only for package @lerna/command





# [5.1.0-alpha.0](https://github.com/lerna/lerna/compare/v4.0.0...v5.1.0-alpha.0) (2022-05-25)

**Note:** Version bump only for package @lerna/command





# [5.0.0](https://github.com/lerna/lerna/compare/v4.0.0...v5.0.0) (2022-05-24)

**Note:** Version bump only for package @lerna/command





# [4.0.0](https://github.com/lerna/lerna/compare/v3.22.1...v4.0.0) (2021-02-10)


### Features

* **deps:** execa@^5.0.0 ([d8100fd](https://github.com/lerna/lerna/commit/d8100fd9e0742b049ed16ac77e976ce34234ebfc))
* Consume named exports of sibling modules ([63499e3](https://github.com/lerna/lerna/commit/63499e33652bc78fe23751875d74017e2f16a689))
* Drop support for Node v6.x & v8.x ([ff4bb4d](https://github.com/lerna/lerna/commit/ff4bb4da215555e3bb136f5af09b5cbc631e57bb))
* Expose named export ([c1303f1](https://github.com/lerna/lerna/commit/c1303f13adc4cf15f96ff25889b52149f8224c0e))
* Remove default export ([e2f1ec3](https://github.com/lerna/lerna/commit/e2f1ec3dd049d2a89880029908a2aa7c66f15082))
* **deps:** execa@^4.1.0 ([9051dca](https://github.com/lerna/lerna/commit/9051dcab1a68b56db09b82ab0345c5f36bcfee2d))


### BREAKING CHANGES

* The default export has been removed, please use a named export instead.
* Node v6.x & v8.x are no longer supported. Please upgrade to the latest LTS release.

Here's the gnarly one-liner I used to make these changes:
```
npx lerna exec --concurrency 1 --stream -- 'json -I -f package.json -e '"'"'this.engines=this.engines||{};this.engines.node=">= 10.18.0"'"'"
```
(requires `npm i -g json` beforehand)





# [3.21.0](https://github.com/lerna/lerna/compare/v3.20.2...v3.21.0) (2020-05-13)

**Note:** Version bump only for package @lerna/command





## [3.18.5](https://github.com/lerna/lerna/compare/v3.18.4...v3.18.5) (2019-11-20)


### Bug Fixes

* **command:** Do not mutate `argv` parameter ([8ca85a4](https://github.com/lerna/lerna/commit/8ca85a4f07acbec02d41077faacdd1f4a62e86a3)), closes [#2348](https://github.com/lerna/lerna/issues/2348)





# [3.18.0](https://github.com/lerna/lerna/compare/v3.17.0...v3.18.0) (2019-10-15)

**Note:** Version bump only for package @lerna/command





## [3.16.5](https://github.com/lerna/lerna/compare/v3.16.4...v3.16.5) (2019-10-07)

**Note:** Version bump only for package @lerna/command





# [3.16.0](https://github.com/lerna/lerna/compare/v3.15.0...v3.16.0) (2019-07-18)


### Bug Fixes

* **command:** Bump minimum range of lodash, silence dumb 'security' warning ([c405871](https://github.com/lerna/lerna/commit/c405871))


### Features

* **deps:** `is-ci@^2.0.0` ([ab2ad83](https://github.com/lerna/lerna/commit/ab2ad83))





# [3.15.0](https://github.com/lerna/lerna/compare/v3.14.2...v3.15.0) (2019-06-09)

**Note:** Version bump only for package @lerna/command





## [3.14.2](https://github.com/lerna/lerna/compare/v3.14.1...v3.14.2) (2019-06-09)

**Note:** Version bump only for package @lerna/command





# [3.14.0](https://github.com/lerna/lerna/compare/v3.13.4...v3.14.0) (2019-05-14)

**Note:** Version bump only for package @lerna/command





## [3.13.3](https://github.com/lerna/lerna/compare/v3.13.2...v3.13.3) (2019-04-17)

**Note:** Version bump only for package @lerna/command





## [3.13.1](https://github.com/lerna/lerna/compare/v3.13.0...v3.13.1) (2019-02-26)

**Note:** Version bump only for package @lerna/command





# [3.13.0](https://github.com/lerna/lerna/compare/v3.12.1...v3.13.0) (2019-02-15)


### Features

* **meta:** Add `repository.directory` field to package.json ([aec5023](https://github.com/lerna/lerna/commit/aec5023))
* **meta:** Normalize package.json `homepage` field ([abeb4dc](https://github.com/lerna/lerna/commit/abeb4dc))





# [3.12.0](https://github.com/lerna/lerna/compare/v3.11.1...v3.12.0) (2019-02-14)


### Features

* **global-options:** Default concurrency to logical CPU count ([#1931](https://github.com/lerna/lerna/issues/1931)) ([2c487fe](https://github.com/lerna/lerna/commit/2c487fe))





# [3.11.0](https://github.com/lerna/lerna/compare/v3.10.8...v3.11.0) (2019-02-08)


### Bug Fixes

* **deps:** Explicit npmlog ^4.1.2 ([571c2e2](https://github.com/lerna/lerna/commit/571c2e2))
* **deps:** Remove unused libnpm (replaced by direct sub-packages) ([1caeb28](https://github.com/lerna/lerna/commit/1caeb28))





## [3.10.6](https://github.com/lerna/lerna/compare/v3.10.5...v3.10.6) (2019-01-19)

**Note:** Version bump only for package @lerna/command





# [3.10.0](https://github.com/lerna/lerna/compare/v3.9.1...v3.10.0) (2019-01-08)

**Note:** Version bump only for package @lerna/command





## [3.8.5](https://github.com/lerna/lerna/compare/v3.8.4...v3.8.5) (2019-01-05)

**Note:** Version bump only for package @lerna/command





## [3.8.1](https://github.com/lerna/lerna/compare/v3.8.0...v3.8.1) (2018-12-31)


### Bug Fixes

* Do not print duplicate stdio after a streaming command errors ([#1832](https://github.com/lerna/lerna/issues/1832)) ([2bcc366](https://github.com/lerna/lerna/commit/2bcc366)), closes [#1790](https://github.com/lerna/lerna/issues/1790)
* **progress:** Correctly avoid progress where we don't want it ([0de3df9](https://github.com/lerna/lerna/commit/0de3df9))
* **progress:** Enable progress during logging setup, correcting default ([da81e60](https://github.com/lerna/lerna/commit/da81e60))


### Features

* **command:** log whether CI environment has been detected ([#1841](https://github.com/lerna/lerna/issues/1841)) ([db5631e](https://github.com/lerna/lerna/commit/db5631e)), closes [#1825](https://github.com/lerna/lerna/issues/1825)





## [3.7.2](https://github.com/lerna/lerna/compare/v3.7.1...v3.7.2) (2018-12-21)

**Note:** Version bump only for package @lerna/command





## [3.7.1](https://github.com/lerna/lerna/compare/v3.7.0...v3.7.1) (2018-12-20)


### Bug Fixes

* **command:** Enable progress from top-level log object ([95e88f0](https://github.com/lerna/lerna/commit/95e88f0))





# [3.7.0](https://github.com/lerna/lerna/compare/v3.6.0...v3.7.0) (2018-12-19)

**Note:** Version bump only for package @lerna/command





# [3.6.0](https://github.com/lerna/lerna/compare/v3.5.1...v3.6.0) (2018-12-07)


### Features

* Migrate existing usage to libnpm ([0d3a786](https://github.com/lerna/lerna/commit/0d3a786)), closes [#1767](https://github.com/lerna/lerna/issues/1767)





# [3.5.0](https://github.com/lerna/lerna/compare/v3.4.3...v3.5.0) (2018-11-27)

**Note:** Version bump only for package @lerna/command





<a name="3.3.0"></a>
# [3.3.0](https://github.com/lerna/lerna/compare/v3.2.1...v3.3.0) (2018-09-06)


### Features

* **deps:** Upgrade execa to ^1.0.0 ([748ae4e](https://github.com/lerna/lerna/commit/748ae4e))





<a name="3.1.3"></a>
## [3.1.3](https://github.com/lerna/lerna/compare/v3.1.2...v3.1.3) (2018-08-21)


### Bug Fixes

* **global-options:** Move env defaults to command superclass ([6d8e405](https://github.com/lerna/lerna/commit/6d8e405)), closes [#1449](https://github.com/lerna/lerna/issues/1449)





<a name="3.1.2"></a>
## [3.1.2](https://github.com/lerna/lerna/compare/v3.1.1...v3.1.2) (2018-08-20)


### Bug Fixes

* **command:** Remove redundant filteredPackages calculation ([e0a361f](https://github.com/lerna/lerna/commit/e0a361f))





<a name="3.1.0"></a>
# [3.1.0](https://github.com/lerna/lerna/compare/v3.0.6...v3.1.0) (2018-08-17)


### Bug Fixes

* **command:** Detect composed commands more accurately ([1e51b39](https://github.com/lerna/lerna/commit/1e51b39))
* **command:** Log lerna CLI version with less ambiguity ([67494e7](https://github.com/lerna/lerna/commit/67494e7))





<a name="3.0.6"></a>
## [3.0.6](https://github.com/lerna/lerna/compare/v3.0.5...v3.0.6) (2018-08-16)


### Bug Fixes

* **command:** Silence goalpost logging when running a composed command ([12b4280](https://github.com/lerna/lerna/commit/12b4280))
* **init:** Consume lernaVersion from options, not instance property ([89e31d2](https://github.com/lerna/lerna/commit/89e31d2))





<a name="3.0.5"></a>
## [3.0.5](https://github.com/lerna/lerna/compare/v3.0.4...v3.0.5) (2018-08-15)

**Note:** Version bump only for package @lerna/command





<a name="3.0.0"></a>
# [3.0.0](https://github.com/lerna/lerna/compare/v3.0.0-rc.0...v3.0.0) (2018-08-10)

**Note:** Version bump only for package @lerna/command





<a name="3.0.0-rc.0"></a>
# [3.0.0-rc.0](https://github.com/lerna/lerna/compare/v3.0.0-beta.21...v3.0.0-rc.0) (2018-07-27)


### Bug Fixes

* **command:** Prevent premature resolution during tests from nested commands ([151363f](https://github.com/lerna/lerna/commit/151363f))
* **project:** Report syntax errors in root package.json ([f674f35](https://github.com/lerna/lerna/commit/f674f35)), closes [#1452](https://github.com/lerna/lerna/issues/1452)


### Code Refactoring

* **collect-updates:** Make argument signature explicit ([e6ba19f](https://github.com/lerna/lerna/commit/e6ba19f))
* **command:** Do not store raw packages list as instance property ([32a211a](https://github.com/lerna/lerna/commit/32a211a))


### Features

* **command:** Remove .defaultOptions() from option resolution stack ([2b27a54](https://github.com/lerna/lerna/commit/2b27a54))
* **project:** Move collect-packages into getPackages() method ([06b88d4](https://github.com/lerna/lerna/commit/06b88d4))


### BREAKING CHANGES

* **collect-updates:** Instead of an opaque command instance, distinct positional arguments are required.
* **command:** `this.packages` no longer exists in Command subclasses, use `this.packageGraph.rawPackageList`





<a name="3.0.0-beta.21"></a>
# [3.0.0-beta.21](https://github.com/lerna/lerna/compare/v3.0.0-beta.20...v3.0.0-beta.21) (2018-05-12)

**Note:** Version bump only for package @lerna/command





<a name="3.0.0-beta.20"></a>
# [3.0.0-beta.20](https://github.com/lerna/lerna/compare/v3.0.0-beta.19...v3.0.0-beta.20) (2018-05-07)


### Features

* Upgrade execa ([393b501](https://github.com/lerna/lerna/commit/393b501))





<a name="3.0.0-beta.19"></a>
# [3.0.0-beta.19](https://github.com/lerna/lerna/compare/v3.0.0-beta.18...v3.0.0-beta.19) (2018-05-03)

**Note:** Version bump only for package @lerna/command





<a name="3.0.0-beta.18"></a>
# [3.0.0-beta.18](https://github.com/lerna/lerna/compare/v3.0.0-beta.17...v3.0.0-beta.18) (2018-04-24)


### Features

* **command:** Move GitUtilities.isInitialized into class method ([abecfcc](https://github.com/lerna/lerna/commit/abecfcc))
* **filters:** Add `--include-filtered-dependents` flag ([#1393](https://github.com/lerna/lerna/issues/1393)) ([2838260](https://github.com/lerna/lerna/commit/2838260))


### BREAKING CHANGES

* **command:** GitUtilities.isInitialized no longer exists. You shouldn't be using GitUtilities.





<a name="3.0.0-beta.17"></a>
# [3.0.0-beta.17](https://github.com/lerna/lerna/compare/v3.0.0-beta.16...v3.0.0-beta.17) (2018-04-13)

**Note:** Version bump only for package @lerna/command





<a name="3.0.0-beta.15"></a>
# [3.0.0-beta.15](https://github.com/lerna/lerna/compare/v3.0.0-beta.14...v3.0.0-beta.15) (2018-04-09)

**Note:** Version bump only for package @lerna/command





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

* **project:** Merge `package` and `packageJson` into `manifest` ([9a47ff7](https://github.com/lerna/lerna/commit/9a47ff7))





<a name="3.0.0-beta.11"></a>
# [3.0.0-beta.11](https://github.com/lerna/lerna/compare/v3.0.0-beta.10...v3.0.0-beta.11) (2018-03-29)

**Note:** Version bump only for package @lerna/command





<a name="3.0.0-beta.10"></a>
# [3.0.0-beta.10](https://github.com/lerna/lerna/compare/v3.0.0-beta.9...v3.0.0-beta.10) (2018-03-27)

**Note:** Version bump only for package @lerna/command





<a name="3.0.0-beta.9"></a>
# [3.0.0-beta.9](https://github.com/lerna/lerna/compare/v3.0.0-beta.8...v3.0.0-beta.9) (2018-03-24)


### Features

* **command:** Remove legacy config handling ([d305a38](https://github.com/lerna/lerna/commit/d305a38))
* **command:** Rename this.repository -> this.project ([43e98a0](https://github.com/lerna/lerna/commit/43e98a0))
* **project:** Normalize config.commands -> config.command ([24e55e3](https://github.com/lerna/lerna/commit/24e55e3))
* **project:** Use cosmiconfig to locate and read lerna.json ([b8c2789](https://github.com/lerna/lerna/commit/b8c2789))


### BREAKING CHANGES

* **command:** lerna.json `bootstrapConfig` and `publishConfig` namespaces are no longer honored.
These config blocks should be moved to `command.bootstrap` and `command.publish`, respectively.





<a name="3.0.0-beta.7"></a>
# [3.0.0-beta.7](https://github.com/lerna/lerna/compare/v3.0.0-beta.6...v3.0.0-beta.7) (2018-03-20)


### Bug Fixes

* **cli:** Retrieve correct version ([bb2c5e8](https://github.com/lerna/lerna/commit/bb2c5e8))





<a name="3.0.0-beta.4"></a>
# [3.0.0-beta.4](https://github.com/lerna/lerna/compare/v3.0.0-beta.3...v3.0.0-beta.4) (2018-03-19)


### Bug Fixes

* **clean-stack:** Try to avoid causing errors during error cleanup ([89f9d3b](https://github.com/lerna/lerna/commit/89f9d3b))





<a name="3.0.0-beta.3"></a>
# [3.0.0-beta.3](https://github.com/lerna/lerna/compare/v3.0.0-beta.2...v3.0.0-beta.3) (2018-03-15)

**Note:** Version bump only for package @lerna/command





<a name="3.0.0-beta.2"></a>

# [3.0.0-beta.2](https://github.com/lerna/lerna/compare/v3.0.0-beta.1...v3.0.0-beta.2) (2018-03-10)

### Features

* Replace @lerna/match-package-name with multimatch ([423f82c](https://github.com/lerna/lerna/commit/423f82c))
* **filter-packages:** Simplify method signature ([47e1c86](https://github.com/lerna/lerna/commit/47e1c86))

### BREAKING CHANGES

* **filter-packages:** The parameters to `filterPackages()` have changed:
  * Two lists (include, exclude) have replaced the destructured config object

<a name="3.0.0-beta.1"></a>

# [3.0.0-beta.1](https://github.com/lerna/lerna/compare/v3.0.0-beta.0...v3.0.0-beta.1) (2018-03-09)

### Bug Fixes

* **filter-options:** require a git repo when using --since ([d21b66e](https://github.com/lerna/lerna/commit/d21b66e)), closes [#822](https://github.com/lerna/lerna/issues/822)

### Features

* **collect-packages:** simplify signature ([39170cf](https://github.com/lerna/lerna/commit/39170cf))
* **filter-options:** Exclude private packages with --no-private ([6674d18](https://github.com/lerna/lerna/commit/6674d18))

### BREAKING CHANGES

* **collect-packages:** Formerly a config object, it is now two parameters, only the first of
  which (rootPath) is required. The second parameter is a list of package
  location globs, defaulting to lerna's default of `["packages/*"]`.
