# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

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
