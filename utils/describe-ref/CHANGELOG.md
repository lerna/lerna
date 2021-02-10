# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [4.0.0](https://github.com/lerna/lerna/compare/v3.22.1...v4.0.0) (2021-02-10)


### Code Refactoring

* **describe-ref:** Add JSDoc types, remove test-only export ([e5cf30c](https://github.com/lerna/lerna/commit/e5cf30cb66f9b85f13afb475ea0c9e59c8fabba3))


### Features

* Drop support for Node v6.x & v8.x ([ff4bb4d](https://github.com/lerna/lerna/commit/ff4bb4da215555e3bb136f5af09b5cbc631e57bb))
* Expose named export ([c1303f1](https://github.com/lerna/lerna/commit/c1303f13adc4cf15f96ff25889b52149f8224c0e))
* Remove default export ([e2f1ec3](https://github.com/lerna/lerna/commit/e2f1ec3dd049d2a89880029908a2aa7c66f15082))


### BREAKING CHANGES

* The default export has been removed, please use a named export instead.
* **describe-ref:** The test-only 'parse()' export has been removed.
* Node v6.x & v8.x are no longer supported. Please upgrade to the latest LTS release.

Here's the gnarly one-liner I used to make these changes:
```
npx lerna exec --concurrency 1 --stream -- 'json -I -f package.json -e '"'"'this.engines=this.engines||{};this.engines.node=">= 10.18.0"'"'"
```
(requires `npm i -g json` beforehand)





## [3.16.5](https://github.com/lerna/lerna/compare/v3.16.4...v3.16.5) (2019-10-07)

**Note:** Version bump only for package @lerna/describe-ref





## [3.14.2](https://github.com/lerna/lerna/compare/v3.14.1...v3.14.2) (2019-06-09)

**Note:** Version bump only for package @lerna/describe-ref





## [3.13.3](https://github.com/lerna/lerna/compare/v3.13.2...v3.13.3) (2019-04-17)

**Note:** Version bump only for package @lerna/describe-ref





# [3.13.0](https://github.com/lerna/lerna/compare/v3.12.1...v3.13.0) (2019-02-15)


### Features

* **meta:** Add `repository.directory` field to package.json ([aec5023](https://github.com/lerna/lerna/commit/aec5023))





# [3.11.0](https://github.com/lerna/lerna/compare/v3.10.8...v3.11.0) (2019-02-08)


### Bug Fixes

* **deps:** Explicit npmlog ^4.1.2 ([571c2e2](https://github.com/lerna/lerna/commit/571c2e2))
* **deps:** Remove unused libnpm (replaced by direct sub-packages) ([1caeb28](https://github.com/lerna/lerna/commit/1caeb28))





# [3.10.0](https://github.com/lerna/lerna/compare/v3.9.1...v3.10.0) (2019-01-08)

**Note:** Version bump only for package @lerna/describe-ref





# [3.9.0](https://github.com/lerna/lerna/compare/v3.8.5...v3.9.0) (2019-01-08)


### Bug Fixes

* **describe-ref:** Properly handle sha-like tag names ([#1853](https://github.com/lerna/lerna/issues/1853)) ([094a1cb](https://github.com/lerna/lerna/commit/094a1cb))





## [3.8.1](https://github.com/lerna/lerna/compare/v3.8.0...v3.8.1) (2018-12-31)


### Bug Fixes

* **publish:** --canary should also respect --include-merged-tags ([462b15c](https://github.com/lerna/lerna/commit/462b15c)), closes [#1820](https://github.com/lerna/lerna/issues/1820)





# [3.6.0](https://github.com/lerna/lerna/compare/v3.5.1...v3.6.0) (2018-12-07)


### Features

* Migrate existing usage to libnpm ([0d3a786](https://github.com/lerna/lerna/commit/0d3a786)), closes [#1767](https://github.com/lerna/lerna/issues/1767)





# [3.5.0](https://github.com/lerna/lerna/compare/v3.4.3...v3.5.0) (2018-11-27)


### Features

* **version:** Add `--include-merged-tags` option ([#1712](https://github.com/lerna/lerna/issues/1712)) ([7ee05d7](https://github.com/lerna/lerna/commit/7ee05d7))





<a name="3.3.0"></a>
# [3.3.0](https://github.com/lerna/lerna/compare/v3.2.1...v3.3.0) (2018-09-06)


### Bug Fixes

* **describe-ref:** Fallback refCount is the number of commits since beginning of repository ([6dfea52](https://github.com/lerna/lerna/commit/6dfea52))





<a name="3.1.0"></a>
# [3.1.0](https://github.com/lerna/lerna/compare/v3.0.6...v3.1.0) (2018-08-17)


### Features

* Create `[@lerna](https://github.com/lerna)/describe-ref` ([8c11b75](https://github.com/lerna/lerna/commit/8c11b75))
