# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

<a name="3.0.0-beta.12"></a>
# [3.0.0-beta.12](https://github.com/lerna/lerna/compare/v3.0.0-beta.11...v3.0.0-beta.12) (2018-03-30)


### Features

* **package:** Add `serialize()` method ([fdec3ac](https://github.com/lerna/lerna/commit/fdec3ac))
* **package:** Add Map-like get/set methods, remove raw json getter ([707d1f0](https://github.com/lerna/lerna/commit/707d1f0))


### BREAKING CHANGES

* **package:** The `Package` class no longer provides direct access to the JSON object
used to construct the instance. Map-like `get()`/`set(val)` methods are
available to modify the internal representation.





<a name="3.0.0-beta.11"></a>
# [3.0.0-beta.11](https://github.com/lerna/lerna/compare/v3.0.0-beta.10...v3.0.0-beta.11) (2018-03-29)

**Note:** Version bump only for package @lerna/add





<a name="3.0.0-beta.10"></a>
# [3.0.0-beta.10](https://github.com/lerna/lerna/compare/v3.0.0-beta.9...v3.0.0-beta.10) (2018-03-27)


### Bug Fixes

* **add:** Use bootstrap factory, not handler ([dbfc891](https://github.com/lerna/lerna/commit/dbfc891))


### Features

* **commands:** Delay require of command instantiation ([a1284f3](https://github.com/lerna/lerna/commit/a1284f3))


### BREAKING CHANGES

* **commands:** The default export of command packages is now a factory, not the subclass (which is now a named export).





<a name="3.0.0-beta.9"></a>
# [3.0.0-beta.9](https://github.com/lerna/lerna/compare/v3.0.0-beta.8...v3.0.0-beta.9) (2018-03-24)


### Features

* **command:** Rename this.repository -> this.project ([43e98a0](https://github.com/lerna/lerna/commit/43e98a0))





<a name="3.0.0-beta.8"></a>
# [3.0.0-beta.8](https://github.com/lerna/lerna/compare/v3.0.0-beta.7...v3.0.0-beta.8) (2018-03-22)


### Bug Fixes

* **add:** Support tag and version specifiers ([5df0fc8](https://github.com/lerna/lerna/commit/5df0fc8)), closes [#1306](https://github.com/lerna/lerna/issues/1306)





<a name="3.0.0-beta.7"></a>
# [3.0.0-beta.7](https://github.com/lerna/lerna/compare/v3.0.0-beta.6...v3.0.0-beta.7) (2018-03-20)

**Note:** Version bump only for package @lerna/add





<a name="3.0.0-beta.6"></a>
# [3.0.0-beta.6](https://github.com/lerna/lerna/compare/v3.0.0-beta.5...v3.0.0-beta.6) (2018-03-19)

**Note:** Version bump only for package @lerna/add





<a name="3.0.0-beta.5"></a>
# [3.0.0-beta.5](https://github.com/lerna/lerna/compare/v3.0.0-beta.4...v3.0.0-beta.5) (2018-03-19)

**Note:** Version bump only for package @lerna/add





<a name="3.0.0-beta.4"></a>
# [3.0.0-beta.4](https://github.com/lerna/lerna/compare/v3.0.0-beta.3...v3.0.0-beta.4) (2018-03-19)


### Bug Fixes

* Use correct instance property override ([9249221](https://github.com/lerna/lerna/commit/9249221))





<a name="3.0.0-beta.3"></a>
# [3.0.0-beta.3](https://github.com/lerna/lerna/compare/v3.0.0-beta.2...v3.0.0-beta.3) (2018-03-15)

**Note:** Version bump only for package @lerna/add





<a name="3.0.0-beta.2"></a>
# [3.0.0-beta.2](https://github.com/lerna/lerna/compare/v3.0.0-beta.1...v3.0.0-beta.2) (2018-03-10)

**Note:** Version bump only for package @lerna/add





<a name="3.0.0-beta.1"></a>
# [3.0.0-beta.1](https://github.com/lerna/lerna/compare/v3.0.0-beta.0...v3.0.0-beta.1) (2018-03-09)

**Note:** Version bump only for package @lerna/add
