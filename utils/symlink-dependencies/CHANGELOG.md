# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [5.1.8](https://github.com/lerna/lerna/compare/v5.1.7...v5.1.8) (2022-07-07)

**Note:** Version bump only for package @lerna/symlink-dependencies





## [5.1.7](https://github.com/lerna/lerna/compare/v5.1.6...v5.1.7) (2022-07-06)

**Note:** Version bump only for package @lerna/symlink-dependencies





## [5.1.6](https://github.com/lerna/lerna/compare/v5.1.5...v5.1.6) (2022-06-24)

**Note:** Version bump only for package @lerna/symlink-dependencies





## [5.1.5](https://github.com/lerna/lerna/compare/v5.1.4...v5.1.5) (2022-06-24)

**Note:** Version bump only for package @lerna/symlink-dependencies





## [5.1.4](https://github.com/lerna/lerna/compare/v5.1.3...v5.1.4) (2022-06-15)

**Note:** Version bump only for package @lerna/symlink-dependencies





## [5.1.3](https://github.com/lerna/lerna/compare/v5.1.2...v5.1.3) (2022-06-15)

**Note:** Version bump only for package @lerna/symlink-dependencies





## [5.1.2](https://github.com/lerna/lerna/compare/v5.1.1...v5.1.2) (2022-06-13)

**Note:** Version bump only for package @lerna/symlink-dependencies





## [5.1.1](https://github.com/lerna/lerna/compare/v5.1.0...v5.1.1) (2022-06-09)


### Bug Fixes

