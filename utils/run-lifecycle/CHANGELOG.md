# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [5.1.8](https://github.com/lerna/lerna/compare/v5.1.7...v5.1.8) (2022-07-07)

**Note:** Version bump only for package @lerna/run-lifecycle





## [5.1.7](https://github.com/lerna/lerna/compare/v5.1.6...v5.1.7) (2022-07-06)

**Note:** Version bump only for package @lerna/run-lifecycle





## [5.1.6](https://github.com/lerna/lerna/compare/v5.1.5...v5.1.6) (2022-06-24)

**Note:** Version bump only for package @lerna/run-lifecycle





## [5.1.5](https://github.com/lerna/lerna/compare/v5.1.4...v5.1.5) (2022-06-24)

**Note:** Version bump only for package @lerna/run-lifecycle





## [5.1.4](https://github.com/lerna/lerna/compare/v5.1.3...v5.1.4) (2022-06-15)

**Note:** Version bump only for package @lerna/run-lifecycle





## [5.1.3](https://github.com/lerna/lerna/compare/v5.1.2...v5.1.3) (2022-06-15)

**Note:** Version bump only for package @lerna/run-lifecycle





## [5.1.2](https://github.com/lerna/lerna/compare/v5.1.1...v5.1.2) (2022-06-13)


### Bug Fixes

