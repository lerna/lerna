# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [5.1.8](https://github.com/lerna/lerna/compare/v5.1.7...v5.1.8) (2022-07-07)

**Note:** Version bump only for package @lerna/npm-dist-tag





## [5.1.7](https://github.com/lerna/lerna/compare/v5.1.6...v5.1.7) (2022-07-06)

**Note:** Version bump only for package @lerna/npm-dist-tag





## [5.1.6](https://github.com/lerna/lerna/compare/v5.1.5...v5.1.6) (2022-06-24)

**Note:** Version bump only for package @lerna/npm-dist-tag





## [5.1.5](https://github.com/lerna/lerna/compare/v5.1.4...v5.1.5) (2022-06-24)

**Note:** Version bump only for package @lerna/npm-dist-tag





## [5.1.4](https://github.com/lerna/lerna/compare/v5.1.3...v5.1.4) (2022-06-15)

**Note:** Version bump only for package @lerna/npm-dist-tag





## [5.1.3](https://github.com/lerna/lerna/compare/v5.1.2...v5.1.3) (2022-06-15)

**Note:** Version bump only for package @lerna/npm-dist-tag





## [5.1.2](https://github.com/lerna/lerna/compare/v5.1.1...v5.1.2) (2022-06-13)


### Bug Fixes

