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

**Note:** Version bump only for package @lerna/diff





<a name="3.0.0-beta.10"></a>
# [3.0.0-beta.10](https://github.com/lerna/lerna/compare/v3.0.0-beta.9...v3.0.0-beta.10) (2018-03-27)


### Features

* **commands:** Delay require of command instantiation ([a1284f3](https://github.com/lerna/lerna/commit/a1284f3))


### BREAKING CHANGES

* **commands:** The default export of command packages is now a factory, not the subclass (which is now a named export).





<a name="3.0.0-beta.9"></a>
# [3.0.0-beta.9](https://github.com/lerna/lerna/compare/v3.0.0-beta.8...v3.0.0-beta.9) (2018-03-24)


### Features

* **command:** Rename this.repository -> this.project ([43e98a0](https://github.com/lerna/lerna/commit/43e98a0))





<a name="3.0.0-beta.7"></a>
# [3.0.0-beta.7](https://github.com/lerna/lerna/compare/v3.0.0-beta.6...v3.0.0-beta.7) (2018-03-20)

**Note:** Version bump only for package @lerna/diff





<a name="3.0.0-beta.4"></a>
# [3.0.0-beta.4](https://github.com/lerna/lerna/compare/v3.0.0-beta.3...v3.0.0-beta.4) (2018-03-19)

**Note:** Version bump only for package @lerna/diff





<a name="3.0.0-beta.3"></a>
# [3.0.0-beta.3](https://github.com/lerna/lerna/compare/v3.0.0-beta.2...v3.0.0-beta.3) (2018-03-15)

**Note:** Version bump only for package @lerna/diff





<a name="3.0.0-beta.2"></a>
# [3.0.0-beta.2](https://github.com/lerna/lerna/compare/v3.0.0-beta.1...v3.0.0-beta.2) (2018-03-10)

**Note:** Version bump only for package @lerna/diff





<a name="3.0.0-beta.1"></a>
# [3.0.0-beta.1](https://github.com/lerna/lerna/compare/v3.0.0-beta.0...v3.0.0-beta.1) (2018-03-09)


### Features

* **diff:** filter diff output with --ignore-changes ([c27c2e0](https://github.com/lerna/lerna/commit/c27c2e0))
