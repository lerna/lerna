# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

<a name="3.0.0-beta.1"></a>
# [3.0.0-beta.1](https://github.com/lerna/lerna/compare/v3.0.0-beta.0...v3.0.0-beta.1) (2018-03-09)


### Features

* **collect-packages:** simplify signature ([39170cf](https://github.com/lerna/lerna/commit/39170cf))


### BREAKING CHANGES

* **collect-packages:** Formerly a config object, it is now two parameters, only the first of
which (rootPath) is required. The second parameter is a list of package
location globs, defaulting to lerna's default of `["packages/*"]`.
