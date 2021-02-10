# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [4.0.0](https://github.com/lerna/lerna/compare/v3.22.1...v4.0.0) (2021-02-10)


### Features

* **deps:** Bump dependencies ([affed1c](https://github.com/lerna/lerna/commit/affed1ce0fce91f01b0a9eafe357db2d985b974f))
* Consume named exports of sibling modules ([63499e3](https://github.com/lerna/lerna/commit/63499e33652bc78fe23751875d74017e2f16a689))
* Expose named export ([c1303f1](https://github.com/lerna/lerna/commit/c1303f13adc4cf15f96ff25889b52149f8224c0e))
* Remove default export ([e2f1ec3](https://github.com/lerna/lerna/commit/e2f1ec3dd049d2a89880029908a2aa7c66f15082))
* **deps:** @evocateur/libnpmpublish -> libnpmpublish@^4.0.0 ([341146e](https://github.com/lerna/lerna/commit/341146ef6c9111607f99d2f1663f973ab16c755e))
* **deps:** fs-extra@^9.0.1 ([2f6f4e0](https://github.com/lerna/lerna/commit/2f6f4e066d5a41b4cd508b3405ac1d0a342932dc))
* **deps:** npm-package-arg@^8.1.0 ([12c8923](https://github.com/lerna/lerna/commit/12c892342d33b86a00ee2cf9079f9b26fe316dc6))
* **deps:** pify@^5.0.0 ([6b34452](https://github.com/lerna/lerna/commit/6b3445219f0f022411a7cb282b0ba39a072e2ef2))
* **deps:** read-package-json@^3.0.0 ([2a02865](https://github.com/lerna/lerna/commit/2a02865a70a0b9ea60220a98bfff745128c90c6f))
* **npm-publish:** Remove figgy-pudding ([bdc162d](https://github.com/lerna/lerna/commit/bdc162d2719fee38d6189daeb37fe4e22338fda7))
* Drop support for Node v6.x & v8.x ([ff4bb4d](https://github.com/lerna/lerna/commit/ff4bb4da215555e3bb136f5af09b5cbc631e57bb))


### BREAKING CHANGES

* The default export has been removed, please use a named export instead.
* Node v6.x & v8.x are no longer supported. Please upgrade to the latest LTS release.

Here's the gnarly one-liner I used to make these changes:
```
npx lerna exec --concurrency 1 --stream -- 'json -I -f package.json -e '"'"'this.engines=this.engines||{};this.engines.node=">= 10.18.0"'"'"
```
(requires `npm i -g json` beforehand)





## [3.18.5](https://github.com/lerna/lerna/compare/v3.18.4...v3.18.5) (2019-11-20)

**Note:** Version bump only for package @lerna/npm-publish





## [3.16.2](https://github.com/lerna/lerna/compare/v3.16.1...v3.16.2) (2019-07-22)

**Note:** Version bump only for package @lerna/npm-publish





## [3.16.1](https://github.com/lerna/lerna/compare/v3.16.0...v3.16.1) (2019-07-19)

**Note:** Version bump only for package @lerna/npm-publish





# [3.16.0](https://github.com/lerna/lerna/compare/v3.15.0...v3.16.0) (2019-07-18)


### Bug Fixes

* **deps:** Update forked npm libs ([4d67426](https://github.com/lerna/lerna/commit/4d67426))


### Features

* **deps:** `fs-extra@^8.1.0` ([313287f](https://github.com/lerna/lerna/commit/313287f))
* **deps:** `pify@^4.0.1` ([f8ee7e6](https://github.com/lerna/lerna/commit/f8ee7e6))





# [3.15.0](https://github.com/lerna/lerna/compare/v3.14.2...v3.15.0) (2019-06-09)


### Bug Fixes

* **deps:** Consume forked npm libs ([bdd4fa1](https://github.com/lerna/lerna/commit/bdd4fa1))





## [3.14.2](https://github.com/lerna/lerna/compare/v3.14.1...v3.14.2) (2019-06-09)


### Bug Fixes

* **npm-publish:** Use generated manifest when publishing subdirectory ([b922766](https://github.com/lerna/lerna/commit/b922766)), closes [#2113](https://github.com/lerna/lerna/issues/2113)





# [3.14.0](https://github.com/lerna/lerna/compare/v3.13.4...v3.14.0) (2019-05-14)


### Features

* **publish:** Add OTP prompt during publish ([#2084](https://github.com/lerna/lerna/issues/2084)) ([c56bda1](https://github.com/lerna/lerna/commit/c56bda1)), closes [#1091](https://github.com/lerna/lerna/issues/1091)





## [3.13.2](https://github.com/lerna/lerna/compare/v3.13.1...v3.13.2) (2019-04-08)

**Note:** Version bump only for package @lerna/npm-publish





# [3.13.0](https://github.com/lerna/lerna/compare/v3.12.1...v3.13.0) (2019-02-15)


### Features

* **meta:** Add `repository.directory` field to package.json ([aec5023](https://github.com/lerna/lerna/commit/aec5023))
* **meta:** Normalize package.json `homepage` field ([abeb4dc](https://github.com/lerna/lerna/commit/abeb4dc))





# [3.11.0](https://github.com/lerna/lerna/compare/v3.10.8...v3.11.0) (2019-02-08)


### Bug Fixes

* **deps:** Explicit libnpmpublish ^1.1.1 ([a506d96](https://github.com/lerna/lerna/commit/a506d96))
* **deps:** Explicit npmlog ^4.1.2 ([571c2e2](https://github.com/lerna/lerna/commit/571c2e2))
* **deps:** Explicit read-package-json ^2.0.13 ([2695a90](https://github.com/lerna/lerna/commit/2695a90))
* **deps:** Remove unused libnpm (replaced by direct sub-packages) ([1caeb28](https://github.com/lerna/lerna/commit/1caeb28))





## [3.10.7](https://github.com/lerna/lerna/compare/v3.10.6...v3.10.7) (2019-01-22)


### Bug Fixes

* **npm-publish:** Ensure process exits non-zero when `libnpm/publish` fails ([9e9ce08](https://github.com/lerna/lerna/commit/9e9ce08))





## [3.10.5](https://github.com/lerna/lerna/compare/v3.10.4...v3.10.5) (2019-01-11)

**Note:** Version bump only for package @lerna/npm-publish





# [3.10.0](https://github.com/lerna/lerna/compare/v3.9.1...v3.10.0) (2019-01-08)

**Note:** Version bump only for package @lerna/npm-publish





# [3.9.0](https://github.com/lerna/lerna/compare/v3.8.5...v3.9.0) (2019-01-08)

**Note:** Version bump only for package @lerna/npm-publish





## [3.8.5](https://github.com/lerna/lerna/compare/v3.8.4...v3.8.5) (2019-01-05)


### Bug Fixes

* **npm-publish:** Ensure pkg.publishConfig is handled correctly ([1877def](https://github.com/lerna/lerna/commit/1877def)), closes [#1498](https://github.com/lerna/lerna/issues/1498)





## [3.8.2](https://github.com/lerna/lerna/compare/v3.8.1...v3.8.2) (2019-01-03)

**Note:** Version bump only for package @lerna/npm-publish





## [3.8.1](https://github.com/lerna/lerna/compare/v3.8.0...v3.8.1) (2018-12-31)


### Bug Fixes

* **npm-publish:** Pass normalized manifest to libnpm/publish ([8e59950](https://github.com/lerna/lerna/commit/8e59950)), closes [#1843](https://github.com/lerna/lerna/issues/1843)





## [3.7.1](https://github.com/lerna/lerna/compare/v3.7.0...v3.7.1) (2018-12-20)


### Bug Fixes

* **npm-publish:** Accept opts.log, defaulting to libnpm/log ([a1d61f6](https://github.com/lerna/lerna/commit/a1d61f6))





# [3.7.0](https://github.com/lerna/lerna/compare/v3.6.0...v3.7.0) (2018-12-19)


### Features

* **npm-publish:** Use libnpm/publish instead of subprocess execution ([433275e](https://github.com/lerna/lerna/commit/433275e))
* **publish:** Use libnpm/publish instead of subprocess execution ([58fda8d](https://github.com/lerna/lerna/commit/58fda8d))





# [3.6.0](https://github.com/lerna/lerna/compare/v3.5.1...v3.6.0) (2018-12-07)


### Features

* Migrate existing usage to libnpm ([0d3a786](https://github.com/lerna/lerna/commit/0d3a786)), closes [#1767](https://github.com/lerna/lerna/issues/1767)





<a name="3.3.1"></a>
## [3.3.1](https://github.com/lerna/lerna/compare/v3.3.0...v3.3.1) (2018-09-11)


### Bug Fixes

* **publish:** Tell yarn to stop creating git tags ([2a6f0a4](https://github.com/lerna/lerna/commit/2a6f0a4)), closes [#1662](https://github.com/lerna/lerna/issues/1662)





<a name="3.3.0"></a>
# [3.3.0](https://github.com/lerna/lerna/compare/v3.2.1...v3.3.0) (2018-09-06)


### Features

* **deps:** Upgrade fs-extra to ^7.0.0 ([042b1a3](https://github.com/lerna/lerna/commit/042b1a3))





<a name="3.2.0"></a>
# [3.2.0](https://github.com/lerna/lerna/compare/v3.1.4...v3.2.0) (2018-08-28)


### Features

* **npm-publish:** Resolve target package to aid chaining ([928a707](https://github.com/lerna/lerna/commit/928a707))
* **npm-publish:** Store entire tarball metadata object on Package instances ([063d743](https://github.com/lerna/lerna/commit/063d743))





<a name="3.0.6"></a>
## [3.0.6](https://github.com/lerna/lerna/compare/v3.0.5...v3.0.6) (2018-08-16)


### Bug Fixes

* **npm-publish:** Tip-toe around logging when emitting chunk to stdout ([c027246](https://github.com/lerna/lerna/commit/c027246))





<a name="3.0.4"></a>
## [3.0.4](https://github.com/lerna/lerna/compare/v3.0.3...v3.0.4) (2018-08-14)


### Bug Fixes

* **publish:** Only pass `--json` to `npm pack` when npm >= 5.10.0 ([71babce](https://github.com/lerna/lerna/commit/71babce)), closes [#1558](https://github.com/lerna/lerna/issues/1558)
* **publish:** Run publish from leaf nodes again ([3d348ec](https://github.com/lerna/lerna/commit/3d348ec)), closes [#1560](https://github.com/lerna/lerna/issues/1560)





<a name="3.0.0"></a>
# [3.0.0](https://github.com/lerna/lerna/compare/v3.0.0-rc.0...v3.0.0) (2018-08-10)


### Bug Fixes

* **publish:** Improve `npm pack` experience ([627cfc2](https://github.com/lerna/lerna/commit/627cfc2))


### Features

* **npm-publish:** Add npmPack export ([088ea54](https://github.com/lerna/lerna/commit/088ea54))
* **publish:** Run `npm pack` before `npm publish` ([8d80b2c](https://github.com/lerna/lerna/commit/8d80b2c))





<a name="3.0.0-rc.0"></a>
# [3.0.0-rc.0](https://github.com/lerna/lerna/compare/v3.0.0-beta.21...v3.0.0-rc.0) (2018-07-27)

**Note:** Version bump only for package @lerna/npm-publish





<a name="3.0.0-beta.21"></a>
# [3.0.0-beta.21](https://github.com/lerna/lerna/compare/v3.0.0-beta.20...v3.0.0-beta.21) (2018-05-12)


### Bug Fixes

* **child-process:** Prevent duplicate logs when any package-oriented execution fails ([d3a8128](https://github.com/lerna/lerna/commit/d3a8128))





<a name="3.0.0-beta.20"></a>
# [3.0.0-beta.20](https://github.com/lerna/lerna/compare/v3.0.0-beta.19...v3.0.0-beta.20) (2018-05-07)

**Note:** Version bump only for package @lerna/npm-publish





<a name="3.0.0-beta.13"></a>
# [3.0.0-beta.13](https://github.com/lerna/lerna/compare/v3.0.0-beta.12...v3.0.0-beta.13) (2018-03-31)

**Note:** Version bump only for package @lerna/npm-publish





<a name="3.0.0-beta.12"></a>
# [3.0.0-beta.12](https://github.com/lerna/lerna/compare/v3.0.0-beta.11...v3.0.0-beta.12) (2018-03-30)

**Note:** Version bump only for package @lerna/npm-publish





<a name="3.0.0-beta.11"></a>
# [3.0.0-beta.11](https://github.com/lerna/lerna/compare/v3.0.0-beta.10...v3.0.0-beta.11) (2018-03-29)


### Features

* Execute atomic publish lifecycle during lerna publish ([#1348](https://github.com/lerna/lerna/issues/1348)) ([45efa24](https://github.com/lerna/lerna/commit/45efa24))





<a name="3.0.0-beta.1"></a>
# [3.0.0-beta.1](https://github.com/lerna/lerna/compare/v3.0.0-beta.0...v3.0.0-beta.1) (2018-03-09)


### Bug Fixes

* **publish:** guard against undefined tag ([d8ce253](https://github.com/lerna/lerna/commit/d8ce253)), closes [#1311](https://github.com/lerna/lerna/issues/1311)
* **publish:** Respect pkg.publishConfig.tag ([04b256a](https://github.com/lerna/lerna/commit/04b256a)), closes [#1311](https://github.com/lerna/lerna/issues/1311)
