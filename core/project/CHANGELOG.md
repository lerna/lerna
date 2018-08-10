# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

<a name="3.0.0"></a>
# [3.0.0](https://github.com/lerna/lerna/compare/v3.0.0-rc.0...v3.0.0) (2018-08-10)


### Features

* Split `lerna version` from of `lerna publish` ([#1522](https://github.com/lerna/lerna/issues/1522)) ([8b97394](https://github.com/lerna/lerna/commit/8b97394)), closes [#277](https://github.com/lerna/lerna/issues/277) [#936](https://github.com/lerna/lerna/issues/936) [#956](https://github.com/lerna/lerna/issues/956) [#961](https://github.com/lerna/lerna/issues/961) [#1056](https://github.com/lerna/lerna/issues/1056) [#1118](https://github.com/lerna/lerna/issues/1118) [#1385](https://github.com/lerna/lerna/issues/1385) [#1483](https://github.com/lerna/lerna/issues/1483) [#1494](https://github.com/lerna/lerna/issues/1494)


### BREAKING CHANGES

* * `--preid` now defaults to "alpha" during prereleases:

  The previous default for this option was undefined, which led to an awkward "1.0.1-0" result when passed to `semver.inc()`.

  The new default "alpha" yields a much more useful "1.0.1-alpha.0" result. Any previous prerelease ID will be preserved, just as it was before.

* `--no-verify` is no longer passed to `git commit` by default, but controlled by the new `--commit-hooks` option:

  The previous behavior was too overzealous, and the new option operates exactly like the corresponding [npm version](https://docs.npmjs.com/cli/version#commit-hooks) option of the same name.

  As long as your pre-commit hooks are properly scoped to ignore changes in package.json files, this change should not affect you. If that is not the case, you may pass `--no-commit-hooks` to restore the previous behavior.





<a name="3.0.0-rc.0"></a>
# [3.0.0-rc.0](https://github.com/lerna/lerna/compare/v3.0.0-beta.21...v3.0.0-rc.0) (2018-07-27)


### Bug Fixes

* **project:** Report syntax errors in root package.json ([f674f35](https://github.com/lerna/lerna/commit/f674f35)), closes [#1452](https://github.com/lerna/lerna/issues/1452)


### Features

* **project:** Move collect-packages into getPackages() method ([06b88d4](https://github.com/lerna/lerna/commit/06b88d4))





<a name="3.0.0-beta.20"></a>
# [3.0.0-beta.20](https://github.com/lerna/lerna/compare/v3.0.0-beta.19...v3.0.0-beta.20) (2018-05-07)


### Features

* **project:** Upgrade cosmiconfig ([9acde7d](https://github.com/lerna/lerna/commit/9acde7d))





<a name="3.0.0-beta.19"></a>
# [3.0.0-beta.19](https://github.com/lerna/lerna/compare/v3.0.0-beta.18...v3.0.0-beta.19) (2018-05-03)


### Features

* **project:** Map deprecated config to new namespaces ([4da6318](https://github.com/lerna/lerna/commit/4da6318))





<a name="3.0.0-beta.17"></a>
# [3.0.0-beta.17](https://github.com/lerna/lerna/compare/v3.0.0-beta.16...v3.0.0-beta.17) (2018-04-13)

**Note:** Version bump only for package @lerna/project





<a name="3.0.0-beta.15"></a>
# [3.0.0-beta.15](https://github.com/lerna/lerna/compare/v3.0.0-beta.14...v3.0.0-beta.15) (2018-04-09)


### Bug Fixes

* **project:** Pin --exact require-from-string v2.0.1 to avoid integrity error with v2.0.2 ([32a38ad](https://github.com/lerna/lerna/commit/32a38ad))





<a name="3.0.0-beta.12"></a>
# [3.0.0-beta.12](https://github.com/lerna/lerna/compare/v3.0.0-beta.11...v3.0.0-beta.12) (2018-03-30)


### Features

* **package:** Add Map-like get/set methods, remove raw json getter ([707d1f0](https://github.com/lerna/lerna/commit/707d1f0))
* **project:** Merge `package` and `packageJson` into `manifest` ([9a47ff7](https://github.com/lerna/lerna/commit/9a47ff7))


### BREAKING CHANGES

* **package:** The `Package` class no longer provides direct access to the JSON object
used to construct the instance. Map-like `get()`/`set(val)` methods are
available to modify the internal representation.





<a name="3.0.0-beta.11"></a>
# [3.0.0-beta.11](https://github.com/lerna/lerna/compare/v3.0.0-beta.10...v3.0.0-beta.11) (2018-03-29)

**Note:** Version bump only for package @lerna/project





<a name="3.0.0-beta.10"></a>
# [3.0.0-beta.10](https://github.com/lerna/lerna/compare/v3.0.0-beta.9...v3.0.0-beta.10) (2018-03-27)


### Features

* **project:** Inherit configuration with yargs-like "extends" ([0b28ef5](https://github.com/lerna/lerna/commit/0b28ef5)), closes [#1281](https://github.com/lerna/lerna/issues/1281)





<a name="3.0.0-beta.9"></a>
# [3.0.0-beta.9](https://github.com/lerna/lerna/compare/v3.0.0-beta.8...v3.0.0-beta.9) (2018-03-24)


### Features

* **project:** Normalize config.commands -> config.command ([24e55e3](https://github.com/lerna/lerna/commit/24e55e3))
* **project:** Use cosmiconfig to locate and read lerna.json ([b8c2789](https://github.com/lerna/lerna/commit/b8c2789))





<a name="3.0.0-beta.1"></a>
# [3.0.0-beta.1](https://github.com/lerna/lerna/compare/v3.0.0-beta.0...v3.0.0-beta.1) (2018-03-09)


### Bug Fixes

* **publish:** default root manifest name when missing ([a504d7e](https://github.com/lerna/lerna/commit/a504d7e)), closes [#1305](https://github.com/lerna/lerna/issues/1305)