* update all transitive inclusions of ansi-regex ([#3166](https://github.com/lerna/lerna/issues/3166)) ([56eaa15](https://github.com/lerna/lerna/commit/56eaa153283be3b1e7d7793d3266fc51801fad8e))





## [5.1.1](https://github.com/lerna/lerna/compare/v5.1.0...v5.1.1) (2022-06-09)


### Bug Fixes

* allow maintenance LTS node 14 engines starting at 14.15.0 ([#3161](https://github.com/lerna/lerna/issues/3161)) ([72305e4](https://github.com/lerna/lerna/commit/72305e4dbab607a2d87ae4efa6ee577c93a9dda9))





# [5.1.0](https://github.com/lerna/lerna/compare/v5.0.0...v5.1.0) (2022-06-07)

**Note:** Version bump only for package @lerna/run-lifecycle





# [5.1.0-alpha.0](https://github.com/lerna/lerna/compare/v4.0.0...v5.1.0-alpha.0) (2022-05-25)

**Note:** Version bump only for package @lerna/run-lifecycle





# [5.0.0](https://github.com/lerna/lerna/compare/v4.0.0...v5.0.0) (2022-05-24)

**Note:** Version bump only for package @lerna/run-lifecycle





# [4.0.0](https://github.com/lerna/lerna/compare/v3.22.1...v4.0.0) (2021-02-10)


### Features

* **deps:** Bump dependencies ([affed1c](https://github.com/lerna/lerna/commit/affed1ce0fce91f01b0a9eafe357db2d985b974f))
* Consume named exports of sibling modules ([63499e3](https://github.com/lerna/lerna/commit/63499e33652bc78fe23751875d74017e2f16a689))
* Drop support for Node v6.x & v8.x ([ff4bb4d](https://github.com/lerna/lerna/commit/ff4bb4da215555e3bb136f5af09b5cbc631e57bb))
* Expose named export ([c1303f1](https://github.com/lerna/lerna/commit/c1303f13adc4cf15f96ff25889b52149f8224c0e))
* Remove default export ([e2f1ec3](https://github.com/lerna/lerna/commit/e2f1ec3dd049d2a89880029908a2aa7c66f15082))
* **deps:** execa@^4.1.0 ([9051dca](https://github.com/lerna/lerna/commit/9051dcab1a68b56db09b82ab0345c5f36bcfee2d))
* **run-lifecycle:** Remove figgy-pudding ([1093f87](https://github.com/lerna/lerna/commit/1093f87d867ddcdf0d7b56f21ad9786a7fb8d6c1))


### BREAKING CHANGES

* The default export has been removed, please use a named export instead.
* Node v6.x & v8.x are no longer supported. Please upgrade to the latest LTS release.

Here's the gnarly one-liner I used to make these changes:
```
npx lerna exec --concurrency 1 --stream -- 'json -I -f package.json -e '"'"'this.engines=this.engines||{};this.engines.node=">= 10.18.0"'"'"
```
(requires `npm i -g json` beforehand)





## [3.16.2](https://github.com/lerna/lerna/compare/v3.16.1...v3.16.2) (2019-07-22)


### Bug Fixes

* **deps:** `npm-lifecycle@^3.1.2` ([25edebf](https://github.com/lerna/lerna/commit/25edebf)), closes [#2189](https://github.com/lerna/lerna/issues/2189)





## [3.16.1](https://github.com/lerna/lerna/compare/v3.16.0...v3.16.1) (2019-07-19)


### Bug Fixes

* **deps:** Pin exact `npm-lifecycle@3.0.0` to avoid Windows regression in >=3.1.0 ([af0569d](https://github.com/lerna/lerna/commit/af0569d)), closes [#2189](https://github.com/lerna/lerna/issues/2189)





# [3.16.0](https://github.com/lerna/lerna/compare/v3.15.0...v3.16.0) (2019-07-18)


### Features

* **run-lifecycle:** Upgrade `npm-lifecycle@^3.1.0` ([e015a74](https://github.com/lerna/lerna/commit/e015a74))





# [3.14.0](https://github.com/lerna/lerna/compare/v3.13.4...v3.14.0) (2019-05-14)


### Bug Fixes

* **run-lifecycle:** Bump `npm-lifecycle` dependency to avoid noisy audit warning ([ea7c20d](https://github.com/lerna/lerna/commit/ea7c20d))





# [3.13.0](https://github.com/lerna/lerna/compare/v3.12.1...v3.13.0) (2019-02-15)


### Features

* **meta:** Add `repository.directory` field to package.json ([aec5023](https://github.com/lerna/lerna/commit/aec5023))
* **meta:** Normalize package.json `homepage` field ([abeb4dc](https://github.com/lerna/lerna/commit/abeb4dc))





# [3.11.0](https://github.com/lerna/lerna/compare/v3.10.8...v3.11.0) (2019-02-08)


### Bug Fixes

* **deps:** Explicit npm-lifecycle ^2.1.0 ([506ad6d](https://github.com/lerna/lerna/commit/506ad6d))
* **deps:** Explicit npmlog ^4.1.2 ([571c2e2](https://github.com/lerna/lerna/commit/571c2e2))
* **deps:** Remove unused libnpm (replaced by direct sub-packages) ([1caeb28](https://github.com/lerna/lerna/commit/1caeb28))





## [3.10.5](https://github.com/lerna/lerna/compare/v3.10.4...v3.10.5) (2019-01-11)


### Bug Fixes

* **run-lifecycle:** Do not customize npm_config_prefix during execution ([79549c1](https://github.com/lerna/lerna/commit/79549c1)), closes [#1866](https://github.com/lerna/lerna/issues/1866)





# [3.10.0](https://github.com/lerna/lerna/compare/v3.9.1...v3.10.0) (2019-01-08)

**Note:** Version bump only for package @lerna/run-lifecycle





# [3.9.0](https://github.com/lerna/lerna/compare/v3.8.5...v3.9.0) (2019-01-08)


### Bug Fixes

* **run-lifecycle:** Ensure all npm_package_* env vars are created ([bab8e58](https://github.com/lerna/lerna/commit/bab8e58)), closes [#1752](https://github.com/lerna/lerna/issues/1752)





## [3.8.2](https://github.com/lerna/lerna/compare/v3.8.1...v3.8.2) (2019-01-03)


### Bug Fixes

* **run-lifecycle:** Short-circuit ignore options ([ae29097](https://github.com/lerna/lerna/commit/ae29097))





## [3.7.1](https://github.com/lerna/lerna/compare/v3.7.0...v3.7.1) (2018-12-20)


### Bug Fixes

* **run-lifecycle:** Accept opts.log, defaulting to libnpm/log ([dde588a](https://github.com/lerna/lerna/commit/dde588a))
* **run-lifecycle:** Do not execute on packages that lack the target script, avoiding spurious logs ([c0ad316](https://github.com/lerna/lerna/commit/c0ad316))





# [3.7.0](https://github.com/lerna/lerna/compare/v3.6.0...v3.7.0) (2018-12-19)


### Bug Fixes

* **run-lifecycle:** Omit circular options from config ([00eb5bd](https://github.com/lerna/lerna/commit/00eb5bd))





# [3.6.0](https://github.com/lerna/lerna/compare/v3.5.1...v3.6.0) (2018-12-07)


### Features

* Migrate existing usage to libnpm ([0d3a786](https://github.com/lerna/lerna/commit/0d3a786)), closes [#1767](https://github.com/lerna/lerna/issues/1767)





## [3.4.1](https://github.com/lerna/lerna/compare/v3.4.0...v3.4.1) (2018-10-04)

**Note:** Version bump only for package @lerna/run-lifecycle





<a name="3.3.1"></a>
## [3.3.1](https://github.com/lerna/lerna/compare/v3.3.0...v3.3.1) (2018-09-11)


### Bug Fixes

* **run-lifecycle:** Remove repetitive error logging ([b8915e7](https://github.com/lerna/lerna/commit/b8915e7))





<a name="3.3.0"></a>
# [3.3.0](https://github.com/lerna/lerna/compare/v3.2.1...v3.3.0) (2018-09-06)


### Bug Fixes

* **run-lifecycle:** Propagate exit code when execution fails ([4763f95](https://github.com/lerna/lerna/commit/4763f95)), closes [#1495](https://github.com/lerna/lerna/issues/1495)





<a name="3.2.0"></a>
# [3.2.0](https://github.com/lerna/lerna/compare/v3.1.4...v3.2.0) (2018-08-28)


### Features

* **run-lifecycle:** Resolve target package to aid chaining ([8e0aa96](https://github.com/lerna/lerna/commit/8e0aa96))





<a name="3.0.0"></a>
# [3.0.0](https://github.com/lerna/lerna/compare/v3.0.0-rc.0...v3.0.0) (2018-08-10)

**Note:** Version bump only for package @lerna/run-lifecycle





<a name="3.0.0-rc.0"></a>
# [3.0.0-rc.0](https://github.com/lerna/lerna/compare/v3.0.0-beta.21...v3.0.0-rc.0) (2018-07-27)


### Features

* **run-lifecycle:** Encapsulate npm-conf with createRunner() factory ([488f98d](https://github.com/lerna/lerna/commit/488f98d))