* allow maintenance LTS node 14 engines starting at 14.15.0 ([#3161](https://github.com/lerna/lerna/issues/3161)) ([72305e4](https://github.com/lerna/lerna/commit/72305e4dbab607a2d87ae4efa6ee577c93a9dda9))





# [5.1.0](https://github.com/lerna/lerna/compare/v5.0.0...v5.1.0) (2022-06-07)

**Note:** Version bump only for package @lerna/symlink-dependencies





# [5.1.0-alpha.0](https://github.com/lerna/lerna/compare/v4.0.0...v5.1.0-alpha.0) (2022-05-25)

**Note:** Version bump only for package @lerna/symlink-dependencies





# [5.0.0](https://github.com/lerna/lerna/compare/v4.0.0...v5.0.0) (2022-05-24)

**Note:** Version bump only for package @lerna/symlink-dependencies





# [4.0.0](https://github.com/lerna/lerna/compare/v3.22.1...v4.0.0) (2021-02-10)


### Features

* **deps:** Bump dependencies ([affed1c](https://github.com/lerna/lerna/commit/affed1ce0fce91f01b0a9eafe357db2d985b974f))
* Consume named exports of sibling modules ([63499e3](https://github.com/lerna/lerna/commit/63499e33652bc78fe23751875d74017e2f16a689))
* Expose named export ([c1303f1](https://github.com/lerna/lerna/commit/c1303f13adc4cf15f96ff25889b52149f8224c0e))
* Remove default export ([e2f1ec3](https://github.com/lerna/lerna/commit/e2f1ec3dd049d2a89880029908a2aa7c66f15082))
* **deps:** fs-extra@^9.0.1 ([2f6f4e0](https://github.com/lerna/lerna/commit/2f6f4e066d5a41b4cd508b3405ac1d0a342932dc))
* **deps:** p-finally -> Promise.prototype.finally() ([028db04](https://github.com/lerna/lerna/commit/028db045b1221df000a2b98c5dceb1e4915a7806))
* **deps:** p-finally@^2.0.1 ([165e47e](https://github.com/lerna/lerna/commit/165e47e722acf6462cf0b4e3a7d0e14d3971e7fb))
* **deps:** p-map-series@^2.1.0 ([7f68076](https://github.com/lerna/lerna/commit/7f680767e0b3c7a15f951c51d4975150fb6e9112))
* **deps:** p-map@^4.0.0 ([92b1364](https://github.com/lerna/lerna/commit/92b1364735e1f2cf379cf1047c60c4fb897d55f5))
* Drop support for Node v6.x & v8.x ([ff4bb4d](https://github.com/lerna/lerna/commit/ff4bb4da215555e3bb136f5af09b5cbc631e57bb))


### BREAKING CHANGES

* The default export has been removed, please use a named export instead.
* Node v6.x & v8.x are no longer supported. Please upgrade to the latest LTS release.

Here's the gnarly one-liner I used to make these changes:
```
npx lerna exec --concurrency 1 --stream -- 'json -I -f package.json -e '"'"'this.engines=this.engines||{};this.engines.node=">= 10.18.0"'"'"
```
(requires `npm i -g json` beforehand)





# [3.17.0](https://github.com/lerna/lerna/compare/v3.16.5...v3.17.0) (2019-10-10)


### Features

* **link:** Use `publishConfig.directory` as symlink source if it exists to allow linking sub-directories ([#2274](https://github.com/lerna/lerna/issues/2274)) ([d04ce8e](https://github.com/lerna/lerna/commit/d04ce8e10503003e498c44d0db5ff455054d7d71))





## [3.16.2](https://github.com/lerna/lerna/compare/v3.16.1...v3.16.2) (2019-07-22)

**Note:** Version bump only for package @lerna/symlink-dependencies





# [3.16.0](https://github.com/lerna/lerna/compare/v3.15.0...v3.16.0) (2019-07-18)


### Features

* **deps:** `fs-extra@^8.1.0` ([313287f](https://github.com/lerna/lerna/commit/313287f))
* **deps:** `p-map@^2.1.0` ([9e58394](https://github.com/lerna/lerna/commit/9e58394))





## [3.14.2](https://github.com/lerna/lerna/compare/v3.14.1...v3.14.2) (2019-06-09)

**Note:** Version bump only for package @lerna/symlink-dependencies





# [3.14.0](https://github.com/lerna/lerna/compare/v3.13.4...v3.14.0) (2019-05-14)

**Note:** Version bump only for package @lerna/symlink-dependencies





# [3.13.0](https://github.com/lerna/lerna/compare/v3.12.1...v3.13.0) (2019-02-15)


### Features

* **meta:** Add `repository.directory` field to package.json ([aec5023](https://github.com/lerna/lerna/commit/aec5023))
* **meta:** Normalize package.json `homepage` field ([abeb4dc](https://github.com/lerna/lerna/commit/abeb4dc))





# [3.11.0](https://github.com/lerna/lerna/compare/v3.10.8...v3.11.0) (2019-02-08)

**Note:** Version bump only for package @lerna/symlink-dependencies





# [3.10.0](https://github.com/lerna/lerna/compare/v3.9.1...v3.10.0) (2019-01-08)

**Note:** Version bump only for package @lerna/symlink-dependencies





## [3.8.1](https://github.com/lerna/lerna/compare/v3.8.0...v3.8.1) (2018-12-31)

**Note:** Version bump only for package @lerna/symlink-dependencies





## [3.7.2](https://github.com/lerna/lerna/compare/v3.7.1...v3.7.2) (2018-12-21)

**Note:** Version bump only for package @lerna/symlink-dependencies





# [3.7.0](https://github.com/lerna/lerna/compare/v3.6.0...v3.7.0) (2018-12-19)

**Note:** Version bump only for package @lerna/symlink-dependencies





# [3.6.0](https://github.com/lerna/lerna/compare/v3.5.1...v3.6.0) (2018-12-07)

**Note:** Version bump only for package @lerna/symlink-dependencies





<a name="3.3.0"></a>
# [3.3.0](https://github.com/lerna/lerna/compare/v3.2.1...v3.3.0) (2018-09-06)


### Features

* **deps:** Upgrade fs-extra to ^7.0.0 ([042b1a3](https://github.com/lerna/lerna/commit/042b1a3))





<a name="3.1.4"></a>
## [3.1.4](https://github.com/lerna/lerna/compare/v3.1.3...v3.1.4) (2018-08-21)

**Note:** Version bump only for package @lerna/symlink-dependencies





<a name="3.0.0"></a>
# [3.0.0](https://github.com/lerna/lerna/compare/v3.0.0-rc.0...v3.0.0) (2018-08-10)

**Note:** Version bump only for package @lerna/symlink-dependencies





<a name="3.0.0-rc.0"></a>
# [3.0.0-rc.0](https://github.com/lerna/lerna/compare/v3.0.0-beta.21...v3.0.0-rc.0) (2018-07-27)


### Features

* Upgrade to fs-extra 6 ([079d873](https://github.com/lerna/lerna/commit/079d873))





<a name="3.0.0-beta.17"></a>
# [3.0.0-beta.17](https://github.com/lerna/lerna/compare/v3.0.0-beta.16...v3.0.0-beta.17) (2018-04-13)

**Note:** Version bump only for package @lerna/symlink-dependencies





<a name="3.0.0-beta.12"></a>
# [3.0.0-beta.12](https://github.com/lerna/lerna/compare/v3.0.0-beta.11...v3.0.0-beta.12) (2018-03-30)

**Note:** Version bump only for package @lerna/symlink-dependencies





<a name="3.0.0-beta.11"></a>
# [3.0.0-beta.11](https://github.com/lerna/lerna/compare/v3.0.0-beta.10...v3.0.0-beta.11) (2018-03-29)

**Note:** Version bump only for package @lerna/symlink-dependencies





<a name="3.0.0-beta.2"></a>
# [3.0.0-beta.2](https://github.com/lerna/lerna/compare/v3.0.0-beta.1...v3.0.0-beta.2) (2018-03-10)


### Features

* Replace @lerna/fs-utils dependency with fs-extra ([9c35a86](https://github.com/lerna/lerna/commit/9c35a86))
