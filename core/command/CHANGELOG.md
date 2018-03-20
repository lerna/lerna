# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

<a name="3.0.0-beta.7"></a>
# [3.0.0-beta.7](https://github.com/lerna/lerna/compare/v3.0.0-beta.6...v3.0.0-beta.7) (2018-03-20)


### Bug Fixes

* **cli:** Retrieve correct version ([bb2c5e8](https://github.com/lerna/lerna/commit/bb2c5e8))





<a name="3.0.0-beta.4"></a>
# [3.0.0-beta.4](https://github.com/lerna/lerna/compare/v3.0.0-beta.3...v3.0.0-beta.4) (2018-03-19)


### Bug Fixes

* **clean-stack:** Try to avoid causing errors during error cleanup ([89f9d3b](https://github.com/lerna/lerna/commit/89f9d3b))





<a name="3.0.0-beta.3"></a>
# [3.0.0-beta.3](https://github.com/lerna/lerna/compare/v3.0.0-beta.2...v3.0.0-beta.3) (2018-03-15)

**Note:** Version bump only for package @lerna/command





<a name="3.0.0-beta.2"></a>

# [3.0.0-beta.2](https://github.com/lerna/lerna/compare/v3.0.0-beta.1...v3.0.0-beta.2) (2018-03-10)

### Features

* Replace @lerna/match-package-name with multimatch ([423f82c](https://github.com/lerna/lerna/commit/423f82c))
* **filter-packages:** Simplify method signature ([47e1c86](https://github.com/lerna/lerna/commit/47e1c86))

### BREAKING CHANGES

* **filter-packages:** The parameters to `filterPackages()` have changed:
  * Two lists (include, exclude) have replaced the destructured config object

<a name="3.0.0-beta.1"></a>

# [3.0.0-beta.1](https://github.com/lerna/lerna/compare/v3.0.0-beta.0...v3.0.0-beta.1) (2018-03-09)

### Bug Fixes

* **filter-options:** require a git repo when using --since ([d21b66e](https://github.com/lerna/lerna/commit/d21b66e)), closes [#822](https://github.com/lerna/lerna/issues/822)

### Features

* **collect-packages:** simplify signature ([39170cf](https://github.com/lerna/lerna/commit/39170cf))
* **filter-options:** Exclude private packages with --no-private ([6674d18](https://github.com/lerna/lerna/commit/6674d18))

### BREAKING CHANGES

* **collect-packages:** Formerly a config object, it is now two parameters, only the first of
  which (rootPath) is required. The second parameter is a list of package
  location globs, defaulting to lerna's default of `["packages/*"]`.
