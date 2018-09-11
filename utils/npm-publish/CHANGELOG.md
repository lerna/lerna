# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

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