* update all transitive inclusions of ansi-regex ([#3166](https://github.com/lerna/lerna/issues/3166)) ([56eaa15](https://github.com/lerna/lerna/commit/56eaa153283be3b1e7d7793d3266fc51801fad8e))





## [5.1.1](https://github.com/lerna/lerna/compare/v5.1.0...v5.1.1) (2022-06-09)


### Bug Fixes

* allow maintenance LTS node 14 engines starting at 14.15.0 ([#3161](https://github.com/lerna/lerna/issues/3161)) ([72305e4](https://github.com/lerna/lerna/commit/72305e4dbab607a2d87ae4efa6ee577c93a9dda9))





# [5.1.0](https://github.com/lerna/lerna/compare/v5.0.0...v5.1.0) (2022-06-07)

**Note:** Version bump only for package @lerna/npm-dist-tag





# [5.1.0-alpha.0](https://github.com/lerna/lerna/compare/v4.0.0...v5.1.0-alpha.0) (2022-05-25)

**Note:** Version bump only for package @lerna/npm-dist-tag





# [5.0.0](https://github.com/lerna/lerna/compare/v4.0.0...v5.0.0) (2022-05-24)

**Note:** Version bump only for package @lerna/npm-dist-tag





# [4.0.0](https://github.com/lerna/lerna/compare/v3.22.1...v4.0.0) (2021-02-10)


### Features

* Consume named exports of sibling modules ([63499e3](https://github.com/lerna/lerna/commit/63499e33652bc78fe23751875d74017e2f16a689))
* **deps:** @evocateur/npm-registry-fetch -> npm-registry-fetch@^9.0.0 ([6df42f2](https://github.com/lerna/lerna/commit/6df42f2caf0887c38870c07a9f850dae0e9c4253))
* **deps:** npm-package-arg@^8.1.0 ([12c8923](https://github.com/lerna/lerna/commit/12c892342d33b86a00ee2cf9079f9b26fe316dc6))
* **npm-dist-tag:** Remove figgy-pudding ([1158f8e](https://github.com/lerna/lerna/commit/1158f8eea49dc3e59860886421bd8ec40a6205df))
* Drop support for Node v6.x & v8.x ([ff4bb4d](https://github.com/lerna/lerna/commit/ff4bb4da215555e3bb136f5af09b5cbc631e57bb))


### BREAKING CHANGES

* Node v6.x & v8.x are no longer supported. Please upgrade to the latest LTS release.

Here's the gnarly one-liner I used to make these changes:
```
npx lerna exec --concurrency 1 --stream -- 'json -I -f package.json -e '"'"'this.engines=this.engines||{};this.engines.node=">= 10.18.0"'"'"
```
(requires `npm i -g json` beforehand)





## [3.18.5](https://github.com/lerna/lerna/compare/v3.18.4...v3.18.5) (2019-11-20)


### Bug Fixes

* Auto-fix prettier formatting ([5344820](https://github.com/lerna/lerna/commit/5344820fc65da081d17f7fd2adb50ffe7101905b))





## [3.18.1](https://github.com/lerna/lerna/compare/v3.18.0...v3.18.1) (2019-10-15)


### Bug Fixes

* **npm-dist-tag:** Port upstream npm/cli[#235](https://github.com/lerna/lerna/issues/235) ([5a1d229](https://github.com/lerna/lerna/commit/5a1d22902cf8d306a804543b568eef701f600fc5))
* **npm-dist-tag:** Respect `npm_config_dry_run` env var ([1fd5e18](https://github.com/lerna/lerna/commit/1fd5e181edc898187ff1e1be4fd715fa87d43bf0))





# [3.16.0](https://github.com/lerna/lerna/compare/v3.15.0...v3.16.0) (2019-07-18)


### Bug Fixes

* **deps:** Update forked npm libs ([4d67426](https://github.com/lerna/lerna/commit/4d67426))





# [3.15.0](https://github.com/lerna/lerna/compare/v3.14.2...v3.15.0) (2019-06-09)


### Bug Fixes

* **deps:** Consume forked npm libs ([bdd4fa1](https://github.com/lerna/lerna/commit/bdd4fa1))





# [3.14.0](https://github.com/lerna/lerna/compare/v3.13.4...v3.14.0) (2019-05-14)


### Features

* **dist-tag:** Prompt for OTP when required ([af870bb](https://github.com/lerna/lerna/commit/af870bb))





# [3.13.0](https://github.com/lerna/lerna/compare/v3.12.1...v3.13.0) (2019-02-15)


### Features

* **meta:** Add `repository.directory` field to package.json ([aec5023](https://github.com/lerna/lerna/commit/aec5023))
* **meta:** Normalize package.json `homepage` field ([abeb4dc](https://github.com/lerna/lerna/commit/abeb4dc))





# [3.11.0](https://github.com/lerna/lerna/compare/v3.10.8...v3.11.0) (2019-02-08)


### Bug Fixes

* **deps:** Explicit npm-package-arg ^6.1.0 ([4b20791](https://github.com/lerna/lerna/commit/4b20791))
* **deps:** Explicit npm-registry-fetch ^3.9.0 ([a83c487](https://github.com/lerna/lerna/commit/a83c487))
* **deps:** Explicit npmlog ^4.1.2 ([571c2e2](https://github.com/lerna/lerna/commit/571c2e2))
* **deps:** Remove unused libnpm (replaced by direct sub-packages) ([1caeb28](https://github.com/lerna/lerna/commit/1caeb28))





## [3.8.5](https://github.com/lerna/lerna/compare/v3.8.4...v3.8.5) (2019-01-05)


### Bug Fixes

* **npm-dist-tag:** Improve robustness ([63a7a89](https://github.com/lerna/lerna/commit/63a7a89))





## [3.7.1](https://github.com/lerna/lerna/compare/v3.7.0...v3.7.1) (2018-12-20)


### Bug Fixes

* **npm-dist-tag:** Accept opts.log, defaulting to libnpm/log ([97edc7e](https://github.com/lerna/lerna/commit/97edc7e))





# [3.7.0](https://github.com/lerna/lerna/compare/v3.6.0...v3.7.0) (2018-12-19)


### Features

* **dist-tag:** Wrap options in figgy-pudding ([2713ab8](https://github.com/lerna/lerna/commit/2713ab8))





# [3.6.0](https://github.com/lerna/lerna/compare/v3.5.1...v3.6.0) (2018-12-07)


### Features

* Migrate existing usage to libnpm ([0d3a786](https://github.com/lerna/lerna/commit/0d3a786)), closes [#1767](https://github.com/lerna/lerna/issues/1767)
* **npm-dist-tag:** Use fetch API instead of CLI to make changes ([54008c6](https://github.com/lerna/lerna/commit/54008c6))





<a name="3.3.0"></a>
# [3.3.0](https://github.com/lerna/lerna/compare/v3.2.1...v3.3.0) (2018-09-06)

**Note:** Version bump only for package @lerna/npm-dist-tag





<a name="3.0.0"></a>
# [3.0.0](https://github.com/lerna/lerna/compare/v3.0.0-rc.0...v3.0.0) (2018-08-10)

**Note:** Version bump only for package @lerna/npm-dist-tag





<a name="3.0.0-rc.0"></a>
# [3.0.0-rc.0](https://github.com/lerna/lerna/compare/v3.0.0-beta.21...v3.0.0-rc.0) (2018-07-27)

**Note:** Version bump only for package @lerna/npm-dist-tag





<a name="3.0.0-beta.21"></a>
# [3.0.0-beta.21](https://github.com/lerna/lerna/compare/v3.0.0-beta.20...v3.0.0-beta.21) (2018-05-12)


### Bug Fixes

* **child-process:** Prevent duplicate logs when any package-oriented execution fails ([d3a8128](https://github.com/lerna/lerna/commit/d3a8128))





<a name="3.0.0-beta.20"></a>
# [3.0.0-beta.20](https://github.com/lerna/lerna/compare/v3.0.0-beta.19...v3.0.0-beta.20) (2018-05-07)

**Note:** Version bump only for package @lerna/npm-dist-tag





<a name="3.0.0-beta.13"></a>
# [3.0.0-beta.13](https://github.com/lerna/lerna/compare/v3.0.0-beta.12...v3.0.0-beta.13) (2018-03-31)

**Note:** Version bump only for package @lerna/npm-dist-tag





<a name="3.0.0-beta.12"></a>
# [3.0.0-beta.12](https://github.com/lerna/lerna/compare/v3.0.0-beta.11...v3.0.0-beta.12) (2018-03-30)

**Note:** Version bump only for package @lerna/npm-dist-tag





<a name="3.0.0-beta.11"></a>
# [3.0.0-beta.11](https://github.com/lerna/lerna/compare/v3.0.0-beta.10...v3.0.0-beta.11) (2018-03-29)

**Note:** Version bump only for package @lerna/npm-dist-tag
