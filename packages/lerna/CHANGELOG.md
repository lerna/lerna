# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [7.3.1](https://github.com/lerna/lerna/compare/v7.3.0...v7.3.1) (2023-10-10)

### Bug Fixes

- **core:** update package engines.node to correctly include only >=16 ([#3861](https://github.com/lerna/lerna/issues/3861)) ([0674555](https://github.com/lerna/lerna/commit/067455559a1ffa25350800bff6c9226d0e24e6b9))

# [7.3.0](https://github.com/lerna/lerna/compare/v7.2.0...v7.3.0) (2023-09-13)

### Bug Fixes

- update make-dir to 4.0.0 and npm audit fix ([#3828](https://github.com/lerna/lerna/issues/3828)) ([373b8bc](https://github.com/lerna/lerna/commit/373b8bc8202f15b4cafb216aee97f43885eebddf))

### Features

- **version:** add --sync-dist-version option ([#3787](https://github.com/lerna/lerna/issues/3787)) ([ba8b946](https://github.com/lerna/lerna/commit/ba8b9469809326de1b3929cf11bbb5919c723a78))
- **version:** option to not ignore scripts on lock update ([#3823](https://github.com/lerna/lerna/issues/3823)) ([4843c3c](https://github.com/lerna/lerna/commit/4843c3c1a95aa2f6c48204c1da3c06a4dcd746a4))

# [7.2.0](https://github.com/lerna/lerna/compare/v7.1.5...v7.2.0) (2023-08-29)

**Note:** Version bump only for package lerna

## [7.1.5](https://github.com/lerna/lerna/compare/v7.1.4...v7.1.5) (2023-08-09)

**Note:** Version bump only for package lerna

## [7.1.4](https://github.com/lerna/lerna/compare/v7.1.3...v7.1.4) (2023-07-15)

### Bug Fixes

- add missing lodash dependency ([#3778](https://github.com/lerna/lerna/issues/3778)) ([ef935c7](https://github.com/lerna/lerna/commit/ef935c7bfa9fdca00424e05a25a7e4d5454764d8))
- bump nx to >=16.5.1 ([#3767](https://github.com/lerna/lerna/issues/3767)) ([0bbd74d](https://github.com/lerna/lerna/commit/0bbd74db8fb29dd914d2387f4c138ac81aad1d9e))
- **core:** export cli.js for global installs ([#3780](https://github.com/lerna/lerna/issues/3780)) ([e2e1629](https://github.com/lerna/lerna/commit/e2e1629fae00d191e01c1a9e1b49eadbdc67f1aa))

## [7.1.3](https://github.com/lerna/lerna/compare/v7.1.2...v7.1.3) (2023-07-12)

### Bug Fixes

- changelog entries for 7.1.2 ([f61b087](https://github.com/lerna/lerna/commit/f61b0872b96a95fe2830b300f082b5dff3c5d326))

## [7.1.2](https://github.com/lerna/lerna/compare/v6.4.1...v7.1.2) (2023-07-12)

- **version:** use async functions to support prettier 3+ ([#3766](https://github.com/lerna/lerna/issues/3766)) ([8026a7b](https://github.com/lerna/lerna/commit/8026a7b34c1cdf45135f5a556b8dd162c0cd2207))

## [7.1.1](https://github.com/lerna/lerna/compare/7.1.0...7.1.1) (2023-06-28)

### Bug Fixes

- **schema:** add missing ref to changelogEntryAdditionalMarkdown ([b41afab](https://github.com/lerna/lerna/commit/b41afabf2ade02cd03bafbc043fa5ed445843640))

# [7.1.0](https://github.com/lerna/lerna/compare/7.0.2...7.1.0) (2023-06-25)

### Features

- **core:** export detectProjects utility function ([#3740](https://github.com/lerna/lerna/issues/3740)) ([641fecb](https://github.com/lerna/lerna/commit/641fecbe7c83602fe5bb792d6db86ab57eecfd9b))
- **repair:** add migration to remove unused "lerna" field from lerna.json ([#3734](https://github.com/lerna/lerna/issues/3734)) ([4fb0427](https://github.com/lerna/lerna/commit/4fb042755c52d87ff33d04fb1cd45e99ba0c0f61))
- **version:** add --changelog-entry-additional-markdown option ([#3751](https://github.com/lerna/lerna/issues/3751)) ([63671df](https://github.com/lerna/lerna/commit/63671df05a02429d39144df632f958ec8bf4a455))

## [7.0.2](https://github.com/lerna/lerna/compare/7.0.1...7.0.2) (2023-06-15)

**Note:** Version bump only for package lerna

## [7.0.1](https://github.com/lerna/lerna/compare/7.0.0...7.0.1) (2023-06-13)

**Note:** Version bump only for package lerna

# [7.0.0](https://github.com/lerna/lerna/compare/7.0.0-alpha.0...7.0.0) (2023-06-08)

### Bug Fixes

- bump cosmiconfig to v8 ([#3701](https://github.com/lerna/lerna/issues/3701)) ([898923d](https://github.com/lerna/lerna/commit/898923d198319d76ed5e37e553bfe3b27e43604c))
- internal cli.js should not be bundled ([53d73c6](https://github.com/lerna/lerna/commit/53d73c6aa9833e5a5bf60c2c78896456e77fab40))
- migration building/publishing issues ([27bf800](https://github.com/lerna/lerna/commit/27bf800b6e7670ea1ec5576fdf008e8d09897d4b))
- **publish:** use correct version in log messages ([#3702](https://github.com/lerna/lerna/issues/3702)) ([4be9188](https://github.com/lerna/lerna/commit/4be9188e68c5d4c320c0946e6e386cbee95a8efe))
- support nx 16.3.1+ ([#3707](https://github.com/lerna/lerna/issues/3707)) ([647dbb5](https://github.com/lerna/lerna/commit/647dbb512bf6a873cab6362c434b420b18af0ad4))

### Features

- add migration for adding $schema, increase some strictness ([73ceac3](https://github.com/lerna/lerna/commit/73ceac3dc2cf0e1246d4433cb101d1e794b2cca3))

# [7.0.0-alpha.8](https://github.com/lerna/lerna/compare/7.0.0-alpha.0...7.0.0-alpha.8) (2023-06-07)

### Bug Fixes

- bump cosmiconfig to v8 ([#3701](https://github.com/lerna/lerna/issues/3701)) ([898923d](https://github.com/lerna/lerna/commit/898923d198319d76ed5e37e553bfe3b27e43604c))
- internal cli.js should not be bundled ([53d73c6](https://github.com/lerna/lerna/commit/53d73c6aa9833e5a5bf60c2c78896456e77fab40))
- migration building/publishing issues ([27bf800](https://github.com/lerna/lerna/commit/27bf800b6e7670ea1ec5576fdf008e8d09897d4b))
- **publish:** use correct version in log messages ([#3702](https://github.com/lerna/lerna/issues/3702)) ([4be9188](https://github.com/lerna/lerna/commit/4be9188e68c5d4c320c0946e6e386cbee95a8efe))
- support nx 16.3.1+ ([#3707](https://github.com/lerna/lerna/issues/3707)) ([647dbb5](https://github.com/lerna/lerna/commit/647dbb512bf6a873cab6362c434b420b18af0ad4))

### Features

- add migration for adding $schema, increase some strictness ([73ceac3](https://github.com/lerna/lerna/commit/73ceac3dc2cf0e1246d4433cb101d1e794b2cca3))

# [7.0.0-alpha.7](https://github.com/lerna/lerna/compare/7.0.0-alpha.0...7.0.0-alpha.7) (2023-06-05)

### Bug Fixes

- bump cosmiconfig to v8 ([#3701](https://github.com/lerna/lerna/issues/3701)) ([898923d](https://github.com/lerna/lerna/commit/898923d198319d76ed5e37e553bfe3b27e43604c))
- internal cli.js should not be bundled ([53d73c6](https://github.com/lerna/lerna/commit/53d73c6aa9833e5a5bf60c2c78896456e77fab40))
- migration building/publishing issues ([27bf800](https://github.com/lerna/lerna/commit/27bf800b6e7670ea1ec5576fdf008e8d09897d4b))
- **publish:** use correct version in log messages ([#3702](https://github.com/lerna/lerna/issues/3702)) ([4be9188](https://github.com/lerna/lerna/commit/4be9188e68c5d4c320c0946e6e386cbee95a8efe))
- support nx 16.3.1+ ([#3707](https://github.com/lerna/lerna/issues/3707)) ([647dbb5](https://github.com/lerna/lerna/commit/647dbb512bf6a873cab6362c434b420b18af0ad4))

### Features

- add migration for adding $schema, increase some strictness ([73ceac3](https://github.com/lerna/lerna/commit/73ceac3dc2cf0e1246d4433cb101d1e794b2cca3))

# [7.0.0-alpha.6](https://github.com/lerna/lerna/compare/7.0.0-alpha.0...7.0.0-alpha.6) (2023-06-02)

### Bug Fixes

- bump cosmiconfig to v8 ([#3701](https://github.com/lerna/lerna/issues/3701)) ([898923d](https://github.com/lerna/lerna/commit/898923d198319d76ed5e37e553bfe3b27e43604c))
- internal cli.js should not be bundled ([53d73c6](https://github.com/lerna/lerna/commit/53d73c6aa9833e5a5bf60c2c78896456e77fab40))
- migration building/publishing issues ([27bf800](https://github.com/lerna/lerna/commit/27bf800b6e7670ea1ec5576fdf008e8d09897d4b))
- **publish:** use correct version in log messages ([#3702](https://github.com/lerna/lerna/issues/3702)) ([4be9188](https://github.com/lerna/lerna/commit/4be9188e68c5d4c320c0946e6e386cbee95a8efe))
- support nx 16.3.1+ ([#3707](https://github.com/lerna/lerna/issues/3707)) ([647dbb5](https://github.com/lerna/lerna/commit/647dbb512bf6a873cab6362c434b420b18af0ad4))

### Features

- add migration for adding $schema, increase some strictness ([73ceac3](https://github.com/lerna/lerna/commit/73ceac3dc2cf0e1246d4433cb101d1e794b2cca3))

# [7.0.0-alpha.5](https://github.com/lerna/lerna/compare/7.0.0-alpha.0...7.0.0-alpha.5) (2023-06-01)

### Bug Fixes

- bump cosmiconfig to v8 ([#3701](https://github.com/lerna/lerna/issues/3701)) ([898923d](https://github.com/lerna/lerna/commit/898923d198319d76ed5e37e553bfe3b27e43604c))
- internal cli.js should not be bundled ([53d73c6](https://github.com/lerna/lerna/commit/53d73c6aa9833e5a5bf60c2c78896456e77fab40))
- migration building/publishing issues ([27bf800](https://github.com/lerna/lerna/commit/27bf800b6e7670ea1ec5576fdf008e8d09897d4b))
- **publish:** use correct version in log messages ([#3702](https://github.com/lerna/lerna/issues/3702)) ([4be9188](https://github.com/lerna/lerna/commit/4be9188e68c5d4c320c0946e6e386cbee95a8efe))

### Features

- add migration for adding $schema, increase some strictness ([73ceac3](https://github.com/lerna/lerna/commit/73ceac3dc2cf0e1246d4433cb101d1e794b2cca3))

# [7.0.0-alpha.4](https://github.com/lerna/lerna/compare/7.0.0-alpha.0...7.0.0-alpha.4) (2023-06-01)

### Bug Fixes

- bump cosmiconfig to v8 ([#3701](https://github.com/lerna/lerna/issues/3701)) ([898923d](https://github.com/lerna/lerna/commit/898923d198319d76ed5e37e553bfe3b27e43604c))
- internal cli.js should not be bundled ([53d73c6](https://github.com/lerna/lerna/commit/53d73c6aa9833e5a5bf60c2c78896456e77fab40))
- migration building/publishing issues ([27bf800](https://github.com/lerna/lerna/commit/27bf800b6e7670ea1ec5576fdf008e8d09897d4b))
- **publish:** use correct version in log messages ([#3702](https://github.com/lerna/lerna/issues/3702)) ([4be9188](https://github.com/lerna/lerna/commit/4be9188e68c5d4c320c0946e6e386cbee95a8efe))

# [7.0.0-alpha.3](https://github.com/lerna/lerna/compare/7.0.0-alpha.0...7.0.0-alpha.3) (2023-05-31)

### Bug Fixes

- bump cosmiconfig to v8 ([#3701](https://github.com/lerna/lerna/issues/3701)) ([898923d](https://github.com/lerna/lerna/commit/898923d198319d76ed5e37e553bfe3b27e43604c))
- internal cli.js should not be bundled ([53d73c6](https://github.com/lerna/lerna/commit/53d73c6aa9833e5a5bf60c2c78896456e77fab40))
- migration building/publishing issues ([27bf800](https://github.com/lerna/lerna/commit/27bf800b6e7670ea1ec5576fdf008e8d09897d4b))

# [7.0.0-alpha.2](https://github.com/lerna/lerna/compare/7.0.0-alpha.0...7.0.0-alpha.2) (2023-05-31)

### Bug Fixes

- bump cosmiconfig to v8 ([#3701](https://github.com/lerna/lerna/issues/3701)) ([898923d](https://github.com/lerna/lerna/commit/898923d198319d76ed5e37e553bfe3b27e43604c))
- internal cli.js should not be bundled ([53d73c6](https://github.com/lerna/lerna/commit/53d73c6aa9833e5a5bf60c2c78896456e77fab40))

# [7.0.0-alpha.1](https://github.com/lerna/lerna/compare/7.0.0-alpha.0...7.0.0-alpha.1) (2023-05-31)

### Bug Fixes

- bump cosmiconfig to v8 ([#3701](https://github.com/lerna/lerna/issues/3701)) ([898923d](https://github.com/lerna/lerna/commit/898923d198319d76ed5e37e553bfe3b27e43604c))
- internal cli.js should not be bundled ([53d73c6](https://github.com/lerna/lerna/commit/53d73c6aa9833e5a5bf60c2c78896456e77fab40))

# [7.0.0-alpha.0](https://github.com/lerna/lerna/compare/6.6.2...7.0.0-alpha.0) (2023-05-10)

### Features

- **core:** convert commands to use nx project graph instead of legacy package graph ([#3667](https://github.com/lerna/lerna/issues/3667)) ([8e813c4](https://github.com/lerna/lerna/commit/8e813c46c543aa8e002a8982ca0b7f6afcee539e))
- do not include bootstrap, add, link commands by default ([#3658](https://github.com/lerna/lerna/issues/3658)) ([487d475](https://github.com/lerna/lerna/commit/487d4755e8602ab3694992dd7702a2dd08f55861))

### BREAKING CHANGES

- We no longer include the bootstrap, add, and link commands by default. We strongly recommend using your package manager (npm, yarn, pnpm) for package management related concerns such as installing and linking dependencies.

If you want to temporarily continue to use those commands in v7 you can do so by installing the @lerna/legacy-package-management package at the same version as your lerna version.

There will not be any active work done on these commands and you should look to migrate as soon as possible, please check out https://lerna.js.org for further guidance.

## [6.6.2](https://github.com/lerna/lerna/compare/6.6.1...6.6.2) (2023-05-04)

### Bug Fixes

- **deps:** bump pacote to latest to remove install warning ([#3624](https://github.com/lerna/lerna/issues/3624)) ([7c34521](https://github.com/lerna/lerna/commit/7c34521b9987b064638dd218b0b417546257d5f3))
- remove non-functional schema properties starting with "no" ([#3645](https://github.com/lerna/lerna/issues/3645)) ([43c2a48](https://github.com/lerna/lerna/commit/43c2a48fbba9e02675032aba15e1b4bb1f89a0ef))

## [6.6.1](https://github.com/lerna/lerna/compare/6.6.0...6.6.1) (2023-03-24)

### Bug Fixes

- build-metadata reference in lerna schema ([e2349ad](https://github.com/lerna/lerna/commit/e2349ad4f529c307ea69d21698a2ab53f5a9d6b4))
- **deps:** update to rimraf v4, remove path-exists ([#3616](https://github.com/lerna/lerna/issues/3616)) ([2f2ee2a](https://github.com/lerna/lerna/commit/2f2ee2a02091e2c9e35feaabc8f202f77407a408))
- lerna schema type for contents should be string ([1625757](https://github.com/lerna/lerna/commit/162575758e9422f2c05fc741ead370eaf793cb57))

# [6.6.0](https://github.com/lerna/lerna/compare/6.5.1...6.6.0) (2023-03-23)

### Bug Fixes

- update arborist package to get rid of deprecated warning ([#3559](https://github.com/lerna/lerna/issues/3559)) ([aff38a7](https://github.com/lerna/lerna/commit/aff38a7a0f5e5eea04d1743e78add9b2e052de3a))

### Features

- add @lerna/legacy-package-management package ([#3602](https://github.com/lerna/lerna/issues/3602)) ([4a03dd5](https://github.com/lerna/lerna/commit/4a03dd5f02c118eb683cf2ed525715b4d8e5221b))
- **version:** add user-defined build metadata to bumped packages ([#2880](https://github.com/lerna/lerna/issues/2880)) ([0b0e2a6](https://github.com/lerna/lerna/commit/0b0e2a62257ad8728835057dc37654626cbd621e))

## [6.5.1](https://github.com/lerna/lerna/compare/6.5.0...6.5.1) (2023-02-14)

### Bug Fixes

- add missing dependency on js-yaml ([187f480](https://github.com/lerna/lerna/commit/187f4804b8406a6472425de21dd89482c382b1b4))

# [6.5.0](https://github.com/lerna/lerna/compare/v6.4.1...6.5.0) (2023-02-13)

### Features

- **publish:** add --include-private option for testing private packages ([#3503](https://github.com/lerna/lerna/issues/3503)) ([fa1f490](https://github.com/lerna/lerna/commit/fa1f4900a658982d87888c1c7c5eef3697c5b31b))

## [6.4.1](https://github.com/lerna/lerna/compare/v6.4.0...v6.4.1) (2023-01-12)

### Bug Fixes

- **run:** resolve erroneous failures ([#3495](https://github.com/lerna/lerna/issues/3495)) ([24d0d5c](https://github.com/lerna/lerna/commit/24d0d5c43b857f8da0d2e06b76bb3ee79fda51ff))

# [6.4.0](https://github.com/lerna/lerna/compare/v6.3.0...v6.4.0) (2023-01-05)

### Features

- **watch:** Add `lerna watch` command ([#3466](https://github.com/lerna/lerna/issues/3466)) ([008b995](https://github.com/lerna/lerna/commit/008b995caab549c0707068e748e4f429bd729afa))

# [6.3.0](https://github.com/lerna/lerna/compare/v6.2.0...v6.3.0) (2022-12-26)

### Features

- **version:** use npmClientArgs in npm install after lerna version ([#3434](https://github.com/lerna/lerna/issues/3434)) ([e019e3f](https://github.com/lerna/lerna/commit/e019e3f7fcb94cbd9da0a4ab69cb38b9c42ffdcd))

# [6.2.0](https://github.com/lerna/lerna/compare/v6.1.0...v6.2.0) (2022-12-13)

### Bug Fixes

- **schema:** add the other format changelogPreset can assume ([#3441](https://github.com/lerna/lerna/issues/3441)) ([d286973](https://github.com/lerna/lerna/commit/d286973d7c2c9b43db65b903f94debd21bafd76e))

### Features

- **publish:** add --summary-file option ([#2653](https://github.com/lerna/lerna/issues/2653)) ([027d943](https://github.com/lerna/lerna/commit/027d9433b7bb0ca1de5fa593ed411e012af57623))

# [6.1.0](https://github.com/lerna/lerna/compare/v6.0.3...v6.1.0) (2022-11-29)

### Features

- **version:** bump prerelease versions from conventional commits ([#3362](https://github.com/lerna/lerna/issues/3362)) ([2288b3a](https://github.com/lerna/lerna/commit/2288b3aca4753b3943ea845ef8785321e5f77610))

## [6.0.3](https://github.com/lerna/lerna/compare/v6.0.2...v6.0.3) (2022-11-07)

**Note:** Version bump only for package lerna

## [6.0.2](https://github.com/lerna/lerna/compare/v6.0.1...v6.0.2) (2022-11-02)

**Note:** Version bump only for package lerna

## [6.0.1](https://github.com/lerna/lerna/compare/v6.0.0...v6.0.1) (2022-10-14)

### Bug Fixes

- **run:** allow for loading of env files to be skipped ([#3375](https://github.com/lerna/lerna/issues/3375)) ([5dbd904](https://github.com/lerna/lerna/commit/5dbd904009ede4cc952fc7f8cbafebf6b12d81a1))

# [6.0.0](https://github.com/lerna/lerna/compare/v6.0.0-alpha.2...v6.0.0) (2022-10-12)

**Note:** Version bump only for package lerna

# [6.0.0-alpha.2](https://github.com/lerna/lerna/compare/v6.0.0-alpha.1...v6.0.0-alpha.2) (2022-10-12)

### Bug Fixes

- **run:** update docs for v6 ([#3366](https://github.com/lerna/lerna/issues/3366)) ([130f490](https://github.com/lerna/lerna/commit/130f4906bee3e240ea9ad9245dfb0fe208668dae))

# [6.0.0-alpha.1](https://github.com/lerna/lerna/compare/v5.6.2...v6.0.0-alpha.1) (2022-10-09)

# [6.0.0-alpha.0](https://github.com/lerna/lerna/compare/v5.6.1...v6.0.0-alpha.0) (2022-10-07)

**Note:** Version bump only for package lerna

## [5.6.2](https://github.com/lerna/lerna/compare/v5.6.1...v5.6.2) (2022-10-09)

**Note:** Version bump only for package lerna

## [5.6.1](https://github.com/lerna/lerna/compare/v5.6.0...v5.6.1) (2022-09-30)

### Bug Fixes

- **add-caching:** ensure lerna.json is configured automatically ([9677cda](https://github.com/lerna/lerna/commit/9677cda7c9e16ae3cc02cd01c7b1087d81095750))

# [5.6.0](https://github.com/lerna/lerna/compare/v5.5.4...v5.6.0) (2022-09-29)

### Features

- **core:** add add-caching command ([#3350](https://github.com/lerna/lerna/issues/3350)) ([ef09a06](https://github.com/lerna/lerna/commit/ef09a06ffc30384194fb120307269f49e4ebc54b))
- **repair:** add lerna repair command ([#3314](https://github.com/lerna/lerna/issues/3314)) ([7defab3](https://github.com/lerna/lerna/commit/7defab3434687fc8e17f921250846aa279ac3df3))

## [5.5.4](https://github.com/lerna/lerna/compare/v5.5.3...v5.5.4) (2022-09-28)

**Note:** Version bump only for package lerna

## [5.5.3](https://github.com/lerna/lerna/compare/v5.5.2...v5.5.3) (2022-09-28)

**Note:** Version bump only for package lerna

## [5.5.2](https://github.com/lerna/lerna/compare/v5.5.1...v5.5.2) (2022-09-20)

**Note:** Version bump only for package lerna

## [5.5.1](https://github.com/lerna/lerna/compare/v5.5.0...v5.5.1) (2022-09-09)

### Bug Fixes

- **run:** exclude dependencies with --scope when nx.json is not present ([#3316](https://github.com/lerna/lerna/issues/3316)) ([99a13a9](https://github.com/lerna/lerna/commit/99a13a9bae2020f2773d21c4109148a59b1ec2d6))

# [5.5.0](https://github.com/lerna/lerna/compare/v5.4.3...v5.5.0) (2022-08-31)

### Features

- pnpm workspaces support ([#3284](https://github.com/lerna/lerna/issues/3284)) ([1b18dbe](https://github.com/lerna/lerna/commit/1b18dbeb03e98c70b5428a9fe457781a59f8d65d))
- **repair:** add lerna repair command ([#3302](https://github.com/lerna/lerna/issues/3302)) ([aae1a2b](https://github.com/lerna/lerna/commit/aae1a2bed1cd2d61ed7b86013d7e6108415cfbcd))

### Reverts

- Revert "feat(repair): add lerna repair command" (#3313) ([d261112](https://github.com/lerna/lerna/commit/d261112ede3256ec1c68a22943ae8854ec9fb906)), closes [#3313](https://github.com/lerna/lerna/issues/3313) [#3302](https://github.com/lerna/lerna/issues/3302)

## [5.4.3](https://github.com/lerna/lerna/compare/v5.4.2...v5.4.3) (2022-08-16)

**Note:** Version bump only for package lerna

## [5.4.2](https://github.com/lerna/lerna/compare/v5.4.1...v5.4.2) (2022-08-14)

**Note:** Version bump only for package lerna

## [5.4.1](https://github.com/lerna/lerna/compare/v5.4.0...v5.4.1) (2022-08-12)

**Note:** Version bump only for package lerna

# [5.4.0](https://github.com/lerna/lerna/compare/v5.3.0...v5.4.0) (2022-08-08)

### Bug Fixes

- **core:** update nx version range base to latest ([#3283](https://github.com/lerna/lerna/issues/3283)) ([241cdde](https://github.com/lerna/lerna/commit/241cdded18cbec4161e0bde675adbcf60e5ea5a8))

# [5.3.0](https://github.com/lerna/lerna/compare/v5.2.0...v5.3.0) (2022-07-27)

### Features

- **publish:** include all dependencies in package graph by default, allow no-sort ([#3263](https://github.com/lerna/lerna/issues/3263)) ([3b0c79c](https://github.com/lerna/lerna/commit/3b0c79cd9ea2abb9399b22cb05348b9b2c31fdce))

# [5.2.0](https://github.com/lerna/lerna/compare/v5.1.8...v5.2.0) (2022-07-22)

### Features

- add json schema for lerna.json ([#3229](https://github.com/lerna/lerna/issues/3229)) ([5075eae](https://github.com/lerna/lerna/commit/5075eae0d0aa8db52f619b9a6d8fdc9934ba24f7))
- **init:** default useNx and useWorkspaces to true for new lerna workspaces ([#3255](https://github.com/lerna/lerna/issues/3255)) ([a0e83e5](https://github.com/lerna/lerna/commit/a0e83e5220f6e3d30b96b60bbaf14c5392653c2e))

## [5.1.8](https://github.com/lerna/lerna/compare/v5.1.7...v5.1.8) (2022-07-07)

**Note:** Version bump only for package lerna

## [5.1.7](https://github.com/lerna/lerna/compare/v5.1.6...v5.1.7) (2022-07-06)

**Note:** Version bump only for package lerna

## [5.1.6](https://github.com/lerna/lerna/compare/v5.1.5...v5.1.6) (2022-06-24)

**Note:** Version bump only for package lerna

## [5.1.5](https://github.com/lerna/lerna/compare/v5.1.4...v5.1.5) (2022-06-24)

**Note:** Version bump only for package lerna

## [5.1.4](https://github.com/lerna/lerna/compare/v5.1.3...v5.1.4) (2022-06-15)

**Note:** Version bump only for package lerna

## [5.1.3](https://github.com/lerna/lerna/compare/v5.1.2...v5.1.3) (2022-06-15)

**Note:** Version bump only for package lerna

## [5.1.2](https://github.com/lerna/lerna/compare/v5.1.1...v5.1.2) (2022-06-13)

### Bug Fixes

- update all transitive inclusions of ansi-regex ([#3166](https://github.com/lerna/lerna/issues/3166)) ([56eaa15](https://github.com/lerna/lerna/commit/56eaa153283be3b1e7d7793d3266fc51801fad8e))

## [5.1.1](https://github.com/lerna/lerna/compare/v5.1.0...v5.1.1) (2022-06-09)

### Bug Fixes

- allow maintenance LTS node 14 engines starting at 14.15.0 ([#3161](https://github.com/lerna/lerna/issues/3161)) ([72305e4](https://github.com/lerna/lerna/commit/72305e4dbab607a2d87ae4efa6ee577c93a9dda9))

# [5.1.0](https://github.com/lerna/lerna/compare/v5.0.0...v5.1.0) (2022-06-07)

**Note:** Version bump only for package lerna

# [5.1.0-alpha.0](https://github.com/lerna/lerna/compare/v4.0.0...v5.1.0-alpha.0) (2022-05-25)

**Note:** Version bump only for package lerna

# [5.0.0](https://github.com/lerna/lerna/compare/v4.0.0...v5.0.0) (2022-05-24)

**Note:** Version bump only for package lerna

# [4.0.0](https://github.com/lerna/lerna/compare/v3.22.1...v4.0.0) (2021-02-10)

### Features

- Consume named exports of sibling modules ([63499e3](https://github.com/lerna/lerna/commit/63499e33652bc78fe23751875d74017e2f16a689))
- **deps:** import-local@^3.0.2 ([e0e74d4](https://github.com/lerna/lerna/commit/e0e74d46c61ae884c1a27627c6e77e488061c9ba))
- Drop support for Node v6.x & v8.x ([ff4bb4d](https://github.com/lerna/lerna/commit/ff4bb4da215555e3bb136f5af09b5cbc631e57bb))

### BREAKING CHANGES

- Node v6.x & v8.x are no longer supported. Please upgrade to the latest LTS release.

Here's the gnarly one-liner I used to make these changes:

```
npx lerna exec --concurrency 1 --stream -- 'json -I -f package.json -e '"'"'this.engines=this.engines||{};this.engines.node=">= 10.18.0"'"'"
```

(requires `npm i -g json` beforehand)

## [3.22.1](https://github.com/lerna/lerna/compare/v3.22.0...v3.22.1) (2020-06-09)

**Note:** Version bump only for package lerna

# [3.22.0](https://github.com/lerna/lerna/compare/v3.21.0...v3.22.0) (2020-05-24)

**Note:** Version bump only for package lerna

# [3.21.0](https://github.com/lerna/lerna/compare/v3.20.2...v3.21.0) (2020-05-13)

**Note:** Version bump only for package lerna

## [3.20.2](https://github.com/lerna/lerna/compare/v3.20.1...v3.20.2) (2020-01-02)

**Note:** Version bump only for package lerna

## [3.20.1](https://github.com/lerna/lerna/compare/v3.20.0...v3.20.1) (2019-12-29)

**Note:** Version bump only for package lerna

# [3.20.0](https://github.com/lerna/lerna/compare/v3.19.0...v3.20.0) (2019-12-27)

### Features

- **cli:** Add new `info` command to output information about local environment ([#2106](https://github.com/lerna/lerna/issues/2106)) ([7abfe43](https://github.com/lerna/lerna/commit/7abfe43426197fbc7f18c44b0c994324609fc769))

# [3.19.0](https://github.com/lerna/lerna/compare/v3.18.5...v3.19.0) (2019-11-20)

**Note:** Version bump only for package lerna

## [3.18.5](https://github.com/lerna/lerna/compare/v3.18.4...v3.18.5) (2019-11-20)

**Note:** Version bump only for package lerna

## [3.18.4](https://github.com/lerna/lerna/compare/v3.18.3...v3.18.4) (2019-11-08)

**Note:** Version bump only for package lerna

## [3.18.3](https://github.com/lerna/lerna/compare/v3.18.2...v3.18.3) (2019-10-22)

**Note:** Version bump only for package lerna

## [3.18.2](https://github.com/lerna/lerna/compare/v3.18.1...v3.18.2) (2019-10-21)

**Note:** Version bump only for package lerna

## [3.18.1](https://github.com/lerna/lerna/compare/v3.18.0...v3.18.1) (2019-10-15)

**Note:** Version bump only for package lerna

# [3.18.0](https://github.com/lerna/lerna/compare/v3.17.0...v3.18.0) (2019-10-15)

### Features

- Upgrade to yargs@14 ([5e60213](https://github.com/lerna/lerna/commit/5e60213e93e3ee229a9341a14e420ed2401001dd))

# [3.17.0](https://github.com/lerna/lerna/compare/v3.16.5...v3.17.0) (2019-10-10)

**Note:** Version bump only for package lerna

## [3.16.5](https://github.com/lerna/lerna/compare/v3.16.4...v3.16.5) (2019-10-07)

**Note:** Version bump only for package lerna

## [3.16.4](https://github.com/lerna/lerna/compare/v3.16.3...v3.16.4) (2019-07-24)

**Note:** Version bump only for package lerna

## [3.16.3](https://github.com/lerna/lerna/compare/v3.16.2...v3.16.3) (2019-07-23)

**Note:** Version bump only for package lerna

## [3.16.2](https://github.com/lerna/lerna/compare/v3.16.1...v3.16.2) (2019-07-22)

**Note:** Version bump only for package lerna

## [3.16.1](https://github.com/lerna/lerna/compare/v3.16.0...v3.16.1) (2019-07-19)

**Note:** Version bump only for package lerna

# [3.16.0](https://github.com/lerna/lerna/compare/v3.15.0...v3.16.0) (2019-07-18)

### Features

- **deps:** `import-local@^2.0.0` ([14d2c66](https://github.com/lerna/lerna/commit/14d2c66))

# [3.15.0](https://github.com/lerna/lerna/compare/v3.14.2...v3.15.0) (2019-06-09)

**Note:** Version bump only for package lerna

## [3.14.2](https://github.com/lerna/lerna/compare/v3.14.1...v3.14.2) (2019-06-09)

**Note:** Version bump only for package lerna

## [3.14.1](https://github.com/lerna/lerna/compare/v3.14.0...v3.14.1) (2019-05-15)

**Note:** Version bump only for package lerna

# [3.14.0](https://github.com/lerna/lerna/compare/v3.13.4...v3.14.0) (2019-05-14)

**Note:** Version bump only for package lerna

## [3.13.4](https://github.com/lerna/lerna/compare/v3.13.3...v3.13.4) (2019-04-24)

**Note:** Version bump only for package lerna

## [3.13.3](https://github.com/lerna/lerna/compare/v3.13.2...v3.13.3) (2019-04-17)

**Note:** Version bump only for package lerna

## [3.13.2](https://github.com/lerna/lerna/compare/v3.13.1...v3.13.2) (2019-04-08)

**Note:** Version bump only for package lerna

## [3.13.1](https://github.com/lerna/lerna/compare/v3.13.0...v3.13.1) (2019-02-26)

**Note:** Version bump only for package lerna

# [3.13.0](https://github.com/lerna/lerna/compare/v3.12.1...v3.13.0) (2019-02-15)

### Features

- **meta:** Add `repository.directory` field to package.json ([aec5023](https://github.com/lerna/lerna/commit/aec5023))
- **meta:** Normalize package.json `homepage` field ([abeb4dc](https://github.com/lerna/lerna/commit/abeb4dc))

## [3.12.1](https://github.com/lerna/lerna/compare/v3.12.0...v3.12.1) (2019-02-14)

**Note:** Version bump only for package lerna

# [3.12.0](https://github.com/lerna/lerna/compare/v3.11.1...v3.12.0) (2019-02-14)

**Note:** Version bump only for package lerna

## [3.11.1](https://github.com/lerna/lerna/compare/v3.11.0...v3.11.1) (2019-02-11)

**Note:** Version bump only for package lerna

# [3.11.0](https://github.com/lerna/lerna/compare/v3.10.8...v3.11.0) (2019-02-08)

### Bug Fixes

- **deps:** Explicit npmlog ^4.1.2 ([571c2e2](https://github.com/lerna/lerna/commit/571c2e2))
- **deps:** Remove unused libnpm (replaced by direct sub-packages) ([1caeb28](https://github.com/lerna/lerna/commit/1caeb28))

## [3.10.8](https://github.com/lerna/lerna/compare/v3.10.7...v3.10.8) (2019-02-01)

**Note:** Version bump only for package lerna

## [3.10.7](https://github.com/lerna/lerna/compare/v3.10.6...v3.10.7) (2019-01-22)

**Note:** Version bump only for package lerna

## [3.10.6](https://github.com/lerna/lerna/compare/v3.10.5...v3.10.6) (2019-01-19)

**Note:** Version bump only for package lerna

## [3.10.5](https://github.com/lerna/lerna/compare/v3.10.4...v3.10.5) (2019-01-11)

**Note:** Version bump only for package lerna

## [3.10.4](https://github.com/lerna/lerna/compare/v3.10.3...v3.10.4) (2019-01-10)

**Note:** Version bump only for package lerna

## [3.10.3](https://github.com/lerna/lerna/compare/v3.10.2...v3.10.3) (2019-01-10)

**Note:** Version bump only for package lerna

## [3.10.2](https://github.com/lerna/lerna/compare/v3.10.1...v3.10.2) (2019-01-09)

**Note:** Version bump only for package lerna

## [3.10.1](https://github.com/lerna/lerna/compare/v3.10.0...v3.10.1) (2019-01-09)

**Note:** Version bump only for package lerna

# [3.10.0](https://github.com/lerna/lerna/compare/v3.9.1...v3.10.0) (2019-01-08)

**Note:** Version bump only for package lerna

## [3.9.1](https://github.com/lerna/lerna/compare/v3.9.0...v3.9.1) (2019-01-08)

**Note:** Version bump only for package lerna

# [3.9.0](https://github.com/lerna/lerna/compare/v3.8.5...v3.9.0) (2019-01-08)

**Note:** Version bump only for package lerna

## [3.8.5](https://github.com/lerna/lerna/compare/v3.8.4...v3.8.5) (2019-01-05)

**Note:** Version bump only for package lerna

## [3.8.4](https://github.com/lerna/lerna/compare/v3.8.3...v3.8.4) (2019-01-03)

**Note:** Version bump only for package lerna

## [3.8.3](https://github.com/lerna/lerna/compare/v3.8.2...v3.8.3) (2019-01-03)

**Note:** Version bump only for package lerna

## [3.8.2](https://github.com/lerna/lerna/compare/v3.8.1...v3.8.2) (2019-01-03)

**Note:** Version bump only for package lerna

## [3.8.1](https://github.com/lerna/lerna/compare/v3.8.0...v3.8.1) (2018-12-31)

**Note:** Version bump only for package lerna

# [3.8.0](https://github.com/lerna/lerna/compare/v3.7.2...v3.8.0) (2018-12-21)

**Note:** Version bump only for package lerna

## [3.7.2](https://github.com/lerna/lerna/compare/v3.7.1...v3.7.2) (2018-12-21)

**Note:** Version bump only for package lerna

## [3.7.1](https://github.com/lerna/lerna/compare/v3.7.0...v3.7.1) (2018-12-20)

**Note:** Version bump only for package lerna

# [3.7.0](https://github.com/lerna/lerna/compare/v3.6.0...v3.7.0) (2018-12-19)

**Note:** Version bump only for package lerna

# [3.6.0](https://github.com/lerna/lerna/compare/v3.5.1...v3.6.0) (2018-12-07)

### Features

- Migrate existing usage to libnpm ([0d3a786](https://github.com/lerna/lerna/commit/0d3a786)), closes [#1767](https://github.com/lerna/lerna/issues/1767)

## [3.5.1](https://github.com/lerna/lerna/compare/v3.5.0...v3.5.1) (2018-11-29)

**Note:** Version bump only for package lerna

# [3.5.0](https://github.com/lerna/lerna/compare/v3.4.3...v3.5.0) (2018-11-27)

**Note:** Version bump only for package lerna

## [3.4.3](https://github.com/lerna/lerna/compare/v3.4.2...v3.4.3) (2018-10-10)

**Note:** Version bump only for package lerna

## [3.4.2](https://github.com/lerna/lerna/compare/v3.4.1...v3.4.2) (2018-10-09)

**Note:** Version bump only for package lerna

## [3.4.1](https://github.com/lerna/lerna/compare/v3.4.0...v3.4.1) (2018-10-04)

**Note:** Version bump only for package lerna

<a name="3.4.0"></a>

# [3.4.0](https://github.com/lerna/lerna/compare/v3.3.2...v3.4.0) (2018-09-14)

**Note:** Version bump only for package lerna

<a name="3.3.2"></a>

## [3.3.2](https://github.com/lerna/lerna/compare/v3.3.1...v3.3.2) (2018-09-12)

**Note:** Version bump only for package lerna

<a name="3.3.1"></a>

## [3.3.1](https://github.com/lerna/lerna/compare/v3.3.0...v3.3.1) (2018-09-11)

**Note:** Version bump only for package lerna

<a name="3.3.0"></a>

# [3.3.0](https://github.com/lerna/lerna/compare/v3.2.1...v3.3.0) (2018-09-06)

**Note:** Version bump only for package lerna

<a name="3.2.1"></a>

## [3.2.1](https://github.com/lerna/lerna/compare/v3.2.0...v3.2.1) (2018-08-28)

**Note:** Version bump only for package lerna

<a name="3.2.0"></a>

# [3.2.0](https://github.com/lerna/lerna/compare/v3.1.4...v3.2.0) (2018-08-28)

### Features

- **cli:** Configure commands in root package, all other bits in cli package ([7200fd0](https://github.com/lerna/lerna/commit/7200fd0)), closes [#1584](https://github.com/lerna/lerna/issues/1584)

<a name="3.1.4"></a>

## [3.1.4](https://github.com/lerna/lerna/compare/v3.1.3...v3.1.4) (2018-08-21)

**Note:** Version bump only for package lerna

<a name="3.1.3"></a>

## [3.1.3](https://github.com/lerna/lerna/compare/v3.1.2...v3.1.3) (2018-08-21)

**Note:** Version bump only for package lerna

<a name="3.1.2"></a>

## [3.1.2](https://github.com/lerna/lerna/compare/v3.1.1...v3.1.2) (2018-08-20)

**Note:** Version bump only for package lerna

<a name="3.1.1"></a>

## [3.1.1](https://github.com/lerna/lerna/compare/v3.1.0...v3.1.1) (2018-08-17)

**Note:** Version bump only for package lerna

<a name="3.1.0"></a>

# [3.1.0](https://github.com/lerna/lerna/compare/v3.0.6...v3.1.0) (2018-08-17)

**Note:** Version bump only for package lerna

<a name="3.0.6"></a>

## [3.0.6](https://github.com/lerna/lerna/compare/v3.0.5...v3.0.6) (2018-08-16)

**Note:** Version bump only for package lerna

<a name="3.0.5"></a>

## [3.0.5](https://github.com/lerna/lerna/compare/v3.0.4...v3.0.5) (2018-08-15)

**Note:** Version bump only for package lerna

<a name="3.0.4"></a>

## [3.0.4](https://github.com/lerna/lerna/compare/v3.0.3...v3.0.4) (2018-08-14)

**Note:** Version bump only for package lerna

<a name="3.0.3"></a>

## [3.0.3](https://github.com/lerna/lerna/compare/v3.0.2...v3.0.3) (2018-08-11)

**Note:** Version bump only for package lerna

<a name="3.0.2"></a>

## [3.0.2](https://github.com/lerna/lerna/compare/v3.0.1...v3.0.2) (2018-08-11)

**Note:** Version bump only for package lerna

<a name="3.0.1"></a>

## [3.0.1](https://github.com/lerna/lerna/compare/v3.0.0...v3.0.1) (2018-08-10)

**Note:** Version bump only for package lerna

<a name="3.0.0"></a>

# [3.0.0](https://github.com/lerna/lerna/compare/v3.0.0-rc.0...v3.0.0) (2018-08-10)

**Note:** Version bump only for package lerna

<a name="3.0.0-rc.0"></a>

# [3.0.0-rc.0](https://github.com/lerna/lerna/compare/v3.0.0-beta.21...v3.0.0-rc.0) (2018-07-27)

**Note:** Version bump only for package lerna

<a name="3.0.0-beta.21"></a>

# [3.0.0-beta.21](https://github.com/lerna/lerna/compare/v3.0.0-beta.20...v3.0.0-beta.21) (2018-05-12)

**Note:** Version bump only for package lerna

<a name="3.0.0-beta.20"></a>

# [3.0.0-beta.20](https://github.com/lerna/lerna/compare/v3.0.0-beta.19...v3.0.0-beta.20) (2018-05-07)

**Note:** Version bump only for package lerna

<a name="3.0.0-beta.19"></a>

# [3.0.0-beta.19](https://github.com/lerna/lerna/compare/v3.0.0-beta.18...v3.0.0-beta.19) (2018-05-03)

**Note:** Version bump only for package lerna

<a name="3.0.0-beta.18"></a>

# [3.0.0-beta.18](https://github.com/lerna/lerna/compare/v3.0.0-beta.17...v3.0.0-beta.18) (2018-04-24)

**Note:** Version bump only for package lerna

<a name="3.0.0-beta.17"></a>

# [3.0.0-beta.17](https://github.com/lerna/lerna/compare/v3.0.0-beta.16...v3.0.0-beta.17) (2018-04-13)

**Note:** Version bump only for package lerna

<a name="3.0.0-beta.16"></a>

# [3.0.0-beta.16](https://github.com/lerna/lerna/compare/v3.0.0-beta.15...v3.0.0-beta.16) (2018-04-10)

**Note:** Version bump only for package lerna

<a name="3.0.0-beta.15"></a>

# [3.0.0-beta.15](https://github.com/lerna/lerna/compare/v3.0.0-beta.14...v3.0.0-beta.15) (2018-04-09)

**Note:** Version bump only for package lerna

<a name="3.0.0-beta.14"></a>

# [3.0.0-beta.14](https://github.com/lerna/lerna/compare/v3.0.0-beta.13...v3.0.0-beta.14) (2018-04-03)

**Note:** Version bump only for package lerna

<a name="3.0.0-beta.13"></a>

# [3.0.0-beta.13](https://github.com/lerna/lerna/compare/v3.0.0-beta.12...v3.0.0-beta.13) (2018-03-31)

**Note:** Version bump only for package lerna

<a name="3.0.0-beta.12"></a>

# [3.0.0-beta.12](https://github.com/lerna/lerna/compare/v3.0.0-beta.11...v3.0.0-beta.12) (2018-03-30)

**Note:** Version bump only for package lerna

<a name="3.0.0-beta.11"></a>

# [3.0.0-beta.11](https://github.com/lerna/lerna/compare/v3.0.0-beta.10...v3.0.0-beta.11) (2018-03-29)

**Note:** Version bump only for package lerna

<a name="3.0.0-beta.10"></a>

# [3.0.0-beta.10](https://github.com/lerna/lerna/compare/v3.0.0-beta.9...v3.0.0-beta.10) (2018-03-27)

**Note:** Version bump only for package lerna

<a name="3.0.0-beta.9"></a>

# [3.0.0-beta.9](https://github.com/lerna/lerna/compare/v3.0.0-beta.8...v3.0.0-beta.9) (2018-03-24)

**Note:** Version bump only for package lerna

<a name="3.0.0-beta.8"></a>

# [3.0.0-beta.8](https://github.com/lerna/lerna/compare/v3.0.0-beta.7...v3.0.0-beta.8) (2018-03-22)

**Note:** Version bump only for package lerna

<a name="3.0.0-beta.7"></a>

# [3.0.0-beta.7](https://github.com/lerna/lerna/compare/v3.0.0-beta.6...v3.0.0-beta.7) (2018-03-20)

### Bug Fixes

- **cli:** Retrieve correct version ([bb2c5e8](https://github.com/lerna/lerna/commit/bb2c5e8))

<a name="3.0.0-beta.6"></a>

# [3.0.0-beta.6](https://github.com/lerna/lerna/compare/v3.0.0-beta.5...v3.0.0-beta.6) (2018-03-19)

**Note:** Version bump only for package lerna

<a name="3.0.0-beta.5"></a>

# [3.0.0-beta.5](https://github.com/lerna/lerna/compare/v3.0.0-beta.4...v3.0.0-beta.5) (2018-03-19)

**Note:** Version bump only for package lerna

<a name="3.0.0-beta.4"></a>

# [3.0.0-beta.4](https://github.com/lerna/lerna/compare/v3.0.0-beta.3...v3.0.0-beta.4) (2018-03-19)

**Note:** Version bump only for package lerna

<a name="3.0.0-beta.3"></a>

# [3.0.0-beta.3](https://github.com/lerna/lerna/compare/v3.0.0-beta.2...v3.0.0-beta.3) (2018-03-15)

**Note:** Version bump only for package lerna

<a name="3.0.0-beta.2"></a>

# [3.0.0-beta.2](https://github.com/lerna/lerna/compare/v3.0.0-beta.1...v3.0.0-beta.2) (2018-03-10)

**Note:** Version bump only for package lerna

<a name="3.0.0-beta.1"></a>

# [3.0.0-beta.1](https://github.com/lerna/lerna/compare/v3.0.0-beta.0...v3.0.0-beta.1) (2018-03-09)

**Note:** Version bump only for package lerna
