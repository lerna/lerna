# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [5.1.8](https://github.com/lerna/lerna/compare/v5.1.7...v5.1.8) (2022-07-07)

**Note:** Version bump only for package @lerna/conventional-commits





## [5.1.7](https://github.com/lerna/lerna/compare/v5.1.6...v5.1.7) (2022-07-06)

**Note:** Version bump only for package @lerna/conventional-commits





## [5.1.6](https://github.com/lerna/lerna/compare/v5.1.5...v5.1.6) (2022-06-24)

**Note:** Version bump only for package @lerna/conventional-commits





## [5.1.5](https://github.com/lerna/lerna/compare/v5.1.4...v5.1.5) (2022-06-24)

**Note:** Version bump only for package @lerna/conventional-commits





## [5.1.4](https://github.com/lerna/lerna/compare/v5.1.3...v5.1.4) (2022-06-15)

**Note:** Version bump only for package @lerna/conventional-commits





## [5.1.3](https://github.com/lerna/lerna/compare/v5.1.2...v5.1.3) (2022-06-15)

**Note:** Version bump only for package @lerna/conventional-commits





## [5.1.2](https://github.com/lerna/lerna/compare/v5.1.1...v5.1.2) (2022-06-13)


### Bug Fixes

* **conventional-commits:** remove pinned lodash.template ([#3172](https://github.com/lerna/lerna/issues/3172)) ([e519f43](https://github.com/lerna/lerna/commit/e519f43049253e66c1ab840c3c08435be1477d76))
* update all transitive inclusions of ansi-regex ([#3166](https://github.com/lerna/lerna/issues/3166)) ([56eaa15](https://github.com/lerna/lerna/commit/56eaa153283be3b1e7d7793d3266fc51801fad8e))





## [5.1.1](https://github.com/lerna/lerna/compare/v5.1.0...v5.1.1) (2022-06-09)


### Bug Fixes

* allow maintenance LTS node 14 engines starting at 14.15.0 ([#3161](https://github.com/lerna/lerna/issues/3161)) ([72305e4](https://github.com/lerna/lerna/commit/72305e4dbab607a2d87ae4efa6ee577c93a9dda9))





# [5.1.0](https://github.com/lerna/lerna/compare/v5.0.0...v5.1.0) (2022-06-07)


### Features

* handle the edge cases in the lerna-nx integration ([c6808fc](https://github.com/lerna/lerna/commit/c6808fc8f2dfe793bf72a64cf2d3909e0bdabba8))





# [5.1.0-alpha.0](https://github.com/lerna/lerna/compare/v4.0.0...v5.1.0-alpha.0) (2022-05-25)

**Note:** Version bump only for package @lerna/conventional-commits





# [5.0.0](https://github.com/lerna/lerna/compare/v4.0.0...v5.0.0) (2022-05-24)

**Note:** Version bump only for package @lerna/conventional-commits





# [4.0.0](https://github.com/lerna/lerna/compare/v3.22.1...v4.0.0) (2021-02-10)


### Features

* **conventional-commits:** Add JSDoc types to named exports ([81a591c](https://github.com/lerna/lerna/commit/81a591ccf1b0ca32f7f4638bab4f84b5743a3ca6))
* **deps:** Bump dependencies ([affed1c](https://github.com/lerna/lerna/commit/affed1ce0fce91f01b0a9eafe357db2d985b974f))
* Consume named exports of sibling modules ([63499e3](https://github.com/lerna/lerna/commit/63499e33652bc78fe23751875d74017e2f16a689))
* **deps:** conventional-changelog-core@^4.2.1 ([54e2b98](https://github.com/lerna/lerna/commit/54e2b98a815cc003981a807f0a167c7dd305523a))
* **deps:** conventional-recommended-bump@^6.0.11 ([4ff481c](https://github.com/lerna/lerna/commit/4ff481c9d7ee3495471d5d1eeb1b72738d7c5410))
* **deps:** fs-extra@^9.0.1 ([2f6f4e0](https://github.com/lerna/lerna/commit/2f6f4e066d5a41b4cd508b3405ac1d0a342932dc))
* **deps:** get-stream@^6.0.0 ([ddf2ab5](https://github.com/lerna/lerna/commit/ddf2ab5512704f17d31773f82fb180e659c461a6))
* **deps:** npm-package-arg@^8.1.0 ([12c8923](https://github.com/lerna/lerna/commit/12c892342d33b86a00ee2cf9079f9b26fe316dc6))
* **deps:** pify@^5.0.0 ([6b34452](https://github.com/lerna/lerna/commit/6b3445219f0f022411a7cb282b0ba39a072e2ef2))
* **deps:** semver@^7.3.2 ([003ad66](https://github.com/lerna/lerna/commit/003ad6641fab8b4e3a82251ebffd27061bd6a31b))
* Drop support for Node v6.x & v8.x ([ff4bb4d](https://github.com/lerna/lerna/commit/ff4bb4da215555e3bb136f5af09b5cbc631e57bb))


### BREAKING CHANGES

* Node v6.x & v8.x are no longer supported. Please upgrade to the latest LTS release.

Here's the gnarly one-liner I used to make these changes:
```
npx lerna exec --concurrency 1 --stream -- 'json -I -f package.json -e '"'"'this.engines=this.engines||{};this.engines.node=">= 10.18.0"'"'"
```
(requires `npm i -g json` beforehand)





# [3.22.0](https://github.com/lerna/lerna/compare/v3.21.0...v3.22.0) (2020-05-24)


### Bug Fixes

* **conventional-commits:**  Support modern config builder functions ([#2546](https://github.com/lerna/lerna/issues/2546)) ([7ffb297](https://github.com/lerna/lerna/commit/7ffb297b5cab910f58153cd9decd1f3b58b0c4ed)), closes [#2138](https://github.com/lerna/lerna/issues/2138)


### Features

* **conventional-commits:** Preserve major version zero on breaking changes ([#2486](https://github.com/lerna/lerna/issues/2486)) ([6126e6c](https://github.com/lerna/lerna/commit/6126e6c6cb52405d7ff98d3b4017bf39dcdfa965))





## [3.18.5](https://github.com/lerna/lerna/compare/v3.18.4...v3.18.5) (2019-11-20)


### Bug Fixes

* **conventional-commits:** Ensure potential `ValidationError` in `getChangelogConfig()` is propagated correctly ([406ba5a](https://github.com/lerna/lerna/commit/406ba5ab14d3a568282112f0e6874f208e8f6433))





## [3.16.4](https://github.com/lerna/lerna/compare/v3.16.3...v3.16.4) (2019-07-24)


### Bug Fixes

* **conventional-commits:** Avoid duplicate root changelog entries with custom `--tag-version-prefix` ([8adeac1](https://github.com/lerna/lerna/commit/8adeac1)), closes [#2197](https://github.com/lerna/lerna/issues/2197)
* **conventional-commits:** Preserve tag prefix in fixed changelog comparison links ([11cf6d2](https://github.com/lerna/lerna/commit/11cf6d2)), closes [#2197](https://github.com/lerna/lerna/issues/2197)





# [3.16.0](https://github.com/lerna/lerna/compare/v3.15.0...v3.16.0) (2019-07-18)


### Bug Fixes

* **conventional-commits:** Hard-pin lodash.template dependency to silence 'helpful' security warning ([c54ad68](https://github.com/lerna/lerna/commit/c54ad68))


### Features

* **deps:** `conventional-recommended-bump@^5.0.0` ([2a0ed60](https://github.com/lerna/lerna/commit/2a0ed60))
* **deps:** `fs-extra@^8.1.0` ([313287f](https://github.com/lerna/lerna/commit/313287f))
* **deps:** `pify@^4.0.1` ([f8ee7e6](https://github.com/lerna/lerna/commit/f8ee7e6))
* **deps:** `semver@^6.2.0` ([d8016d9](https://github.com/lerna/lerna/commit/d8016d9))





# [3.14.0](https://github.com/lerna/lerna/compare/v3.13.4...v3.14.0) (2019-05-14)


### Features

* **conventional-commits:** Add conventional prerelease/graduation ([#1991](https://github.com/lerna/lerna/issues/1991)) ([5d84b61](https://github.com/lerna/lerna/commit/5d84b61)), closes [#1433](https://github.com/lerna/lerna/issues/1433) [#1675](https://github.com/lerna/lerna/issues/1675)





# [3.13.0](https://github.com/lerna/lerna/compare/v3.12.1...v3.13.0) (2019-02-15)


### Features

* **conventional-commits:** Bump conventional-changelog dependencies to pick up security fixes ([d632d1b](https://github.com/lerna/lerna/commit/d632d1b))
* **meta:** Add `repository.directory` field to package.json ([aec5023](https://github.com/lerna/lerna/commit/aec5023))
* **meta:** Normalize package.json `homepage` field ([abeb4dc](https://github.com/lerna/lerna/commit/abeb4dc))





# [3.12.0](https://github.com/lerna/lerna/compare/v3.11.1...v3.12.0) (2019-02-14)


### Bug Fixes

* **conventional-commits:** Improve logging during preset resolution ([d4a16a5](https://github.com/lerna/lerna/commit/d4a16a5))





# [3.11.0](https://github.com/lerna/lerna/compare/v3.10.8...v3.11.0) (2019-02-08)


### Bug Fixes

* **deps:** Explicit npm-package-arg ^6.1.0 ([4b20791](https://github.com/lerna/lerna/commit/4b20791))
* **deps:** Explicit npmlog ^4.1.2 ([571c2e2](https://github.com/lerna/lerna/commit/571c2e2))
* **deps:** Remove unused libnpm (replaced by direct sub-packages) ([1caeb28](https://github.com/lerna/lerna/commit/1caeb28))


### Features

* **version:** Create Github releases with `--github-release` ([#1864](https://github.com/lerna/lerna/issues/1864)) ([f84a631](https://github.com/lerna/lerna/commit/f84a631)), closes [#1513](https://github.com/lerna/lerna/issues/1513)





## [3.10.8](https://github.com/lerna/lerna/compare/v3.10.7...v3.10.8) (2019-02-01)


### Bug Fixes

* **conventional-commits:** Support legacy callback presets ([60647b4](https://github.com/lerna/lerna/commit/60647b4)), closes [#1896](https://github.com/lerna/lerna/issues/1896)





# [3.10.0](https://github.com/lerna/lerna/compare/v3.9.1...v3.10.0) (2019-01-08)

**Note:** Version bump only for package @lerna/conventional-commits





# [3.6.0](https://github.com/lerna/lerna/compare/v3.5.1...v3.6.0) (2018-12-07)


### Features

* Migrate existing usage to libnpm ([0d3a786](https://github.com/lerna/lerna/commit/0d3a786)), closes [#1767](https://github.com/lerna/lerna/issues/1767)





# [3.5.0](https://github.com/lerna/lerna/compare/v3.4.3...v3.5.0) (2018-11-27)


### Bug Fixes

* **conventional-commits:** Bump minimum dependency ranges for node v11 compat ([76fad65](https://github.com/lerna/lerna/commit/76fad65))





## [3.4.1](https://github.com/lerna/lerna/compare/v3.4.0...v3.4.1) (2018-10-04)


### Bug Fixes

* **conventional-commits:** Upgrade angular preset, ensure header is not duplicated ([159a0b0](https://github.com/lerna/lerna/commit/159a0b0)), closes [#1696](https://github.com/lerna/lerna/issues/1696)
* **conventional-commits:** Upgrade dependencies ([9752f3e](https://github.com/lerna/lerna/commit/9752f3e)), closes [#1641](https://github.com/lerna/lerna/issues/1641) [#1661](https://github.com/lerna/lerna/issues/1661)





<a name="3.3.0"></a>
# [3.3.0](https://github.com/lerna/lerna/compare/v3.2.1...v3.3.0) (2018-09-06)


### Features

* **deps:** Upgrade fs-extra to ^7.0.0 ([042b1a3](https://github.com/lerna/lerna/commit/042b1a3))
* **deps:** Upgrade get-stream to ^4.0.0 ([e280d1d](https://github.com/lerna/lerna/commit/e280d1d))





<a name="3.0.2"></a>
## [3.0.2](https://github.com/lerna/lerna/compare/v3.0.1...v3.0.2) (2018-08-11)


### Bug Fixes

* **conventional-commits:** Pass --tag-version-prefix to changelog utilities ([8ed7d83](https://github.com/lerna/lerna/commit/8ed7d83))
* **conventional-commits:** Provide fallback bump when releaseType is missing ([e330f6f](https://github.com/lerna/lerna/commit/e330f6f)), closes [#1551](https://github.com/lerna/lerna/issues/1551)





<a name="3.0.0"></a>
# [3.0.0](https://github.com/lerna/lerna/compare/v3.0.0-rc.0...v3.0.0) (2018-08-10)

**Note:** Version bump only for package @lerna/conventional-commits





<a name="3.0.0-rc.0"></a>
# [3.0.0-rc.0](https://github.com/lerna/lerna/compare/v3.0.0-beta.21...v3.0.0-rc.0) (2018-07-27)


### Features

* Upgrade to fs-extra 6 ([079d873](https://github.com/lerna/lerna/commit/079d873))
* **project:** Move collect-packages into getPackages() method ([06b88d4](https://github.com/lerna/lerna/commit/06b88d4))





<a name="3.0.0-beta.15"></a>
# [3.0.0-beta.15](https://github.com/lerna/lerna/compare/v3.0.0-beta.14...v3.0.0-beta.15) (2018-04-09)


### Features

* **conventional-commits:** Support local file presets ([a1bff40](https://github.com/lerna/lerna/commit/a1bff40))





<a name="3.0.0-beta.10"></a>
# [3.0.0-beta.10](https://github.com/lerna/lerna/compare/v3.0.0-beta.9...v3.0.0-beta.10) (2018-03-27)

**Note:** Version bump only for package @lerna/conventional-commits





<a name="3.0.0-beta.3"></a>
# [3.0.0-beta.3](https://github.com/lerna/lerna/compare/v3.0.0-beta.2...v3.0.0-beta.3) (2018-03-15)


### Bug Fixes

* fs-extra dependency is a caret range, not exact ([81556d0](https://github.com/lerna/lerna/commit/81556d0))





<a name="3.0.0-beta.2"></a>
# [3.0.0-beta.2](https://github.com/lerna/lerna/compare/v3.0.0-beta.1...v3.0.0-beta.2) (2018-03-10)


### Features

* Replace @lerna/fs-utils dependency with fs-extra ([9c35a86](https://github.com/lerna/lerna/commit/9c35a86))





<a name="3.0.0-beta.1"></a>
# [3.0.0-beta.1](https://github.com/lerna/lerna/compare/v3.0.0-beta.0...v3.0.0-beta.1) (2018-03-09)


### Bug Fixes

* **conventional-commits:** output version bump message closer to version heading ([64916d6](https://github.com/lerna/lerna/commit/64916d6))
