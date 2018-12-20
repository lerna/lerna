# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [3.7.1](https://github.com/lerna/lerna/compare/v3.7.0...v3.7.1) (2018-12-20)


### Bug Fixes

* **bootstrap:** Pulse progress bar during execution ([b38a151](https://github.com/lerna/lerna/commit/b38a151))
* **clean:** Pulse progress bar during execution ([f1202de](https://github.com/lerna/lerna/commit/f1202de))
* **command:** Enable progress from top-level log object ([95e88f0](https://github.com/lerna/lerna/commit/95e88f0))
* **import:** Pulse progress bar during execution ([b552e22](https://github.com/lerna/lerna/commit/b552e22))
* **npm-dist-tag:** Accept opts.log, defaulting to libnpm/log ([97edc7e](https://github.com/lerna/lerna/commit/97edc7e))
* **npm-publish:** Accept opts.log, defaulting to libnpm/log ([a1d61f6](https://github.com/lerna/lerna/commit/a1d61f6))
* **pack-directory:** Accept opts.log, defaulting to libnpm/log ([d099d13](https://github.com/lerna/lerna/commit/d099d13))
* **publish:** Do not pass this.logger into conf, it does not respect log.level ([9bcd503](https://github.com/lerna/lerna/commit/9bcd503))
* **publish:** Pulse progress bar during execution ([49b8771](https://github.com/lerna/lerna/commit/49b8771))
* Add pulse-till-done utility ([3359c63](https://github.com/lerna/lerna/commit/3359c63))
* **run-lifecycle:** Accept opts.log, defaulting to libnpm/log ([dde588a](https://github.com/lerna/lerna/commit/dde588a))
* **run-lifecycle:** Do not execute on packages that lack the target script, avoiding spurious logs ([c0ad316](https://github.com/lerna/lerna/commit/c0ad316))





# [3.7.0](https://github.com/lerna/lerna/compare/v3.6.0...v3.7.0) (2018-12-19)


### Bug Fixes

* **add:** Snapshot opts passed to pacote.manifest() ([d0f0dbc](https://github.com/lerna/lerna/commit/d0f0dbc))
* **bootstrap:** Use run-lifecycle factory instead of manual filtering ([d32feaa](https://github.com/lerna/lerna/commit/d32feaa))
* **create:** Pass options snapshot to pacote.manifest() ([6116680](https://github.com/lerna/lerna/commit/6116680))
* **npm-conf:** Port kevva/npm-conf/pull/12 ([@zkochan](https://github.com/zkochan)) ([d58b741](https://github.com/lerna/lerna/commit/d58b741))
* **npm-conf:** Update defaults & types to npm v6.5.0+ ([6a8aa83](https://github.com/lerna/lerna/commit/6a8aa83))
* **publish:** Remove unused dependency ([d4ab6c4](https://github.com/lerna/lerna/commit/d4ab6c4))
* **publish:** Short-circuit retries for npm username validation ([ca4dd95](https://github.com/lerna/lerna/commit/ca4dd95))
* **run-lifecycle:** Omit circular options from config ([00eb5bd](https://github.com/lerna/lerna/commit/00eb5bd))


### Features

* Add [@lerna](https://github.com/lerna)/get-packed ([8675c8f](https://github.com/lerna/lerna/commit/8675c8f))
* Add [@lerna](https://github.com/lerna)/pack-directory ([be1aeaf](https://github.com/lerna/lerna/commit/be1aeaf))
* **dist-tag:** Wrap options in figgy-pudding ([2713ab8](https://github.com/lerna/lerna/commit/2713ab8))
* **npm-publish:** Use libnpm/publish instead of subprocess execution ([433275e](https://github.com/lerna/lerna/commit/433275e))
* **package:** Add .refresh() method to update internal state when external changes have occurred ([905ba10](https://github.com/lerna/lerna/commit/905ba10))
* **publish:** Add npm-session, npm-version, and user-agent fields to libnpm/fetch config ([5edb27d](https://github.com/lerna/lerna/commit/5edb27d))
* **publish:** Refresh package manifests after prepare/prepublishOnly lifecycle ([e6b31f8](https://github.com/lerna/lerna/commit/e6b31f8))
* **publish:** Use [@lerna](https://github.com/lerna)/pack-directory instead of subprocess npm pack ([fd7299f](https://github.com/lerna/lerna/commit/fd7299f))
* **publish:** Use libnpm/publish instead of subprocess execution ([58fda8d](https://github.com/lerna/lerna/commit/58fda8d))
* **version:** Refresh package manifests after preversion lifecycle ([7c7bf9a](https://github.com/lerna/lerna/commit/7c7bf9a))





# [3.6.0](https://github.com/lerna/lerna/compare/v3.5.1...v3.6.0) (2018-12-07)


### Bug Fixes

* **add:** Validate local package version ([#1804](https://github.com/lerna/lerna/issues/1804)) ([ed6e2db](https://github.com/lerna/lerna/commit/ed6e2db)), closes [#1799](https://github.com/lerna/lerna/issues/1799)
* **bootstrap:** Omit local bundled dependencies ([#1805](https://github.com/lerna/lerna/issues/1805)) ([8f5bdbb](https://github.com/lerna/lerna/commit/8f5bdbb)), closes [#1775](https://github.com/lerna/lerna/issues/1775)
* **pkg:** Exclude __mocks__ from package tarball ([4017f37](https://github.com/lerna/lerna/commit/4017f37))


### Features

* **add:** Add --no-bootstrap option ([89bb928](https://github.com/lerna/lerna/commit/89bb928))
* **bootstrap:** Support `--force-local` option ([#1807](https://github.com/lerna/lerna/issues/1807)) ([25572af](https://github.com/lerna/lerna/commit/25572af)), closes [#1763](https://github.com/lerna/lerna/issues/1763)
* Migrate existing usage to libnpm ([0d3a786](https://github.com/lerna/lerna/commit/0d3a786)), closes [#1767](https://github.com/lerna/lerna/issues/1767)
* **create:** Migrate `npm info` subprocess to libnpm.manifest ([65a1d1b](https://github.com/lerna/lerna/commit/65a1d1b))
* **listable:** Add --toposort option ([b387881](https://github.com/lerna/lerna/commit/b387881)), closes [#1652](https://github.com/lerna/lerna/issues/1652)
* **npm-dist-tag:** Use fetch API instead of CLI to make changes ([54008c6](https://github.com/lerna/lerna/commit/54008c6))
* **publish:** Add a "from-package" positional argument ([#1708](https://github.com/lerna/lerna/issues/1708)) ([16611be](https://github.com/lerna/lerna/commit/16611be)), closes [#1648](https://github.com/lerna/lerna/issues/1648)
* **publish:** Attempt profile retrieval before whoami endpoint during user validation ([38097d8](https://github.com/lerna/lerna/commit/38097d8))





## [3.5.1](https://github.com/lerna/lerna/compare/v3.5.0...v3.5.1) (2018-11-29)


### Bug Fixes

* **publish:** Pass explicit list of files to checkout instead of globs ([a4c57c2](https://github.com/lerna/lerna/commit/a4c57c2)), closes [#1786](https://github.com/lerna/lerna/issues/1786)





# [3.5.0](https://github.com/lerna/lerna/compare/v3.4.3...v3.5.0) (2018-11-27)


### Bug Fixes

* **conventional-commits:** Bump minimum dependency ranges for node v11 compat ([76fad65](https://github.com/lerna/lerna/commit/76fad65))
* prettier ([001a6df](https://github.com/lerna/lerna/commit/001a6df))
* Update yarn workspaces error prompt link ([#1756](https://github.com/lerna/lerna/issues/1756)) ([d6e6a42](https://github.com/lerna/lerna/commit/d6e6a42))
* **publish:** Ignore non-release tags when detecting `from-git` ([#1782](https://github.com/lerna/lerna/issues/1782)) ([3cb7465](https://github.com/lerna/lerna/commit/3cb7465))
* **version:** Add friendly error message when remote branch doesn't exist ([#1741](https://github.com/lerna/lerna/issues/1741)) ([cd34b48](https://github.com/lerna/lerna/commit/cd34b48))
* **version:** Don't version private packages lacking a version field ([#1654](https://github.com/lerna/lerna/issues/1654)) ([578bb19](https://github.com/lerna/lerna/commit/578bb19))


### Features

* **publish:** Add option `--no-git-reset` to leave unstaged changes in working tree ([#1791](https://github.com/lerna/lerna/issues/1791)) ([eae5619](https://github.com/lerna/lerna/commit/eae5619))
* **run:** Log package name and timing in runScriptInPackageCapturing ([#1781](https://github.com/lerna/lerna/issues/1781)) ([b69a728](https://github.com/lerna/lerna/commit/b69a728))
* **version:** Add `--include-merged-tags` option ([#1712](https://github.com/lerna/lerna/issues/1712)) ([7ee05d7](https://github.com/lerna/lerna/commit/7ee05d7))





## [3.4.3](https://github.com/lerna/lerna/compare/v3.4.2...v3.4.3) (2018-10-10)


### Bug Fixes

* **publish:** Use correct field name when limiting retries ([76589d4](https://github.com/lerna/lerna/commit/76589d4))





## [3.4.2](https://github.com/lerna/lerna/compare/v3.4.1...v3.4.2) (2018-10-09)


### Bug Fixes

* **publish:** Prevent retries during access validation so third-party registries are skipped faster ([a89ae62](https://github.com/lerna/lerna/commit/a89ae62))
* **publish:** Use modern auth resolution ([7ba41a6](https://github.com/lerna/lerna/commit/7ba41a6))





## [3.4.1](https://github.com/lerna/lerna/compare/v3.4.0...v3.4.1) (2018-10-04)


### Bug Fixes

* **add:** Allow --registry option ([597606c](https://github.com/lerna/lerna/commit/597606c))
* **bootstrap:** Constrain npm-conf argument object to options.registry only ([987fd26](https://github.com/lerna/lerna/commit/987fd26))
* **conventional-commits:** Upgrade angular preset, ensure header is not duplicated ([159a0b0](https://github.com/lerna/lerna/commit/159a0b0)), closes [#1696](https://github.com/lerna/lerna/issues/1696)
* **conventional-commits:** Upgrade dependencies ([9752f3e](https://github.com/lerna/lerna/commit/9752f3e)), closes [#1641](https://github.com/lerna/lerna/issues/1641) [#1661](https://github.com/lerna/lerna/issues/1661)
* **npm-conf:** Do not overwrite defaults with undefined cli keys ([25af71d](https://github.com/lerna/lerna/commit/25af71d))
* **publish:** Overwrite Yarn registry proxy when encountered ([f7fdc77](https://github.com/lerna/lerna/commit/f7fdc77))
* **publish:** Set token on npm config, allow third-party registries to remain non-compliant ([06a9479](https://github.com/lerna/lerna/commit/06a9479))





<a name="3.4.0"></a>
# [3.4.0](https://github.com/lerna/lerna/compare/v3.3.2...v3.4.0) (2018-09-14)


### Features

* **publish:** Use APIs for validation queries instead of CLI ([65fc603](https://github.com/lerna/lerna/commit/65fc603))





<a name="3.3.2"></a>
## [3.3.2](https://github.com/lerna/lerna/compare/v3.3.1...v3.3.2) (2018-09-12)


### Bug Fixes

* **publish:** Allow `--force-publish` in a canary release ([b97d9a3](https://github.com/lerna/lerna/commit/b97d9a3)), closes [#1638](https://github.com/lerna/lerna/issues/1638)
* **version:** Allow `--force-publish` to work on tagged releases ([7971bf3](https://github.com/lerna/lerna/commit/7971bf3)), closes [#1667](https://github.com/lerna/lerna/issues/1667) [#1671](https://github.com/lerna/lerna/issues/1671)





<a name="3.3.1"></a>
## [3.3.1](https://github.com/lerna/lerna/compare/v3.3.0...v3.3.1) (2018-09-11)


### Bug Fixes

* **create:** Upgrade whatwg-url to ^7.0.0 ([00842d6](https://github.com/lerna/lerna/commit/00842d6))
* **import:** Handle filepaths with spaces more robustly ([#1655](https://github.com/lerna/lerna/issues/1655)) ([b084293](https://github.com/lerna/lerna/commit/b084293))
* **prompt:** Upgrade inquirer to ^6.2.0 ([ebb7ee4](https://github.com/lerna/lerna/commit/ebb7ee4))
* **publish:** Tell yarn to stop creating git tags ([2a6f0a4](https://github.com/lerna/lerna/commit/2a6f0a4)), closes [#1662](https://github.com/lerna/lerna/issues/1662)
* **run-lifecycle:** Remove repetitive error logging ([b8915e7](https://github.com/lerna/lerna/commit/b8915e7))





<a name="3.3.0"></a>
# [3.3.0](https://github.com/lerna/lerna/compare/v3.2.1...v3.3.0) (2018-09-06)


### Bug Fixes

* **describe-ref:** Fallback refCount is the number of commits since beginning of repository ([6dfea52](https://github.com/lerna/lerna/commit/6dfea52))
* Propagate exit codes from failed executions ([af9c70b](https://github.com/lerna/lerna/commit/af9c70b)), closes [#1374](https://github.com/lerna/lerna/issues/1374) [#1653](https://github.com/lerna/lerna/issues/1653)
* **run-lifecycle:** Propagate exit code when execution fails ([4763f95](https://github.com/lerna/lerna/commit/4763f95)), closes [#1495](https://github.com/lerna/lerna/issues/1495)


### Features

* **deps:** Upgrade execa to ^1.0.0 ([748ae4e](https://github.com/lerna/lerna/commit/748ae4e))
* **deps:** Upgrade fs-extra to ^7.0.0 ([042b1a3](https://github.com/lerna/lerna/commit/042b1a3))
* **deps:** Upgrade get-stream to ^4.0.0 ([e280d1d](https://github.com/lerna/lerna/commit/e280d1d))
* **deps:** Upgrade strong-log-transformer to ^2.0.0 ([42b18a1](https://github.com/lerna/lerna/commit/42b18a1))





<a name="3.2.1"></a>
## [3.2.1](https://github.com/lerna/lerna/compare/v3.2.0...v3.2.1) (2018-08-28)


### Bug Fixes

* **publish:** Use package version as fallback for independent canary bump ([989a3b5](https://github.com/lerna/lerna/commit/989a3b5)), closes [#1614](https://github.com/lerna/lerna/issues/1614)





<a name="3.2.0"></a>
# [3.2.0](https://github.com/lerna/lerna/compare/v3.1.4...v3.2.0) (2018-08-28)


### Bug Fixes

* **add:** Order short flags first in help output, clarify description ([8efb549](https://github.com/lerna/lerna/commit/8efb549))
* **publish:** Call synthetic prepublishOnly lifecycle before packing ([dda9812](https://github.com/lerna/lerna/commit/dda9812)), closes [#1169](https://github.com/lerna/lerna/issues/1169)
* **version:** Make changes to packages in batched topological order ([d799fbf](https://github.com/lerna/lerna/commit/d799fbf))
* **version:** Skip working tree validation when `--no-git-tag-version` passed ([bd948cc](https://github.com/lerna/lerna/commit/bd948cc)), closes [#1613](https://github.com/lerna/lerna/issues/1613)


### Features

* **add:** Add examples to `--help` output ([#1612](https://github.com/lerna/lerna/issues/1612)) ([2ab62c1](https://github.com/lerna/lerna/commit/2ab62c1)), closes [#1608](https://github.com/lerna/lerna/issues/1608)
* **cli:** Configure commands in root package, all other bits in cli package ([7200fd0](https://github.com/lerna/lerna/commit/7200fd0)), closes [#1584](https://github.com/lerna/lerna/issues/1584)
* **npm-publish:** Resolve target package to aid chaining ([928a707](https://github.com/lerna/lerna/commit/928a707))
* **npm-publish:** Store entire tarball metadata object on Package instances ([063d743](https://github.com/lerna/lerna/commit/063d743))
* **publish:** Support prepack/postpack lifecycle in root manifest ([9df88a4](https://github.com/lerna/lerna/commit/9df88a4))
* **run-lifecycle:** Resolve target package to aid chaining ([8e0aa96](https://github.com/lerna/lerna/commit/8e0aa96))





<a name="3.1.4"></a>
## [3.1.4](https://github.com/lerna/lerna/compare/v3.1.3...v3.1.4) (2018-08-21)


### Bug Fixes

* **symlink-binary:** Avoid instanceof across nested module boundaries ([26d1b72](https://github.com/lerna/lerna/commit/26d1b72)), closes [#1525](https://github.com/lerna/lerna/issues/1525)





<a name="3.1.3"></a>
## [3.1.3](https://github.com/lerna/lerna/compare/v3.1.2...v3.1.3) (2018-08-21)


### Bug Fixes

* **add:** Avoid passing bad scope to pacote ([ad649bf](https://github.com/lerna/lerna/commit/ad649bf)), closes [#1592](https://github.com/lerna/lerna/issues/1592)
* **global-options:** Move env defaults to command superclass ([6d8e405](https://github.com/lerna/lerna/commit/6d8e405)), closes [#1449](https://github.com/lerna/lerna/issues/1449)





<a name="3.1.2"></a>
## [3.1.2](https://github.com/lerna/lerna/compare/v3.1.1...v3.1.2) (2018-08-20)


### Bug Fixes

* Setup instance.filteredPackages explicitly ([32357f8](https://github.com/lerna/lerna/commit/32357f8))
* Use packageGraph.rawPackageList instead of misleading instance.filteredPackages ([2e2abdc](https://github.com/lerna/lerna/commit/2e2abdc))
* **bootstrap:** Remove redundant duplicate name check ([c2405a1](https://github.com/lerna/lerna/commit/c2405a1))
* **command:** Remove redundant filteredPackages calculation ([e0a361f](https://github.com/lerna/lerna/commit/e0a361f))
* **filter-options:** Move filterPackages logic into named export ([e863c28](https://github.com/lerna/lerna/commit/e863c28))
* **package-graph:** Throw errors when package names are not unique ([387df2b](https://github.com/lerna/lerna/commit/387df2b))
* **publish:** Allow composed version command to decide when to verify working tree ([e61aa67](https://github.com/lerna/lerna/commit/e61aa67))





<a name="3.1.1"></a>
## [3.1.1](https://github.com/lerna/lerna/compare/v3.1.0...v3.1.1) (2018-08-17)


### Bug Fixes

* **add:** Compose bootstrap to avoid extra logs ([3c534eb](https://github.com/lerna/lerna/commit/3c534eb))
* **add:** Use `pacote` to resolve third-party registry authentication woes ([a0fbf46](https://github.com/lerna/lerna/commit/a0fbf46)), closes [#1572](https://github.com/lerna/lerna/issues/1572) [#1539](https://github.com/lerna/lerna/issues/1539)





<a name="3.1.0"></a>
# [3.1.0](https://github.com/lerna/lerna/compare/v3.0.6...v3.1.0) (2018-08-17)


### Bug Fixes

* **collect-updates:** Report no changes when on a release commit ([082d876](https://github.com/lerna/lerna/commit/082d876)), closes [#1548](https://github.com/lerna/lerna/issues/1548)
* **command:** Detect composed commands more accurately ([1e51b39](https://github.com/lerna/lerna/commit/1e51b39))
* **command:** Log lerna CLI version with less ambiguity ([67494e7](https://github.com/lerna/lerna/commit/67494e7))
* **publish:** Throw errors if --canary attempted on unclean tree or tagged release ([5da0e42](https://github.com/lerna/lerna/commit/5da0e42))
* **version:** Throw errors if tree is unclean or duplicating tagged release ([d8ee1cf](https://github.com/lerna/lerna/commit/d8ee1cf))


### Features

* Create `[@lerna](https://github.com/lerna)/check-working-tree` ([98cd41f](https://github.com/lerna/lerna/commit/98cd41f))
* Create `[@lerna](https://github.com/lerna)/describe-ref` ([8c11b75](https://github.com/lerna/lerna/commit/8c11b75))





<a name="3.0.6"></a>
## [3.0.6](https://github.com/lerna/lerna/compare/v3.0.5...v3.0.6) (2018-08-16)


### Bug Fixes

* **command:** Silence goalpost logging when running a composed command ([12b4280](https://github.com/lerna/lerna/commit/12b4280))
* **create:** Use whatwg-url instead of node 8.x-dependent URL class ([8701b79](https://github.com/lerna/lerna/commit/8701b79))
* **init:** Consume lernaVersion from options, not instance property ([89e31d2](https://github.com/lerna/lerna/commit/89e31d2))
* **npm-publish:** Tip-toe around logging when emitting chunk to stdout ([c027246](https://github.com/lerna/lerna/commit/c027246))
* **version:** Pass --preid to selection prompt ([23a30a0](https://github.com/lerna/lerna/commit/23a30a0)), closes [#1214](https://github.com/lerna/lerna/issues/1214)
* **version:** Prioritize `--preid` over existing prerelease ID ([#1568](https://github.com/lerna/lerna/issues/1568)) ([f2c470a](https://github.com/lerna/lerna/commit/f2c470a))





<a name="3.0.5"></a>
## [3.0.5](https://github.com/lerna/lerna/compare/v3.0.4...v3.0.5) (2018-08-15)


### Bug Fixes

* **collect-updates:** Remove period from committish log message ([a97262c](https://github.com/lerna/lerna/commit/a97262c))
* **filter-options:** Allow --private to be configured from file ([21e134c](https://github.com/lerna/lerna/commit/21e134c))
* **global-options:** Allow --sort to be configured from file ([f4aed75](https://github.com/lerna/lerna/commit/f4aed75))
* **help:** Insert line break before describing boolean negations ([da2f886](https://github.com/lerna/lerna/commit/da2f886))
* **options:** Provide -y alias for --yes ([3ea460c](https://github.com/lerna/lerna/commit/3ea460c))
* **publish:** Add confirmation prompt before execution ([47766e5](https://github.com/lerna/lerna/commit/47766e5)), closes [#1566](https://github.com/lerna/lerna/issues/1566)
* **publish:** Get tagged packages from merge commit ([#1567](https://github.com/lerna/lerna/issues/1567)) ([fc771d9](https://github.com/lerna/lerna/commit/fc771d9))
* **version:** Log skipped publish when composed ([89645b7](https://github.com/lerna/lerna/commit/89645b7))





<a name="3.0.4"></a>
## [3.0.4](https://github.com/lerna/lerna/compare/v3.0.3...v3.0.4) (2018-08-14)


### Bug Fixes

* **publish:** Do not ping third-party registries ([42f4fdd](https://github.com/lerna/lerna/commit/42f4fdd)), closes [#1560](https://github.com/lerna/lerna/issues/1560)
* **publish:** Only pass `--json` to `npm pack` when npm >= 5.10.0 ([71babce](https://github.com/lerna/lerna/commit/71babce)), closes [#1558](https://github.com/lerna/lerna/issues/1558)
* **publish:** Run publish from leaf nodes again ([3d348ec](https://github.com/lerna/lerna/commit/3d348ec)), closes [#1560](https://github.com/lerna/lerna/issues/1560)





<a name="3.0.3"></a>
## [3.0.3](https://github.com/lerna/lerna/compare/v3.0.2...v3.0.3) (2018-08-11)


### Bug Fixes

* **publish:** Restore deprecated `--skip-npm` functionality ([cb47cb6](https://github.com/lerna/lerna/commit/cb47cb6)), closes [#1553](https://github.com/lerna/lerna/issues/1553)





<a name="3.0.2"></a>
## [3.0.2](https://github.com/lerna/lerna/compare/v3.0.1...v3.0.2) (2018-08-11)


### Bug Fixes

* **conventional-commits:** Pass --tag-version-prefix to changelog utilities ([8ed7d83](https://github.com/lerna/lerna/commit/8ed7d83))
* **conventional-commits:** Provide fallback bump when releaseType is missing ([e330f6f](https://github.com/lerna/lerna/commit/e330f6f)), closes [#1551](https://github.com/lerna/lerna/issues/1551)
* **exec:** Allow config files to override defaults ([2335149](https://github.com/lerna/lerna/commit/2335149))
* **publish:** Add default for --tag-version-prefix ([f159442](https://github.com/lerna/lerna/commit/f159442))
* **publish:** Allow disabling of registry and package verification ([0bfdff5](https://github.com/lerna/lerna/commit/0bfdff5)), closes [#1552](https://github.com/lerna/lerna/issues/1552)
* **run:** Allow config files to override defaults ([f15b6fb](https://github.com/lerna/lerna/commit/f15b6fb))
* **version:** Allow config files to override defaults ([bb1cfb5](https://github.com/lerna/lerna/commit/bb1cfb5))
* **version:** Positional bump supersedes `--conventional-commits` when choosing version ([a74c866](https://github.com/lerna/lerna/commit/a74c866))





<a name="3.0.1"></a>
## [3.0.1](https://github.com/lerna/lerna/compare/v3.0.0...v3.0.1) (2018-08-10)


### Bug Fixes

* **publish:** Allow unpublished packages to pass access verification ([3a7348c](https://github.com/lerna/lerna/commit/3a7348c))





<a name="3.0.0"></a>
# [3.0.0](https://github.com/lerna/lerna/compare/v3.0.0-rc.0...v3.0.0) (2018-08-10)


### Bug Fixes

* **add:** Always use POSIX paths when computing relative file: specifiers ([ffe354f](https://github.com/lerna/lerna/commit/ffe354f))
* **add:** Support explicit & implicit relative file: specifiers ([41f231f](https://github.com/lerna/lerna/commit/41f231f))
* **create:** Use filename without scope when generating imports from test file ([acfd48b](https://github.com/lerna/lerna/commit/acfd48b))
* **publish:** Improve `npm pack` experience ([627cfc2](https://github.com/lerna/lerna/commit/627cfc2))


### Features

* **changed:** Support list output options ([6ecdd83](https://github.com/lerna/lerna/commit/6ecdd83))
* **list:** Extract [@lerna](https://github.com/lerna)/listable utility ([bf56018](https://github.com/lerna/lerna/commit/bf56018))
* **list:** Improve scriptability with several new options ([2e204af](https://github.com/lerna/lerna/commit/2e204af))
* **npm-publish:** Add npmPack export ([088ea54](https://github.com/lerna/lerna/commit/088ea54))
* **package:** Add tarball property ([be453cd](https://github.com/lerna/lerna/commit/be453cd))
* **publish:** Run `npm pack` before `npm publish` ([8d80b2c](https://github.com/lerna/lerna/commit/8d80b2c))
* **publish:** Validate npm registry and package access prerequisites ([ebc8ba6](https://github.com/lerna/lerna/commit/ebc8ba6)), closes [#55](https://github.com/lerna/lerna/issues/55) [#1045](https://github.com/lerna/lerna/issues/1045) [#1347](https://github.com/lerna/lerna/issues/1347)
* Add [@lerna](https://github.com/lerna)/log-packed module, extracted from npm ([9c767ac](https://github.com/lerna/lerna/commit/9c767ac))
* Split `lerna version` from of `lerna publish` ([#1522](https://github.com/lerna/lerna/issues/1522)) ([8b97394](https://github.com/lerna/lerna/commit/8b97394)), closes [#277](https://github.com/lerna/lerna/issues/277) [#936](https://github.com/lerna/lerna/issues/936) [#956](https://github.com/lerna/lerna/issues/956) [#961](https://github.com/lerna/lerna/issues/961) [#1056](https://github.com/lerna/lerna/issues/1056) [#1118](https://github.com/lerna/lerna/issues/1118) [#1385](https://github.com/lerna/lerna/issues/1385) [#1483](https://github.com/lerna/lerna/issues/1483) [#1494](https://github.com/lerna/lerna/issues/1494)


### BREAKING CHANGES

* **changed:** The package names emitted to stdout are no longer prefixed by a "- ", and private packages are no longer displayed by default.
* **list:** The default output of `lerna ls` no longer shows version strings or private packages.

 * The new alias `lerna la` resembles the old output, with the addition of relative path to the package
 * The new alias `lerna ll` is a shortcut for the new `--long` option
 * A new `--parseable` option has been added to aid magical piping incantations
* * `--preid` now defaults to "alpha" during prereleases:

  The previous default for this option was undefined, which led to an awkward "1.0.1-0" result when passed to `semver.inc()`.

  The new default "alpha" yields a much more useful "1.0.1-alpha.0" result. Any previous prerelease ID will be preserved, just as it was before.

* `--no-verify` is no longer passed to `git commit` by default, but controlled by the new `--commit-hooks` option:

  The previous behavior was too overzealous, and the new option operates exactly like the corresponding [npm version](https://docs.npmjs.com/cli/version#commit-hooks) option of the same name.

  As long as your pre-commit hooks are properly scoped to ignore changes in package.json files, this change should not affect you. If that is not the case, you may pass `--no-commit-hooks` to restore the previous behavior.





<a name="3.0.0-rc.0"></a>
# [3.0.0-rc.0](https://github.com/lerna/lerna/compare/v3.0.0-beta.21...v3.0.0-rc.0) (2018-07-27)


### Bug Fixes

* **changed:** Clarify early exit log message ([b132c3a](https://github.com/lerna/lerna/commit/b132c3a))
* **cli:** Pass global defaults into option factory instead of yargs.config() ([cf4008a](https://github.com/lerna/lerna/commit/cf4008a)), closes [#1449](https://github.com/lerna/lerna/issues/1449)
* **command:** Prevent premature resolution during tests from nested commands ([151363f](https://github.com/lerna/lerna/commit/151363f))
* **core/package:** Serialize hosted git URLs with original protocol/shorthand ([60ff432](https://github.com/lerna/lerna/commit/60ff432)), closes [#1499](https://github.com/lerna/lerna/issues/1499)
* **project:** Report syntax errors in root package.json ([f674f35](https://github.com/lerna/lerna/commit/f674f35)), closes [#1452](https://github.com/lerna/lerna/issues/1452)
* **publish:** Add default description 'npm' for --npm-client ([649048c](https://github.com/lerna/lerna/commit/649048c))
* **publish:** Avoid fs-extra warning on 32-bit machines ([e908d23](https://github.com/lerna/lerna/commit/e908d23))
* **publish:** Do not leave unstaged changes with --skip-git ([2d497ed](https://github.com/lerna/lerna/commit/2d497ed))
* **publish:** Exit early when publishing w/o commits ([#1453](https://github.com/lerna/lerna/issues/1453)) ([6cbae35](https://github.com/lerna/lerna/commit/6cbae35)), closes [#773](https://github.com/lerna/lerna/issues/773)
* **publish:** Pass --repo-version argument through semver.valid() ([272e9f1](https://github.com/lerna/lerna/commit/272e9f1)), closes [#1483](https://github.com/lerna/lerna/issues/1483)
* **publish:** Update lerna.json version after root preversion lifecycle ([7b3817c](https://github.com/lerna/lerna/commit/7b3817c)), closes [#1495](https://github.com/lerna/lerna/issues/1495)
* **tests:** Special handling for Windows CI issues ([#1441](https://github.com/lerna/lerna/issues/1441)) ([1a01125](https://github.com/lerna/lerna/commit/1a01125))


### Code Refactoring

* **collect-updates:** Make argument signature explicit ([e6ba19f](https://github.com/lerna/lerna/commit/e6ba19f))
* **command:** Do not store raw packages list as instance property ([32a211a](https://github.com/lerna/lerna/commit/32a211a))


### Features

* Add description from --help summary [skip ci] ([9b65d8e](https://github.com/lerna/lerna/commit/9b65d8e))
* Count packages affected in command summary logging ([5f5e585](https://github.com/lerna/lerna/commit/5f5e585))
* **publish:** Ensure published packages contain a LICENSE file ([#1465](https://github.com/lerna/lerna/issues/1465)) ([5863564](https://github.com/lerna/lerna/commit/5863564)), closes [#1213](https://github.com/lerna/lerna/issues/1213)
* Upgrade to fs-extra 6 ([079d873](https://github.com/lerna/lerna/commit/079d873))
* **add:** Add `--exact` option to `lerna add` ([#1478](https://github.com/lerna/lerna/issues/1478)) ([346d156](https://github.com/lerna/lerna/commit/346d156)), closes [#1470](https://github.com/lerna/lerna/issues/1470)
* **cli:** Upgrade to Yargs 12 ([7899ab8](https://github.com/lerna/lerna/commit/7899ab8))
* **command:** Remove .defaultOptions() from option resolution stack ([2b27a54](https://github.com/lerna/lerna/commit/2b27a54))
* **ls:** Log number of packages listed ([855fff6](https://github.com/lerna/lerna/commit/855fff6))
* **package-graph:** Add `rawPackageList` getter ([0ad5faf](https://github.com/lerna/lerna/commit/0ad5faf))
* **project:** Move collect-packages into getPackages() method ([06b88d4](https://github.com/lerna/lerna/commit/06b88d4))
* **publish:** Add --require-scripts option to opt-in to raw JS lifecycle scripts ([054392b](https://github.com/lerna/lerna/commit/054392b))
* **publish:** Add `--amend` flag ([#1422](https://github.com/lerna/lerna/issues/1422)) ([ef5f0db](https://github.com/lerna/lerna/commit/ef5f0db))
* **run-lifecycle:** Encapsulate npm-conf with createRunner() factory ([488f98d](https://github.com/lerna/lerna/commit/488f98d))


### BREAKING CHANGES

* **publish:** External `$PKGDIR/scripts/{pre,post}publish.js` lifecycles are now opt-in instead of automatic. Pass `--require-scripts` explicitly to restore previous functionality.
* **collect-updates:** Instead of an opaque command instance, distinct positional arguments are required.
* **command:** `this.packages` no longer exists in Command subclasses, use `this.packageGraph.rawPackageList`





<a name="3.0.0-beta.21"></a>
# [3.0.0-beta.21](https://github.com/lerna/lerna/compare/v3.0.0-beta.20...v3.0.0-beta.21) (2018-05-12)


### Bug Fixes

* **child-process:** Prevent duplicate logs when any package-oriented execution fails ([d3a8128](https://github.com/lerna/lerna/commit/d3a8128))





<a name="3.0.0-beta.20"></a>
# [3.0.0-beta.20](https://github.com/lerna/lerna/compare/v3.0.0-beta.19...v3.0.0-beta.20) (2018-05-07)


### Features

* **project:** Upgrade cosmiconfig ([9acde7d](https://github.com/lerna/lerna/commit/9acde7d))
* Upgrade execa ([393b501](https://github.com/lerna/lerna/commit/393b501))





<a name="3.0.0-beta.19"></a>
# [3.0.0-beta.19](https://github.com/lerna/lerna/compare/v3.0.0-beta.18...v3.0.0-beta.19) (2018-05-03)


### Bug Fixes

* **add:** Configure `--dev` as boolean option ([#1390](https://github.com/lerna/lerna/issues/1390)) ([75b91bd](https://github.com/lerna/lerna/commit/75b91bd))
* **collect-updates:** Derive most recent tag from annotated tags only ([90df646](https://github.com/lerna/lerna/commit/90df646))
* **collect-updates:** Remove redundant short-circuit ([#1406](https://github.com/lerna/lerna/issues/1406)) ([2bcdd35](https://github.com/lerna/lerna/commit/2bcdd35))
* **publish:** Include all packages during global major bump ([#1391](https://github.com/lerna/lerna/issues/1391)) ([9cebed1](https://github.com/lerna/lerna/commit/9cebed1)), closes [#1383](https://github.com/lerna/lerna/issues/1383)


### Features

* **project:** Map deprecated config to new namespaces ([4da6318](https://github.com/lerna/lerna/commit/4da6318))


### BREAKING CHANGES

* **collect-updates:** Lightweight tags are no longer included when detecting changes since the last release.





<a name="3.0.0-beta.18"></a>
# [3.0.0-beta.18](https://github.com/lerna/lerna/compare/v3.0.0-beta.17...v3.0.0-beta.18) (2018-04-24)


### Bug Fixes

* **cli:** Exit immediately when error is caught ([5b01599](https://github.com/lerna/lerna/commit/5b01599)), closes [#1384](https://github.com/lerna/lerna/issues/1384)
* **diff:** Diff since last release in branch, _not_ most recent global tag ([9879fef](https://github.com/lerna/lerna/commit/9879fef))
* **git-utils:** Pass --no-verify to `git push` ([#1376](https://github.com/lerna/lerna/issues/1376)) ([0b88ffb](https://github.com/lerna/lerna/commit/0b88ffb)), closes [#1366](https://github.com/lerna/lerna/issues/1366)
* **git-utils:** Pass `--follow-tags` to `git push` ([6907e90](https://github.com/lerna/lerna/commit/6907e90))


### Features

* **collect-updates:** Copy remaining git utilities into module ([cb9c19d](https://github.com/lerna/lerna/commit/cb9c19d))
* **command:** Move GitUtilities.isInitialized into class method ([abecfcc](https://github.com/lerna/lerna/commit/abecfcc))
* **diff:** Move diff-only git utilities ([47dc0e2](https://github.com/lerna/lerna/commit/47dc0e2))
* Remove core/git-utils package ([48096c4](https://github.com/lerna/lerna/commit/48096c4))
* **filters:** Add `--include-filtered-dependents` flag ([#1393](https://github.com/lerna/lerna/issues/1393)) ([2838260](https://github.com/lerna/lerna/commit/2838260))
* **git-utils:** Devolve getCurrentSHA() to consumers ([ecbc1d3](https://github.com/lerna/lerna/commit/ecbc1d3))
* **git-utils:** Devolve getShortSHA() to consumers ([95d179d](https://github.com/lerna/lerna/commit/95d179d))
* **import:** Inline GitUtilities.getWorkspaceRoot() ([925080e](https://github.com/lerna/lerna/commit/925080e))
* **init:** Inline GitUtilities.init() ([6e401e1](https://github.com/lerna/lerna/commit/6e401e1))
* **publish:** Move publish-only git utilities ([5594749](https://github.com/lerna/lerna/commit/5594749))


### BREAKING CHANGES

* **cli:** Previously, lerna would accept `--scope` and `--ignore` options where they were not intended,
despite logging the unexpected arguments correctly. This would result in the commands continuing to run with unexpected configuration.

Going forward, lerna will exit non-zero _immediately_ upon encountering these errors.
* `@lerna/git-utils` is gone. Don't use it.
* **collect-updates:** GitUtilities is going away soon.
* **diff:** Don't use GitUtilities.
* **git-utils:** Don't use GitUtilities!
* **git-utils:** Don't use GitUtilities.
* **import:** GitUtilities.getWorkspaceRoot no longer exists. You shouldn't be using GitUtilities.
* **init:** GitUtilities.init() no longer exists. You shouldn't be using GitUtilities.
* **command:** GitUtilities.isInitialized no longer exists. You shouldn't be using GitUtilities.
* **publish:** Many named exports of GitUtilities are no longer provided. Don't use GitUtilities, it's a bad pattern.





<a name="3.0.0-beta.17"></a>
# [3.0.0-beta.17](https://github.com/lerna/lerna/compare/v3.0.0-beta.16...v3.0.0-beta.17) (2018-04-13)


### Bug Fixes

* **bootstrap:** Pass npm-conf to feature predicate instead of directly reading process.env ([b4af3c9](https://github.com/lerna/lerna/commit/b4af3c9))
* **bootstrap:** Pluralize log text ([#1232](https://github.com/lerna/lerna/issues/1232)) ([5c74760](https://github.com/lerna/lerna/commit/5c74760))
* **package:** Resolve correct relative spec ([ec2b8f5](https://github.com/lerna/lerna/commit/ec2b8f5))


### Features

* **add:** Use directory globs to filter targeted packages ([39fa7b6](https://github.com/lerna/lerna/commit/39fa7b6))
* **link:** Add 'convert' subcommand to aid migration to local file: specifiers ([f59bf3c](https://github.com/lerna/lerna/commit/f59bf3c))


### BREAKING CHANGES

* **add:** `lerna add` now only supports adding one dependency at a time. It is much more valuable to filter by directory globs, anyway.





<a name="3.0.0-beta.16"></a>
# [3.0.0-beta.16](https://github.com/lerna/lerna/compare/v3.0.0-beta.15...v3.0.0-beta.16) (2018-04-10)


### Bug Fixes

* **import:** Rebase patch copies, too ([f6bae80](https://github.com/lerna/lerna/commit/f6bae80))





<a name="3.0.0-beta.15"></a>
# [3.0.0-beta.15](https://github.com/lerna/lerna/compare/v3.0.0-beta.14...v3.0.0-beta.15) (2018-04-09)


### Bug Fixes

* **project:** Pin --exact require-from-string v2.0.1 to avoid integrity error with v2.0.2 ([32a38ad](https://github.com/lerna/lerna/commit/32a38ad))
* **publish:** Allow tag check to fail with strong warning ([#1355](https://github.com/lerna/lerna/issues/1355)) ([f5268cd](https://github.com/lerna/lerna/commit/f5268cd))


### Features

* **bootstrap:** Use `npm ci` with `--ci` option ([#1360](https://github.com/lerna/lerna/issues/1360)) ([d7e33c6](https://github.com/lerna/lerna/commit/d7e33c6))
* **conventional-commits:** Support local file presets ([a1bff40](https://github.com/lerna/lerna/commit/a1bff40))





<a name="3.0.0-beta.14"></a>
# [3.0.0-beta.14](https://github.com/lerna/lerna/compare/v3.0.0-beta.13...v3.0.0-beta.14) (2018-04-03)


### Bug Fixes

* **create:** Actually publish the module data helper ([4775cc4](https://github.com/lerna/lerna/commit/4775cc4))
* **logging:** Log failures from package scripts once, not twice ([436cfe1](https://github.com/lerna/lerna/commit/436cfe1))
* **publish:** Ensure optionalDependencies are updated during publish to registry ([559b731](https://github.com/lerna/lerna/commit/559b731))





<a name="3.0.0-beta.13"></a>
# [3.0.0-beta.13](https://github.com/lerna/lerna/compare/v3.0.0-beta.12...v3.0.0-beta.13) (2018-03-31)


### Bug Fixes

* **child-process:** Do not merge lines of streaming stderr ([59dc2d4](https://github.com/lerna/lerna/commit/59dc2d4)), closes [#994](https://github.com/lerna/lerna/issues/994)
* Use ValidationError instead of Error ([bea6bc3](https://github.com/lerna/lerna/commit/bea6bc3))
* **run:** Exit early when no packages contain the targeted lifecycle ([c8a5526](https://github.com/lerna/lerna/commit/c8a5526))


### Features

* Enable progress bars only when necessary ([b766c83](https://github.com/lerna/lerna/commit/b766c83))





<a name="3.0.0-beta.12"></a>
# [3.0.0-beta.12](https://github.com/lerna/lerna/compare/v3.0.0-beta.11...v3.0.0-beta.12) (2018-03-30)


### Bug Fixes

* **create:** Silently ignore missing builtin npmrc ([1523520](https://github.com/lerna/lerna/commit/1523520)), closes [#1353](https://github.com/lerna/lerna/issues/1353)
* **npm-conf:** Replace env vars even in config keys ([3c9a5de](https://github.com/lerna/lerna/commit/3c9a5de))


### Features

* **package:** Add `serialize()` method ([fdec3ac](https://github.com/lerna/lerna/commit/fdec3ac))
* **package:** Add Map-like get/set methods, remove raw json getter ([707d1f0](https://github.com/lerna/lerna/commit/707d1f0))
* **project:** Merge `package` and `packageJson` into `manifest` ([9a47ff7](https://github.com/lerna/lerna/commit/9a47ff7))
* Add --no-prefix for streaming output ([#1352](https://github.com/lerna/lerna/issues/1352)) ([36c1fad](https://github.com/lerna/lerna/commit/36c1fad))


### BREAKING CHANGES

* **package:** The `Package` class no longer provides direct access to the JSON object
used to construct the instance. Map-like `get()`/`set(val)` methods are
available to modify the internal representation.





<a name="3.0.0-beta.11"></a>
# [3.0.0-beta.11](https://github.com/lerna/lerna/compare/v3.0.0-beta.10...v3.0.0-beta.11) (2018-03-29)


### Bug Fixes

* **exec:** Clarify --no-bail option ([6e4c6fd](https://github.com/lerna/lerna/commit/6e4c6fd))
* **publish:** Write temporary annotations once, not repeatedly ([6abae76](https://github.com/lerna/lerna/commit/6abae76))


### Features

* **bootstrap:** Inherit stdio during root-only install ([fd8c391](https://github.com/lerna/lerna/commit/fd8c391))
* **bootstrap:** Short-circuit when local file: specifiers are detected in the root ([d8a8f03](https://github.com/lerna/lerna/commit/d8a8f03))
* **child-process:** Allow exec() opts.stdio override ([fd84013](https://github.com/lerna/lerna/commit/fd84013))
* **npm-install:** Allow opts.stdio override ([4ba5e74](https://github.com/lerna/lerna/commit/4ba5e74))
* Execute atomic publish lifecycle during lerna publish ([#1348](https://github.com/lerna/lerna/issues/1348)) ([45efa24](https://github.com/lerna/lerna/commit/45efa24))
* Support `optionalDependencies` ([b73e19d](https://github.com/lerna/lerna/commit/b73e19d)), closes [#121](https://github.com/lerna/lerna/issues/121)
* **npm-run-script:** Accept opts.reject ([7c5a791](https://github.com/lerna/lerna/commit/7c5a791))
* **run:** Add --no-bail option ([893fcc8](https://github.com/lerna/lerna/commit/893fcc8)), closes [#1351](https://github.com/lerna/lerna/issues/1351)





<a name="3.0.0-beta.10"></a>
# [3.0.0-beta.10](https://github.com/lerna/lerna/compare/v3.0.0-beta.9...v3.0.0-beta.10) (2018-03-27)


### Bug Fixes

* **add:** Use bootstrap factory, not handler ([dbfc891](https://github.com/lerna/lerna/commit/dbfc891))


### Features

* **commands:** Delay require of command instantiation ([a1284f3](https://github.com/lerna/lerna/commit/a1284f3))
* **project:** Inherit configuration with yargs-like "extends" ([0b28ef5](https://github.com/lerna/lerna/commit/0b28ef5)), closes [#1281](https://github.com/lerna/lerna/issues/1281)


### BREAKING CHANGES

* **commands:** The default export of command packages is now a factory, not the subclass (which is now a named export).





<a name="3.0.0-beta.9"></a>
# [3.0.0-beta.9](https://github.com/lerna/lerna/compare/v3.0.0-beta.8...v3.0.0-beta.9) (2018-03-24)


### Bug Fixes

* **filter-options:** Move include/exclude validation into filter-packages ([503251d](https://github.com/lerna/lerna/commit/503251d))
* **git-utils:** Remove unused methods, stop mocking tests ([3e00d7a](https://github.com/lerna/lerna/commit/3e00d7a))
* **publish:** Split `--skip-*` properly, leave working tree clean ([5b4b2c9](https://github.com/lerna/lerna/commit/5b4b2c9))


### Features

* **command:** Remove legacy config handling ([d305a38](https://github.com/lerna/lerna/commit/d305a38))
* **command:** Rename this.repository -> this.project ([43e98a0](https://github.com/lerna/lerna/commit/43e98a0))
* **project:** Normalize config.commands -> config.command ([24e55e3](https://github.com/lerna/lerna/commit/24e55e3))
* **project:** Use cosmiconfig to locate and read lerna.json ([b8c2789](https://github.com/lerna/lerna/commit/b8c2789))


### BREAKING CHANGES

* **publish:** Previously, gitHead annotations were leftover if `--skip-npm` was passed,
despite no actual requirement for that property when no publishing is going on.

Now, all publish-related operations are truly skipped with `--skip-npm`,
and all git commit/push-related operations are skipped with `--skip-git`.
Passing `--skip-npm` will now also always push to remote, which represents
a breaking change from 2.x behavior.

Thanks @KingScooty for raising the issue!
* **command:** lerna.json `bootstrapConfig` and `publishConfig` namespaces are no longer honored.
These config blocks should be moved to `command.bootstrap` and `command.publish`, respectively.





<a name="3.0.0-beta.8"></a>
# [3.0.0-beta.8](https://github.com/lerna/lerna/compare/v3.0.0-beta.7...v3.0.0-beta.8) (2018-03-22)


### Bug Fixes

* **add:** Support tag and version specifiers ([5df0fc8](https://github.com/lerna/lerna/commit/5df0fc8)), closes [#1306](https://github.com/lerna/lerna/issues/1306)
* **create:** Skip repository property when git remote is missing ([98c8be6](https://github.com/lerna/lerna/commit/98c8be6))


### Features

* **init:** Improve ex-nihilo output ([7b80e07](https://github.com/lerna/lerna/commit/7b80e07))
* **npm-conf:** Add get/setCredentialsByURI() methods ([ad20d8a](https://github.com/lerna/lerna/commit/ad20d8a))
* **utils:** Add "vendored" npm-conf ([9c24a25](https://github.com/lerna/lerna/commit/9c24a25))
* **utils:** Add [@lerna](https://github.com/lerna)/map-to-registry ([ce72828](https://github.com/lerna/lerna/commit/ce72828))





<a name="3.0.0-beta.7"></a>
# [3.0.0-beta.7](https://github.com/lerna/lerna/compare/v3.0.0-beta.6...v3.0.0-beta.7) (2018-03-20)


### Bug Fixes

* **cli:** Retrieve correct version ([bb2c5e8](https://github.com/lerna/lerna/commit/bb2c5e8))





<a name="3.0.0-beta.6"></a>
# [3.0.0-beta.6](https://github.com/lerna/lerna/compare/v3.0.0-beta.5...v3.0.0-beta.6) (2018-03-19)

**Note:** Version bump only for package lerna





<a name="3.0.0-beta.5"></a>
# [3.0.0-beta.5](https://github.com/lerna/lerna/compare/v3.0.0-beta.4...v3.0.0-beta.5) (2018-03-19)


### Bug Fixes

* **bootstrap:** Move --hoist/--nohoist coerce into class ([8877aa0](https://github.com/lerna/lerna/commit/8877aa0)), closes [#1337](https://github.com/lerna/lerna/issues/1337)





<a name="3.0.0-beta.4"></a>
# [3.0.0-beta.4](https://github.com/lerna/lerna/compare/v3.0.0-beta.3...v3.0.0-beta.4) (2018-03-19)


### Bug Fixes

* **clean-stack:** Try to avoid causing errors during error cleanup ([89f9d3b](https://github.com/lerna/lerna/commit/89f9d3b))
* Respect durable hoist configuration ([2081640](https://github.com/lerna/lerna/commit/2081640)), closes [#1325](https://github.com/lerna/lerna/issues/1325)
* Use correct instance property override ([9249221](https://github.com/lerna/lerna/commit/9249221))


### Features

* Add `lerna create` command ([#1326](https://github.com/lerna/lerna/issues/1326)) ([f15b224](https://github.com/lerna/lerna/commit/f15b224))





<a name="3.0.0-beta.3"></a>
# [3.0.0-beta.3](https://github.com/lerna/lerna/compare/v3.0.0-beta.2...v3.0.0-beta.3) (2018-03-15)


### Bug Fixes

* **utils:** Use safe relative path when calling git diff ([#1323](https://github.com/lerna/lerna/issues/1323)) ([619c477](https://github.com/lerna/lerna/commit/619c477))
* ci option should not be visible in help output ([580b2d5](https://github.com/lerna/lerna/commit/580b2d5))
* fs-extra dependency is a caret range, not exact ([81556d0](https://github.com/lerna/lerna/commit/81556d0))


### Features

* Check for upstream changes before attempting to publish ([#1317](https://github.com/lerna/lerna/issues/1317)) ([cef0a69](https://github.com/lerna/lerna/commit/cef0a69))
* **cli:** Set config.ci from env var ([5452293](https://github.com/lerna/lerna/commit/5452293))
* **global-options:** Add hidden `ci` option ([86a4d65](https://github.com/lerna/lerna/commit/86a4d65))
* Upstream changes warn in CI, throw locally ([4de055d](https://github.com/lerna/lerna/commit/4de055d)), closes [#1177](https://github.com/lerna/lerna/issues/1177) [#1317](https://github.com/lerna/lerna/issues/1317)
* **publish:** Add logging when `--skip-git` or `--skip-npm` are passed ([#1319](https://github.com/lerna/lerna/issues/1319)) ([8eef9ff](https://github.com/lerna/lerna/commit/8eef9ff))





<a name="3.0.0-beta.2"></a>
# [3.0.0-beta.2](https://github.com/lerna/lerna/compare/v3.0.0-beta.1...v3.0.0-beta.2) (2018-03-10)


### Bug Fixes

* Move `@lerna/has-dependency-installed` into `commands/bootstrap/lib` ([c09ccbd](https://github.com/lerna/lerna/commit/c09ccbd))

### Features

* Rename `@lerna/fs-utils` => `@lerna/rimraf-dir` ([30451ed](https://github.com/lerna/lerna/commit/30451ed))
* Replace `@lerna/fs-utils` dependency with `fs-extra` ([9c35a86](https://github.com/lerna/lerna/commit/9c35a86))
* Replace `@lerna/match-package-name` with `multimatch` ([423f82c](https://github.com/lerna/lerna/commit/423f82c))
* **filter-packages:** Simplify method signature ([47e1c86](https://github.com/lerna/lerna/commit/47e1c86))


### BREAKING CHANGES

* **filter-packages:** The parameters to `filterPackages()` have changed:
  * Two lists (`include`, `exclude`) have replaced the destructured config object





<a name="3.0.0-beta.1"></a>
# [3.0.0-beta.1](https://github.com/lerna/lerna/compare/v3.0.0-beta.0...v3.0.0-beta.1) (2018-03-09)


### Bug Fixes

* **conventional-commits:** output version bump message closer to version heading ([64916d6](https://github.com/lerna/lerna/commit/64916d6))
* **filter-options:** require a git repo when using --since ([d21b66e](https://github.com/lerna/lerna/commit/d21b66e)), closes [#822](https://github.com/lerna/lerna/issues/822)
* **init:** lerna init does not, in fact, require git ([d1d69c7](https://github.com/lerna/lerna/commit/d1d69c7))
* **publish:** Checkout manifest changes serially ([ce4a4b1](https://github.com/lerna/lerna/commit/ce4a4b1))
* **publish:** default root manifest name when missing ([a504d7e](https://github.com/lerna/lerna/commit/a504d7e)), closes [#1305](https://github.com/lerna/lerna/issues/1305)
* **publish:** guard against undefined tag ([d8ce253](https://github.com/lerna/lerna/commit/d8ce253)), closes [#1311](https://github.com/lerna/lerna/issues/1311)
* **publish:** Respect pkg.publishConfig.tag ([04b256a](https://github.com/lerna/lerna/commit/04b256a)), closes [#1311](https://github.com/lerna/lerna/issues/1311)
* **publish:** work around yarn "link:" intransigency ([ddfb517](https://github.com/lerna/lerna/commit/ddfb517))

### Features

* **collect-packages:** simplify signature ([39170cf](https://github.com/lerna/lerna/commit/39170cf))
* **diff:** filter diff output with --ignore-changes ([c27c2e0](https://github.com/lerna/lerna/commit/c27c2e0))
* **filter-options:** Exclude private packages with --no-private ([6674d18](https://github.com/lerna/lerna/commit/6674d18))


### BREAKING CHANGES

* **collect-packages:** Formerly a config object, it is now two parameters, only the first of
which (rootPath) is required. The second parameter is a list of package
location globs, defaulting to lerna's default of `["packages/*"]`.





## v3.0.0-beta.0 (2018-03-07)

This is the first `lerna` release published by `lerna` itself. :tada:

#### :boom: Breaking Change

* [#1307](https://github.com/lerna/lerna/pull/1307) Convert `lerna/lerna` into a `lerna`-based monorepo. ([@evocateur](https://github.com/evocateur))

* **Rename `lerna publish` flag `--ignore` to `--ignore-changes`** ([8c92956](https://github.com/lerna/lerna/commit/8c92956))

  This resolves previous ambiguity as to what exactly was intended by the "ignore" config for lerna publish,
  which was _not_ intended to be identical to the filtering option `--ignore`.

  The old option will still work when found in `lerna.json` config, but it is recommended to migrate to the
  new option name to ensure future compatibility.

#### :rocket: Enhancement

* [#1310](https://github.com/lerna/lerna/pull/1310) Add gitHead property to package.json before publish. ([@evocateur](https://github.com/evocateur))

#### Committers: 1

* Daniel Stockman ([evocateur](https://github.com/evocateur))

## v3.0.0-alpha.3 (2018-03-03)

#### :bug: Bug Fix

* [#1302](https://github.com/lerna/lerna/pull/1302) Use npm-lifecycle to run solitary lifecycle phases. ([@evocateur](https://github.com/evocateur))

#### :nail_care: Polish

* [#1300](https://github.com/lerna/lerna/pull/1300) Disable all non-error logging when stdout is piped. ([@evocateur](https://github.com/evocateur))

#### Committers: 1

* Daniel Stockman ([evocateur](https://github.com/evocateur))

## v3.0.0-alpha.2 (2018-03-02)

#### :bug: Bug Fix

* Sort packages correctly ([2ead3107](https://github.com/lerna/lerna/commit/2ead3107))
* Don't resolve relative links in private packages ([04760f38](https://github.com/lerna/lerna/commit/04760f38))

#### :nail_care: Polish

* Disable progress in commands that only output lists ([e91c9f2c](https://github.com/lerna/lerna/commit/e91c9f2c))

## v3.0.0-alpha.1 (2018-02-28)

#### :boom: Breaking Change

* [#1278](https://github.com/lerna/lerna/pull/1278) Add universal hosted git URL support. ([@evocateur](https://github.com/evocateur))
* [#1289](https://github.com/lerna/lerna/pull/1289) Convert command lifecycle from callbacks to Promises. ([@evocateur](https://github.com/evocateur))
* [#1290](https://github.com/lerna/lerna/pull/1290) Preserve package.json structure during bootstrap mangling. ([@evocateur](https://github.com/evocateur))
  Thanks to [@compulim](https://github.com/compulim) for the initial PR!

#### :house: Internal

* [#1271](https://github.com/lerna/lerna/pull/1271) Split symlink methods out of FileSystemUtilities. ([@evocateur](https://github.com/evocateur), [@compulim](https://github.com/compulim))
* Tons of other refactoring afoot! Check out [this diff](https://github.com/lerna/lerna/compare/v3.0.0-alpha.0...v3.0.0-alpha.1).

#### Committers: 1

* Daniel Stockman ([evocateur](https://github.com/evocateur))

## v3.0.0-alpha.0 (2018-02-14)

#### :boom: Breaking Change

* [`#1122`](https://github.com/lerna/lerna/pull/1122) Use local lerna if available. ([@marionebl](https://github.com/marionebl))
* [`#1207`](https://github.com/lerna/lerna/pull/1207) Refactor command superclass and yargs handlers. ([@evocateur](https://github.com/evocateur))
* [`#1208`](https://github.com/lerna/lerna/pull/1208) Use CommonJS. ([@evocateur](https://github.com/evocateur))
* [`#1209`](https://github.com/lerna/lerna/pull/1209) Drop support for node v4. ([@evocateur](https://github.com/evocateur))
* [`#1211`](https://github.com/lerna/lerna/pull/1211) Bump major versions of dependencies. ([@evocateur](https://github.com/evocateur))
* [`#1225`](https://github.com/lerna/lerna/pull/1225) Remove lerna.json compatibility check. ([@evocateur](https://github.com/evocateur))
* [`#1226`](https://github.com/lerna/lerna/pull/1226) Remove all deprecated validations. ([@evocateur](https://github.com/evocateur))
* [`#1234`](https://github.com/lerna/lerna/pull/1234) Upgrade to yargs 11. ([@evocateur](https://github.com/evocateur))

#### :rocket: Enhancement

* [`#1212`](https://github.com/lerna/lerna/pull/1212) Throw friendly error when workspaces are not configured correctly. ([@craigbilner](https://github.com/craigbilner))
* [`#1227`](https://github.com/lerna/lerna/pull/1227) Add `--ignore-scripts` flag to bootstrap command. ([@Andarist](https://github.com/Andarist))
* [`#1254`](https://github.com/lerna/lerna/pull/1254) Add support for new yarn workspaces config format. ([@detrohutt](https://github.com/detrohutt))
* [`#1261`](https://github.com/lerna/lerna/pull/1261) Refactor publish command to be 98% async. ([@evocateur](https://github.com/evocateur))
* [`#1262`](https://github.com/lerna/lerna/pull/1262) Rewrite npm5 `file:` links during publish. ([@evocateur](https://github.com/evocateur))

#### :bug: Bug Fix

* [`#1219`](https://github.com/lerna/lerna/pull/1219) Avoid triggering pre-commit and commitmsg hooks during publish. ([@alan-agius4](https://github.com/alan-agius4))
* [`#1220`](https://github.com/lerna/lerna/pull/1220) Remove `--no-gpg-sign` from `git commit`. ([@evocateur](https://github.com/evocateur))

#### :memo: Documentation

* [`#1248`](https://github.com/lerna/lerna/pull/1248) Document another potential cause of git initialization failure. ([@fritz-c](https://github.com/fritz-c))
* [`#1250`](https://github.com/lerna/lerna/pull/1250) Add guide for debugging Jest tests with VS Code. ([@millermatt](https://github.com/millermatt))

#### :house: Internal

* [`#1210`](https://github.com/lerna/lerna/pull/1210) Upgrade to Jest v22. ([@evocateur](https://github.com/evocateur))
* [`#1224`](https://github.com/lerna/lerna/pull/1224) Remove explicit `glob` dependency in favor of `globby`. ([@wtgtybhertgeghgtwtg](https://github.com/wtgtybhertgeghgtwtg))
* [`#1260`](https://github.com/lerna/lerna/pull/1260) `PackageGraph` is a `Map`, its nodes store relationships in a `Set`. ([@evocateur](https://github.com/evocateur))
* [`#1266`](https://github.com/lerna/lerna/pull/1266) Split `PackageUtilities` into smaller files. ([@evocateur](https://github.com/evocateur))
* [`#1267`](https://github.com/lerna/lerna/pull/1267) Split `NpmUtilities` into smaller files. ([@evocateur](https://github.com/evocateur))

#### Committers: 9

* Alan Agius ([alan-agius4](https://github.com/alan-agius4))
* Alexander Roberts ([detrohutt](https://github.com/detrohutt))
* Craig Bilner ([craigbilner](https://github.com/craigbilner))
* Daniel Stockman ([evocateur](https://github.com/evocateur))
* Fritz ([fritz-c](https://github.com/fritz-c))
* Mario Nebl ([marionebl](https://github.com/marionebl))
* Mateusz Burzyński ([Andarist](https://github.com/Andarist))
* Matt Miller ([millermatt](https://github.com/millermatt))
* [wtgtybhertgeghgtwtg](https://github.com/wtgtybhertgeghgtwtg)

## v2.7.2 (2018-01-16)

#### :rocket: Enhancement

* [#1205](https://github.com/lerna/lerna/pull/1205) Add %v as placeholder for raw version in `--message`. ([@mojavelinux](https://github.com/mojavelinux))

#### :bug: Bug Fix

* [#1206](https://github.com/lerna/lerna/pull/1206) Avoid dropping early logs below default level. ([@evocateur](https://github.com/evocateur))

#### Committers: 2

* Dan Allen ([mojavelinux](https://github.com/mojavelinux))
* Daniel Stockman ([evocateur](https://github.com/evocateur))

## v2.7.1 (2018-01-16)

#### :bug: Bug Fix

* [#1194](https://github.com/lerna/lerna/pull/1194) Treat 'lerna run test' like any other command. ([@tkrotoff](https://github.com/tkrotoff))
* [#1199](https://github.com/lerna/lerna/pull/1199) Fix import command so it works if Lerna root is a subdir of git root. ([@RoystonS](https://github.com/RoystonS))
* [#1204](https://github.com/lerna/lerna/pull/1204) Avoid interactive prompt during yarn publish. ([@evocateur](https://github.com/evocateur))

#### Committers: 3

* Daniel Stockman ([evocateur](https://github.com/evocateur))
* Royston Shufflebotham ([RoystonS](https://github.com/RoystonS))
* Tanguy Krotoff ([tkrotoff](https://github.com/tkrotoff))

## v2.7.0 (2018-01-12)

#### :rocket: Enhancement

* [#1140](https://github.com/lerna/lerna/pull/1140) Warn user and exit non-zero if command is invalid. ([@cezaraugusto](https://github.com/cezaraugusto))
* [#1145](https://github.com/lerna/lerna/pull/1145) run/publish: Use npmClient instead of hardcoded npm. ([@oreporan](https://github.com/oreporan))
* [#1149](https://github.com/lerna/lerna/pull/1149) Add support for root-level version lifecycle. ([@bigtimebuddy](https://github.com/bigtimebuddy))

#### :bug: Bug Fix

* [#1187](https://github.com/lerna/lerna/pull/1187) Completely ignore peerDependencies during publish. ([@evocateur](https://github.com/evocateur))
* [#1193](https://github.com/lerna/lerna/pull/1193) Throw error when lerna.json or package.json have invalid syntax. ([@evocateur](https://github.com/evocateur))

#### :memo: Documentation

* [#1164](https://github.com/lerna/lerna/pull/1164) docs: replace "command" with "commands" to avoid ambiguity. ([@fengyuanchen](https://github.com/fengyuanchen))
* [#1186](https://github.com/lerna/lerna/pull/1186) docs: 📇 Add private registry tips to troubleshooting.md. ([@frankstallone](https://github.com/frankstallone))

#### :house: Internal

* [#1188](https://github.com/lerna/lerna/pull/1188) Prettier. ([@evocateur](https://github.com/evocateur))

#### Committers: 7

* Alan Agius ([alan-agius4](https://github.com/alan-agius4))
* Cezar Augusto ([cezaraugusto](https://github.com/cezaraugusto))
* Chen Fengyuan ([fengyuanchen](https://github.com/fengyuanchen))
* Daniel Stockman ([evocateur](https://github.com/evocateur))
* Frank Stallone ([frankstallone](https://github.com/frankstallone))
* Matt Karl ([bigtimebuddy](https://github.com/bigtimebuddy))
* Ore Poran ([oreporan](https://github.com/oreporan))

## v2.6.0 (2018-01-08)

Happy 2018! :tada:

#### :rocket: Enhancement

* [#1110](https://github.com/lerna/lerna/pull/1110) Add `--stream` option to `lerna exec`. ([@alan-agius4](https://github.com/alan-agius4))
* [#1111](https://github.com/lerna/lerna/pull/1111) Add `--changelog-preset` option to customize `--conventional-commits` output. ([@alan-agius4](https://github.com/alan-agius4))

#### :bug: Bug Fix

* [#1134](https://github.com/lerna/lerna/pull/1134) Normalize path used for `git add` in respect to OS/environment. ([@zenflow](https://github.com/zenflow))
* [#1129](https://github.com/lerna/lerna/pull/1129) Throw error in bootstrap when Yarn workspaces is misconfigured. ([@evocateur](https://github.com/evocateur))
* [#1101](https://github.com/lerna/lerna/pull/1101) Set chmod for linked binaries. ([@marionebl](https://github.com/marionebl))
* [#1112](https://github.com/lerna/lerna/pull/1112) Use all `packages` locations when resetting canary changes. ([@jwickens](https://github.com/jwickens))
* [#1115](https://github.com/lerna/lerna/pull/1115) Keep non-patch subject parts when importing repository. ([@koenpunt](https://github.com/koenpunt))

#### :memo: Documentation

* [#1139](https://github.com/lerna/lerna/pull/1139) add docs on how to publish scoped packages. ([@cezaraugusto](https://github.com/cezaraugusto))
* [#1108](https://github.com/lerna/lerna/pull/1108) Minor typo fix in hoist.md. ([@tdmalone](https://github.com/tdmalone))
* [#1166](https://github.com/lerna/lerna/pull/1166) fix: typo in README.md "in in". ([@vladgolubev](https://github.com/vladgolubev))
* [#1176](https://github.com/lerna/lerna/pull/1176) Fix typo in README.md. ([@LoicPoullain](https://github.com/LoicPoullain))

#### Committers: 10

* Alan Agius ([alan-agius4](https://github.com/alan-agius4))
* Cezar Augusto ([cezaraugusto](https://github.com/cezaraugusto))
* Daniel Stockman ([evocateur](https://github.com/evocateur))
* Jonathan R Wickens ([jwickens](https://github.com/jwickens))
* Koen Punt ([koenpunt](https://github.com/koenpunt))
* Loïc Poullain ([LoicPoullain](https://github.com/LoicPoullain))
* Mario Nebl ([marionebl](https://github.com/marionebl))
* Matthew Francis Brunetti ([zenflow](https://github.com/zenflow))
* Tim Malone ([tdmalone](https://github.com/tdmalone))
* Vlad Holubiev ([vladgolubev](https://github.com/vladgolubev))

## v2.5.1 (2017-11-01)

A quick bugfix for an overlooked case in `lerna add`.

#### :bug: Bug Fix

* [#1100](https://github.com/lerna/lerna/pull/1100) Preserve existing deps with lerna add. ([@marionebl](https://github.com/marionebl))

#### Committers: 1

* Mario Nebl ([marionebl](https://github.com/marionebl))

## v2.5.0 (2017-11-01)

A new command (`lerna add`), new flags for bootstrap and link commands, and a much-improved experience when publishing "final" releases after a series of prereleases!

#### :rocket: Enhancement

* [#1069](https://github.com/lerna/lerna/pull/1069) Implement `lerna add <pkg>[@version] [--dev]`. ([@marionebl](https://github.com/marionebl))
* [#1077](https://github.com/lerna/lerna/pull/1077) Republish prereleased packages during subsequent non-prerelease publish. ([@spudly](https://github.com/spudly))
* [#1078](https://github.com/lerna/lerna/pull/1078) Generate root changelog in fixed mode. ([@ZauberNerd](https://github.com/ZauberNerd))
* [#1081](https://github.com/lerna/lerna/pull/1081) Warn during bootstrap when two or more packages have the same package.json name. ([@amfio](https://github.com/amfio))
* [#1082](https://github.com/lerna/lerna/pull/1082) Add --force-local to link command. ([@jiverson](https://github.com/jiverson))
* [#1087](https://github.com/lerna/lerna/pull/1087) Add --reject-cycles to bootstrap, logging packages when found. ([@mitchhentges](https://github.com/mitchhentges))

#### :bug: Bug Fix

* [#1059](https://github.com/lerna/lerna/pull/1059) Improve "import" edgecases + (i18n fixes + git tweaks). ([@swernerx](https://github.com/swernerx))
* [#1063](https://github.com/lerna/lerna/pull/1063) Fail when --hoist and --yarn are used together. ([@marionebl](https://github.com/marionebl))
* [#1083](https://github.com/lerna/lerna/pull/1083) Fixed diffing on Windows. ([@the0neWhoKnocks](https://github.com/the0neWhoKnocks))

#### :memo: Documentation

* [#1062](https://github.com/lerna/lerna/pull/1062) Fix README typo. ([@imagentleman](https://github.com/imagentleman))

#### :house: Internal

* [#1080](https://github.com/lerna/lerna/pull/1080) Add test for skipping empty patches during import --flatten. ([@gyoshev](https://github.com/gyoshev))
* [#1092](https://github.com/lerna/lerna/pull/1092) Make integration tests less flaky on Windows. ([@evocateur](https://github.com/evocateur))

#### Committers: 11

* Alex Gyoshev ([gyoshev](https://github.com/gyoshev))
* Alexander Field ([amfio](https://github.com/amfio))
* Björn Brauer ([ZauberNerd](https://github.com/ZauberNerd))
* Daniel Stockman ([evocateur](https://github.com/evocateur))
* Josh Iverson ([jiverson](https://github.com/jiverson))
* José Antonio Chio ([imagentleman](https://github.com/imagentleman))
* Mario Nebl ([marionebl](https://github.com/marionebl))
* Mitchell Hentges ([mitchhentges](https://github.com/mitchhentges))
* Sebastian Werner ([swernerx](https://github.com/swernerx))
* Stephen John Sorensen ([spudly](https://github.com/spudly))
* [the0neWhoKnocks](https://github.com/the0neWhoKnocks)

## v2.4.0 (2017-10-05)

I inadvertently made `lerna bootstrap --hoist` really slow in v2.3.0, so that's fixed. Big thanks to all the contributors!

#### :rocket: Enhancement

* [#1033](https://github.com/lerna/lerna/pull/1033) Add support for git-hosted urls as sibling package dependencies. ([@gustaff-weldon](https://github.com/gustaff-weldon))

#### :bug: Bug Fix

* [#1044](https://github.com/lerna/lerna/pull/1044) Throw publish validation errors before version selection. ([@evocateur](https://github.com/evocateur))
* [#1047](https://github.com/lerna/lerna/pull/1047) Remove git requirement from link command. ([@jiverson](https://github.com/jiverson))
* [#1051](https://github.com/lerna/lerna/pull/1051) When hoisting, only install with --global-style in leaf nodes, not root. ([@evocateur](https://github.com/evocateur))
* [#1054](https://github.com/lerna/lerna/pull/1054) Set `process.exitCode` instead of calling `process.exit(code)`. ([@evocateur](https://github.com/evocateur))

#### :nail_care: Polish

* [#1048](https://github.com/lerna/lerna/pull/1048) Clean up code missed by lint settings. ([@jiverson](https://github.com/jiverson))
* [#1052](https://github.com/lerna/lerna/pull/1052) Truncate stack (or pass directly) when logging errors. ([@evocateur](https://github.com/evocateur))

#### :memo: Documentation

* [#1042](https://github.com/lerna/lerna/pull/1042) Update workspace document. ([@nhducit](https://github.com/nhducit))

#### Committers: 4

* Daniel Stockman ([evocateur](https://github.com/evocateur))
* Good stuff and well done! ([gustaff-weldon](https://github.com/gustaff-weldon))
* Josh Iverson ([jiverson](https://github.com/jiverson))
* nhducit ([nhducit](https://github.com/nhducit))

## v2.3.1 (2017-10-03)

This is what happens when you forget to pull from upstream before publishing.

#### :nail_care: Polish

* [#1025](https://github.com/lerna/lerna/pull/1025) Log which packages are throwing ECYCLE error. ([@FezVrasta](https://github.com/FezVrasta))

#### Committers: 1

* Federico Zivolo ([FezVrasta](https://github.com/FezVrasta))

## v2.3.0 (2017-10-03)

New options for `lerna import` and `lerna publish`, set `--loglevel` from lerna.json, and more!

#### :rocket: Enhancement

* [#1019](https://github.com/lerna/lerna/pull/1019) Add `--flatten` option to use when merge conflicts cannot be imported. ([@dmaksimovic](https://github.com/dmaksimovic))
* [#1026](https://github.com/lerna/lerna/pull/1026) Add `--allow-branch` option to restrict publish to designated branches. ([@FaHeymann](https://github.com/FaHeymann))
* [#1029](https://github.com/lerna/lerna/pull/1029) Call version lifecycle scripts during publish. ([@cwmoo740](https://github.com/cwmoo740))
* [#1030](https://github.com/lerna/lerna/pull/1030) Add runScriptSync for use in version lifecycle methods. ([@cwmoo740](https://github.com/cwmoo740))

#### :bug: Bug Fix

* [#1020](https://github.com/lerna/lerna/pull/1020) Use `--canary=<value>` as prerelease tag, not commit-ish. ([@achingbrain](https://github.com/achingbrain))
* [#1037](https://github.com/lerna/lerna/pull/1037) Support durable `--loglevel` config from lerna.json. ([@evocateur](https://github.com/evocateur))
* [#1041](https://github.com/lerna/lerna/pull/1041) Pass npmClientArgs to yarn workspaces install command. ([@evocateur](https://github.com/evocateur))

#### :memo: Documentation

* [#1040](https://github.com/lerna/lerna/pull/1040) Tweak conventional message examples. ([@stevemao](https://github.com/stevemao))

#### :house: Internal

* [#1038](https://github.com/lerna/lerna/pull/1038) Rename `npmPublishAsPrerelease` to `npmPublish` to avoid confusion. ([@Hypnosphi](https://github.com/Hypnosphi))

#### Committers: 7

* Alex Potsides ([achingbrain](https://github.com/achingbrain))
* Daniel Stockman ([evocateur](https://github.com/evocateur))
* Darko Maksimovic ([dmaksimovic](https://github.com/dmaksimovic))
* Fabian Heymann ([FaHeymann](https://github.com/FaHeymann))
* Filipp Riabchun ([Hypnosphi](https://github.com/Hypnosphi))
* Jeffrey Young ([cwmoo740](https://github.com/cwmoo740))
* Steve Mao ([stevemao](https://github.com/stevemao))

## v2.2.0 (2017-09-15)

A new command, tweaks to logging and init scaffolding, and documentation!

#### :rocket: Enhancement

* [#970](https://github.com/lerna/lerna/pull/970) Create configured "packages" directories during lerna init. ([@Siilwyn](https://github.com/Siilwyn))
* [#1004](https://github.com/lerna/lerna/pull/1004) Improve logging of package lifecycle errors during bootstrap. ([@gauntface](https://github.com/gauntface))
* [#1000](https://github.com/lerna/lerna/pull/1000) Add `lerna link` command. ([@Inkdpixels](https://github.com/Inkdpixels))

#### :memo: Documentation

* [#985](https://github.com/lerna/lerna/pull/985) Update installation instructions to match lerna init behavior. ([@sapegin](https://github.com/sapegin))
* [#1011](https://github.com/lerna/lerna/pull/1011) Add shield example to README.md. ([@mfix22](https://github.com/mfix22))

#### Committers: 5

* Artem Sapegin ([sapegin](https://github.com/sapegin))
* Matt Gaunt ([gauntface](https://github.com/gauntface))
* Michael Fix ([mfix22](https://github.com/mfix22))
* Selwyn ([Siilwyn](https://github.com/Siilwyn))
* Tyll Weiß ([Inkdpixels](https://github.com/Inkdpixels))

## v2.1.2 (2017-08-29)

More bugfixes, plus support for the `prepare` lifecycle script found in npm 4+.

#### :rocket: Enhancement

* [#979](https://github.com/lerna/lerna/pull/979) Run "prepare" lifecycle script during bootstrap. ([@Andarist](https://github.com/Andarist))

#### :bug: Bug Fix

* [#992](https://github.com/lerna/lerna/pull/992) Fix --conventional-commits recommending already released version. ([@jezzay](https://github.com/jezzay))
* [#993](https://github.com/lerna/lerna/pull/993) Fix silly level log output for --conventional-commits. ([@jezzay](https://github.com/jezzay))
* [#996](https://github.com/lerna/lerna/pull/996) Only diff package locations, not the entire repository. ([@evocateur](https://github.com/evocateur))

#### :house: Internal

* [#997](https://github.com/lerna/lerna/pull/997) All command unit tests use yargs runner. ([@evocateur](https://github.com/evocateur))

#### Committers: 3

* Daniel Stockman ([evocateur](https://github.com/evocateur))
* Jeremy ([jezzay](https://github.com/jezzay))
* Mateusz Burzyński ([Andarist](https://github.com/Andarist))

## v2.1.1 (2017-08-28)

A quick bugfix release to restore a broken `lerna publish --canary`, as reported in [#989](https://github.com/lerna/lerna/issues/989). Many thanks to all who pitched in to identify the issue!

#### :bug: Bug Fix

* [#990](https://github.com/lerna/lerna/pull/990) Use yargs parser in unit tests for greater fidelity. ([@evocateur](https://github.com/evocateur))

#### Committers: 1

* Daniel Stockman ([evocateur](https://github.com/evocateur))

## v2.1.0 (2017-08-24)

#### :rocket: Enhancement

* [#922](https://github.com/lerna/lerna/pull/922) Support `--conventional-commits` in fixed versioning mode. ([@jezzay](https://github.com/jezzay))
* [#960](https://github.com/lerna/lerna/pull/960) Improve support for semver prerelease identifiers when publishing. ([@shawnbot](https://github.com/shawnbot))

#### :bug: Bug Fix

* [#940](https://github.com/lerna/lerna/pull/940) Improve bootstrap performance with `--include-filtered-dependencies` in large, cyclic repos. ([@lukebatchelor](https://github.com/lukebatchelor))
* [#943](https://github.com/lerna/lerna/pull/943) Return error and exit on invalid command. ([@Siilwyn](https://github.com/Siilwyn))
* [#965](https://github.com/lerna/lerna/pull/965) Avoid false positives during integration test filtering. ([@darrylhodgins](https://github.com/darrylhodgins))
* [#976](https://github.com/lerna/lerna/pull/976) Bump load-json-file. ([@anfedorov](https://github.com/anfedorov))
* [#982](https://github.com/lerna/lerna/pull/982) Exit properly when there is nothing to publish. ([@evocateur](https://github.com/evocateur))

#### :memo: Documentation

* [#921](https://github.com/lerna/lerna/pull/921) Fixed spelling mistake in a comment for Command.js. ([@dlmr](https://github.com/dlmr))
* [#978](https://github.com/lerna/lerna/pull/978) Add root package.json and CI setup sections to FAQ. ([@Andarist](https://github.com/Andarist))
* [#981](https://github.com/lerna/lerna/pull/981) Add troubleshooting info for GitHub lightweight tags. ([@jezzay](https://github.com/jezzay))

#### :house: Internal

* [#934](https://github.com/lerna/lerna/pull/934) Platform independent integration tests. ([@jezzay](https://github.com/jezzay))
* [#946](https://github.com/lerna/lerna/pull/946) Swallow promise rejection in registerChild as it is handled via callback. ([@viliusl](https://github.com/viliusl))
* [#973](https://github.com/lerna/lerna/pull/973) Update LICENSE. ([@yanca018](https://github.com/yanca018))

#### Committers: 11

* Andrey Fedorov ([anfedorov](https://github.com/anfedorov))
* Daniel Stockman ([evocateur](https://github.com/evocateur))
* Darryl Hodgins ([darrylhodgins](https://github.com/darrylhodgins))
* Gustaf Dalemar ([dlmr](https://github.com/dlmr))
* Jeremy ([jezzay](https://github.com/jezzay))
* Mateusz Burzyński ([Andarist](https://github.com/Andarist))
* Selwyn ([Siilwyn](https://github.com/Siilwyn))
* Shawn Allen ([shawnbot](https://github.com/shawnbot))
* Vilius Lukošius ([viliusl](https://github.com/viliusl))
* [lukebatchelor](https://github.com/lukebatchelor)
* [yanca018](https://github.com/yanca018)

## v2.0.0 (2017-07-06)

:tada: It's happening! :tada:

#### :boom: Breaking Change

* [#904](https://github.com/lerna/lerna/pull/904) Improved --canary functionality. ([@Craga89](https://github.com/Craga89))
  `--canary` now bumps the generated version to the next semver minor, and accepts a value (e.g. `--canary=beta`) to override the default "alpha" tag.

#### :rocket: Enhancement

* [#899](https://github.com/lerna/lerna/pull/899) Support Yarn workspaces to replace bootstrap command. ([@bestander](https://github.com/bestander))
* [#834](https://github.com/lerna/lerna/pull/834) Pass extra arguments to npmClient during bootstrap. ([@xaka](https://github.com/xaka))
* [#873](https://github.com/lerna/lerna/pull/873) Add root path dir environment variable to `lerna run`. ([@yisraelx](https://github.com/yisraelx))
* [#822](https://github.com/lerna/lerna/pull/822) Add --since flag to all commands that accept --scope. ([@treshugart](https://github.com/treshugart))
* [#806](https://github.com/lerna/lerna/pull/806) Allow custom yarn mutex from lerna.json config. ([@ChristopheVandePoel](https://github.com/ChristopheVandePoel))
* [#868](https://github.com/lerna/lerna/pull/868) lerna run: Don't error if no scoped packages are matched. ([@ricky](https://github.com/ricky))
* [#835](https://github.com/lerna/lerna/pull/835) Flag for exec to bail upon child execution error. ([@rsolomon](https://github.com/rsolomon))

#### :bug: Bug Fix

* [#857](https://github.com/lerna/lerna/pull/857) Print n/a when a package has no version key.. ([@ben-eb](https://github.com/ben-eb))
* [#897](https://github.com/lerna/lerna/pull/897) Run yarn in non-interactive mode. ([@tricoder42](https://github.com/tricoder42))
* [#898](https://github.com/lerna/lerna/pull/898) Fix issue where Yargs default would override durable options. ([@treshugart](https://github.com/treshugart))
* [#846](https://github.com/lerna/lerna/pull/846) Do not log private packages as published. ([@evocateur](https://github.com/evocateur))
* [#845](https://github.com/lerna/lerna/pull/845) Preserve tag summary with `lerna publish --message`. ([@evocateur](https://github.com/evocateur))
* [#844](https://github.com/lerna/lerna/pull/844) All CLI options should be configurable in lerna.json. ([@evocateur](https://github.com/evocateur))

#### :memo: Documentation

* [#840](https://github.com/lerna/lerna/pull/840) Update publish docs in README. ([@shilman](https://github.com/shilman))
* [#836](https://github.com/lerna/lerna/pull/836) Add semver notes to bootstrap command docs. ([@loklaan](https://github.com/loklaan))

#### :house: Internal

* [#861](https://github.com/lerna/lerna/pull/861) chore(travis): test against node 8 and npm 5. ([@douglasduteil](https://github.com/douglasduteil))

#### Committers: 15

* Ben Briggs ([ben-eb](https://github.com/ben-eb))
* Craig Michael Thompson ([Craga89](https://github.com/Craga89))
* Daniel Stockman ([evocateur](https://github.com/evocateur))
* Douglas Duteil ([douglasduteil](https://github.com/douglasduteil))
* Konstantin Raev ([bestander](https://github.com/bestander))
* Lochlan Bunn ([loklaan](https://github.com/loklaan))
* Michael Shilman ([shilman](https://github.com/shilman))
* Pavel Strashkin ([xaka](https://github.com/xaka))
* Ricky Rivera ([ricky](https://github.com/ricky))
* Ross Solomon ([rsolomon](https://github.com/rsolomon))
* Simen Bekkhus ([SimenB](https://github.com/SimenB))
* Tomáš Ehrlich ([tricoder42](https://github.com/tricoder42))
* Trey Shugart ([treshugart](https://github.com/treshugart))
* [ChristopheVandePoel](https://github.com/ChristopheVandePoel)
* [yisraelx](https://github.com/yisraelx)

## v2.0.0-rc.5 (2017-05-22)

This is the last release candidate.

We need to fix [#789](https://github.com/lerna/lerna/issues/789) before we can release `v2.0.0`. All contributions are appreciated!

#### :boom: Breaking Change

* [#807](https://github.com/lerna/lerna/pull/807) Change exit codes for `updated` and `publish`. ([@koddsson](https://github.com/koddsson))

  It is now possible to run `lerna publish` in CI unconditionally, only publishing when changes are actually detected, and never failing when it decides to not publish anything.

  Previously:

  * `lerna publish` when there are no updates to publish would throw an error
  * `lerna updated` when there are no updates would `exit 0`, making it ineffective as a chained filter (e.g., `lerna updated && lerna publish`)

  Now:

  * `lerna publish` when there are no updates is a no-op, exiting successfully with a helpful log message
  * `lerna updated` when there are no updates will exit non-zero (but _not_ throw an error), enabling it to be an effective filter

#### :rocket: Enhancement

* [#726](https://github.com/lerna/lerna/pull/726) Add --only-updated option to exec and run subcommands. ([@jameslnewell](https://github.com/jameslnewell))

  When executing a script or command, only run the script or command on packages that have been updated since the last release. A package is considered "updated" using the same rules as `lerna updated`.

  ```sh
  lerna exec --only-updated -- ls -la
  lerna run --only-updated test
  ```

  * [#795](https://github.com/lerna/lerna/pull/795) Add --parallel flag to `lerna exec`. ([@evocateur](https://github.com/evocateur))

    With this flag, `lerna exec` will run the command in _all_ filtered packages
    in parallel, completely ignoring concurrency and topological sorting.

    ```sh
    # transpile modules in all packages as changes occur
    lerna exec -- babel src -d lib -w

    # transpile watched modules only in package-foo
    lerna exec --scope package-foo -- babel src -d lib -w
    ```

    It is advised to constrain the scope of the command when running with this
    flag, as spawning dozens of subprocesses may be harmful to your shell's
    equanimity (or maximum file descriptor limit, for example). YMMV

* [#796](https://github.com/lerna/lerna/pull/796) Add --parallel flag to `lerna run`. ([@evocateur](https://github.com/evocateur))

  This allows simpler invocation of `watch` scripts, with the caveat that concurrency and topological sorting are _completely_ ignored. This is generally the intention when calling `lerna run watch` and other similar script targets, hence the additional flag.

  ```sh
  # the following commands are equivalent
  lerna run watch --concurrency=1000 --stream
  lerna run watch --parallel
  ```

  Package filtering (`--scope` and `--ignore`) is still available when this new flag is being used, and it is advised to narrow the scope of parallel execution when you have more than a dozen packages or so (YMMV).

* [#803](https://github.com/lerna/lerna/pull/803) Skip git repo check by default in Commands which do not rely on git. ([@noherczeg](https://github.com/noherczeg))
* [#824](https://github.com/lerna/lerna/pull/824) Add json output to `ls` and `updated` commands. ([@ricky](https://github.com/ricky))

  When run with `--json`, `lerna updated` and `lerna ls` will return an array of objects in the following format:

  ```json
  [
    {
      "name": "package",
      "version": "1.0.0",
      "private": false
    }
  ]
  ```

* [#829](https://github.com/lerna/lerna/pull/829) Prefix piped streams with rotating colors. ([@evocateur](https://github.com/evocateur))

#### :bug: Bug Fix

* [#798](https://github.com/lerna/lerna/pull/798) Disable progress bars when running in CI or non-interactive shell. ([@evocateur](https://github.com/evocateur))
* [#799](https://github.com/lerna/lerna/pull/799) Do not ignore explicit `node_modules` in package paths. ([@evocateur](https://github.com/evocateur))
* [#815](https://github.com/lerna/lerna/pull/815) Support GPG signing of git tags. ([@alethea](https://github.com/alethea))
* [#828](https://github.com/lerna/lerna/pull/828) Switch to `fs-extra`. ([@evocateur](https://github.com/evocateur))
* [#831](https://github.com/lerna/lerna/pull/831) Make `pkg` argument optional for `lerna diff`. ([@evocateur](https://github.com/evocateur))

#### :house: Internal

* [#827](https://github.com/lerna/lerna/pull/827), [#830](https://github.com/lerna/lerna/pull/830) Upgrade dependencies. ([@evocateur](https://github.com/evocateur))

#### Committers: 6

* Alethea Rose ([alethea](https://github.com/alethea))
* Daniel Stockman ([evocateur](https://github.com/evocateur))
* James Newell ([jameslnewell](https://github.com/jameslnewell))
* Kristján Oddsson ([koddsson](https://github.com/koddsson))
* Norbert Csaba Herczeg ([noherczeg](https://github.com/noherczeg))
* [ricky](https://github.com/ricky)

## v2.0.0-rc.4 (2017-04-27)

Now with less bugs! The `--hoist` flag works again, among other `rc.3` bugfixes, and our logging is _much_ more detailed now.

#### :boom: Breaking Change

* [#777](https://github.com/lerna/lerna/pull/777) Replace --skip-temp-tag with --temp-tag. ([@noherczeg](https://github.com/noherczeg))
* [#779](https://github.com/lerna/lerna/pull/779) Log with npmlog. ([@evocateur](https://github.com/evocateur))

#### :rocket: Enhancement

* [#782](https://github.com/lerna/lerna/pull/782) Add --max-buffer flag. ([@noherczeg](https://github.com/noherczeg))

#### :bug: Bug Fix

* [#775](https://github.com/lerna/lerna/pull/775), [#784](https://github.com/lerna/lerna/pull/784) Install non-hoisted leaves using `npm --global-style`. ([@ricky](https://github.com/ricky))
* [#776](https://github.com/lerna/lerna/pull/776) Ignore node_modules when traversing nested package locations. ([@evocateur](https://github.com/evocateur))
* [#778](https://github.com/lerna/lerna/pull/778) Fix --hoist with no argument default. ([@evocateur](https://github.com/evocateur))
* [#787](https://github.com/lerna/lerna/pull/787) Prevent log messages and progress bars from mangling prompts. ([@evocateur](https://github.com/evocateur))
* [#790](https://github.com/lerna/lerna/pull/790) Log the directories being cleaned. ([@evocateur](https://github.com/evocateur))

#### :nail_care: Polish

* [#781](https://github.com/lerna/lerna/pull/781) Support `--force-publish` arrays and booleans. ([@evocateur](https://github.com/evocateur))

#### :memo: Documentation

* [#783](https://github.com/lerna/lerna/pull/783) Add troubleshooting docs. ([@noherczeg](https://github.com/noherczeg))

#### :house: Internal

* [#780](https://github.com/lerna/lerna/pull/780) Restore async rimraf loops. ([@evocateur](https://github.com/evocateur))

#### Committers: 3

* Daniel Stockman ([evocateur](https://github.com/evocateur))
* Norbert Csaba Herczeg ([noherczeg](https://github.com/noherczeg))
* [ricky](https://github.com/ricky)

## v2.0.0-rc.3 (2017-04-18)

Barring show-stopping bugs, our goal is to cut `v2.0.0` later this week. Big props to all of our brave users riding the bleeding edge of release candidates and reporting issues!

#### :bug: Bug Fix

* [#764](https://github.com/lerna/lerna/pull/764) Use network mutex when bootstrapping with yarn. ([@evocateur](https://github.com/evocateur))

`lerna bootstrap --npmClient=yarn` should no longer require `--concurrency=1` to avoid yarn cache race conditions.

* [#769](https://github.com/lerna/lerna/pull/769) Fix custom version prompt. ([@timdorr](https://github.com/timdorr))
* [#771](https://github.com/lerna/lerna/pull/771) Resolve internal CLI calls with Windows-safe pattern. ([@evocateur](https://github.com/evocateur))

If you've ever encountered the error `Error: spawn rimraf ENOENT`, this should fix that. Turns out `yarn` doesn't match a behavior of `npm` when installing, and does _not_ symlink transitive dependency binaries.

#### :house: Internal

* [#770](https://github.com/lerna/lerna/pull/770) Pass multiple directories to rimraf. ([@evocateur](https://github.com/evocateur))

#### Committers: 2

* Daniel Stockman ([evocateur](https://github.com/evocateur))
* Tim Dorr ([timdorr](https://github.com/timdorr))

## v2.0.0-rc.2 (2017-04-13)

Inching ever closer to :checkered_flag: v2.0.0!

**Highlights**: `lerna exec` learned some new tricks (thanks to [execa](https://github.com/sindresorhus/execa#execa---)), and multi-line commit messages on Windows should now work.

```sh
$ lerna exec echo \$LERNA_PACKAGE_NAME
# note the escaped $, so it evaluates in the subshell, not the current shell
```

Ever get tired of repeating yourself in all of the package deps with devDependencies on `babel-cli` or `rimraf`? Now, all you need to do is have them installed in the root, and the following replaces all that duplicate code:

```sh
$ lerna exec rimraf lib
$ lerna exec babel -- src -d lib
```

The `--` is still useful for hiding args from `lerna`, but it isn't always necessary now.
In the example above, I had to hide the `-d` from `lerna`'s arg parser, but positional arguments are just fine.
When in doubt, always append the command you want to run (e.g., `babel src -d lib`) after the `--`, _after_ all other arguments to `lerna exec`.

#### :rocket: Enhancement

* [#719](https://github.com/lerna/lerna/pull/719) Use yargs to handle CLI args and subcommands. ([@noherczeg](https://github.com/noherczeg))

<details><summary><code>lerna --help</code> is a bit cleaner now</summary><p>
<!-- browsers demand the next line be empty -->

```txt
Usage: lerna <command> [options]

Commands:
  bootstrap                Link local packages together and install remaining package dependencies
  clean                    Remove the node_modules directory from all packages.
  diff <pkg>               Diff all packages or a single package since the last release.
  exec <command> [args..]  Run an arbitrary command in each package.
  import <pathToRepo>      Import the package in <pathToRepo> into packages/<directory-name> with commit history.
  init                     Create a new Lerna repo or upgrade an existing repo to the current version of Lerna.
  ls                       List all public packages
  publish                  Publish packages in the current project.
  run <script> [args..]    Run an npm script in each package that contains that script.
  updated                  Check which packages have changed since the last publish.

Global Options:
  --loglevel                       What level of logs to report.  [string] [default: "info"]
  --concurrency                    How many threads to use if lerna parallelises the tasks.  [number] [default: 4]
  --scope                          Restricts the scope to package names matching the given glob.
                                   (Only for 'run', 'exec', 'clean', 'ls', and 'bootstrap' commands)  [string]
  --ignore                         Ignore packages with names matching the given glob.
                                   (Only for 'run', 'exec', 'clean', 'ls', and 'bootstrap' commands)  [string]
  --include-filtered-dependencies  Include all transitive dependencies when running a command, regardless of --scope or --ignore.
  --registry                       Use the specified registry for all npm client operations.  [string]
  --sort                           Sort packages topologically (all dependencies before dependents)  [boolean] [default: true]
  -h, --help                       Show help  [boolean]
  -v, --version                    Show version number  [boolean]

When a command fails, all logs are written to lerna-debug.log in the current working directory.

For more information, find our manual at https://github.com/lerna/lerna
```

</p></details>

<details><summary>Targeted command help: <code>lerna bootstrap --help</code></summary><p>
<!-- browsers demand the next line be empty -->

```txt
lerna bootstrap

Global Options:
  --loglevel                       What level of logs to report.  [string] [default: "info"]
  --concurrency                    How many threads to use if lerna parallelises the tasks.  [number] [default: 4]
  --scope                          Restricts the scope to package names matching the given glob.
                                   (Only for 'run', 'exec', 'clean', 'ls', and 'bootstrap' commands)  [string]
  --ignore                         Ignore packages with names matching the given glob.
                                   (Only for 'run', 'exec', 'clean', 'ls', and 'bootstrap' commands)  [string]
  --include-filtered-dependencies  Include all transitive dependencies when running a command, regardless of --scope or --ignore.
  --registry                       Use the specified registry for all npm client operations.  [string]
  --sort                           Sort packages topologically (all dependencies before dependents)  [boolean] [default: true]
  -h, --help                       Show help  [boolean]
  -v, --version                    Show version number  [boolean]

Options:
  --hoist       Install external dependencies matching [glob] to the repo root  [string] [default: '**']
  --nohoist     Don't hoist external dependencies matching [glob] to the repo root  [string]
  --npm-client  Executable used to install dependencies (npm, yarn, pnpm, ...)  [string]
```

</p></details>

We've got plenty of room to grow our documentation, PRs welcome!

#### :bug: Bug Fix

* [#758](https://github.com/lerna/lerna/pull/758) Use temp-write for multi-line commit messages. ([@evocateur](https://github.com/evocateur))
* [#761](https://github.com/lerna/lerna/pull/761) Use shell option when spawning `lerna exec`. ([@jwb](https://github.com/jwb))
* [#762](https://github.com/lerna/lerna/pull/762) Fix durable option resolution. ([@evocateur](https://github.com/evocateur))

#### :memo: Documentation

* [#748](https://github.com/lerna/lerna/pull/748) Reference conventionalcommits.org website in README. ([@bcoe](https://github.com/bcoe))
* [#751](https://github.com/lerna/lerna/pull/751) Update README.md and docs to better explain hoisting. ([@kylecordes](https://github.com/kylecordes))

If you've ever had a question about hoisting, read [@kylecordes](https://github.com/kylecordes)'s brilliant docs [here](https://github.com/lerna/lerna/blob/master/doc/hoist.md)!

#### :house: Internal

* [#745](https://github.com/lerna/lerna/pull/745) Add eslint-plugin-node. ([@evocateur](https://github.com/evocateur))
* [#747](https://github.com/lerna/lerna/pull/747) Fix bootstrap integration tests. ([@evocateur](https://github.com/evocateur))
* [#749](https://github.com/lerna/lerna/pull/749) Convert eslint config to YAML. ([@evocateur](https://github.com/evocateur))
* [#750](https://github.com/lerna/lerna/pull/750) Refactor fixture helpers to reduce duplication. ([@evocateur](https://github.com/evocateur))
* [#759](https://github.com/lerna/lerna/pull/759) Use execa for child_process calls. ([@evocateur](https://github.com/evocateur))

#### Committers: 5

* Benjamin E. Coe ([bcoe](https://github.com/bcoe))
* Daniel Stockman ([evocateur](https://github.com/evocateur))
* John Bito ([jwb](https://github.com/jwb))
* Kyle Cordes ([kylecordes](https://github.com/kylecordes))
* Norbert Csaba Herczeg ([noherczeg](https://github.com/noherczeg))

## v2.0.0-rc.1 (2017-04-07)

A silent (but deadly) bug slipped into the last release. Many thanks to ([@timdp](https://github.com/timdp)) for discovering it.

#### :bug: Bug Fix

* [#744](https://github.com/lerna/lerna/pull/744) Fix package.json updates during publish. ([@evocateur](https://github.com/evocateur))

## v2.0.0-rc.0 (2017-04-06)

:tada: It's the first release candidate of `v2.0.0`! :tada:

**Highlights**: Jest, CI automation improvements, and tons of internal refactoring!

We've been in "beta" for quite some time, and it's time for our versioning to better communicate changes and guarantee API stability.

Our goal is to focus on a few important bugfixes before pushing the big red button and cutting a `v2.0.0` for realsies. Check out the [milestone](https://github.com/lerna/lerna/milestone/1) to see if you can help!

#### :boom: Breaking Change

* [#732](https://github.com/lerna/lerna/pull/732) Remove broken public API. ([@evocateur](https://github.com/evocateur))

Our apologies if you were using this, but did you know it's been broken since before the first 2.x beta?
We have better opportunities in the offing for helping folks reuse parts of our inner logic (a `--json` flag for `lerna ls`, perhaps?), and encourage those who have complex needs to join or start discussions in the issues.

#### :rocket: Enhancement

* [#666](https://github.com/lerna/lerna/pull/666) Create annotated git tags instead of lightweight tags. ([@AlexLandau](https://github.com/AlexLandau))
* [#665](https://github.com/lerna/lerna/pull/665) Automate CHANGELOG updates and version bumps during publish with `--conventional-commits` flag. ([@bcoe](https://github.com/bcoe))
* [#607](https://github.com/lerna/lerna/pull/607) Increment version by semver keyword with `--cd-version` flag. ([@cif](https://github.com/cif))
* [#641](https://github.com/lerna/lerna/pull/641) Add prompts for prerelease versions. ([@rtsao](https://github.com/rtsao))
* [#647](https://github.com/lerna/lerna/pull/647) Allow concurrency to be configured via lerna.json. ([@gigabo](https://github.com/gigabo))
* [#635](https://github.com/lerna/lerna/pull/635) Switch to Jest. ([@evocateur](https://github.com/evocateur))
* [#714](https://github.com/lerna/lerna/pull/714) Refactor unit tests into Jest idioms, adding integration tests. ([@evocateur](https://github.com/evocateur))

#### :bug: Bug Fix

* [#731](https://github.com/lerna/lerna/pull/731) Symlink binaries of scoped packages correctly. ([@evocateur](https://github.com/evocateur))
* [#729](https://github.com/lerna/lerna/pull/729) Upgrade progress to address upstream bug. ([@zzarcon](https://github.com/zzarcon))
* [#728](https://github.com/lerna/lerna/pull/728) Handle `--ignore` flag correctly when publishing. ([@noherczeg](https://github.com/noherczeg))
* [#711](https://github.com/lerna/lerna/pull/711) Do not reject detached `HEAD` when publishing a canary release. ([@evocateur](https://github.com/evocateur))
* [#694](https://github.com/lerna/lerna/pull/694), [#705](https://github.com/lerna/lerna/pull/705) Loosen version check to major-only. ([@evocateur](https://github.com/evocateur))
* [#687](https://github.com/lerna/lerna/pull/687) Support lerna execution from subdirectories of repo root. ([@evocateur](https://github.com/evocateur))
* [#654](https://github.com/lerna/lerna/pull/654), [#672](https://github.com/lerna/lerna/pull/672) Merge current process.env when using `--registry` flag. ([@noherczeg](https://github.com/noherczeg)), ([@TheLarkInn](https://github.com/TheLarkInn))
* [#621](https://github.com/lerna/lerna/pull/621) Include private packages in the list of updated packages. ([@spudly](https://github.com/spudly))
* [#638](https://github.com/lerna/lerna/pull/638) Install with all dependencies when installing. ([@gigabo](https://github.com/gigabo))

#### :nail_care: Polish

* [#655](https://github.com/lerna/lerna/pull/655) Actually warn when a matching dependency version is not satisfied. ([@evocateur](https://github.com/evocateur))
* [#674](https://github.com/lerna/lerna/pull/674) Appveyor status should reflect master, not latest. ([@evocateur](https://github.com/evocateur))

#### :memo: Documentation

* [#736](https://github.com/lerna/lerna/pull/736) Update FAQ.md with publish retry details. ([@cdaringe](https://github.com/cdaringe))
* [#693](https://github.com/lerna/lerna/pull/693) Add GitHub issue and pull request templates. ([@evocateur](https://github.com/evocateur))
* [#634](https://github.com/lerna/lerna/pull/634) Add documentation about "watch" commands next to `--no-sort`. ([@trotzig](https://github.com/trotzig))

#### :house: Internal

* [#738](https://github.com/lerna/lerna/pull/738) Use `babel-preset-env` instead of `babel-preset-es2015`. ([@evocateur](https://github.com/evocateur))
* [#737](https://github.com/lerna/lerna/pull/737) Update eslint, config, and plugins. ([@evocateur](https://github.com/evocateur))
* [#733](https://github.com/lerna/lerna/pull/733), [#734](https://github.com/lerna/lerna/pull/734) Refactor CWD handling. ([@evocateur](https://github.com/evocateur))
* [#690](https://github.com/lerna/lerna/pull/690) Whitelist files included in package tarball. ([@evocateur](https://github.com/evocateur))
* [#681](https://github.com/lerna/lerna/pull/681) Use `yarn --frozen-lockfile` in CI. ([@evocateur](https://github.com/evocateur))
* [#673](https://github.com/lerna/lerna/pull/673) Use yarn instead of npm in CI. ([@evocateur](https://github.com/evocateur))
* [#663](https://github.com/lerna/lerna/pull/663) add tests for `NpmUtilities.getExecOpts()`. ([@noherczeg](https://github.com/noherczeg))

#### Committers: 17

* Alex Landau ([AlexLandau](https://github.com/AlexLandau))
* Ben Ipsen ([cif](https://github.com/cif))
* Benjamin E. Coe ([bcoe](https://github.com/bcoe))
* Bo Borgerson ([gigabo](https://github.com/gigabo))
* Christopher Dieringer ([cdaringe](https://github.com/cdaringe))
* Daniel Stockman ([evocateur](https://github.com/evocateur))
* Hector Zarco ([zzarcon](https://github.com/zzarcon))
* Henric Trotzig ([trotzig](https://github.com/trotzig))
* Henry Zhu ([hzoo](https://github.com/hzoo))
* Norbert Csaba Herczeg ([noherczeg](https://github.com/noherczeg))
* Nuno Campos ([nfcampos](https://github.com/nfcampos))
* Ryan Tsao ([rtsao](https://github.com/rtsao))
* Sean Larkin ([TheLarkInn](https://github.com/TheLarkInn))
* Stephen John Sorensen ([spudly](https://github.com/spudly))
* Vladimir Guguiev ([wizardzloy](https://github.com/wizardzloy))
* Yasser Kaddour ([YasserKaddour](https://github.com/YasserKaddour))
* james kyle ([thejameskyle](https://github.com/thejameskyle))

## v2.0.0-beta.38 (2017-02-28)

📦 🐈 Initial Yarn support and more!

#### :rocket: Enhancement

* [#605](https://github.com/lerna/lerna/pull/605) Add support for pluggable npm clients. ([@gigabo](https://github.com/gigabo))

> We'll make yarn the default once we feel that it's more stable.

```sh
$ lerna bootstrap --npm-client=yarn
```

```json
{
  "npmClient": "yarn"
}
```

* [#595](https://github.com/lerna/lerna/pull/595) Publish npm packages in topological order ([@loganfsmyth](https://github.com/loganfsmyth))

Very important fix for Babel that we used in the last release. This prevents a timing issue when publishing where a module will try to download a package that isn't published yet because it is published before it's own dependency is published itself. We used to get many issues from users on non-public npm about "babel-types" not being found.

* [#475](https://github.com/lerna/lerna/pull/475) Lerna checks for changes since most recent tag in the current branch ([@](Gongreg))

We now check for changes since the most recent tag in the current branch, instead of the most recent tag in entire repository. This allows publishing older versions of a project in maintenance branches, as well as nightly releases from a feature branch.

Additionally, we now ensure that the user is in a non-detached branch because lerna can't publish without a valid git branch.

* [#608](https://github.com/lerna/lerna/pull/608) Add a --stream option to the run command. ([@gigabo](https://github.com/gigabo))

Useful to get output for child processes immediately if using `lerna run` with a watch command

```sh
$ lerna run watch --stream
```

* [#624](https://github.com/lerna/lerna/pull/624) Add versions to lerna ls. Closes [#603](https://github.com/lerna/lerna/issues/603) ([@ben-eb](https://github.com/ben-eb))

- [#620](https://github.com/lerna/lerna/pull/620) Feature: skip-temp-tag. ([@noherczeg](https://github.com/noherczeg))

This will not create a temporary dist-tag called `lerna-temp` when publishing. Useful if your third party proxy doesn't support dist-tags.

```sh
$ lerna publish --skip-temp-tag
```

* [#587](https://github.com/lerna/lerna/pull/587) Always run test and env scripts. ([@simon360](https://github.com/simon360))

Defaults to running `npm run test` and `npm run env`

* [#598](https://github.com/lerna/lerna/pull/598) Durable `includeFilteredDependencies` config via lerna.json. ([@gigabo](https://github.com/gigabo))

```json
{
  "commands": {
    "bootstrap": {
      "includeFilteredDependencies": true
    }
  }
}
```

* [#596](https://github.com/lerna/lerna/pull/596) Support `sort` option in lerna.json. ([@gigabo](https://github.com/gigabo))

```js
{
  "commands": {
    "run": {
      "sort": false
    }
  }
}
```

* [#599](https://github.com/lerna/lerna/pull/599) Explicit registry flag feature. ([@noherczeg](https://github.com/noherczeg))

```sh
$ lerna publish --registry https://my-private-registry
```

#### :bug: Bug Fix

* [#601](https://github.com/lerna/lerna/pull/601) Fix --ignore flag when globs are expanded to an array. ([@rtsao](https://github.com/rtsao))
* [#597](https://github.com/lerna/lerna/pull/597) Support command config in either "commands" or "command". ([@gigabo](https://github.com/gigabo))
* [#586](https://github.com/lerna/lerna/pull/586) Avoid exception after successful `lerna diff`. ([@evocateur](https://github.com/evocateur))

#### :house: Internal

* [#604](https://github.com/lerna/lerna/pull/604) Fix midair collision. ([@doug-wade](https://github.com/doug-wade))
* [#594](https://github.com/lerna/lerna/pull/594) Remove `sync-exec` ([@wtgtybhertgeghgtwtg](https://github.com/wtgtybhertgeghgtwtg))

#### Committers: 11

* Ben Briggs ([ben-eb](https://github.com/ben-eb))
* Bo Borgerson ([gigabo](https://github.com/gigabo))
* Daniel Stockman ([evocateur](https://github.com/evocateur))
* Douglas Wade ([doug-wade](https://github.com/doug-wade))
* Garth Kidd ([garthk](https://github.com/garthk))
* Gytis Vinclovas ([Gongreg](https://github.com/Gongreg))
* Logan Smyth ([loganfsmyth](https://github.com/loganfsmyth))
* Norbert Csaba Herczeg ([noherczeg](https://github.com/noherczeg))
* Ryan Tsao ([rtsao](https://github.com/rtsao))
* [simon360](https://github.com/simon360)
* [wtgtybhertgeghgtwtg](https://github.com/wtgtybhertgeghgtwtg)

## v2.0.0-beta.37 (2017-02-08)

`--include-filtered-dependencies` now works with `ls`,`exec`,`run` as well!

* Fixes an issue with `--hoist` (from previous release)

#### :rocket: Enhancement

* [#581](https://github.com/lerna/lerna/pull/581) Improve support for --include-filtered-dependencies. ([@roblg](https://github.com/roblg))
* [#576](https://github.com/lerna/lerna/pull/576) Install with no arguments. ([@gigabo](https://github.com/gigabo))
* [#569](https://github.com/lerna/lerna/pull/569) Short-circuit out of install with no packages. ([@gigabo](https://github.com/gigabo))

#### :bug: Bug Fix

* [#574](https://github.com/lerna/lerna/pull/574) Use correct logger method in Package method.. ([@evocateur](https://github.com/evocateur))
* [#568](https://github.com/lerna/lerna/pull/568) Check if directories exist before removing during hoist. ([@gigabo](https://github.com/gigabo))

#### :house: Internal

* [#562](https://github.com/lerna/lerna/pull/562) Replace `lodash.find`, `lodash.unionwith`, and `pad` with `lodash`.. ([@wtgtybhertgeghgtwtg](https://github.com/wtgtybhertgeghgtwtg))
* [#584](https://github.com/lerna/lerna/pull/584) Bump `command-join`.. ([@wtgtybhertgeghgtwtg](https://github.com/wtgtybhertgeghgtwtg))
* [#575](https://github.com/lerna/lerna/pull/575) Add coverage report. ([@doug-wade](https://github.com/doug-wade))

#### Committers: 5

* Bo Borgerson ([gigabo](https://github.com/gigabo))
* Daniel Stockman ([evocateur](https://github.com/evocateur))
* Douglas Wade ([doug-wade](https://github.com/doug-wade))
* Robert Gay ([roblg](https://github.com/roblg))
* [wtgtybhertgeghgtwtg](https://github.com/wtgtybhertgeghgtwtg)

## v2.0.0-beta.36 (2017-02-02)

#### :bug: Bug Fix

* [#566](https://github.com/lerna/lerna/pull/566) Fix rimraf bin resolution. ([@rtsao](https://github.com/rtsao))

## v2.0.0-beta.35 (2017-02-01)

3 new flags:

###### `--no-sort` (only for run, exec and bootstrap)

By default, all tasks execute on packages in topologically sorted order as to respect the dependency relationships of the packages in question. Cycles are broken on a best-effort basis in a way not guaranteed to be consistent across Lerna invocations.

Topological sorting can cause concurrency bottlenecks if there are a small number of packages with many dependents or if some packages take a disproportionately long time to execute. The `--no-sort` option disables sorting, instead executing tasks in an arbitrary order with maximum concurrency.

###### `--hoist` (only for bootstrap)

Install external dependencies matching `glob` at the repo root so they're
available to all packages. Any binaries from these dependencies will be
linked into dependent package `node_modules/.bin/` directories so they're
available for npm scripts. If the option is present but no `glob` is given
the default is `**` (hoist everything). This option only affects the
`bootstrap` command.

```sh
$ lerna bootstrap --hoist
```

Note: If packages depend on different _versions_ of an external dependency,
the most commonly used version will be hoisted, and a warning will be emitted.

This option may also be set in `lerna.json` with `"hoist": true` or `"hoist": <glob>`.

###### `--nohoist` (only for bootstrap)

Do _not_ install external dependencies matching `glob` at the repo root. This
can be used to opt out of hoisting for certain dependencies.

```sh
$ lerna bootstrap --hoist --nohoist=babel-*
```

This option may also be set in `lerna.json` with `"nohoist": <glob>`.

#### :rocket: Enhancement

* [#507](https://github.com/lerna/lerna/pull/507) Automatic hoisting of common dependencies. ([@gigabo](https://github.com/gigabo))
* [#547](https://github.com/lerna/lerna/pull/547) Spawn child process for rimraf (speeds up `lerna clean`). ([@roblg](https://github.com/roblg))
* [#543](https://github.com/lerna/lerna/pull/543) [clean] Support `--include-filtered-dependencies` flag. ([@roblg](https://github.com/roblg))
* [#412](https://github.com/lerna/lerna/pull/412) Make bootstrap, exec and run commands execute packages in dependency order by default. ([@seansfkelley](https://github.com/seansfkelley))
* [#373](https://github.com/lerna/lerna/pull/373) [Feature] Log stdout when commands fail. Closes [#343](https://github.com/lerna/lerna/issues/343).. ([@seansfkelley](https://github.com/seansfkelley))

#### :bug: Bug Fix

* [#542](https://github.com/lerna/lerna/pull/542) Fixes issue: prepublish not running in dependencies with `--scope --include-filtered-dependencies`. ([@roblg](https://github.com/roblg))

When running `lerna bootstrap --scope foo --include-filtered-dependencies` run prepublish task with the same flags.

#### :memo: Documentation

* [#465](https://github.com/lerna/lerna/pull/465) Add a note about lerna-wizard.. ([@szarouski](https://github.com/szarouski))

#### :house: Internal

* [#554](https://github.com/lerna/lerna/pull/554) Bump `cross-env`.. ([@wtgtybhertgeghgtwtg](https://github.com/wtgtybhertgeghgtwtg))
* [#560](https://github.com/lerna/lerna/pull/560) redo labels [skip ci]. ([@hzoo](https://github.com/hzoo))
* [#559](https://github.com/lerna/lerna/pull/559) Drop `isarray`.. ([@wtgtybhertgeghgtwtg](https://github.com/wtgtybhertgeghgtwtg))
* [#557](https://github.com/lerna/lerna/pull/557) Fix broken hoisting tests. ([@doug-wade](https://github.com/doug-wade))
* [#549](https://github.com/lerna/lerna/pull/549) Bump `signal-exit`.. ([@wtgtybhertgeghgtwtg](https://github.com/wtgtybhertgeghgtwtg))
* [#548](https://github.com/lerna/lerna/pull/548) Bump `object-assigned-sorted`.. ([@wtgtybhertgeghgtwtg](https://github.com/wtgtybhertgeghgtwtg))
* [#535](https://github.com/lerna/lerna/pull/535) Don't include unnecesary files in the npm package. ([@gpittarelli](https://github.com/gpittarelli))
* [#546](https://github.com/lerna/lerna/pull/546) Drop `object-assign`.. ([@wtgtybhertgeghgtwtg](https://github.com/wtgtybhertgeghgtwtg))
* [#541](https://github.com/lerna/lerna/pull/541) Upgrade `inquirer` dependency. ([@wtgtybhertgeghgtwtg](https://github.com/wtgtybhertgeghgtwtg))

#### Committers: 9

* Bo Borgerson ([gigabo](https://github.com/gigabo))
* Douglas Wade ([doug-wade](https://github.com/doug-wade))
* George Pittarelli ([gpittarelli](https://github.com/gpittarelli))
* Henry Zhu ([hzoo](https://github.com/hzoo))
* Robert Gay ([roblg](https://github.com/roblg))
* Sean Kelley ([seansfkelley](https://github.com/seansfkelley))
* Sergey Zarouski ([szarouski](https://github.com/szarouski))
* [wtgtybhertgeghgtwtg](https://github.com/wtgtybhertgeghgtwtg)

## v2.0.0-beta.34 (2017-01-26)

#### :bug: Bug Fix

* [#537](https://github.com/lerna/lerna/pull/537) [CRITICAL] Publish command is broken for 2.0.0-beta.33. ([@diogofcunha](https://github.com/diogofcunha))

#### Committers: 1

* Diogo ([diogofcunha](https://github.com/diogofcunha))

## v2.0.0-beta.33 (2017-01-25)

* Drop Node 0.10/0.12/5
* Custom publish commit message
* Publish to a different remote
* Publish exact versions instead of `^`

#### Breaking change

* [#528](https://github.com/lerna/lerna/pull/528) Drop node 5 from travis/appveyor. ([@chitchu](https://github.com/chitchu))
* [#484](https://github.com/lerna/lerna/pull/484) Drop support for node 0.10 and node 0.12. ([@doug-wade](https://github.com/doug-wade))

#### Enhancement

* [#460](https://github.com/lerna/lerna/pull/460) Add --message option for custom commit msgs when publishing. ([@traviskaufman](https://github.com/traviskaufman))

Override default message with `--message` or `-m`

```sh
lerna publish -m "chore: Publish"
```

* [#508](https://github.com/lerna/lerna/pull/508) [Feature] Allow git remote to be changed for publish. ([@tdanecker](https://github.com/tdanecker))

Use a different git remote other than origin

```sh
lerna publish --git-remote upstream
```

* [#390](https://github.com/lerna/lerna/pull/390) [Feature] Adds `--include-filtered-dependencies` flag for bootstrap command. ([@lukebatchelor](https://github.com/lukebatchelor))

`my-component` and all of its dependencies will be bootstrapped

```sh
lerna bootstrap --scope my-component --include-filtered-dependencies
```

* [#426](https://github.com/lerna/lerna/pull/426) Add support for hidden '--exact' flag. ([@L8D](https://github.com/L8D))

Use exact versions (`"2.1.3"`) instead of with `^` (`"^2.1.3"`)

```sh
lerna publish --exact
```

#### Bug fix

* [#458](https://github.com/lerna/lerna/pull/458) use message passed as argument to the static method input() in PromptUtilities. ([@btiwaree](https://github.com/btiwaree))
* [#483](https://github.com/lerna/lerna/pull/483) 467: lerna bootstrap succeeds with 0 packages. ([@doug-wade](https://github.com/doug-wade))
* [#454](https://github.com/lerna/lerna/pull/454) Use close event to wait for spawned processes to finish. ([@xaka](https://github.com/xaka))

#### Documentation

* [#514](https://github.com/lerna/lerna/pull/514) Update README.md (s/--exclude/--ignore/). ([@xaka](https://github.com/xaka))
* [#459](https://github.com/lerna/lerna/pull/459) Fix import logger info typo. ([@sdgluck](https://github.com/sdgluck))

#### Committers: 9

* Bishesh Tiwaree ([btiwaree](https://github.com/btiwaree))
* Douglas Wade ([doug-wade](https://github.com/doug-wade))
* Pavel Strashkin ([xaka](https://github.com/xaka))
* Sam Gluck ([sdgluck](https://github.com/sdgluck))
* Tenor Biel ([L8D](https://github.com/L8D))
* Thomas Danecker ([tdanecker](https://github.com/tdanecker))
* Travis Kaufman ([traviskaufman](https://github.com/traviskaufman))
* Vicente Jr Yuchitcho ([chitchu](https://github.com/chitchu))
* [lukebatchelor](https://github.com/lukebatchelor)

## v2.0.0-beta.32 (2017-01-04)

#### Bug fix

* [#435](https://github.com/lerna/lerna/pull/435) Use symlinks with relative paths instead of absolute on non-windows environments (Closes [#423](https://github.com/lerna/lerna/issues/423)).. ([@JaapRood](https://github.com/JaapRood))
* [#440](https://github.com/lerna/lerna/pull/440) Change testing NODE_ENV to "lerna-test" (Closes [#406](https://github.com/lerna/lerna/issues/406)). ([@ryb73](https://github.com/ryb73))
* [#444](https://github.com/lerna/lerna/pull/444) Use correct logger method for warnings. ([@evocateur](https://github.com/evocateur))

#### Committers: 3

* Daniel Stockman ([evocateur](https://github.com/evocateur))
* Jaap van Hardeveld ([JaapRood](https://github.com/JaapRood))
* Ryan Biwer ([ryb73](https://github.com/ryb73))

## v2.0.0-beta.31 (2016-12-14)

#### Enhancement

* [#365](https://github.com/lerna/lerna/pull/365) Add support for configurable package locations. ([@gigabo](https://github.com/gigabo))

Lerna now supports packages outside of the `packages/` directory!

Configured via an array of globs in `lerna.json`:

```json
{
  "lerna": "2.0.0-beta.31",
  "version": "1.1.3",
  "packages": ["packages/*"]
}
```

* [#436](https://github.com/lerna/lerna/pull/436) Highlight private packages in updated/publish output. ([@chrishelgert](https://github.com/chrishelgert))

No more confusion about what will actually get published!

![example](https://cloud.githubusercontent.com/assets/3918488/20965291/4c6a753c-bc75-11e6-9b6d-853f0952b647.png)

* [#367](https://github.com/lerna/lerna/pull/367) Make log levels more like npm. ([@gigabo](https://github.com/gigabo))

Adds a `--loglevel [silent|error|warn|success|info|verbose|silly]` option.

Any logs of a higher level than the setting are shown. The default is "info".

* [#386](https://github.com/lerna/lerna/pull/386) Add --scope and --ignore support for bootstrap, exec, run, clean and ls. ([@lukebatchelor](https://github.com/lukebatchelor))
* [#358](https://github.com/lerna/lerna/pull/358) Run pre/post install scripts during bootstrap. ([@seansfkelley](https://github.com/seansfkelley))

#### Bug fix

* [#442](https://github.com/lerna/lerna/pull/442) Increase maxBuffer. ([@rygine](https://github.com/rygine))
* [#372](https://github.com/lerna/lerna/pull/372) Fix logifyAsync, logifySync decorators. ([@seansfkelley](https://github.com/seansfkelley))

#### Committers: 15

* Bastian Heist ([beheist](https://github.com/beheist))
* Ben Briggs ([ben-eb](https://github.com/ben-eb))
* Ben Clinkinbeard ([bclinkinbeard](https://github.com/bclinkinbeard))
* Bo Borgerson ([gigabo](https://github.com/gigabo))
* Chris Helgert ([chrishelgert](https://github.com/chrishelgert))
* Elise Chant ([elisechant](https://github.com/elisechant))
* Gary Johnson ([garyjN7](https://github.com/garyjN7))
* Henry Zhu ([hzoo](https://github.com/hzoo))
* Ivan Akulov ([iamakulov](https://github.com/iamakulov))
* James K ([thejameskyle](https://github.com/thejameskyle))
* Joscha Feth ([joscha](https://github.com/joscha))
* MURAKAMI Masahiko ([fossamagna](https://github.com/fossamagna))
* Sean Kelley ([seansfkelley](https://github.com/seansfkelley))
* Teppei Sato ([teppeis](https://github.com/teppeis))
* [lukebatchelor](https://github.com/lukebatchelor)
