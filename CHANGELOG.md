# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [6.6.1](https://github.com/lerna/lerna/compare/6.6.0...6.6.1) (2023-03-24)

### Bug Fixes

- build-metadata reference in lerna schema ([e2349ad](https://github.com/lerna/lerna/commit/e2349ad4f529c307ea69d21698a2ab53f5a9d6b4))
- **deps:** update to rimraf v4, remove path-exists ([#3616](https://github.com/lerna/lerna/issues/3616)) ([2f2ee2a](https://github.com/lerna/lerna/commit/2f2ee2a02091e2c9e35feaabc8f202f77407a408))
- ensure rimraf bin dir can always be resolved ([#3614](https://github.com/lerna/lerna/issues/3614)) ([0fe5faf](https://github.com/lerna/lerna/commit/0fe5fafb28a47cb80c7d8ea4fb4e152b6ed0d978))
- handle trailing commas and comments in lerna.json files ([#3603](https://github.com/lerna/lerna/issues/3603)) ([b826398](https://github.com/lerna/lerna/commit/b826398b6da61b6b3a0e972211fb3a8ec68654f3))
- lerna schema type for contents should be string ([1625757](https://github.com/lerna/lerna/commit/162575758e9422f2c05fc741ead370eaf793cb57))
- **publish:** use updated version with pnpm workspaces ([#3606](https://github.com/lerna/lerna/issues/3606)) ([cd7ad21](https://github.com/lerna/lerna/commit/cd7ad211212bd18e4876703a26d53df4b77f2d38))

# [6.6.0](https://github.com/lerna/lerna/compare/6.5.1...6.6.0) (2023-03-23)

### Bug Fixes

- correct links to command docs ([#3598](https://github.com/lerna/lerna/issues/3598)) ([b90b684](https://github.com/lerna/lerna/commit/b90b684976e33b18f1a856657dbc9a9546fe2c66))
- **publish:** ensure zero exit code when EWORKINGTREE warning occurs ([#3327](https://github.com/lerna/lerna/issues/3327)) ([9c00a33](https://github.com/lerna/lerna/commit/9c00a33b18046b6f0a5a20d7043a4f0bb309d9c4))
- update `troubleshooting.md` typo ([#3581](https://github.com/lerna/lerna/issues/3581)) ([a174cd7](https://github.com/lerna/lerna/commit/a174cd78165c5e9f05bf160891d927177ed7b948))
- update arborist package to get rid of deprecated warning ([#3559](https://github.com/lerna/lerna/issues/3559)) ([aff38a7](https://github.com/lerna/lerna/commit/aff38a7a0f5e5eea04d1743e78add9b2e052de3a))
- **version:** handle deps property missing due to outdated lockfile ([#3549](https://github.com/lerna/lerna/issues/3549)) ([fdbbab9](https://github.com/lerna/lerna/commit/fdbbab9c2cb96ac9e97018129bbdb5347c0e6171))
- **version:** update yarn lock for versions of yarn >= 2.0.0 ([#3555](https://github.com/lerna/lerna/issues/3555)) ([ce2ceca](https://github.com/lerna/lerna/commit/ce2ceca7defd06fc2c8abf0241cbb2c3dcfaf0f3))

### Features

- add @lerna/legacy-package-management package ([#3602](https://github.com/lerna/lerna/issues/3602)) ([4a03dd5](https://github.com/lerna/lerna/commit/4a03dd5f02c118eb683cf2ed525715b4d8e5221b))
- **version:** add user-defined build metadata to bumped packages ([#2880](https://github.com/lerna/lerna/issues/2880)) ([0b0e2a6](https://github.com/lerna/lerna/commit/0b0e2a62257ad8728835057dc37654626cbd621e))

## [6.5.1](https://github.com/lerna/lerna/compare/6.5.0...6.5.1) (2023-02-14)

### Bug Fixes

- add missing dependency on js-yaml ([187f480](https://github.com/lerna/lerna/commit/187f4804b8406a6472425de21dd89482c382b1b4))

### Reverts

- Revert "chore: bump nx-cloud" (#3539) ([3360981](https://github.com/lerna/lerna/commit/3360981000fc483e7202c975f0ef0b7e8b8ff74d)), closes [#3539](https://github.com/lerna/lerna/issues/3539) [#3537](https://github.com/lerna/lerna/issues/3537)

# [6.5.0](https://github.com/lerna/lerna/compare/v6.4.1...6.5.0) (2023-02-13)

### Bug Fixes

- **create:** normalize quotes and indents in generated test and lib files ([#3529](https://github.com/lerna/lerna/issues/3529)) ([ad39fe2](https://github.com/lerna/lerna/commit/ad39fe2e4ca4e76cb7be6af83e8fbbc60d0935ce))
- **repair:** re-enable repair generators ([#3497](https://github.com/lerna/lerna/issues/3497)) ([510c3e9](https://github.com/lerna/lerna/commit/510c3e993be09f8f070dd07ca3ee7d352d00e491))

### Features

- **publish:** add --include-private option for testing private packages ([#3503](https://github.com/lerna/lerna/issues/3503)) ([fa1f490](https://github.com/lerna/lerna/commit/fa1f4900a658982d87888c1c7c5eef3697c5b31b))
- **publish:** recover from network failure ([#3513](https://github.com/lerna/lerna/issues/3513)) ([f03ee3e](https://github.com/lerna/lerna/commit/f03ee3e2efe052d3b21dcb3b15cdad15f5ded499))
- **run:** allow multiple script targets to be triggered at once ([#3527](https://github.com/lerna/lerna/issues/3527)) ([937b02a](https://github.com/lerna/lerna/commit/937b02aea4b3a62236aa8998eef127753f47c87c))

## [6.4.1](https://github.com/lerna/lerna/compare/v6.4.0...v6.4.1) (2023-01-12)

### Bug Fixes

- **run:** resolve erroneous failures ([#3495](https://github.com/lerna/lerna/issues/3495)) ([24d0d5c](https://github.com/lerna/lerna/commit/24d0d5c43b857f8da0d2e06b76bb3ee79fda51ff))

# [6.4.0](https://github.com/lerna/lerna/compare/v6.3.0...v6.4.0) (2023-01-05)

### Bug Fixes

- **run:** add explicit nx dependency ([#3486](https://github.com/lerna/lerna/issues/3486)) ([7e39397](https://github.com/lerna/lerna/commit/7e3939780df597ba6f1f0352299c2b5e77c7e824))
- **version:** recognize .prettierignore when formatting files ([#3482](https://github.com/lerna/lerna/issues/3482)) ([4e2c7a9](https://github.com/lerna/lerna/commit/4e2c7a9b883d36681474f0998dbe27ba5f8574f4))

### Features

- **create:** support relative path from root as lerna create location ([#3478](https://github.com/lerna/lerna/issues/3478)) ([82825ce](https://github.com/lerna/lerna/commit/82825ce98b43720cb7034e98f2b388ab14882bbf))
- **watch:** Add `lerna watch` command ([#3466](https://github.com/lerna/lerna/issues/3466)) ([008b995](https://github.com/lerna/lerna/commit/008b995caab549c0707068e748e4f429bd729afa))

# [6.3.0](https://github.com/lerna/lerna/compare/v6.2.0...v6.3.0) (2022-12-26)

### Features

- **version:** support custom command for git tag ([#2760](https://github.com/lerna/lerna/issues/2760)) ([6eac92f](https://github.com/lerna/lerna/commit/6eac92fe5a899895a530360724723f307cf349f3))
- **version:** use npmClientArgs in npm install after lerna version ([#3434](https://github.com/lerna/lerna/issues/3434)) ([e019e3f](https://github.com/lerna/lerna/commit/e019e3f7fcb94cbd9da0a4ab69cb38b9c42ffdcd))

# [6.2.0](https://github.com/lerna/lerna/compare/v6.1.0...v6.2.0) (2022-12-13)

### Bug Fixes

- **core:** more detailed error message when version cannot be found ([#3424](https://github.com/lerna/lerna/issues/3424)) ([b729b0c](https://github.com/lerna/lerna/commit/b729b0c01a6d303c6f3bc5d65beb0dcde924160f))
- **schema:** add the other format changelogPreset can assume ([#3441](https://github.com/lerna/lerna/issues/3441)) ([d286973](https://github.com/lerna/lerna/commit/d286973d7c2c9b43db65b903f94debd21bafd76e))
- **utils:** check validity of bundledDependencies before iteration ([#2960](https://github.com/lerna/lerna/issues/2960)) ([2517ffb](https://github.com/lerna/lerna/commit/2517ffb5a2854ca65ccb9128446eda8b5bc8741f))

### Features

- **publish:** add --summary-file option ([#2653](https://github.com/lerna/lerna/issues/2653)) ([027d943](https://github.com/lerna/lerna/commit/027d9433b7bb0ca1de5fa593ed411e012af57623))
- **version:** add --signoff git flag ([#2897](https://github.com/lerna/lerna/issues/2897)) ([93b24d7](https://github.com/lerna/lerna/commit/93b24d72d9a9b47fbbc2cec02919c572b0440e79))

# [6.1.0](https://github.com/lerna/lerna/compare/v6.0.3...v6.1.0) (2022-11-29)

### Bug Fixes

- **run:** detect target configuration in package.json files ([#3432](https://github.com/lerna/lerna/issues/3432)) ([798aae1](https://github.com/lerna/lerna/commit/798aae14656c9fbbde62bd941fe3a11450112f3b))

### Features

- **version:** bump prerelease versions from conventional commits ([#3362](https://github.com/lerna/lerna/issues/3362)) ([2288b3a](https://github.com/lerna/lerna/commit/2288b3aca4753b3943ea845ef8785321e5f77610))

## [6.0.3](https://github.com/lerna/lerna/compare/v6.0.2...v6.0.3) (2022-11-07)

### Bug Fixes

- **publish:** support inconsistent workspace prefix usage ([#3413](https://github.com/lerna/lerna/issues/3413)) ([da2274b](https://github.com/lerna/lerna/commit/da2274ba68f75082e3d0399241c27038f99da40a))
- **version:** only apply prettier if it was explicitly installed ([#3406](https://github.com/lerna/lerna/issues/3406)) ([0161bbe](https://github.com/lerna/lerna/commit/0161bbe187e7d97231e7d36f30371ae0f479da57))

## [6.0.2](https://github.com/lerna/lerna/compare/v6.0.1...v6.0.2) (2022-11-02)

### Bug Fixes

- **publish:** remove workspace prefix on publish ([#3397](https://github.com/lerna/lerna/issues/3397)) ([1f0e546](https://github.com/lerna/lerna/commit/1f0e54697ef4526251684478c9dcdd6447e3123c))

## [6.0.1](https://github.com/lerna/lerna/compare/v6.0.0...v6.0.1) (2022-10-14)

### Bug Fixes

- **run:** allow for loading of env files to be skipped ([#3375](https://github.com/lerna/lerna/issues/3375)) ([5dbd904](https://github.com/lerna/lerna/commit/5dbd904009ede4cc952fc7f8cbafebf6b12d81a1))

# [6.0.0](https://github.com/lerna/lerna/compare/v6.0.0-alpha.2...v6.0.0) (2022-10-12)

### Super fast, modern task-runner implementation for `lerna run`

As of version 6.0.0, Lerna will now delegate the implementation details of the `lerna run` command to the super fast, modern task-runner (powered by Nx) by default.

If for some reason you wish to opt in to the legacy task-runner implementation details (powered by `p-map` and `p-queue`), you can do so by setting `"useNx": false` in your lerna.json. (Please let us know via a Github issue if you feel the need to do that, however, as in general the new task-runner should just work how you expect it to as a lerna user).

### Interactive configuration for `lerna run` caching and task pipelines via the new `lerna add-caching` command

When using the modern task-runner implementation described above, the way to get the most out of it is to tell it about the outputs of your various scripts, and also any relationships that exist between them (such as needing to run the `build` script before the `test`, for example).

Simply run `lerna add-caching` and follow the instructions in order to generate all the relevant configuration for your workspace.

You can learn more about the configuration it generates here: https://lerna.js.org/docs/concepts/task-pipeline-configuration

### Automatic loading of .env files in `lerna run` with the new task-runner implementation

By default the modern task runner powered by Nx will automatically load `.env` files for you. You can set `--load-env-files` to false if you want to disable this behavior for any reason.

For more details about what `.env` files will be loaded by default please see: https://nx.dev/recipes/environment-variables/define-environment-variables

### Obsolete options in `lerna run` with the new task-runner implementation

There are certain legacy options for `lerna run` which are no longer applicable to the modern task-runner. Please see full details about those flags, and the reason behind their obselence, here:

https://lerna.js.org/docs/lerna6-obsolete-options

### New `lerna repair` command

When configuration changes over time as new versions of a tool are published it can be tricky to keep up with the changes and sometimes it's possible to miss out on optimizations as a result.

When you run the new command `lerna repair`, lerna will execute a series of code migrations/codemods which update your workspace to the latest and greatest best practices for workspace configuration.

The actual codemods which run will be added to over time, but for now one you might see run on your workspace is that it will remove any explicit `"useNx": true` references from lerna.json files, because that is no longer necessary and it's cleaner not to have it.

We are really excited about this feature and how we can use it to help users keep their workspaces up to date.

# [6.0.0-alpha.2](https://github.com/lerna/lerna/compare/v6.0.0-alpha.1...v6.0.0-alpha.2) (2022-10-12)

### Bug Fixes

- **run:** update docs for v6 ([#3366](https://github.com/lerna/lerna/issues/3366)) ([130f490](https://github.com/lerna/lerna/commit/130f4906bee3e240ea9ad9245dfb0fe208668dae))

# [6.0.0-alpha.1](https://github.com/lerna/lerna/compare/v5.6.2...v6.0.0-alpha.1) (2022-10-09)

# [6.0.0-alpha.0](https://github.com/lerna/lerna/compare/v5.6.1...v6.0.0-alpha.0) (2022-10-07)

**Note:** Version bump only for package lerna-monorepo

## [5.6.2](https://github.com/lerna/lerna/compare/v5.6.1...v5.6.2) (2022-10-09)

### Bug Fixes

- **bootstrap:** reject-cycles when using workspaces ([#3168](https://github.com/lerna/lerna/issues/3168)) ([8a47a6d](https://github.com/lerna/lerna/commit/8a47a6d55a871eb6ce1c0e620a3cea2b92bf76ea))
- **core:** fix "cannot read property 'version' of undefined" for pnpm + independent versioning ([#3358](https://github.com/lerna/lerna/issues/3358)) ([31e4c98](https://github.com/lerna/lerna/commit/31e4c98cc77ba1689c28c5362c6a3de0f20f7fb7))
- **core:** replace `"red"` color with `"brightBlue"` on package's output prefix ([#2774](https://github.com/lerna/lerna/issues/2774)) ([d7c1b87](https://github.com/lerna/lerna/commit/d7c1b8784841477b24ab44b248df7e1cd2958198))
- **create:** remove unused globby dep ([#3360](https://github.com/lerna/lerna/issues/3360)) ([e873f0c](https://github.com/lerna/lerna/commit/e873f0c0b35275cd2568f43a945a84fbae364c2e))
- **npm-publish:** Allows disabling of strict SSL checks ([#2952](https://github.com/lerna/lerna/issues/2952)) ([eec3207](https://github.com/lerna/lerna/commit/eec3207a3e26436e2311a136f5287558332fcb2a))
- **run:** always set env LERNA_PACKAGE_NAME environment variable ([#3359](https://github.com/lerna/lerna/issues/3359)) ([012d31d](https://github.com/lerna/lerna/commit/012d31d1dee36bfacb392cb9f6503aab78cdd4d1))

## [5.6.1](https://github.com/lerna/lerna/compare/v5.6.0...v5.6.1) (2022-09-30)

### Bug Fixes

- **add-caching:** ensure lerna.json is configured automatically ([9677cda](https://github.com/lerna/lerna/commit/9677cda7c9e16ae3cc02cd01c7b1087d81095750))

# [5.6.0](https://github.com/lerna/lerna/compare/v5.5.4...v5.6.0) (2022-09-29)

### Bug Fixes

- **run:** only defer to Nx when targetDefaults are defined in nx.json ([#3349](https://github.com/lerna/lerna/issues/3349)) ([51f80d9](https://github.com/lerna/lerna/commit/51f80d901fceb285677bd55ef2a456f3fb264c13))

### Features

- **core:** add add-caching command ([#3350](https://github.com/lerna/lerna/issues/3350)) ([ef09a06](https://github.com/lerna/lerna/commit/ef09a06ffc30384194fb120307269f49e4ebc54b))
- **repair:** add lerna repair command ([#3314](https://github.com/lerna/lerna/issues/3314)) ([7defab3](https://github.com/lerna/lerna/commit/7defab3434687fc8e17f921250846aa279ac3df3))
- **version:** apply prettier to updated files, if applicable ([#3348](https://github.com/lerna/lerna/issues/3348)) ([d63fc1f](https://github.com/lerna/lerna/commit/d63fc1fdd8b51911e793bf91469bc15babbf0343))

## [5.5.4](https://github.com/lerna/lerna/compare/v5.5.3...v5.5.4) (2022-09-28)

**Note:** Version bump only for package lerna-monorepo

## [5.5.3](https://github.com/lerna/lerna/compare/v5.5.2...v5.5.3) (2022-09-28)

### Bug Fixes

- **run:** fully defer to Nx for dep detection when nx.json exists ([#3345](https://github.com/lerna/lerna/issues/3345)) ([fef2ae6](https://github.com/lerna/lerna/commit/fef2ae6c13b35330b2367d89a63e539f2646f04e))

## [5.5.2](https://github.com/lerna/lerna/compare/v5.5.1...v5.5.2) (2022-09-20)

### Bug Fixes

- **run:** missing `fs-extra` dependency declaration ([#3332](https://github.com/lerna/lerna/issues/3332)) ([068830e](https://github.com/lerna/lerna/commit/068830e95f0552a33db3ea678092134372a40af1))
- **run:** warn on incompatible arguments with useNx ([#3326](https://github.com/lerna/lerna/issues/3326)) ([ebf6542](https://github.com/lerna/lerna/commit/ebf654240aa1c0c67d7f1ba5dec458c14edd5c32))

## [5.5.1](https://github.com/lerna/lerna/compare/v5.5.0...v5.5.1) (2022-09-09)

### Bug Fixes

- **core:** prevent validation error in version/publish with `workspace:` prefix ([#3322](https://github.com/lerna/lerna/issues/3322)) ([746ce33](https://github.com/lerna/lerna/commit/746ce33512e4052b01a5a303d1db6ecb8bf6fea1))
- **run:** exclude dependencies with --scope when nx.json is not present ([#3316](https://github.com/lerna/lerna/issues/3316)) ([99a13a9](https://github.com/lerna/lerna/commit/99a13a9bae2020f2773d21c4109148a59b1ec2d6))

# [5.5.0](https://github.com/lerna/lerna/compare/v5.4.3...v5.5.0) (2022-08-31)

### Bug Fixes

- **version:** only update existing lockfile deps ([#3308](https://github.com/lerna/lerna/issues/3308)) ([f5c8480](https://github.com/lerna/lerna/commit/f5c84807b957079b6a6d771bb9ca327f88c15a8a))

### Features

- pnpm workspaces support ([#3284](https://github.com/lerna/lerna/issues/3284)) ([1b18dbe](https://github.com/lerna/lerna/commit/1b18dbeb03e98c70b5428a9fe457781a59f8d65d))

## [5.4.3](https://github.com/lerna/lerna/compare/v5.4.2...v5.4.3) (2022-08-16)

### Bug Fixes

- **version:** ignore npm lifecycle scripts on package lock update ([#3295](https://github.com/lerna/lerna/issues/3295)) ([1ba2b8a](https://github.com/lerna/lerna/commit/1ba2b8a61dd2518f1e55c3f1e7880e04f7a7967f))

## [5.4.2](https://github.com/lerna/lerna/compare/v5.4.1...v5.4.2) (2022-08-14)

### Bug Fixes

- **version:** update package-lock at the root if it exists ([#3290](https://github.com/lerna/lerna/issues/3290)) ([7f62bab](https://github.com/lerna/lerna/commit/7f62babdd240983b0a9bbc658c44346e153b2c9e))

## [5.4.1](https://github.com/lerna/lerna/compare/v5.4.0...v5.4.1) (2022-08-12)

### Bug Fixes

- **package-graph:** ensure to touch all nodes ([#3234](https://github.com/lerna/lerna/issues/3234)) ([f3c211d](https://github.com/lerna/lerna/commit/f3c211dd7d08fb41b27b6f7bec2013b2192d291c))
- properly update dependencies lockfile v2 ([#3275](https://github.com/lerna/lerna/issues/3275)) ([d7c398b](https://github.com/lerna/lerna/commit/d7c398bb686d6874d9dbbff2e82cbc8a5c2c3615))

# [5.4.0](https://github.com/lerna/lerna/compare/v5.3.0...v5.4.0) (2022-08-08)

### Bug Fixes

- **core:** update nx version range base to latest ([#3283](https://github.com/lerna/lerna/issues/3283)) ([241cdde](https://github.com/lerna/lerna/commit/241cdded18cbec4161e0bde675adbcf60e5ea5a8))
- **create:** default test script no longer errors ([#3266](https://github.com/lerna/lerna/issues/3266)) ([dfd30fa](https://github.com/lerna/lerna/commit/dfd30fa1b141512c66998ce95777246c38eb1019))

### Features

- **init:** create .gitignore with lerna init ([#3270](https://github.com/lerna/lerna/issues/3270)) ([3461348](https://github.com/lerna/lerna/commit/3461348bc5e2d511d16d9537227e8b884bf6558b))

# [5.3.0](https://github.com/lerna/lerna/compare/v5.2.0...v5.3.0) (2022-07-27)

### Bug Fixes

- **run-lifecycle:** lifecycle events should run to completion in series ([#3262](https://github.com/lerna/lerna/issues/3262)) ([2f51588](https://github.com/lerna/lerna/commit/2f51588f3686ab9bb015a12294f3eca11cb41fad))
- **version:** inherit stdio for lerna version lifecycle scripts ([#3264](https://github.com/lerna/lerna/issues/3264)) ([9083a23](https://github.com/lerna/lerna/commit/9083a239893d3edae5e16f057c515c741a10c312))

### Features

- **publish:** include all dependencies in package graph by default, allow no-sort ([#3263](https://github.com/lerna/lerna/issues/3263)) ([3b0c79c](https://github.com/lerna/lerna/commit/3b0c79cd9ea2abb9399b22cb05348b9b2c31fdce))

# [5.2.0](https://github.com/lerna/lerna/compare/v5.1.8...v5.2.0) (2022-07-22)

### Bug Fixes

- **prompt:** update inquirer to v8.2.4 ([80c17d8](https://github.com/lerna/lerna/commit/80c17d8200851bfd89f8b7f8da897015774f1241))

### Features

- add json schema for lerna.json ([#3229](https://github.com/lerna/lerna/issues/3229)) ([5075eae](https://github.com/lerna/lerna/commit/5075eae0d0aa8db52f619b9a6d8fdc9934ba24f7))
- **init:** default useNx and useWorkspaces to true for new lerna workspaces ([#3255](https://github.com/lerna/lerna/issues/3255)) ([a0e83e5](https://github.com/lerna/lerna/commit/a0e83e5220f6e3d30b96b60bbaf14c5392653c2e))
- **publish:** disable legacy `verifyAccess` behavior by default ([#3249](https://github.com/lerna/lerna/issues/3249)) ([94174c1](https://github.com/lerna/lerna/commit/94174c1ff2ce20b9fef33a68bc62ba0d17207942))

## [5.1.8](https://github.com/lerna/lerna/compare/v5.1.7...v5.1.8) (2022-07-07)

### Bug Fixes

- update git-url-parse to v12 ([#3231](https://github.com/lerna/lerna/issues/3231)) ([f954404](https://github.com/lerna/lerna/commit/f9544045b59714bacc1b5e0155682c7b1c4140d2))

## [5.1.7](https://github.com/lerna/lerna/compare/v5.1.6...v5.1.7) (2022-07-06)

### Bug Fixes

- **run:** add double quotes around script target containing colon ([#3218](https://github.com/lerna/lerna/issues/3218)) ([ead461e](https://github.com/lerna/lerna/commit/ead461eba284d8d2efb0da3f18ce87fb5ae42bd2))

## [5.1.6](https://github.com/lerna/lerna/compare/v5.1.5...v5.1.6) (2022-06-24)

### Bug Fixes

- lerna run parallel should maximize concurrency with useNx ([#3205](https://github.com/lerna/lerna/issues/3205)) ([f80d03c](https://github.com/lerna/lerna/commit/f80d03c17b06146b097f904ee066728d6580090d))

## [5.1.5](https://github.com/lerna/lerna/compare/v5.1.4...v5.1.5) (2022-06-24)

### Bug Fixes

- **bootstrap:** preserve indentation style in package-lock.json when running bootstrap ([#2955](https://github.com/lerna/lerna/issues/2955)) ([04cfa52](https://github.com/lerna/lerna/commit/04cfa5237053fee1f016e8569612e44a615fc3b5))

## [5.1.4](https://github.com/lerna/lerna/compare/v5.1.3...v5.1.4) (2022-06-15)

### Bug Fixes

- correctly detect if target dependencies are set ([5845f6b](https://github.com/lerna/lerna/commit/5845f6bf53fd562978fd0ee2265a9ec602b4c335))

## [5.1.3](https://github.com/lerna/lerna/compare/v5.1.2...v5.1.3) (2022-06-15)

### Bug Fixes

- drastically reduce time taken to check for cycles ([#2874](https://github.com/lerna/lerna/issues/2874)) ([4b81a98](https://github.com/lerna/lerna/commit/4b81a98859e9a8667693bc7808fa76b2e21c07bc))
- properly update lockfile v2 ([#3091](https://github.com/lerna/lerna/issues/3091)) ([1e07a88](https://github.com/lerna/lerna/commit/1e07a88d42335c950f09fe4f511da9d939cbb9bd))

## [5.1.2](https://github.com/lerna/lerna/compare/v5.1.1...v5.1.2) (2022-06-13)

### Bug Fixes

- **conventional-commits:** remove pinned lodash.template ([#3172](https://github.com/lerna/lerna/issues/3172)) ([e519f43](https://github.com/lerna/lerna/commit/e519f43049253e66c1ab840c3c08435be1477d76))
- update all transitive inclusions of ansi-regex ([#3166](https://github.com/lerna/lerna/issues/3166)) ([56eaa15](https://github.com/lerna/lerna/commit/56eaa153283be3b1e7d7793d3266fc51801fad8e))

## [5.1.1](https://github.com/lerna/lerna/compare/v5.1.0...v5.1.1) (2022-06-09)

### Bug Fixes

- allow maintenance LTS node 14 engines starting at 14.15.0 ([#3161](https://github.com/lerna/lerna/issues/3161)) ([72305e4](https://github.com/lerna/lerna/commit/72305e4dbab607a2d87ae4efa6ee577c93a9dda9))

# [5.1.0](https://github.com/lerna/lerna/compare/v5.0.0...v5.1.0) (2022-06-07)

### Bug Fixes

- **utils:** orphaned child process on Windows ([#3156](https://github.com/lerna/lerna/issues/3156)) ([7e69e9e](https://github.com/lerna/lerna/commit/7e69e9e308ec36d1c7b9682673e785aaa4ce056a))
- handle the edge cases in the lerna-nx integration ([c6808fc](https://github.com/lerna/lerna/commit/c6808fc8f2dfe793bf72a64cf2d3909e0bdabba8))

### Features

- add experimental support to run tasks via Nx ([1c35828](https://github.com/lerna/lerna/commit/1c358286c8425d1720580859c4b42e15a3b15eac))

# [5.0.0](https://github.com/lerna/lerna/compare/v4.0.0...v5.0.0) (2022-05-24)

Lerna workspaces no longer have dependency deprecation warnings.

### Bug Fixes

- replace read-package-tree with @npmcli/arborist ([#3133](https://github.com/lerna/lerna/issues/3133)) ([f1c10a4](https://github.com/lerna/lerna/commit/f1c10a40fe667e5012a60e9b372a8e7996465de1))
- resolve most dependency audit issues ([#3127](https://github.com/lerna/lerna/issues/3127)) ([2b3b191](https://github.com/lerna/lerna/commit/2b3b1910d377122f294b4a79a291596fbc81241c))

### BREAKING CHANGES

- Node v10.x and v12.x are no longer supported.

  - Please upgrade to the latest LTS release of Node (we recommend either v14 or v16).

- Internally npm lifecycle scripts are now invoked using `@npmcli/run-script` instead of `npm-lifecycle` in order to modernize the package and fix package vulnerabilities and deprecations.

  - We are classing this as a breaking change because the APIs of `npm-lifecycle` and `@npmcli/run-script` are significantly different, despite `@npmcli/run-script` being the official successor to `npm-lifecycle`.

    We have successfully made the integration test suite we inherited pass with this change, but there may potentially be aspects related to it which are not covered by the tests and are breaking. If you encounter any issues you believe are related to this change please open a new issue with a dedicated reproduction for us to look into!

# [4.0.0](https://github.com/lerna/lerna/compare/v3.22.1...v4.0.0) (2021-02-10)

### Bug Fixes

- **version:** Ensure --create-release environment variables are present during initialization ([2d0a97a](https://github.com/lerna/lerna/commit/2d0a97aade2b17cb58ce8c0afdbfd950033f46db))
- Improve accuracy of JSDoc type annotations ([1ec69f0](https://github.com/lerna/lerna/commit/1ec69f0e0f7a3f1e0c74dbacb17fab2d7b7a8a44))
- **create:** Use main as default Github branch ([1a951e9](https://github.com/lerna/lerna/commit/1a951e92376b2aff2e1866791a0ae0b03f19515d))
- **import:** Better handling of "Patch is empty" ([#2588](https://github.com/lerna/lerna/issues/2588)) ([0497bc7](https://github.com/lerna/lerna/commit/0497bc73043b2b646cc614f54187b68ba007000e))

### Code Refactoring

- **describe-ref:** Add JSDoc types, remove test-only export ([e5cf30c](https://github.com/lerna/lerna/commit/e5cf30cb66f9b85f13afb475ea0c9e59c8fabba3))
- **package:** Move Package.lazy() to static method ([e52108e](https://github.com/lerna/lerna/commit/e52108e308192150e1d5e21f3a23c9e91f87d4b7))

### Features

- **child-process:** Add JSDoc types ([1840492](https://github.com/lerna/lerna/commit/1840492a6b9e832dafe7046157798e3157c2a13b))
- **collect-uncommitted:** Remove figgy-pudding ([621b382](https://github.com/lerna/lerna/commit/621b3821cf0ce4921a0815e0ce33a8222c7b172b))
- **collect-updates:** Add JSDoc type annotations to primary export ([a4e7c78](https://github.com/lerna/lerna/commit/a4e7c7884f8c278f705824684a25a717327cda06))
- **conventional-commits:** Add JSDoc types to named exports ([81a591c](https://github.com/lerna/lerna/commit/81a591ccf1b0ca32f7f4638bab4f84b5743a3ca6))
- **deps:** @evocateur/libnpmaccess -> libnpmaccess@^4.0.1 ([7974b35](https://github.com/lerna/lerna/commit/7974b351e53575503dd881c639b53d820e4f525e))
- **deps:** @evocateur/libnpmpublish -> libnpmpublish@^4.0.0 ([341146e](https://github.com/lerna/lerna/commit/341146ef6c9111607f99d2f1663f973ab16c755e))
- **deps:** @evocateur/npm-registry-fetch -> npm-registry-fetch@^9.0.0 ([6df42f2](https://github.com/lerna/lerna/commit/6df42f2caf0887c38870c07a9f850dae0e9c4253))
- **deps:** @evocateur/pacote -> pacote@^11.1.13 ([99b4217](https://github.com/lerna/lerna/commit/99b4217ed143527a45969f3a46f1bd9b84999d68))
- **deps:** @octokit/rest@^18.0.9 ([f064a55](https://github.com/lerna/lerna/commit/f064a55627994a08f5ba9f735fcd5b2c3491e431))
- **deps:** @zkochan/cmd-shim -> cmd-shim@^4.0.2 ([179e2c3](https://github.com/lerna/lerna/commit/179e2c30b5734bb95f8f4005169987231992a525))
- **deps:** Bump dependencies ([affed1c](https://github.com/lerna/lerna/commit/affed1ce0fce91f01b0a9eafe357db2d985b974f))
- **deps:** byte-size@^7.0.0 ([a1b2555](https://github.com/lerna/lerna/commit/a1b255504b52d83455de7bed32bf5e4d63cc7538))
- **deps:** camelcase -> yargs-parser/camelCase ([d966e8b](https://github.com/lerna/lerna/commit/d966e8b3d36ad9eb02f656b73d9b41882ca7b208))
- **deps:** chalk@^4.1.0 ([d2a9ed5](https://github.com/lerna/lerna/commit/d2a9ed537139f49561a7e29b3ebf624c97f48c77))
- **deps:** conventional-changelog-core@^4.2.1 ([54e2b98](https://github.com/lerna/lerna/commit/54e2b98a815cc003981a807f0a167c7dd305523a))
- **deps:** conventional-recommended-bump@^6.0.11 ([4ff481c](https://github.com/lerna/lerna/commit/4ff481c9d7ee3495471d5d1eeb1b72738d7c5410))
- **deps:** cosmiconfig@^7.0.0 ([2958fe6](https://github.com/lerna/lerna/commit/2958fe6b3e586adb27da6643d1c215b73c8afa7b))
- **deps:** dot-prop@^6.0.0 ([5f31d3b](https://github.com/lerna/lerna/commit/5f31d3b46f8d1d84d264b90be38f57887d2e4969))
- **deps:** execa@^4.1.0 ([9051dca](https://github.com/lerna/lerna/commit/9051dcab1a68b56db09b82ab0345c5f36bcfee2d))
- **deps:** execa@^5.0.0 ([d8100fd](https://github.com/lerna/lerna/commit/d8100fd9e0742b049ed16ac77e976ce34234ebfc))
- **deps:** fs-extra@^9.0.1 ([2f6f4e0](https://github.com/lerna/lerna/commit/2f6f4e066d5a41b4cd508b3405ac1d0a342932dc))
- **deps:** get-port@^5.1.1 ([b1b2275](https://github.com/lerna/lerna/commit/b1b2275237f16a26e6f96deffee8b0f72d8ce17d))
- **deps:** get-stream@^6.0.0 ([ddf2ab5](https://github.com/lerna/lerna/commit/ddf2ab5512704f17d31773f82fb180e659c461a6))
- **deps:** globby@^11.0.1 ([6cb5bbe](https://github.com/lerna/lerna/commit/6cb5bbec5599cdd93d314ffdc4abea8822e48075))
- **deps:** import-local@^3.0.2 ([e0e74d4](https://github.com/lerna/lerna/commit/e0e74d46c61ae884c1a27627c6e77e488061c9ba))
- **deps:** init-package-json@^2.0.1 ([4042e8e](https://github.com/lerna/lerna/commit/4042e8e0a73427d1f9585ff285554e2a954b7be6))
- **deps:** inquirer@^7.3.3 ([0b37795](https://github.com/lerna/lerna/commit/0b377959d76ad354f384ff3addb42e3855eec379))
- **deps:** load-json-file@^6.2.0 ([239f54b](https://github.com/lerna/lerna/commit/239f54b070691106dd9b31f2a279d726744651f8))
- **deps:** multimatch@^5.0.0 ([0172526](https://github.com/lerna/lerna/commit/017252644cfd2394e77680673bae0e31ffa58d5e))
- **deps:** npm-package-arg@^8.1.0 ([12c8923](https://github.com/lerna/lerna/commit/12c892342d33b86a00ee2cf9079f9b26fe316dc6))
- **deps:** npm-packlist@^2.1.4 ([c63fabd](https://github.com/lerna/lerna/commit/c63fabdc09bae34d8f8d907e5d21a996ac01daef))
- **deps:** p-finally -> Promise.prototype.finally() ([028db04](https://github.com/lerna/lerna/commit/028db045b1221df000a2b98c5dceb1e4915a7806))
- **deps:** p-finally@^2.0.1 ([165e47e](https://github.com/lerna/lerna/commit/165e47e722acf6462cf0b4e3a7d0e14d3971e7fb))
- **deps:** p-map-series@^2.1.0 ([7f68076](https://github.com/lerna/lerna/commit/7f680767e0b3c7a15f951c51d4975150fb6e9112))
- **deps:** p-map@^4.0.0 ([92b1364](https://github.com/lerna/lerna/commit/92b1364735e1f2cf379cf1047c60c4fb897d55f5))
- **deps:** p-pipe@^3.1.0 ([489f59e](https://github.com/lerna/lerna/commit/489f59e28657a039becb4cdba5a1955043c73cf1))
- **deps:** p-queue@^6.6.2 ([ed76cdd](https://github.com/lerna/lerna/commit/ed76cdddf57963e7aa3dfbff1f37fe361c9e2769))
- **deps:** p-reduce@^2.1.0 ([fd4289a](https://github.com/lerna/lerna/commit/fd4289ad20fd9ce5921b83d97f82984abf4f65b0))
- **deps:** p-waterfall@^2.1.0 ([7b7ea50](https://github.com/lerna/lerna/commit/7b7ea503e8371e7f663fd604bff51aebfe9e7b33))
- **deps:** path-exists@^4.0.0 ([3fb6304](https://github.com/lerna/lerna/commit/3fb6304a31b4c92cf7eac6f7ab4fc725a22dc68f))
- **deps:** pify@^5.0.0 ([6b34452](https://github.com/lerna/lerna/commit/6b3445219f0f022411a7cb282b0ba39a072e2ef2))
- **deps:** read-cmd-shim@^2.0.0 ([9f78eee](https://github.com/lerna/lerna/commit/9f78eee7c148bbe0a623af193478573c4373f5a8))
- **deps:** read-package-json@^3.0.0 ([2a02865](https://github.com/lerna/lerna/commit/2a02865a70a0b9ea60220a98bfff745128c90c6f))
- **deps:** read-package-tree@^5.3.1 ([3311780](https://github.com/lerna/lerna/commit/331178049e61f3c401a074d27e84d12856e3494e))
- **deps:** resolve-from@^5.0.0 ([d414462](https://github.com/lerna/lerna/commit/d4144623f3069fda62b324186c46050f4f7e1c77))
- **deps:** rimraf@^3.0.2 ([cda2e18](https://github.com/lerna/lerna/commit/cda2e1838ea75eb668249b7a61d6a2828061b188))
- **deps:** semver@^7.3.2 ([003ad66](https://github.com/lerna/lerna/commit/003ad6641fab8b4e3a82251ebffd27061bd6a31b))
- **deps:** slash@^3.0.0 ([5dec383](https://github.com/lerna/lerna/commit/5dec383109bcd1cce9abbc80796369db9314acc9))
- **deps:** ssri@^8.0.0 ([41729b4](https://github.com/lerna/lerna/commit/41729b4f9a2301a5e96cb7850c3bfd211f21006d))
- **deps:** tar@^6.0.5 ([fce3e77](https://github.com/lerna/lerna/commit/fce3e778276cbab99301b6caba414efd3b4a78ea))
- **deps:** temp-write@^4.0.0 ([7bbfb70](https://github.com/lerna/lerna/commit/7bbfb7020fbbf1fd7f2ebea38ac2718bea5a0646))
- **deps:** upath@^2.0.1 ([28ecc48](https://github.com/lerna/lerna/commit/28ecc48aa9f0de6073f0bc534071e2697d8bef98))
- **deps:** whatwg-url@^8.4.0 ([5dfb7f0](https://github.com/lerna/lerna/commit/5dfb7f0ee196a0c9b9010339d512a5b5b9b75a47))
- **deps:** write-file-atomic@^3.0.3 ([61f341b](https://github.com/lerna/lerna/commit/61f341b0078a4ef89bdd667389ed892aa080272f))
- **deps:** write-json-file@^4.3.0 ([d552c53](https://github.com/lerna/lerna/commit/d552c533c45489a1774f3c3b9ae8d15fc5d3b2a8))
- **deps:** write-pkg@^4.0.0 ([34db21c](https://github.com/lerna/lerna/commit/34db21c8e344928d9ade36e191b337b74783c566))
- **deps:** yargs@^16.1.1 ([53d432b](https://github.com/lerna/lerna/commit/53d432bd4cc5ff86345c6ca5cf601a6ff2d3e814))
- **filter-options:** Remove figgy-pudding ([7d90289](https://github.com/lerna/lerna/commit/7d9028906098cf20c287c460da7d236bdb29007e))
- **has-npm-version:** Remove unused makePredicate() export ([56cba2f](https://github.com/lerna/lerna/commit/56cba2ffc4dccf3380548567a36a35345fb7c747))
- **npm-dist-tag:** Remove figgy-pudding ([1158f8e](https://github.com/lerna/lerna/commit/1158f8eea49dc3e59860886421bd8ec40a6205df))
- **npm-publish:** Remove figgy-pudding ([bdc162d](https://github.com/lerna/lerna/commit/bdc162d2719fee38d6189daeb37fe4e22338fda7))
- **otplease:** Remove figgy-pudding ([45ee52e](https://github.com/lerna/lerna/commit/45ee52e010cfd98fdcddf43f6bfc9cd11b4a3aa0))
- **pack-directory:** Remove figgy-pudding ([640faa5](https://github.com/lerna/lerna/commit/640faa54cbbc5faeb6b13322c8d4f48bf035a1f7))
- **package:** Improve JSDoc-inferred types, encapsulation ([4d80c38](https://github.com/lerna/lerna/commit/4d80c3832cf2a1cceb31e535fa841db4c68a7346))
- **package-graph:** Improve JSDoc-inferred types, encapsulation ([fae9e8d](https://github.com/lerna/lerna/commit/fae9e8dc8d80df57b7bd34f429ea579e0529de30))
- **prerelease-id-from-version:** Add JSDoc types ([53cdad9](https://github.com/lerna/lerna/commit/53cdad917ba6ca6a3ce350d44c3854248e0ea933))
- **profiler:** Remove figgy-pudding ([69d4704](https://github.com/lerna/lerna/commit/69d47041e83138869404c131adda3fc3122bf2d9))
- **project:** Add JSDoc type annotations to primary export ([8443ad3](https://github.com/lerna/lerna/commit/8443ad396b2e4d11df2d0a85b456037ca2cc87c0))
- **prompt:** Add JSDoc types ([0406568](https://github.com/lerna/lerna/commit/0406568c51bef818b7894f6ade959caf550a378a))
- **prompt:** Add unambiguous exports ([46fa111](https://github.com/lerna/lerna/commit/46fa11177c433482ba41e6d43765a0d9eaddc89a))
- **prompt:** Remove ambiguous exports ([42ab453](https://github.com/lerna/lerna/commit/42ab4533d6643c5bb3ceca8eeff7358421235bf6))
- Consume named exports of sibling modules ([63499e3](https://github.com/lerna/lerna/commit/63499e33652bc78fe23751875d74017e2f16a689))
- Expose named export ([c1303f1](https://github.com/lerna/lerna/commit/c1303f13adc4cf15f96ff25889b52149f8224c0e))
- Remove default export ([e2f1ec3](https://github.com/lerna/lerna/commit/e2f1ec3dd049d2a89880029908a2aa7c66f15082))
- **publish:** Remove figgy-pudding ([caf823e](https://github.com/lerna/lerna/commit/caf823e01e9eb5463b452b929a74dbc83ffc5df7))
- **query-graph:** Remove figgy-pudding ([3b0e2fe](https://github.com/lerna/lerna/commit/3b0e2fec7c274bc93627404295b51638cb7d7e60))
- **run-lifecycle:** Remove figgy-pudding ([1093f87](https://github.com/lerna/lerna/commit/1093f87d867ddcdf0d7b56f21ad9786a7fb8d6c1))
- **run-topologically:** Remove figgy-pudding ([f3a73db](https://github.com/lerna/lerna/commit/f3a73db0f083a77fc14bdff2e4da4b2decfa8c8a))
- Drop support for Node v6.x & v8.x ([ff4bb4d](https://github.com/lerna/lerna/commit/ff4bb4da215555e3bb136f5af09b5cbc631e57bb))

### BREAKING CHANGES

- **prompt:** The ambiguous 'confirm', 'select', and 'input' exports have been removed. Please use the renamed exports 'promptConfirmation', 'promptSelectOne', and 'promptTextInput' (respectively).
- **has-npm-version:** The makePredicate() export has been removed, memoization is now the responsibility of the caller.
- The default export has been removed, please use a named export instead.
- **describe-ref:** The test-only 'parse()' export has been removed.
- **package:** The `lazy` named export is now a proper static method of `Package`.
- Node v6.x & v8.x are no longer supported. Please upgrade to the latest LTS release.

Here's the gnarly one-liner I used to make these changes:

```
npx lerna exec --concurrency 1 --stream -- 'json -I -f package.json -e '"'"'this.engines=this.engines||{};this.engines.node=">= 10.18.0"'"'"
```

(requires `npm i -g json` beforehand)

## [3.22.1](https://github.com/lerna/lerna/compare/v3.22.0...v3.22.1) (2020-06-09)

### Bug Fixes

- Move [#2445](https://github.com/lerna/lerna/issues/2445) behind `--no-granular-pathspec` option ([b3da937](https://github.com/lerna/lerna/commit/b3da937a61199ac71ed44b184ed36ff131237165)), closes [#2598](https://github.com/lerna/lerna/issues/2598)

# [3.22.0](https://github.com/lerna/lerna/compare/v3.21.0...v3.22.0) (2020-05-24)

### Bug Fixes

- **conventional-commits:** Support modern config builder functions ([#2546](https://github.com/lerna/lerna/issues/2546)) ([7ffb297](https://github.com/lerna/lerna/commit/7ffb297b5cab910f58153cd9decd1f3b58b0c4ed)), closes [#2138](https://github.com/lerna/lerna/issues/2138)
- **create:** Use correct variable name in generated CLI output ([#2547](https://github.com/lerna/lerna/issues/2547)) ([a1fd622](https://github.com/lerna/lerna/commit/a1fd622a55e3dbbf47a6a166c01fe17636cd0a76))
- **deps:** upgrade octokit/enterprise-rest to v6 ([#2464](https://github.com/lerna/lerna/issues/2464)) ([b44ea75](https://github.com/lerna/lerna/commit/b44ea753fb9405432bc9fea84726fae365bf4cd8))
- **import:** Support non-ASCII characters in file paths ([#2441](https://github.com/lerna/lerna/issues/2441)) ([c74ffa4](https://github.com/lerna/lerna/commit/c74ffa4b31503ab8cd537ac2a9c9c15494f81a0c))
- **publish:** Avoid errors when files are ignored by git ([#2445](https://github.com/lerna/lerna/issues/2445)) ([448f2ae](https://github.com/lerna/lerna/commit/448f2aee7258febc15c131c1128688326a52778f)), closes [#2151](https://github.com/lerna/lerna/issues/2151)
- **publish:** Avoid exception when publishing 1st version ([#2485](https://github.com/lerna/lerna/issues/2485)) ([5d80285](https://github.com/lerna/lerna/commit/5d802851d156e20e1bac4107e68b7280e078a51b))
- **publish:** Support `--tag-version-prefix` in `--canary` mode ([#2435](https://github.com/lerna/lerna/issues/2435)) ([611c38e](https://github.com/lerna/lerna/commit/611c38edb07d18fc92a20ba44edab715519a203d))
- **version:** `--atomic` fallback when `GIT_REDIRECT_STDERR` is enabled ([#2467](https://github.com/lerna/lerna/issues/2467)) ([c255d12](https://github.com/lerna/lerna/commit/c255d1242e3c21f432fac1e484a4e71ad50ed71f))

### Features

- **conventional-commits:** Preserve major version zero on breaking changes ([#2486](https://github.com/lerna/lerna/issues/2486)) ([6126e6c](https://github.com/lerna/lerna/commit/6126e6c6cb52405d7ff98d3b4017bf39dcdfa965))
- **version:** add `--force-git-tag` option ([#2594](https://github.com/lerna/lerna/issues/2594)) ([00738e9](https://github.com/lerna/lerna/commit/00738e9ab2a9f3b5656419205bd7ddb1669e4193))

# [3.21.0](https://github.com/lerna/lerna/compare/v3.20.2...v3.21.0) (2020-05-13)

### Bug Fixes

- **publish:** Canary releases without previous tags should not explode ([c9eb590](https://github.com/lerna/lerna/commit/c9eb590bf867889a188598322bb4552db7a34dfc))

### Features

- **project:** Add `getPackagesSync()` export ([068bdd7](https://github.com/lerna/lerna/commit/068bdd75683ca9687a420523e4ba007bd8b3b220))
- **version:** Ignore private packages completely with `--no-private` ([a9b9f97](https://github.com/lerna/lerna/commit/a9b9f97457e4e4b0cac7f4ce562458d921a1f9be))

## [3.20.2](https://github.com/lerna/lerna/compare/v3.20.1...v3.20.2) (2020-01-02)

### Bug Fixes

- **version:** Loosen `--atomic` fallback to catch incompatible CLI versions ([6f0e2bb](https://github.com/lerna/lerna/commit/6f0e2bb1b033b0579910cedcf0be84f1474c1580)), closes [#2400](https://github.com/lerna/lerna/issues/2400)

## [3.20.1](https://github.com/lerna/lerna/compare/v3.20.0...v3.20.1) (2019-12-29)

### Bug Fixes

- **version:** Support git clients that do not support `git push --atomic` ([2b9b210](https://github.com/lerna/lerna/commit/2b9b210c0b6ac69853ffb01f0dbac9109ab419c5))

# [3.20.0](https://github.com/lerna/lerna/compare/v3.19.0...v3.20.0) (2019-12-27)

### Bug Fixes

- **collect-dependents:** Avoid skipping dependents of cyclic dependencies ([#2380](https://github.com/lerna/lerna/issues/2380)) ([bd19a34](https://github.com/lerna/lerna/commit/bd19a34debf3344e94386b4ffd4b3fe87efb4641))
- **version:** pass `--atomic` to `git push` ([#2393](https://github.com/lerna/lerna/issues/2393)) ([ec0f92a](https://github.com/lerna/lerna/commit/ec0f92aac03cea27168d3982601f40b863943a3c)), closes [#2392](https://github.com/lerna/lerna/issues/2392)

### Features

- **cli:** Add new `info` command to output information about local environment ([#2106](https://github.com/lerna/lerna/issues/2106)) ([7abfe43](https://github.com/lerna/lerna/commit/7abfe43426197fbc7f18c44b0c994324609fc769))
- **publish:** Add `--legacy-auth` flag ([#2347](https://github.com/lerna/lerna/issues/2347)) ([0e9bda7](https://github.com/lerna/lerna/commit/0e9bda769d944e3f0b9218ec1ecfaf63273baf11))
- Add `--profile` option to `lerna exec` and `lerna run` ([#2376](https://github.com/lerna/lerna/issues/2376)) ([6290174](https://github.com/lerna/lerna/commit/62901748f818516d58efdfd955eacb447e270351))

# [3.19.0](https://github.com/lerna/lerna/compare/v3.18.5...v3.19.0) (2019-11-20)

### Features

- **add:** Add `--peer` option to save target in `peerDependencies` ([#2334](https://github.com/lerna/lerna/issues/2334)) ([e12bf6a](https://github.com/lerna/lerna/commit/e12bf6a6af636e8ac0c0085144325f36505fc8d9))

## [3.18.5](https://github.com/lerna/lerna/compare/v3.18.4...v3.18.5) (2019-11-20)

### Bug Fixes

- Auto-fix prettier formatting ([5344820](https://github.com/lerna/lerna/commit/5344820fc65da081d17f7fd2adb50ffe7101905b))
- **cli:** Bump yargs to `^14.2.2` ([51365b8](https://github.com/lerna/lerna/commit/51365b8700a3b7c609cf9caaeb63a6b07a4b3959))
- **command:** Do not mutate `argv` parameter ([8ca85a4](https://github.com/lerna/lerna/commit/8ca85a4f07acbec02d41077faacdd1f4a62e86a3)), closes [#2348](https://github.com/lerna/lerna/issues/2348)
- **conventional-commits:** Ensure potential `ValidationError` in `getChangelogConfig()` is propagated correctly ([406ba5a](https://github.com/lerna/lerna/commit/406ba5ab14d3a568282112f0e6874f208e8f6433))

## [3.18.4](https://github.com/lerna/lerna/compare/v3.18.3...v3.18.4) (2019-11-08)

### Bug Fixes

- **changed:** Copy relevant options from version, do not inherit ([6bd77ba](https://github.com/lerna/lerna/commit/6bd77ba60afd496e0f612aca7a56b8a9c8270436))
- **filter-options:** Clarify `--since` description ([b649b35](https://github.com/lerna/lerna/commit/b649b35bccab97a0f8a5cdd3a37216b5f6db16dc))
- **filter-options:** Ensure `--include-merged-tags` is available to all `--since`-filterable commands ([287bcd8](https://github.com/lerna/lerna/commit/287bcd8b5c8dbb2dc4def5c933d0b4917c34813e)), closes [#2332](https://github.com/lerna/lerna/issues/2332)
- **version:** Clarify `--include-merged-tags` description ([b0bbfcf](https://github.com/lerna/lerna/commit/b0bbfcfa867fea420376232d2af0d80a97454c9e))

## [3.18.3](https://github.com/lerna/lerna/compare/v3.18.2...v3.18.3) (2019-10-22)

### Bug Fixes

- **version:** Correct warning message ([384cd15](https://github.com/lerna/lerna/commit/384cd15f7024201da530e8c47d2e6277f2a89f59))
- **version:** Workaround yargs bug with spurious `--` arguments ([46be9dc](https://github.com/lerna/lerna/commit/46be9dc14999e0dbe933d562a0363fba6ff2f115)), closes [#2315](https://github.com/lerna/lerna/issues/2315)

## [3.18.2](https://github.com/lerna/lerna/compare/v3.18.1...v3.18.2) (2019-10-21)

### Bug Fixes

- **version:** Update lockfile version, if present ([5b1b40b](https://github.com/lerna/lerna/commit/5b1b40b60ebd442d766236fad19bb6073ccb045b)), closes [#1998](https://github.com/lerna/lerna/issues/1998) [#2160](https://github.com/lerna/lerna/issues/2160) [#1415](https://github.com/lerna/lerna/issues/1415)

## [3.18.1](https://github.com/lerna/lerna/compare/v3.18.0...v3.18.1) (2019-10-15)

### Bug Fixes

- **npm-dist-tag:** Port upstream npm/cli[#235](https://github.com/lerna/lerna/issues/235) ([5a1d229](https://github.com/lerna/lerna/commit/5a1d22902cf8d306a804543b568eef701f600fc5))
- **npm-dist-tag:** Respect `npm_config_dry_run` env var ([1fd5e18](https://github.com/lerna/lerna/commit/1fd5e181edc898187ff1e1be4fd715fa87d43bf0))

# [3.18.0](https://github.com/lerna/lerna/compare/v3.17.0...v3.18.0) (2019-10-15)

### Bug Fixes

- **bootstrap:** Move all filter logging into get-filtered-packages method ([54dca56](https://github.com/lerna/lerna/commit/54dca563efb13ad88d478ac31668f6e13a1d99e7))
- **options:** Explicit `--conventional-graduate` ([f73e6ed](https://github.com/lerna/lerna/commit/f73e6ed8966b06c25de973f2c7f90eea2d4f2d3a))
- **options:** Explicit `--conventional-prerelease` ([f3581ae](https://github.com/lerna/lerna/commit/f3581aede1d8c7613c0549fbe1bfbb2dfddf46f4))
- **options:** Explicit `--force-local` ([6948a11](https://github.com/lerna/lerna/commit/6948a11dbc2f845db78a2c666d0ea8160612e41e))
- **options:** Explicit `--force-publish` ([343a751](https://github.com/lerna/lerna/commit/343a751739eda514c047037cc3b3a4ebc40932ba))
- **options:** Explicit `--ignore-prepublish` ([fa21723](https://github.com/lerna/lerna/commit/fa217231c95d306bfdd3ffaf348c936a3232c998))
- **options:** Explicit `--ignore-scripts` ([efcb3bd](https://github.com/lerna/lerna/commit/efcb3bd2a9591f5380abb349a09ae1f1b802de29))
- **options:** Explicit `--pre-dist-tag` ([1d9552c](https://github.com/lerna/lerna/commit/1d9552c431ea78184ff51dc66f01de3314edb42e))
- **options:** Explicit `--use-workspaces` ([ac8385d](https://github.com/lerna/lerna/commit/ac8385d77e931397b68b068ded7ac83dd1a19d68))

### Features

- **filter-options:** Add `--exclude-dependents` option ([ff50e29](https://github.com/lerna/lerna/commit/ff50e299aa990b121e1bd987548252376177c68a)), closes [#2198](https://github.com/lerna/lerna/issues/2198)
- **filter-options:** Allow command to continue if no packages are matched ([#2280](https://github.com/lerna/lerna/issues/2280)) ([a706023](https://github.com/lerna/lerna/commit/a706023b585846c8e43771657d65ba8797125504))
- **filter-options:** Rename `--include-filtered-*` options ([f2c3a92](https://github.com/lerna/lerna/commit/f2c3a92fe41b6fdc5d11269f0f2c3e27761b4c85))
- **filter-options:** Use figgy-pudding in getFilteredPackages() ([73badee](https://github.com/lerna/lerna/commit/73badee5da06745ff58ee96f762d7240e9b4d6f1))
- Remove unused @lerna/batch-packages ([d136fb5](https://github.com/lerna/lerna/commit/d136fb5fa98563ae6e9abdc51d1c6211a9e0c5bf))
- Remove unused @lerna/run-parallel-batches ([ec95403](https://github.com/lerna/lerna/commit/ec95403d6b56ecd4b37a187874015505005a13fb))
- Upgrade to yargs@14 ([5e60213](https://github.com/lerna/lerna/commit/5e60213e93e3ee229a9341a14e420ed2401001dd))
- **package-graph:** Deprecate method `pruneCycleNodes()` ([ccf32e1](https://github.com/lerna/lerna/commit/ccf32e1d745e0ab2d633d8b72613d3c19ccdc0c7))

# [3.17.0](https://github.com/lerna/lerna/compare/v3.16.5...v3.17.0) (2019-10-10)

### Features

- **link:** Use `publishConfig.directory` as symlink source if it exists to allow linking sub-directories ([#2274](https://github.com/lerna/lerna/issues/2274)) ([d04ce8e](https://github.com/lerna/lerna/commit/d04ce8e10503003e498c44d0db5ff455054d7d71))

## [3.16.5](https://github.com/lerna/lerna/compare/v3.16.4...v3.16.5) (2019-10-07)

### Bug Fixes

- **bootstrap:** Run lifecycle scripts in topological queue instead of batches ([#2224](https://github.com/lerna/lerna/issues/2224)) ([d8d33f7](https://github.com/lerna/lerna/commit/d8d33f7))
- **child-process:** Use Set to manage book-keeping instead of mutable integer ([5dbea32](https://github.com/lerna/lerna/commit/5dbea32))

## [3.16.4](https://github.com/lerna/lerna/compare/v3.16.3...v3.16.4) (2019-07-24)

### Bug Fixes

- **conventional-commits:** Avoid duplicate root changelog entries with custom `--tag-version-prefix` ([8adeac1](https://github.com/lerna/lerna/commit/8adeac1)), closes [#2197](https://github.com/lerna/lerna/issues/2197)
- **conventional-commits:** Preserve tag prefix in fixed changelog comparison links ([11cf6d2](https://github.com/lerna/lerna/commit/11cf6d2)), closes [#2197](https://github.com/lerna/lerna/issues/2197)
- **pack-directory:** Use correct property when packing subdirectories ([1575396](https://github.com/lerna/lerna/commit/1575396))
- **publish:** Pass correct arguments to packDirectory() ([b1aade3](https://github.com/lerna/lerna/commit/b1aade3))

## [3.16.3](https://github.com/lerna/lerna/compare/v3.16.2...v3.16.3) (2019-07-23)

### Bug Fixes

- **publish:** Identify tagged packages correctly with custom `--tag-version-prefix` ([f4cbd4d](https://github.com/lerna/lerna/commit/f4cbd4d)), closes [#2195](https://github.com/lerna/lerna/issues/2195)

## [3.16.2](https://github.com/lerna/lerna/compare/v3.16.1...v3.16.2) (2019-07-22)

### Bug Fixes

- **create-symlink:** Generate shims for missing bin scripts for Windows ([c3f7998](https://github.com/lerna/lerna/commit/c3f7998))
- **create-symlink:** Use octal notation for chmod values ([03f80b7](https://github.com/lerna/lerna/commit/03f80b7))
- **deps:** `npm-lifecycle@^3.1.2` ([25edebf](https://github.com/lerna/lerna/commit/25edebf)), closes [#2189](https://github.com/lerna/lerna/issues/2189)
- **deps:** Switch to actively-maintained `@zkochan/cmd-shim` ([60d1100](https://github.com/lerna/lerna/commit/60d1100))
- **integration:** Limit concurrency of bootstrap --hoist test ([f25854d](https://github.com/lerna/lerna/commit/f25854d))

## [3.16.1](https://github.com/lerna/lerna/compare/v3.16.0...v3.16.1) (2019-07-19)

### Bug Fixes

- **deps:** Pin exact `npm-lifecycle@3.0.0` to avoid Windows regression in >=3.1.0 ([af0569d](https://github.com/lerna/lerna/commit/af0569d)), closes [#2189](https://github.com/lerna/lerna/issues/2189)

# [3.16.0](https://github.com/lerna/lerna/compare/v3.15.0...v3.16.0) (2019-07-18)

### Bug Fixes

- **command:** Bump minimum range of lodash, silence dumb 'security' warning ([c405871](https://github.com/lerna/lerna/commit/c405871))
- **conventional-commits:** Hard-pin lodash.template dependency to silence 'helpful' security warning ([c54ad68](https://github.com/lerna/lerna/commit/c54ad68))
- **deps:** Bump `@evocateur/pacote` ([03e4797](https://github.com/lerna/lerna/commit/03e4797))
- **deps:** Update forked npm libs ([4d67426](https://github.com/lerna/lerna/commit/4d67426))
- **npm-conf:** OTP should default to undefined, figgy pudding is very strict ([2fa02a8](https://github.com/lerna/lerna/commit/2fa02a8))
- **pack-directory:** Bump npm-packlist + tar dependencies ([59ebd19](https://github.com/lerna/lerna/commit/59ebd19))
- **package-graph:** Flatten cycles to avoid skipping packages ([#2185](https://github.com/lerna/lerna/issues/2185)) ([b335763](https://github.com/lerna/lerna/commit/b335763))
- **project:** Ensure deprecated `githubRelease` config is also remapped from `command.publish` namespace ([a3d264e](https://github.com/lerna/lerna/commit/a3d264e)), closes [#2177](https://github.com/lerna/lerna/issues/2177)
- **publish:** Add `--graph-type` option to control packages included in topological sort ([#2152](https://github.com/lerna/lerna/issues/2152)) ([ae87669](https://github.com/lerna/lerna/commit/ae87669)), closes [#1437](https://github.com/lerna/lerna/issues/1437)
- **publish:** Allow `--no-verify-access` to prevent checking for account-level 2FA ([ce58d8f](https://github.com/lerna/lerna/commit/ce58d8f))
- **publish:** OTP cache should be seeded from conf value, not CLI directly ([cf56622](https://github.com/lerna/lerna/commit/cf56622))
- **publish:** Propagate root license into custom publish directories ([d410a58](https://github.com/lerna/lerna/commit/d410a58)), closes [#2157](https://github.com/lerna/lerna/issues/2157)

### Features

- **bootstrap:** Add `--strict` option to enable throwing when `--hoist` warns ([#2140](https://github.com/lerna/lerna/issues/2140)) ([91437b5](https://github.com/lerna/lerna/commit/91437b5))
- **deps:** `@octokit/plugin-enterprise-rest@^3.6.1` ([74a3890](https://github.com/lerna/lerna/commit/74a3890))
- **deps:** `@octokit/rest@^16.28.4` ([5f09f50](https://github.com/lerna/lerna/commit/5f09f50))
- **deps:** `byte-size@^5.0.1` ([ed51ddd](https://github.com/lerna/lerna/commit/ed51ddd))
- **deps:** `conventional-recommended-bump@^5.0.0` ([2a0ed60](https://github.com/lerna/lerna/commit/2a0ed60))
- **deps:** `fs-extra@^8.1.0` ([313287f](https://github.com/lerna/lerna/commit/313287f))
- **deps:** `get-port@^4.2.0` ([778ae6a](https://github.com/lerna/lerna/commit/778ae6a))
- **deps:** `glob-parent@^5.0.0` ([c6bc218](https://github.com/lerna/lerna/commit/c6bc218))
- **deps:** `globby@^9.2.0` ([d9aa249](https://github.com/lerna/lerna/commit/d9aa249))
- **deps:** `import-local@^2.0.0` ([14d2c66](https://github.com/lerna/lerna/commit/14d2c66))
- **deps:** `is-ci@^2.0.0` ([ab2ad83](https://github.com/lerna/lerna/commit/ab2ad83))
- **deps:** `load-json-file@^5.3.0` ([3718cc9](https://github.com/lerna/lerna/commit/3718cc9))
- **deps:** `multimatch@^3.0.0` ([968b0d7](https://github.com/lerna/lerna/commit/968b0d7))
- **deps:** `p-map@^2.1.0` ([9e58394](https://github.com/lerna/lerna/commit/9e58394))
- **deps:** `pify@^4.0.1` ([f8ee7e6](https://github.com/lerna/lerna/commit/f8ee7e6))
- **deps:** `semver@^6.2.0` ([d8016d9](https://github.com/lerna/lerna/commit/d8016d9))
- **deps:** `slash@^2.0.0` ([bedd6af](https://github.com/lerna/lerna/commit/bedd6af))
- **deps:** `write-json-file@^3.2.0` ([4fa7dea](https://github.com/lerna/lerna/commit/4fa7dea))
- **listable:** Output JSON adjacency list with `--graph` ([9457a21](https://github.com/lerna/lerna/commit/9457a21)), closes [#1970](https://github.com/lerna/lerna/issues/1970)
- **otplease:** Expose getOneTimePassword() helper ([44b9f70](https://github.com/lerna/lerna/commit/44b9f70))
- **publish:** Eager prompt for OTP when account-level 2FA is enabled ([4f893d1](https://github.com/lerna/lerna/commit/4f893d1))
- **run-lifecycle:** Upgrade `npm-lifecycle@^3.1.0` ([e015a74](https://github.com/lerna/lerna/commit/e015a74))

# [3.15.0](https://github.com/lerna/lerna/compare/v3.14.2...v3.15.0) (2019-06-09)

### Bug Fixes

- **deps:** Consume forked npm libs ([bdd4fa1](https://github.com/lerna/lerna/commit/bdd4fa1))

### Features

- **version:** Add `--create-release=[gitlab|github]` option ([#2073](https://github.com/lerna/lerna/issues/2073)) ([4974b78](https://github.com/lerna/lerna/commit/4974b78))

## [3.14.2](https://github.com/lerna/lerna/compare/v3.14.1...v3.14.2) (2019-06-09)

### Bug Fixes

- **bootstrap:** Respect `--force-local` option ([#2104](https://github.com/lerna/lerna/issues/2104)) ([c2fb639](https://github.com/lerna/lerna/commit/c2fb639))
- **child-process:** Ensure adjacent prefixes are always a different color ([5a10146](https://github.com/lerna/lerna/commit/5a10146))
- **npm-publish:** Use generated manifest when publishing subdirectory ([b922766](https://github.com/lerna/lerna/commit/b922766)), closes [#2113](https://github.com/lerna/lerna/issues/2113)
- **publish:** Allow per-leaf subdirectory publishing ([ea861d9](https://github.com/lerna/lerna/commit/ea861d9)), closes [#2109](https://github.com/lerna/lerna/issues/2109)
- **version:** Remove unused dependency ([285bd7e](https://github.com/lerna/lerna/commit/285bd7e))

## [3.14.1](https://github.com/lerna/lerna/compare/v3.14.0...v3.14.1) (2019-05-15)

### Bug Fixes

- **collect-uncommitted:** Call `git` with correct arguments, test properly ([551e6e4](https://github.com/lerna/lerna/commit/551e6e4)), closes [#2091](https://github.com/lerna/lerna/issues/2091)

# [3.14.0](https://github.com/lerna/lerna/compare/v3.13.4...v3.14.0) (2019-05-14)

### Bug Fixes

- **add:** Never pass filter options to nested bootstrap ([9a5a29c](https://github.com/lerna/lerna/commit/9a5a29c)), closes [#1989](https://github.com/lerna/lerna/issues/1989)
- **run-lifecycle:** Bump `npm-lifecycle` dependency to avoid noisy audit warning ([ea7c20d](https://github.com/lerna/lerna/commit/ea7c20d))

### Features

- **conventional-commits:** Add conventional prerelease/graduation ([#1991](https://github.com/lerna/lerna/issues/1991)) ([5d84b61](https://github.com/lerna/lerna/commit/5d84b61)), closes [#1433](https://github.com/lerna/lerna/issues/1433) [#1675](https://github.com/lerna/lerna/issues/1675)
- **dist-tag:** Prompt for OTP when required ([af870bb](https://github.com/lerna/lerna/commit/af870bb))
- **exec:** Add just-in-time queue management ([23736e5](https://github.com/lerna/lerna/commit/23736e5))
- **import:** Add `--preserve-commit` option ([#2079](https://github.com/lerna/lerna/issues/2079)) ([6a7448d](https://github.com/lerna/lerna/commit/6a7448d))
- **link:** generate shims for missing 'bin' scripts ([#2059](https://github.com/lerna/lerna/issues/2059)) ([90acdde](https://github.com/lerna/lerna/commit/90acdde)), closes [#1444](https://github.com/lerna/lerna/issues/1444)
- **listable:** Use QueryGraph.toposort() helper ([84ce674](https://github.com/lerna/lerna/commit/84ce674))
- **publish:** Add `--otp` option ([6fcbc36](https://github.com/lerna/lerna/commit/6fcbc36)), closes [#2076](https://github.com/lerna/lerna/issues/2076)
- **publish:** Add just-in-time queue management ([ae6471c](https://github.com/lerna/lerna/commit/ae6471c))
- **publish:** Add OTP prompt during publish ([#2084](https://github.com/lerna/lerna/issues/2084)) ([c56bda1](https://github.com/lerna/lerna/commit/c56bda1)), closes [#1091](https://github.com/lerna/lerna/issues/1091)
- **publish:** Display uncommitted changes when validation fails ([#2066](https://github.com/lerna/lerna/issues/2066)) ([ea41fe9](https://github.com/lerna/lerna/commit/ea41fe9))
- **query-graph:** Add toposort() helper ([90759c2](https://github.com/lerna/lerna/commit/90759c2))
- **run:** Add just-in-time queue management ([#2045](https://github.com/lerna/lerna/issues/2045)) ([6eca172](https://github.com/lerna/lerna/commit/6eca172))
- **run:** Extract `@lerna/run-topologically` ([3a8b175](https://github.com/lerna/lerna/commit/3a8b175))
- **version:** Add just-in-time queue management ([290539b](https://github.com/lerna/lerna/commit/290539b))

## [3.13.4](https://github.com/lerna/lerna/compare/v3.13.3...v3.13.4) (2019-04-24)

### Bug Fixes

- **import:** Avoid "unrecognized input" error from colors when using `--flatten` ([#2037](https://github.com/lerna/lerna/issues/2037)) ([51625fa](https://github.com/lerna/lerna/commit/51625fa)), closes [#1644](https://github.com/lerna/lerna/issues/1644)
- **version:** Resolve prerelease for version without bump ([#2041](https://github.com/lerna/lerna/issues/2041)) ([aa11325](https://github.com/lerna/lerna/commit/aa11325))
- **version:** Search for complete tag prefix when composing GitHub releases ([024a6ab](https://github.com/lerna/lerna/commit/024a6ab)), closes [#2038](https://github.com/lerna/lerna/issues/2038)

## [3.13.3](https://github.com/lerna/lerna/compare/v3.13.2...v3.13.3) (2019-04-17)

### Bug Fixes

- **child-process:** Centralize `exitCode` translation from string codes into numbers ([09c0103](https://github.com/lerna/lerna/commit/09c0103)), closes [#2031](https://github.com/lerna/lerna/issues/2031)
- **docs:** Add missing docs for `--tag-version-prefix` ([#2035](https://github.com/lerna/lerna/issues/2035)) ([ff9c476](https://github.com/lerna/lerna/commit/ff9c476)), closes [#1924](https://github.com/lerna/lerna/issues/1924)
- **exec:** Handle node string error codes before setting process.exitCode ([#2031](https://github.com/lerna/lerna/issues/2031)) ([c599c64](https://github.com/lerna/lerna/commit/c599c64))

## [3.13.2](https://github.com/lerna/lerna/compare/v3.13.1...v3.13.2) (2019-04-08)

### Bug Fixes

- **lifecycles:** Avoid duplicating 'rooted leaf' lifecycles ([a7ad9b6](https://github.com/lerna/lerna/commit/a7ad9b6))

## [3.13.1](https://github.com/lerna/lerna/compare/v3.13.0...v3.13.1) (2019-02-26)

### Bug Fixes

- **deps:** cosmiconfig ^5.1.0 ([ed48950](https://github.com/lerna/lerna/commit/ed48950))
- **deps:** npm-packlist ^1.4.1 ([aaf822e](https://github.com/lerna/lerna/commit/aaf822e)), closes [#1932](https://github.com/lerna/lerna/issues/1932)
- **deps:** pacote ^9.5.0 ([cdc2e17](https://github.com/lerna/lerna/commit/cdc2e17))
- **deps:** Upgrade octokit libs ([ea490cd](https://github.com/lerna/lerna/commit/ea490cd))
- **list:** Restore empty `--json` array output when no results ([2c925bd](https://github.com/lerna/lerna/commit/2c925bd)), closes [#1945](https://github.com/lerna/lerna/issues/1945)

# [3.13.0](https://github.com/lerna/lerna/compare/v3.12.1...v3.13.0) (2019-02-15)

### Features

- **conventional-commits:** Bump conventional-changelog dependencies to pick up security fixes ([d632d1b](https://github.com/lerna/lerna/commit/d632d1b))
- **listable:** Output newline-delimited JSON with `--ndjson` ([742781b](https://github.com/lerna/lerna/commit/742781b))
- **meta:** Add `repository.directory` field to package.json ([aec5023](https://github.com/lerna/lerna/commit/aec5023))
- **meta:** Normalize package.json `homepage` field ([abeb4dc](https://github.com/lerna/lerna/commit/abeb4dc))

## [3.12.1](https://github.com/lerna/lerna/compare/v3.12.0...v3.12.1) (2019-02-14)

### Bug Fixes

- **collect-updates:** Do not skip change detection when `--since` provided ([6ff53d6](https://github.com/lerna/lerna/commit/6ff53d6)), closes [#1927](https://github.com/lerna/lerna/issues/1927)
- **list:** Do not emit empty stdout when there are no results ([ba54439](https://github.com/lerna/lerna/commit/ba54439))

# [3.12.0](https://github.com/lerna/lerna/compare/v3.11.1...v3.12.0) (2019-02-14)

### Bug Fixes

- **collect-updates:** Clarify logging in context ([9b8dd9c](https://github.com/lerna/lerna/commit/9b8dd9c))
- **conventional-commits:** Improve logging during preset resolution ([d4a16a5](https://github.com/lerna/lerna/commit/d4a16a5))
- **publish:** Check for git describe error explicitly ([237d1c5](https://github.com/lerna/lerna/commit/237d1c5))
- **publish:** Make the missing license warning clearer and more actionable ([#1921](https://github.com/lerna/lerna/issues/1921)) ([8a71ac4](https://github.com/lerna/lerna/commit/8a71ac4))
- **publish:** Revert foolhardy refactoring (5e975e0) ([a6733a2](https://github.com/lerna/lerna/commit/a6733a2))
- **version:** Log message when git repository validation is skipped ([2c40ffd](https://github.com/lerna/lerna/commit/2c40ffd))

### Features

- **global-options:** Default concurrency to logical CPU count ([#1931](https://github.com/lerna/lerna/issues/1931)) ([2c487fe](https://github.com/lerna/lerna/commit/2c487fe))
- **publish:** Add `--git-head` option to preserve gitless `from-package` metadata ([3d18f2f](https://github.com/lerna/lerna/commit/3d18f2f)), closes [#1933](https://github.com/lerna/lerna/issues/1933)
- **publish:** Allow `from-package` positional to run without a git repo ([df49bfc](https://github.com/lerna/lerna/commit/df49bfc)), closes [#1933](https://github.com/lerna/lerna/issues/1933)
- **version:** Skip repository validation when git is unused ([#1908](https://github.com/lerna/lerna/issues/1908)) ([b9e887e](https://github.com/lerna/lerna/commit/b9e887e)), closes [#1869](https://github.com/lerna/lerna/issues/1869)

## [3.11.1](https://github.com/lerna/lerna/compare/v3.11.0...v3.11.1) (2019-02-11)

### Bug Fixes

- **version:** Exit with an error when `--github-release` is combined with `--no-changelog` ([030de9d](https://github.com/lerna/lerna/commit/030de9d))
- **version:** Passing `--no-changelog` should not disable root versioning ([83c33a3](https://github.com/lerna/lerna/commit/83c33a3))

# [3.11.0](https://github.com/lerna/lerna/compare/v3.10.8...v3.11.0) (2019-02-08)

### Bug Fixes

- **collect-updates:** Improve logging, making ignored globs explicit ([42e4a5c](https://github.com/lerna/lerna/commit/42e4a5c))
- **collect-updates:** Match dotfiles when ignoring changes ([99eadc6](https://github.com/lerna/lerna/commit/99eadc6))
- **create:** Bump camelcase ([e58a1d0](https://github.com/lerna/lerna/commit/e58a1d0))
- **deps:** Explicit libnpmaccess ^3.0.1 ([6ba3d1d](https://github.com/lerna/lerna/commit/6ba3d1d))
- **deps:** Explicit libnpmpublish ^1.1.1 ([a506d96](https://github.com/lerna/lerna/commit/a506d96))
- **deps:** Explicit npm-lifecycle ^2.1.0 ([506ad6d](https://github.com/lerna/lerna/commit/506ad6d))
- **deps:** Explicit npm-package-arg ^6.1.0 ([4b20791](https://github.com/lerna/lerna/commit/4b20791))
- **deps:** Explicit npm-registry-fetch ^3.9.0 ([a83c487](https://github.com/lerna/lerna/commit/a83c487))
- **deps:** Explicit npmlog ^4.1.2 ([571c2e2](https://github.com/lerna/lerna/commit/571c2e2))
- **deps:** Explicit pacote ^9.4.1 ([44d05bf](https://github.com/lerna/lerna/commit/44d05bf))
- **deps:** Explicit read-package-json ^2.0.13 ([2695a90](https://github.com/lerna/lerna/commit/2695a90))
- **deps:** Remove unused libnpm (replaced by direct sub-packages) ([1caeb28](https://github.com/lerna/lerna/commit/1caeb28))
- **filter-options:** Require arguments to --scope and --ignore ([4b81dad](https://github.com/lerna/lerna/commit/4b81dad))
- **publish:** Correct silly log heading ([f1dc3fc](https://github.com/lerna/lerna/commit/f1dc3fc))

### Features

- **version:** Create Github releases with `--github-release` ([#1864](https://github.com/lerna/lerna/issues/1864)) ([f84a631](https://github.com/lerna/lerna/commit/f84a631)), closes [#1513](https://github.com/lerna/lerna/issues/1513)

## [3.10.8](https://github.com/lerna/lerna/compare/v3.10.7...v3.10.8) (2019-02-01)

### Bug Fixes

- **conventional-commits:** Support legacy callback presets ([60647b4](https://github.com/lerna/lerna/commit/60647b4)), closes [#1896](https://github.com/lerna/lerna/issues/1896)
- **publish:** Skip private package lookup ([#1905](https://github.com/lerna/lerna/issues/1905)) ([f9e18fa](https://github.com/lerna/lerna/commit/f9e18fa))
- **version:** Fix negated option links in readme ([0908212](https://github.com/lerna/lerna/commit/0908212))

## [3.10.7](https://github.com/lerna/lerna/compare/v3.10.6...v3.10.7) (2019-01-22)

### Bug Fixes

- **cli:** Ensure exit code is always numeric ([a2362b8](https://github.com/lerna/lerna/commit/a2362b8))
- **npm-publish:** Ensure process exits non-zero when `libnpm/publish` fails ([9e9ce08](https://github.com/lerna/lerna/commit/9e9ce08))

## [3.10.6](https://github.com/lerna/lerna/compare/v3.10.5...v3.10.6) (2019-01-19)

### Bug Fixes

- **exec:** Tweak description ([68a0685](https://github.com/lerna/lerna/commit/68a0685))
- **import:** Ensure compatibility with root-level package globs ([#1875](https://github.com/lerna/lerna/issues/1875)) ([16ab98d](https://github.com/lerna/lerna/commit/16ab98d)), closes [#1872](https://github.com/lerna/lerna/issues/1872)
- **options:** Document negated boolean options explicitly ([8bc9669](https://github.com/lerna/lerna/commit/8bc9669))
- **package-graph:** Ensure cycle paths are always names, not objects ([ae81a76](https://github.com/lerna/lerna/commit/ae81a76))
- **package-graph:** Use correct property when testing for duplicates ([ef33cb7](https://github.com/lerna/lerna/commit/ef33cb7))
- **publish:** Map packument requests concurrently directly from package graph ([c79a827](https://github.com/lerna/lerna/commit/c79a827))
- **run:** Re-order --npm-client in help output ([bfa89bf](https://github.com/lerna/lerna/commit/bfa89bf))

## [3.10.5](https://github.com/lerna/lerna/compare/v3.10.4...v3.10.5) (2019-01-11)

### Bug Fixes

- **run-lifecycle:** Do not customize npm_config_prefix during execution ([79549c1](https://github.com/lerna/lerna/commit/79549c1)), closes [#1866](https://github.com/lerna/lerna/issues/1866)

## [3.10.4](https://github.com/lerna/lerna/compare/v3.10.3...v3.10.4) (2019-01-10)

### Bug Fixes

- **add:** Do not scope chained bootstrap ([d9d4bc4](https://github.com/lerna/lerna/commit/d9d4bc4))
- **bootstrap:** Do not `npm ci` when hoisting ([27516b9](https://github.com/lerna/lerna/commit/27516b9)), closes [#1865](https://github.com/lerna/lerna/issues/1865)

## [3.10.3](https://github.com/lerna/lerna/compare/v3.10.2...v3.10.3) (2019-01-10)

### Bug Fixes

- **bootstrap:** When filtering, only bootstrap filtered packages ([71174e4](https://github.com/lerna/lerna/commit/71174e4)), closes [#1421](https://github.com/lerna/lerna/issues/1421) [#1766](https://github.com/lerna/lerna/issues/1766)

## [3.10.2](https://github.com/lerna/lerna/compare/v3.10.1...v3.10.2) (2019-01-09)

### Bug Fixes

- **bootstrap:** Remove fancy root lifecycle execution, it was foolish ([9f80722](https://github.com/lerna/lerna/commit/9f80722)), closes [#1857](https://github.com/lerna/lerna/issues/1857)

## [3.10.1](https://github.com/lerna/lerna/compare/v3.10.0...v3.10.1) (2019-01-09)

### Bug Fixes

- **collect-updates:** Avoid improper bumps from prompt selections ([06a1cff](https://github.com/lerna/lerna/commit/06a1cff)), closes [#1357](https://github.com/lerna/lerna/issues/1357)

# [3.10.0](https://github.com/lerna/lerna/compare/v3.9.1...v3.10.0) (2019-01-08)

### Bug Fixes

- **publish:** Correctly determine canary version when `--include-merged-tags` present ([fb2a1b2](https://github.com/lerna/lerna/commit/fb2a1b2)), closes [#1820](https://github.com/lerna/lerna/issues/1820)

### Features

- **lerna:** Use --exact version ranges between sibling dependencies ([02a067f](https://github.com/lerna/lerna/commit/02a067f))
- **version:** Add `--no-changelog` option ([#1854](https://github.com/lerna/lerna/issues/1854)) ([d73d823](https://github.com/lerna/lerna/commit/d73d823)), closes [#1852](https://github.com/lerna/lerna/issues/1852)

## [3.9.1](https://github.com/lerna/lerna/compare/v3.9.0...v3.9.1) (2019-01-08)

### Bug Fixes

- **bootstrap:** Don't pass `--ignore-scripts` to `npm install` ([e602838](https://github.com/lerna/lerna/commit/e602838)), closes [#1855](https://github.com/lerna/lerna/issues/1855)
- **bootstrap:** Prevent recursive execution from all install lifecycles ([ea9dbbe](https://github.com/lerna/lerna/commit/ea9dbbe))

# [3.9.0](https://github.com/lerna/lerna/compare/v3.8.5...v3.9.0) (2019-01-08)

### Bug Fixes

- **bootstrap:** Only run install lifecycles once-per-package, in topological order ([929ae22](https://github.com/lerna/lerna/commit/929ae22))
- **describe-ref:** Properly handle sha-like tag names ([#1853](https://github.com/lerna/lerna/issues/1853)) ([094a1cb](https://github.com/lerna/lerna/commit/094a1cb))
- **run-lifecycle:** Ensure all npm*package*\* env vars are created ([bab8e58](https://github.com/lerna/lerna/commit/bab8e58)), closes [#1752](https://github.com/lerna/lerna/issues/1752)

### Features

- **bootstrap:** Add `--ignore-prepublish` option ([f14fc06](https://github.com/lerna/lerna/commit/f14fc06))
- **bootstrap:** Run root install lifecycles where appropriate ([944e36f](https://github.com/lerna/lerna/commit/944e36f))

## [3.8.5](https://github.com/lerna/lerna/compare/v3.8.4...v3.8.5) (2019-01-05)

### Bug Fixes

- **npm-dist-tag:** Improve robustness ([63a7a89](https://github.com/lerna/lerna/commit/63a7a89))
- **npm-publish:** Ensure pkg.publishConfig is handled correctly ([1877def](https://github.com/lerna/lerna/commit/1877def)), closes [#1498](https://github.com/lerna/lerna/issues/1498)
- **project:** Deprecate root-level config keys as well, prioritizing nested ([7a65a87](https://github.com/lerna/lerna/commit/7a65a87))
- **publish:** Deprecate `--npm-tag`, replaced by `--dist-tag` ([196d663](https://github.com/lerna/lerna/commit/196d663))
- **publish:** Ensure pkg.publishConfig is handled correctly when promoting dist-tags ([af1c2ad](https://github.com/lerna/lerna/commit/af1c2ad))
- **publish:** Tweak progress logging ([5a04145](https://github.com/lerna/lerna/commit/5a04145))

## [3.8.4](https://github.com/lerna/lerna/compare/v3.8.3...v3.8.4) (2019-01-03)

### Bug Fixes

- **publish:** Pass username to access.lsPackages() ([31982a1](https://github.com/lerna/lerna/commit/31982a1))

## [3.8.3](https://github.com/lerna/lerna/compare/v3.8.2...v3.8.3) (2019-01-03)

### Bug Fixes

- **publish:** Give up trying to validate third-party registries ([b44f2f9](https://github.com/lerna/lerna/commit/b44f2f9)), closes [#1685](https://github.com/lerna/lerna/issues/1685) [#1687](https://github.com/lerna/lerna/issues/1687)

## [3.8.2](https://github.com/lerna/lerna/compare/v3.8.1...v3.8.2) (2019-01-03)

### Bug Fixes

- **bootstrap:** Bail out of hoisted recursive lifecycles ([169c943](https://github.com/lerna/lerna/commit/169c943)), closes [#1125](https://github.com/lerna/lerna/issues/1125)
- **publish:** Avoid recursive root lifecycle execution ([e133134](https://github.com/lerna/lerna/commit/e133134))
- **publish:** Run root prepublish lifecycle if it exists ([c5676bb](https://github.com/lerna/lerna/commit/c5676bb))
- **run-lifecycle:** Short-circuit ignore options ([ae29097](https://github.com/lerna/lerna/commit/ae29097))
- **version:** Avoid recursive root lifecycle execution ([089392d](https://github.com/lerna/lerna/commit/089392d)), closes [#1844](https://github.com/lerna/lerna/issues/1844)

## [3.8.1](https://github.com/lerna/lerna/compare/v3.8.0...v3.8.1) (2018-12-31)

### Bug Fixes

- Do not print duplicate stdio after a streaming command errors ([#1832](https://github.com/lerna/lerna/issues/1832)) ([2bcc366](https://github.com/lerna/lerna/commit/2bcc366)), closes [#1790](https://github.com/lerna/lerna/issues/1790)
- **npm-publish:** Pass normalized manifest to libnpm/publish ([8e59950](https://github.com/lerna/lerna/commit/8e59950)), closes [#1843](https://github.com/lerna/lerna/issues/1843)
- **progress:** Correctly avoid progress where we don't want it ([0de3df9](https://github.com/lerna/lerna/commit/0de3df9))
- **progress:** Enable progress during logging setup, correcting default ([da81e60](https://github.com/lerna/lerna/commit/da81e60))
- **publish:** --canary should also respect --include-merged-tags ([462b15c](https://github.com/lerna/lerna/commit/462b15c)), closes [#1820](https://github.com/lerna/lerna/issues/1820)

### Features

- **command:** log whether CI environment has been detected ([#1841](https://github.com/lerna/lerna/issues/1841)) ([db5631e](https://github.com/lerna/lerna/commit/db5631e)), closes [#1825](https://github.com/lerna/lerna/issues/1825)

# [3.8.0](https://github.com/lerna/lerna/compare/v3.7.2...v3.8.0) (2018-12-21)

### Bug Fixes

- **publish:** Heighten dist-tag success log level to distinguish from noisy fetch logging ([f1f0871](https://github.com/lerna/lerna/commit/f1f0871))
- **publish:** Unhide options shared with version command ([09fccd3](https://github.com/lerna/lerna/commit/09fccd3))

### Features

- **publish:** Add --contents option ([5e790e5](https://github.com/lerna/lerna/commit/5e790e5)), closes [#1817](https://github.com/lerna/lerna/issues/1817)

## [3.7.2](https://github.com/lerna/lerna/compare/v3.7.1...v3.7.2) (2018-12-21)

### Bug Fixes

- **pack-directory:** Accept lazy Package, passing directory as second parameter ([c6819c0](https://github.com/lerna/lerna/commit/c6819c0))
- **package:** Add Package.lazy() helper ([4aa9d37](https://github.com/lerna/lerna/commit/4aa9d37))
- **package:** Chain self from serialize() method for parity with refresh() ([98c812c](https://github.com/lerna/lerna/commit/98c812c))
- **publish:** Re-order --git-reset flag in options ([0653af9](https://github.com/lerna/lerna/commit/0653af9))
- **publish:** Remove unused --npm-client option ([4e7eaef](https://github.com/lerna/lerna/commit/4e7eaef))
- **symlink-binary:** Use Package.lazy() instead of private resolver ([83fe3ef](https://github.com/lerna/lerna/commit/83fe3ef))
- **version:** Prevent clobbering composed --yes option ([f3816be](https://github.com/lerna/lerna/commit/f3816be))

## [3.7.1](https://github.com/lerna/lerna/compare/v3.7.0...v3.7.1) (2018-12-20)

### Bug Fixes

- **bootstrap:** Pulse progress bar during execution ([b38a151](https://github.com/lerna/lerna/commit/b38a151))
- **clean:** Pulse progress bar during execution ([f1202de](https://github.com/lerna/lerna/commit/f1202de))
- **command:** Enable progress from top-level log object ([95e88f0](https://github.com/lerna/lerna/commit/95e88f0))
- **import:** Pulse progress bar during execution ([b552e22](https://github.com/lerna/lerna/commit/b552e22))
- **npm-dist-tag:** Accept opts.log, defaulting to libnpm/log ([97edc7e](https://github.com/lerna/lerna/commit/97edc7e))
- **npm-publish:** Accept opts.log, defaulting to libnpm/log ([a1d61f6](https://github.com/lerna/lerna/commit/a1d61f6))
- **pack-directory:** Accept opts.log, defaulting to libnpm/log ([d099d13](https://github.com/lerna/lerna/commit/d099d13))
- **publish:** Do not pass this.logger into conf, it does not respect log.level ([9bcd503](https://github.com/lerna/lerna/commit/9bcd503))
- **publish:** Pulse progress bar during execution ([49b8771](https://github.com/lerna/lerna/commit/49b8771))
- Add pulse-till-done utility ([3359c63](https://github.com/lerna/lerna/commit/3359c63))
- **run-lifecycle:** Accept opts.log, defaulting to libnpm/log ([dde588a](https://github.com/lerna/lerna/commit/dde588a))
- **run-lifecycle:** Do not execute on packages that lack the target script, avoiding spurious logs ([c0ad316](https://github.com/lerna/lerna/commit/c0ad316))

# [3.7.0](https://github.com/lerna/lerna/compare/v3.6.0...v3.7.0) (2018-12-19)

### Bug Fixes

- **add:** Snapshot opts passed to pacote.manifest() ([d0f0dbc](https://github.com/lerna/lerna/commit/d0f0dbc))
- **bootstrap:** Use run-lifecycle factory instead of manual filtering ([d32feaa](https://github.com/lerna/lerna/commit/d32feaa))
- **create:** Pass options snapshot to pacote.manifest() ([6116680](https://github.com/lerna/lerna/commit/6116680))
- **npm-conf:** Port kevva/npm-conf/pull/12 ([@zkochan](https://github.com/zkochan)) ([d58b741](https://github.com/lerna/lerna/commit/d58b741))
- **npm-conf:** Update defaults & types to npm v6.5.0+ ([6a8aa83](https://github.com/lerna/lerna/commit/6a8aa83))
- **publish:** Remove unused dependency ([d4ab6c4](https://github.com/lerna/lerna/commit/d4ab6c4))
- **publish:** Short-circuit retries for npm username validation ([ca4dd95](https://github.com/lerna/lerna/commit/ca4dd95))
- **run-lifecycle:** Omit circular options from config ([00eb5bd](https://github.com/lerna/lerna/commit/00eb5bd))

### Features

- Add [@lerna](https://github.com/lerna)/get-packed ([8675c8f](https://github.com/lerna/lerna/commit/8675c8f))
- Add [@lerna](https://github.com/lerna)/pack-directory ([be1aeaf](https://github.com/lerna/lerna/commit/be1aeaf))
- **dist-tag:** Wrap options in figgy-pudding ([2713ab8](https://github.com/lerna/lerna/commit/2713ab8))
- **npm-publish:** Use libnpm/publish instead of subprocess execution ([433275e](https://github.com/lerna/lerna/commit/433275e))
- **package:** Add .refresh() method to update internal state when external changes have occurred ([905ba10](https://github.com/lerna/lerna/commit/905ba10))
- **publish:** Add npm-session, npm-version, and user-agent fields to libnpm/fetch config ([5edb27d](https://github.com/lerna/lerna/commit/5edb27d))
- **publish:** Refresh package manifests after prepare/prepublishOnly lifecycle ([e6b31f8](https://github.com/lerna/lerna/commit/e6b31f8))
- **publish:** Use [@lerna](https://github.com/lerna)/pack-directory instead of subprocess npm pack ([fd7299f](https://github.com/lerna/lerna/commit/fd7299f))
- **publish:** Use libnpm/publish instead of subprocess execution ([58fda8d](https://github.com/lerna/lerna/commit/58fda8d))
- **version:** Refresh package manifests after preversion lifecycle ([7c7bf9a](https://github.com/lerna/lerna/commit/7c7bf9a))

# [3.6.0](https://github.com/lerna/lerna/compare/v3.5.1...v3.6.0) (2018-12-07)

### Bug Fixes

- **add:** Validate local package version ([#1804](https://github.com/lerna/lerna/issues/1804)) ([ed6e2db](https://github.com/lerna/lerna/commit/ed6e2db)), closes [#1799](https://github.com/lerna/lerna/issues/1799)
- **bootstrap:** Omit local bundled dependencies ([#1805](https://github.com/lerna/lerna/issues/1805)) ([8f5bdbb](https://github.com/lerna/lerna/commit/8f5bdbb)), closes [#1775](https://github.com/lerna/lerna/issues/1775)
- **pkg:** Exclude **mocks** from package tarball ([4017f37](https://github.com/lerna/lerna/commit/4017f37))

### Features

- **add:** Add --no-bootstrap option ([89bb928](https://github.com/lerna/lerna/commit/89bb928))
- **bootstrap:** Support `--force-local` option ([#1807](https://github.com/lerna/lerna/issues/1807)) ([25572af](https://github.com/lerna/lerna/commit/25572af)), closes [#1763](https://github.com/lerna/lerna/issues/1763)
- Migrate existing usage to libnpm ([0d3a786](https://github.com/lerna/lerna/commit/0d3a786)), closes [#1767](https://github.com/lerna/lerna/issues/1767)
- **create:** Migrate `npm info` subprocess to libnpm.manifest ([65a1d1b](https://github.com/lerna/lerna/commit/65a1d1b))
- **listable:** Add --toposort option ([b387881](https://github.com/lerna/lerna/commit/b387881)), closes [#1652](https://github.com/lerna/lerna/issues/1652)
- **npm-dist-tag:** Use fetch API instead of CLI to make changes ([54008c6](https://github.com/lerna/lerna/commit/54008c6))
- **publish:** Add a "from-package" positional argument ([#1708](https://github.com/lerna/lerna/issues/1708)) ([16611be](https://github.com/lerna/lerna/commit/16611be)), closes [#1648](https://github.com/lerna/lerna/issues/1648)
- **publish:** Attempt profile retrieval before whoami endpoint during user validation ([38097d8](https://github.com/lerna/lerna/commit/38097d8))

## [3.5.1](https://github.com/lerna/lerna/compare/v3.5.0...v3.5.1) (2018-11-29)

### Bug Fixes

- **publish:** Pass explicit list of files to checkout instead of globs ([a4c57c2](https://github.com/lerna/lerna/commit/a4c57c2)), closes [#1786](https://github.com/lerna/lerna/issues/1786)

# [3.5.0](https://github.com/lerna/lerna/compare/v3.4.3...v3.5.0) (2018-11-27)

### Bug Fixes

- **conventional-commits:** Bump minimum dependency ranges for node v11 compat ([76fad65](https://github.com/lerna/lerna/commit/76fad65))
- prettier ([001a6df](https://github.com/lerna/lerna/commit/001a6df))
- Update yarn workspaces error prompt link ([#1756](https://github.com/lerna/lerna/issues/1756)) ([d6e6a42](https://github.com/lerna/lerna/commit/d6e6a42))
- **publish:** Ignore non-release tags when detecting `from-git` ([#1782](https://github.com/lerna/lerna/issues/1782)) ([3cb7465](https://github.com/lerna/lerna/commit/3cb7465))
- **version:** Add friendly error message when remote branch doesn't exist ([#1741](https://github.com/lerna/lerna/issues/1741)) ([cd34b48](https://github.com/lerna/lerna/commit/cd34b48))
- **version:** Don't version private packages lacking a version field ([#1654](https://github.com/lerna/lerna/issues/1654)) ([578bb19](https://github.com/lerna/lerna/commit/578bb19))

### Features

- **publish:** Add option `--no-git-reset` to leave unstaged changes in working tree ([#1791](https://github.com/lerna/lerna/issues/1791)) ([eae5619](https://github.com/lerna/lerna/commit/eae5619))
- **run:** Log package name and timing in runScriptInPackageCapturing ([#1781](https://github.com/lerna/lerna/issues/1781)) ([b69a728](https://github.com/lerna/lerna/commit/b69a728))
- **version:** Add `--include-merged-tags` option ([#1712](https://github.com/lerna/lerna/issues/1712)) ([7ee05d7](https://github.com/lerna/lerna/commit/7ee05d7))

## [3.4.3](https://github.com/lerna/lerna/compare/v3.4.2...v3.4.3) (2018-10-10)

### Bug Fixes

- **publish:** Use correct field name when limiting retries ([76589d4](https://github.com/lerna/lerna/commit/76589d4))

## [3.4.2](https://github.com/lerna/lerna/compare/v3.4.1...v3.4.2) (2018-10-09)

### Bug Fixes

- **publish:** Prevent retries during access validation so third-party registries are skipped faster ([a89ae62](https://github.com/lerna/lerna/commit/a89ae62))
- **publish:** Use modern auth resolution ([7ba41a6](https://github.com/lerna/lerna/commit/7ba41a6))

## [3.4.1](https://github.com/lerna/lerna/compare/v3.4.0...v3.4.1) (2018-10-04)

### Bug Fixes

- **add:** Allow --registry option ([597606c](https://github.com/lerna/lerna/commit/597606c))
- **bootstrap:** Constrain npm-conf argument object to options.registry only ([987fd26](https://github.com/lerna/lerna/commit/987fd26))
- **conventional-commits:** Upgrade angular preset, ensure header is not duplicated ([159a0b0](https://github.com/lerna/lerna/commit/159a0b0)), closes [#1696](https://github.com/lerna/lerna/issues/1696)
- **conventional-commits:** Upgrade dependencies ([9752f3e](https://github.com/lerna/lerna/commit/9752f3e)), closes [#1641](https://github.com/lerna/lerna/issues/1641) [#1661](https://github.com/lerna/lerna/issues/1661)
- **npm-conf:** Do not overwrite defaults with undefined cli keys ([25af71d](https://github.com/lerna/lerna/commit/25af71d))
- **publish:** Overwrite Yarn registry proxy when encountered ([f7fdc77](https://github.com/lerna/lerna/commit/f7fdc77))
- **publish:** Set token on npm config, allow third-party registries to remain non-compliant ([06a9479](https://github.com/lerna/lerna/commit/06a9479))

<a name="3.4.0"></a>

# [3.4.0](https://github.com/lerna/lerna/compare/v3.3.2...v3.4.0) (2018-09-14)

### Features

- **publish:** Use APIs for validation queries instead of CLI ([65fc603](https://github.com/lerna/lerna/commit/65fc603))

<a name="3.3.2"></a>

## [3.3.2](https://github.com/lerna/lerna/compare/v3.3.1...v3.3.2) (2018-09-12)

### Bug Fixes

- **publish:** Allow `--force-publish` in a canary release ([b97d9a3](https://github.com/lerna/lerna/commit/b97d9a3)), closes [#1638](https://github.com/lerna/lerna/issues/1638)
- **version:** Allow `--force-publish` to work on tagged releases ([7971bf3](https://github.com/lerna/lerna/commit/7971bf3)), closes [#1667](https://github.com/lerna/lerna/issues/1667) [#1671](https://github.com/lerna/lerna/issues/1671)

<a name="3.3.1"></a>

## [3.3.1](https://github.com/lerna/lerna/compare/v3.3.0...v3.3.1) (2018-09-11)

### Bug Fixes

- **create:** Upgrade whatwg-url to ^7.0.0 ([00842d6](https://github.com/lerna/lerna/commit/00842d6))
- **import:** Handle filepaths with spaces more robustly ([#1655](https://github.com/lerna/lerna/issues/1655)) ([b084293](https://github.com/lerna/lerna/commit/b084293))
- **prompt:** Upgrade inquirer to ^6.2.0 ([ebb7ee4](https://github.com/lerna/lerna/commit/ebb7ee4))
- **publish:** Tell yarn to stop creating git tags ([2a6f0a4](https://github.com/lerna/lerna/commit/2a6f0a4)), closes [#1662](https://github.com/lerna/lerna/issues/1662)
- **run-lifecycle:** Remove repetitive error logging ([b8915e7](https://github.com/lerna/lerna/commit/b8915e7))

<a name="3.3.0"></a>

# [3.3.0](https://github.com/lerna/lerna/compare/v3.2.1...v3.3.0) (2018-09-06)

### Bug Fixes

- **describe-ref:** Fallback refCount is the number of commits since beginning of repository ([6dfea52](https://github.com/lerna/lerna/commit/6dfea52))
- Propagate exit codes from failed executions ([af9c70b](https://github.com/lerna/lerna/commit/af9c70b)), closes [#1374](https://github.com/lerna/lerna/issues/1374) [#1653](https://github.com/lerna/lerna/issues/1653)
- **run-lifecycle:** Propagate exit code when execution fails ([4763f95](https://github.com/lerna/lerna/commit/4763f95)), closes [#1495](https://github.com/lerna/lerna/issues/1495)

### Features

- **deps:** Upgrade execa to ^1.0.0 ([748ae4e](https://github.com/lerna/lerna/commit/748ae4e))
- **deps:** Upgrade fs-extra to ^7.0.0 ([042b1a3](https://github.com/lerna/lerna/commit/042b1a3))
- **deps:** Upgrade get-stream to ^4.0.0 ([e280d1d](https://github.com/lerna/lerna/commit/e280d1d))
- **deps:** Upgrade strong-log-transformer to ^2.0.0 ([42b18a1](https://github.com/lerna/lerna/commit/42b18a1))

<a name="3.2.1"></a>

## [3.2.1](https://github.com/lerna/lerna/compare/v3.2.0...v3.2.1) (2018-08-28)

### Bug Fixes

- **publish:** Use package version as fallback for independent canary bump ([989a3b5](https://github.com/lerna/lerna/commit/989a3b5)), closes [#1614](https://github.com/lerna/lerna/issues/1614)

<a name="3.2.0"></a>

# [3.2.0](https://github.com/lerna/lerna/compare/v3.1.4...v3.2.0) (2018-08-28)

### Bug Fixes

- **add:** Order short flags first in help output, clarify description ([8efb549](https://github.com/lerna/lerna/commit/8efb549))
- **publish:** Call synthetic prepublishOnly lifecycle before packing ([dda9812](https://github.com/lerna/lerna/commit/dda9812)), closes [#1169](https://github.com/lerna/lerna/issues/1169)
- **version:** Make changes to packages in batched topological order ([d799fbf](https://github.com/lerna/lerna/commit/d799fbf))
- **version:** Skip working tree validation when `--no-git-tag-version` passed ([bd948cc](https://github.com/lerna/lerna/commit/bd948cc)), closes [#1613](https://github.com/lerna/lerna/issues/1613)

### Features

- **add:** Add examples to `--help` output ([#1612](https://github.com/lerna/lerna/issues/1612)) ([2ab62c1](https://github.com/lerna/lerna/commit/2ab62c1)), closes [#1608](https://github.com/lerna/lerna/issues/1608)
- **cli:** Configure commands in root package, all other bits in cli package ([7200fd0](https://github.com/lerna/lerna/commit/7200fd0)), closes [#1584](https://github.com/lerna/lerna/issues/1584)
- **npm-publish:** Resolve target package to aid chaining ([928a707](https://github.com/lerna/lerna/commit/928a707))
- **npm-publish:** Store entire tarball metadata object on Package instances ([063d743](https://github.com/lerna/lerna/commit/063d743))
- **publish:** Support prepack/postpack lifecycle in root manifest ([9df88a4](https://github.com/lerna/lerna/commit/9df88a4))
- **run-lifecycle:** Resolve target package to aid chaining ([8e0aa96](https://github.com/lerna/lerna/commit/8e0aa96))

<a name="3.1.4"></a>

## [3.1.4](https://github.com/lerna/lerna/compare/v3.1.3...v3.1.4) (2018-08-21)

### Bug Fixes

- **symlink-binary:** Avoid instanceof across nested module boundaries ([26d1b72](https://github.com/lerna/lerna/commit/26d1b72)), closes [#1525](https://github.com/lerna/lerna/issues/1525)

<a name="3.1.3"></a>

## [3.1.3](https://github.com/lerna/lerna/compare/v3.1.2...v3.1.3) (2018-08-21)

### Bug Fixes

- **add:** Avoid passing bad scope to pacote ([ad649bf](https://github.com/lerna/lerna/commit/ad649bf)), closes [#1592](https://github.com/lerna/lerna/issues/1592)
- **global-options:** Move env defaults to command superclass ([6d8e405](https://github.com/lerna/lerna/commit/6d8e405)), closes [#1449](https://github.com/lerna/lerna/issues/1449)

<a name="3.1.2"></a>

## [3.1.2](https://github.com/lerna/lerna/compare/v3.1.1...v3.1.2) (2018-08-20)

### Bug Fixes

- Setup instance.filteredPackages explicitly ([32357f8](https://github.com/lerna/lerna/commit/32357f8))
- Use packageGraph.rawPackageList instead of misleading instance.filteredPackages ([2e2abdc](https://github.com/lerna/lerna/commit/2e2abdc))
- **bootstrap:** Remove redundant duplicate name check ([c2405a1](https://github.com/lerna/lerna/commit/c2405a1))
- **command:** Remove redundant filteredPackages calculation ([e0a361f](https://github.com/lerna/lerna/commit/e0a361f))
- **filter-options:** Move filterPackages logic into named export ([e863c28](https://github.com/lerna/lerna/commit/e863c28))
- **package-graph:** Throw errors when package names are not unique ([387df2b](https://github.com/lerna/lerna/commit/387df2b))
- **publish:** Allow composed version command to decide when to verify working tree ([e61aa67](https://github.com/lerna/lerna/commit/e61aa67))

<a name="3.1.1"></a>

## [3.1.1](https://github.com/lerna/lerna/compare/v3.1.0...v3.1.1) (2018-08-17)

### Bug Fixes

- **add:** Compose bootstrap to avoid extra logs ([3c534eb](https://github.com/lerna/lerna/commit/3c534eb))
- **add:** Use `pacote` to resolve third-party registry authentication woes ([a0fbf46](https://github.com/lerna/lerna/commit/a0fbf46)), closes [#1572](https://github.com/lerna/lerna/issues/1572) [#1539](https://github.com/lerna/lerna/issues/1539)

<a name="3.1.0"></a>

# [3.1.0](https://github.com/lerna/lerna/compare/v3.0.6...v3.1.0) (2018-08-17)

### Bug Fixes

- **collect-updates:** Report no changes when on a release commit ([082d876](https://github.com/lerna/lerna/commit/082d876)), closes [#1548](https://github.com/lerna/lerna/issues/1548)
- **command:** Detect composed commands more accurately ([1e51b39](https://github.com/lerna/lerna/commit/1e51b39))
- **command:** Log lerna CLI version with less ambiguity ([67494e7](https://github.com/lerna/lerna/commit/67494e7))
- **publish:** Throw errors if --canary attempted on unclean tree or tagged release ([5da0e42](https://github.com/lerna/lerna/commit/5da0e42))
- **version:** Throw errors if tree is unclean or duplicating tagged release ([d8ee1cf](https://github.com/lerna/lerna/commit/d8ee1cf))

### Features

- Create `[@lerna](https://github.com/lerna)/check-working-tree` ([98cd41f](https://github.com/lerna/lerna/commit/98cd41f))
- Create `[@lerna](https://github.com/lerna)/describe-ref` ([8c11b75](https://github.com/lerna/lerna/commit/8c11b75))

<a name="3.0.6"></a>

## [3.0.6](https://github.com/lerna/lerna/compare/v3.0.5...v3.0.6) (2018-08-16)

### Bug Fixes

- **command:** Silence goalpost logging when running a composed command ([12b4280](https://github.com/lerna/lerna/commit/12b4280))
- **create:** Use whatwg-url instead of node 8.x-dependent URL class ([8701b79](https://github.com/lerna/lerna/commit/8701b79))
- **init:** Consume lernaVersion from options, not instance property ([89e31d2](https://github.com/lerna/lerna/commit/89e31d2))
- **npm-publish:** Tip-toe around logging when emitting chunk to stdout ([c027246](https://github.com/lerna/lerna/commit/c027246))
- **version:** Pass --preid to selection prompt ([23a30a0](https://github.com/lerna/lerna/commit/23a30a0)), closes [#1214](https://github.com/lerna/lerna/issues/1214)
- **version:** Prioritize `--preid` over existing prerelease ID ([#1568](https://github.com/lerna/lerna/issues/1568)) ([f2c470a](https://github.com/lerna/lerna/commit/f2c470a))

<a name="3.0.5"></a>

## [3.0.5](https://github.com/lerna/lerna/compare/v3.0.4...v3.0.5) (2018-08-15)

### Bug Fixes

- **collect-updates:** Remove period from committish log message ([a97262c](https://github.com/lerna/lerna/commit/a97262c))
- **filter-options:** Allow --private to be configured from file ([21e134c](https://github.com/lerna/lerna/commit/21e134c))
- **global-options:** Allow --sort to be configured from file ([f4aed75](https://github.com/lerna/lerna/commit/f4aed75))
- **help:** Insert line break before describing boolean negations ([da2f886](https://github.com/lerna/lerna/commit/da2f886))
- **options:** Provide -y alias for --yes ([3ea460c](https://github.com/lerna/lerna/commit/3ea460c))
- **publish:** Add confirmation prompt before execution ([47766e5](https://github.com/lerna/lerna/commit/47766e5)), closes [#1566](https://github.com/lerna/lerna/issues/1566)
- **publish:** Get tagged packages from merge commit ([#1567](https://github.com/lerna/lerna/issues/1567)) ([fc771d9](https://github.com/lerna/lerna/commit/fc771d9))
- **version:** Log skipped publish when composed ([89645b7](https://github.com/lerna/lerna/commit/89645b7))

<a name="3.0.4"></a>

## [3.0.4](https://github.com/lerna/lerna/compare/v3.0.3...v3.0.4) (2018-08-14)

### Bug Fixes

- **publish:** Do not ping third-party registries ([42f4fdd](https://github.com/lerna/lerna/commit/42f4fdd)), closes [#1560](https://github.com/lerna/lerna/issues/1560)
- **publish:** Only pass `--json` to `npm pack` when npm >= 5.10.0 ([71babce](https://github.com/lerna/lerna/commit/71babce)), closes [#1558](https://github.com/lerna/lerna/issues/1558)
- **publish:** Run publish from leaf nodes again ([3d348ec](https://github.com/lerna/lerna/commit/3d348ec)), closes [#1560](https://github.com/lerna/lerna/issues/1560)

<a name="3.0.3"></a>

## [3.0.3](https://github.com/lerna/lerna/compare/v3.0.2...v3.0.3) (2018-08-11)

### Bug Fixes

- **publish:** Restore deprecated `--skip-npm` functionality ([cb47cb6](https://github.com/lerna/lerna/commit/cb47cb6)), closes [#1553](https://github.com/lerna/lerna/issues/1553)

<a name="3.0.2"></a>

## [3.0.2](https://github.com/lerna/lerna/compare/v3.0.1...v3.0.2) (2018-08-11)

### Bug Fixes

- **conventional-commits:** Pass --tag-version-prefix to changelog utilities ([8ed7d83](https://github.com/lerna/lerna/commit/8ed7d83))
- **conventional-commits:** Provide fallback bump when releaseType is missing ([e330f6f](https://github.com/lerna/lerna/commit/e330f6f)), closes [#1551](https://github.com/lerna/lerna/issues/1551)
- **exec:** Allow config files to override defaults ([2335149](https://github.com/lerna/lerna/commit/2335149))
- **publish:** Add default for --tag-version-prefix ([f159442](https://github.com/lerna/lerna/commit/f159442))
- **publish:** Allow disabling of registry and package verification ([0bfdff5](https://github.com/lerna/lerna/commit/0bfdff5)), closes [#1552](https://github.com/lerna/lerna/issues/1552)
- **run:** Allow config files to override defaults ([f15b6fb](https://github.com/lerna/lerna/commit/f15b6fb))
- **version:** Allow config files to override defaults ([bb1cfb5](https://github.com/lerna/lerna/commit/bb1cfb5))
- **version:** Positional bump supersedes `--conventional-commits` when choosing version ([a74c866](https://github.com/lerna/lerna/commit/a74c866))

<a name="3.0.1"></a>

## [3.0.1](https://github.com/lerna/lerna/compare/v3.0.0...v3.0.1) (2018-08-10)

### Bug Fixes

- **publish:** Allow unpublished packages to pass access verification ([3a7348c](https://github.com/lerna/lerna/commit/3a7348c))

<a name="3.0.0"></a>

# [3.0.0](https://github.com/lerna/lerna/compare/v3.0.0-rc.0...v3.0.0) (2018-08-10)

### Bug Fixes

- **add:** Always use POSIX paths when computing relative file: specifiers ([ffe354f](https://github.com/lerna/lerna/commit/ffe354f))
- **add:** Support explicit & implicit relative file: specifiers ([41f231f](https://github.com/lerna/lerna/commit/41f231f))
- **create:** Use filename without scope when generating imports from test file ([acfd48b](https://github.com/lerna/lerna/commit/acfd48b))
- **publish:** Improve `npm pack` experience ([627cfc2](https://github.com/lerna/lerna/commit/627cfc2))

### Features

- **changed:** Support list output options ([6ecdd83](https://github.com/lerna/lerna/commit/6ecdd83))
- **list:** Extract [@lerna](https://github.com/lerna)/listable utility ([bf56018](https://github.com/lerna/lerna/commit/bf56018))
- **list:** Improve scriptability with several new options ([2e204af](https://github.com/lerna/lerna/commit/2e204af))
- **npm-publish:** Add npmPack export ([088ea54](https://github.com/lerna/lerna/commit/088ea54))
- **package:** Add tarball property ([be453cd](https://github.com/lerna/lerna/commit/be453cd))
- **publish:** Run `npm pack` before `npm publish` ([8d80b2c](https://github.com/lerna/lerna/commit/8d80b2c))
- **publish:** Validate npm registry and package access prerequisites ([ebc8ba6](https://github.com/lerna/lerna/commit/ebc8ba6)), closes [#55](https://github.com/lerna/lerna/issues/55) [#1045](https://github.com/lerna/lerna/issues/1045) [#1347](https://github.com/lerna/lerna/issues/1347)
- Add [@lerna](https://github.com/lerna)/log-packed module, extracted from npm ([9c767ac](https://github.com/lerna/lerna/commit/9c767ac))
- Split `lerna version` from of `lerna publish` ([#1522](https://github.com/lerna/lerna/issues/1522)) ([8b97394](https://github.com/lerna/lerna/commit/8b97394)), closes [#277](https://github.com/lerna/lerna/issues/277) [#936](https://github.com/lerna/lerna/issues/936) [#956](https://github.com/lerna/lerna/issues/956) [#961](https://github.com/lerna/lerna/issues/961) [#1056](https://github.com/lerna/lerna/issues/1056) [#1118](https://github.com/lerna/lerna/issues/1118) [#1385](https://github.com/lerna/lerna/issues/1385) [#1483](https://github.com/lerna/lerna/issues/1483) [#1494](https://github.com/lerna/lerna/issues/1494)

### BREAKING CHANGES

- **changed:** The package names emitted to stdout are no longer prefixed by a "- ", and private packages are no longer displayed by default.
- **list:** The default output of `lerna ls` no longer shows version strings or private packages.

- The new alias `lerna la` resembles the old output, with the addition of relative path to the package
- The new alias `lerna ll` is a shortcut for the new `--long` option
- A new `--parseable` option has been added to aid magical piping incantations
- - `--preid` now defaults to "alpha" during prereleases:

  The previous default for this option was undefined, which led to an awkward "1.0.1-0" result when passed to `semver.inc()`.

  The new default "alpha" yields a much more useful "1.0.1-alpha.0" result. Any previous prerelease ID will be preserved, just as it was before.

- `--no-verify` is no longer passed to `git commit` by default, but controlled by the new `--commit-hooks` option:

  The previous behavior was too overzealous, and the new option operates exactly like the corresponding [npm version](https://docs.npmjs.com/cli/version#commit-hooks) option of the same name.

  As long as your pre-commit hooks are properly scoped to ignore changes in package.json files, this change should not affect you. If that is not the case, you may pass `--no-commit-hooks` to restore the previous behavior.

<a name="3.0.0-rc.0"></a>

# [3.0.0-rc.0](https://github.com/lerna/lerna/compare/v3.0.0-beta.21...v3.0.0-rc.0) (2018-07-27)

### Bug Fixes

- **changed:** Clarify early exit log message ([b132c3a](https://github.com/lerna/lerna/commit/b132c3a))
- **cli:** Pass global defaults into option factory instead of yargs.config() ([cf4008a](https://github.com/lerna/lerna/commit/cf4008a)), closes [#1449](https://github.com/lerna/lerna/issues/1449)
- **command:** Prevent premature resolution during tests from nested commands ([151363f](https://github.com/lerna/lerna/commit/151363f))
- **core/package:** Serialize hosted git URLs with original protocol/shorthand ([60ff432](https://github.com/lerna/lerna/commit/60ff432)), closes [#1499](https://github.com/lerna/lerna/issues/1499)
- **project:** Report syntax errors in root package.json ([f674f35](https://github.com/lerna/lerna/commit/f674f35)), closes [#1452](https://github.com/lerna/lerna/issues/1452)
- **publish:** Add default description 'npm' for --npm-client ([649048c](https://github.com/lerna/lerna/commit/649048c))
- **publish:** Avoid fs-extra warning on 32-bit machines ([e908d23](https://github.com/lerna/lerna/commit/e908d23))
- **publish:** Do not leave unstaged changes with --skip-git ([2d497ed](https://github.com/lerna/lerna/commit/2d497ed))
- **publish:** Exit early when publishing w/o commits ([#1453](https://github.com/lerna/lerna/issues/1453)) ([6cbae35](https://github.com/lerna/lerna/commit/6cbae35)), closes [#773](https://github.com/lerna/lerna/issues/773)
- **publish:** Pass --repo-version argument through semver.valid() ([272e9f1](https://github.com/lerna/lerna/commit/272e9f1)), closes [#1483](https://github.com/lerna/lerna/issues/1483)
- **publish:** Update lerna.json version after root preversion lifecycle ([7b3817c](https://github.com/lerna/lerna/commit/7b3817c)), closes [#1495](https://github.com/lerna/lerna/issues/1495)
- **tests:** Special handling for Windows CI issues ([#1441](https://github.com/lerna/lerna/issues/1441)) ([1a01125](https://github.com/lerna/lerna/commit/1a01125))

### Code Refactoring

- **collect-updates:** Make argument signature explicit ([e6ba19f](https://github.com/lerna/lerna/commit/e6ba19f))
- **command:** Do not store raw packages list as instance property ([32a211a](https://github.com/lerna/lerna/commit/32a211a))

### Features

- Add description from --help summary [skip ci] ([9b65d8e](https://github.com/lerna/lerna/commit/9b65d8e))
- Count packages affected in command summary logging ([5f5e585](https://github.com/lerna/lerna/commit/5f5e585))
- **publish:** Ensure published packages contain a LICENSE file ([#1465](https://github.com/lerna/lerna/issues/1465)) ([5863564](https://github.com/lerna/lerna/commit/5863564)), closes [#1213](https://github.com/lerna/lerna/issues/1213)
- Upgrade to fs-extra 6 ([079d873](https://github.com/lerna/lerna/commit/079d873))
- **add:** Add `--exact` option to `lerna add` ([#1478](https://github.com/lerna/lerna/issues/1478)) ([346d156](https://github.com/lerna/lerna/commit/346d156)), closes [#1470](https://github.com/lerna/lerna/issues/1470)
- **cli:** Upgrade to Yargs 12 ([7899ab8](https://github.com/lerna/lerna/commit/7899ab8))
- **command:** Remove .defaultOptions() from option resolution stack ([2b27a54](https://github.com/lerna/lerna/commit/2b27a54))
- **ls:** Log number of packages listed ([855fff6](https://github.com/lerna/lerna/commit/855fff6))
- **package-graph:** Add `rawPackageList` getter ([0ad5faf](https://github.com/lerna/lerna/commit/0ad5faf))
- **project:** Move collect-packages into getPackages() method ([06b88d4](https://github.com/lerna/lerna/commit/06b88d4))
- **publish:** Add --require-scripts option to opt-in to raw JS lifecycle scripts ([054392b](https://github.com/lerna/lerna/commit/054392b))
- **publish:** Add `--amend` flag ([#1422](https://github.com/lerna/lerna/issues/1422)) ([ef5f0db](https://github.com/lerna/lerna/commit/ef5f0db))
- **run-lifecycle:** Encapsulate npm-conf with createRunner() factory ([488f98d](https://github.com/lerna/lerna/commit/488f98d))

### BREAKING CHANGES

- **publish:** External `$PKGDIR/scripts/{pre,post}publish.js` lifecycles are now opt-in instead of automatic. Pass `--require-scripts` explicitly to restore previous functionality.
- **collect-updates:** Instead of an opaque command instance, distinct positional arguments are required.
- **command:** `this.packages` no longer exists in Command subclasses, use `this.packageGraph.rawPackageList`

<a name="3.0.0-beta.21"></a>

# [3.0.0-beta.21](https://github.com/lerna/lerna/compare/v3.0.0-beta.20...v3.0.0-beta.21) (2018-05-12)

### Bug Fixes

- **child-process:** Prevent duplicate logs when any package-oriented execution fails ([d3a8128](https://github.com/lerna/lerna/commit/d3a8128))

<a name="3.0.0-beta.20"></a>

# [3.0.0-beta.20](https://github.com/lerna/lerna/compare/v3.0.0-beta.19...v3.0.0-beta.20) (2018-05-07)

### Features

- **project:** Upgrade cosmiconfig ([9acde7d](https://github.com/lerna/lerna/commit/9acde7d))
- Upgrade execa ([393b501](https://github.com/lerna/lerna/commit/393b501))

<a name="3.0.0-beta.19"></a>

# [3.0.0-beta.19](https://github.com/lerna/lerna/compare/v3.0.0-beta.18...v3.0.0-beta.19) (2018-05-03)

### Bug Fixes

- **add:** Configure `--dev` as boolean option ([#1390](https://github.com/lerna/lerna/issues/1390)) ([75b91bd](https://github.com/lerna/lerna/commit/75b91bd))
- **collect-updates:** Derive most recent tag from annotated tags only ([90df646](https://github.com/lerna/lerna/commit/90df646))
- **collect-updates:** Remove redundant short-circuit ([#1406](https://github.com/lerna/lerna/issues/1406)) ([2bcdd35](https://github.com/lerna/lerna/commit/2bcdd35))
- **publish:** Include all packages during global major bump ([#1391](https://github.com/lerna/lerna/issues/1391)) ([9cebed1](https://github.com/lerna/lerna/commit/9cebed1)), closes [#1383](https://github.com/lerna/lerna/issues/1383)

### Features

- **project:** Map deprecated config to new namespaces ([4da6318](https://github.com/lerna/lerna/commit/4da6318))

### BREAKING CHANGES

- **collect-updates:** Lightweight tags are no longer included when detecting changes since the last release.

<a name="3.0.0-beta.18"></a>

# [3.0.0-beta.18](https://github.com/lerna/lerna/compare/v3.0.0-beta.17...v3.0.0-beta.18) (2018-04-24)

### Bug Fixes

- **cli:** Exit immediately when error is caught ([5b01599](https://github.com/lerna/lerna/commit/5b01599)), closes [#1384](https://github.com/lerna/lerna/issues/1384)
- **diff:** Diff since last release in branch, _not_ most recent global tag ([9879fef](https://github.com/lerna/lerna/commit/9879fef))
- **git-utils:** Pass --no-verify to `git push` ([#1376](https://github.com/lerna/lerna/issues/1376)) ([0b88ffb](https://github.com/lerna/lerna/commit/0b88ffb)), closes [#1366](https://github.com/lerna/lerna/issues/1366)
- **git-utils:** Pass `--follow-tags` to `git push` ([6907e90](https://github.com/lerna/lerna/commit/6907e90))

### Features

- **collect-updates:** Copy remaining git utilities into module ([cb9c19d](https://github.com/lerna/lerna/commit/cb9c19d))
- **command:** Move GitUtilities.isInitialized into class method ([abecfcc](https://github.com/lerna/lerna/commit/abecfcc))
- **diff:** Move diff-only git utilities ([47dc0e2](https://github.com/lerna/lerna/commit/47dc0e2))
- Remove core/git-utils package ([48096c4](https://github.com/lerna/lerna/commit/48096c4))
- **filters:** Add `--include-filtered-dependents` flag ([#1393](https://github.com/lerna/lerna/issues/1393)) ([2838260](https://github.com/lerna/lerna/commit/2838260))
- **git-utils:** Devolve getCurrentSHA() to consumers ([ecbc1d3](https://github.com/lerna/lerna/commit/ecbc1d3))
- **git-utils:** Devolve getShortSHA() to consumers ([95d179d](https://github.com/lerna/lerna/commit/95d179d))
- **import:** Inline GitUtilities.getWorkspaceRoot() ([925080e](https://github.com/lerna/lerna/commit/925080e))
- **init:** Inline GitUtilities.init() ([6e401e1](https://github.com/lerna/lerna/commit/6e401e1))
- **publish:** Move publish-only git utilities ([5594749](https://github.com/lerna/lerna/commit/5594749))

### BREAKING CHANGES

- **cli:** Previously, lerna would accept `--scope` and `--ignore` options where they were not intended,
  despite logging the unexpected arguments correctly. This would result in the commands continuing to run with unexpected configuration.

Going forward, lerna will exit non-zero _immediately_ upon encountering these errors.

- `@lerna/git-utils` is gone. Don't use it.
- **collect-updates:** GitUtilities is going away soon.
- **diff:** Don't use GitUtilities.
- **git-utils:** Don't use GitUtilities!
- **git-utils:** Don't use GitUtilities.
- **import:** GitUtilities.getWorkspaceRoot no longer exists. You shouldn't be using GitUtilities.
- **init:** GitUtilities.init() no longer exists. You shouldn't be using GitUtilities.
- **command:** GitUtilities.isInitialized no longer exists. You shouldn't be using GitUtilities.
- **publish:** Many named exports of GitUtilities are no longer provided. Don't use GitUtilities, it's a bad pattern.

<a name="3.0.0-beta.17"></a>

# [3.0.0-beta.17](https://github.com/lerna/lerna/compare/v3.0.0-beta.16...v3.0.0-beta.17) (2018-04-13)

### Bug Fixes

- **bootstrap:** Pass npm-conf to feature predicate instead of directly reading process.env ([b4af3c9](https://github.com/lerna/lerna/commit/b4af3c9))
- **bootstrap:** Pluralize log text ([#1232](https://github.com/lerna/lerna/issues/1232)) ([5c74760](https://github.com/lerna/lerna/commit/5c74760))
- **package:** Resolve correct relative spec ([ec2b8f5](https://github.com/lerna/lerna/commit/ec2b8f5))

### Features

- **add:** Use directory globs to filter targeted packages ([39fa7b6](https://github.com/lerna/lerna/commit/39fa7b6))
- **link:** Add 'convert' subcommand to aid migration to local file: specifiers ([f59bf3c](https://github.com/lerna/lerna/commit/f59bf3c))

### BREAKING CHANGES

- **add:** `lerna add` now only supports adding one dependency at a time. It is much more valuable to filter by directory globs, anyway.

<a name="3.0.0-beta.16"></a>

# [3.0.0-beta.16](https://github.com/lerna/lerna/compare/v3.0.0-beta.15...v3.0.0-beta.16) (2018-04-10)

### Bug Fixes

- **import:** Rebase patch copies, too ([f6bae80](https://github.com/lerna/lerna/commit/f6bae80))

<a name="3.0.0-beta.15"></a>

# [3.0.0-beta.15](https://github.com/lerna/lerna/compare/v3.0.0-beta.14...v3.0.0-beta.15) (2018-04-09)

### Bug Fixes

- **project:** Pin --exact require-from-string v2.0.1 to avoid integrity error with v2.0.2 ([32a38ad](https://github.com/lerna/lerna/commit/32a38ad))
- **publish:** Allow tag check to fail with strong warning ([#1355](https://github.com/lerna/lerna/issues/1355)) ([f5268cd](https://github.com/lerna/lerna/commit/f5268cd))

### Features

- **bootstrap:** Use `npm ci` with `--ci` option ([#1360](https://github.com/lerna/lerna/issues/1360)) ([d7e33c6](https://github.com/lerna/lerna/commit/d7e33c6))
- **conventional-commits:** Support local file presets ([a1bff40](https://github.com/lerna/lerna/commit/a1bff40))

<a name="3.0.0-beta.14"></a>

# [3.0.0-beta.14](https://github.com/lerna/lerna/compare/v3.0.0-beta.13...v3.0.0-beta.14) (2018-04-03)

### Bug Fixes

- **create:** Actually publish the module data helper ([4775cc4](https://github.com/lerna/lerna/commit/4775cc4))
- **logging:** Log failures from package scripts once, not twice ([436cfe1](https://github.com/lerna/lerna/commit/436cfe1))
- **publish:** Ensure optionalDependencies are updated during publish to registry ([559b731](https://github.com/lerna/lerna/commit/559b731))

<a name="3.0.0-beta.13"></a>

# [3.0.0-beta.13](https://github.com/lerna/lerna/compare/v3.0.0-beta.12...v3.0.0-beta.13) (2018-03-31)

### Bug Fixes

- **child-process:** Do not merge lines of streaming stderr ([59dc2d4](https://github.com/lerna/lerna/commit/59dc2d4)), closes [#994](https://github.com/lerna/lerna/issues/994)
- Use ValidationError instead of Error ([bea6bc3](https://github.com/lerna/lerna/commit/bea6bc3))
- **run:** Exit early when no packages contain the targeted lifecycle ([c8a5526](https://github.com/lerna/lerna/commit/c8a5526))

### Features

- Enable progress bars only when necessary ([b766c83](https://github.com/lerna/lerna/commit/b766c83))

<a name="3.0.0-beta.12"></a>

# [3.0.0-beta.12](https://github.com/lerna/lerna/compare/v3.0.0-beta.11...v3.0.0-beta.12) (2018-03-30)

### Bug Fixes

- **create:** Silently ignore missing builtin npmrc ([1523520](https://github.com/lerna/lerna/commit/1523520)), closes [#1353](https://github.com/lerna/lerna/issues/1353)
- **npm-conf:** Replace env vars even in config keys ([3c9a5de](https://github.com/lerna/lerna/commit/3c9a5de))

### Features

- **package:** Add `serialize()` method ([fdec3ac](https://github.com/lerna/lerna/commit/fdec3ac))
- **package:** Add Map-like get/set methods, remove raw json getter ([707d1f0](https://github.com/lerna/lerna/commit/707d1f0))
- **project:** Merge `package` and `packageJson` into `manifest` ([9a47ff7](https://github.com/lerna/lerna/commit/9a47ff7))
- Add --no-prefix for streaming output ([#1352](https://github.com/lerna/lerna/issues/1352)) ([36c1fad](https://github.com/lerna/lerna/commit/36c1fad))

### BREAKING CHANGES

- **package:** The `Package` class no longer provides direct access to the JSON object
  used to construct the instance. Map-like `get()`/`set(val)` methods are
  available to modify the internal representation.

<a name="3.0.0-beta.11"></a>

# [3.0.0-beta.11](https://github.com/lerna/lerna/compare/v3.0.0-beta.10...v3.0.0-beta.11) (2018-03-29)

### Bug Fixes

- **exec:** Clarify --no-bail option ([6e4c6fd](https://github.com/lerna/lerna/commit/6e4c6fd))
- **publish:** Write temporary annotations once, not repeatedly ([6abae76](https://github.com/lerna/lerna/commit/6abae76))

### Features

- **bootstrap:** Inherit stdio during root-only install ([fd8c391](https://github.com/lerna/lerna/commit/fd8c391))
- **bootstrap:** Short-circuit when local file: specifiers are detected in the root ([d8a8f03](https://github.com/lerna/lerna/commit/d8a8f03))
- **child-process:** Allow exec() opts.stdio override ([fd84013](https://github.com/lerna/lerna/commit/fd84013))
- **npm-install:** Allow opts.stdio override ([4ba5e74](https://github.com/lerna/lerna/commit/4ba5e74))
- Execute atomic publish lifecycle during lerna publish ([#1348](https://github.com/lerna/lerna/issues/1348)) ([45efa24](https://github.com/lerna/lerna/commit/45efa24))
- Support `optionalDependencies` ([b73e19d](https://github.com/lerna/lerna/commit/b73e19d)), closes [#121](https://github.com/lerna/lerna/issues/121)
- **npm-run-script:** Accept opts.reject ([7c5a791](https://github.com/lerna/lerna/commit/7c5a791))
- **run:** Add --no-bail option ([893fcc8](https://github.com/lerna/lerna/commit/893fcc8)), closes [#1351](https://github.com/lerna/lerna/issues/1351)

<a name="3.0.0-beta.10"></a>

# [3.0.0-beta.10](https://github.com/lerna/lerna/compare/v3.0.0-beta.9...v3.0.0-beta.10) (2018-03-27)

### Bug Fixes

- **add:** Use bootstrap factory, not handler ([dbfc891](https://github.com/lerna/lerna/commit/dbfc891))

### Features

- **commands:** Delay require of command instantiation ([a1284f3](https://github.com/lerna/lerna/commit/a1284f3))
- **project:** Inherit configuration with yargs-like "extends" ([0b28ef5](https://github.com/lerna/lerna/commit/0b28ef5)), closes [#1281](https://github.com/lerna/lerna/issues/1281)

### BREAKING CHANGES

- **commands:** The default export of command packages is now a factory, not the subclass (which is now a named export).

<a name="3.0.0-beta.9"></a>

# [3.0.0-beta.9](https://github.com/lerna/lerna/compare/v3.0.0-beta.8...v3.0.0-beta.9) (2018-03-24)

### Bug Fixes

- **filter-options:** Move include/exclude validation into filter-packages ([503251d](https://github.com/lerna/lerna/commit/503251d))
- **git-utils:** Remove unused methods, stop mocking tests ([3e00d7a](https://github.com/lerna/lerna/commit/3e00d7a))
- **publish:** Split `--skip-*` properly, leave working tree clean ([5b4b2c9](https://github.com/lerna/lerna/commit/5b4b2c9))

### Features

- **command:** Remove legacy config handling ([d305a38](https://github.com/lerna/lerna/commit/d305a38))
- **command:** Rename this.repository -> this.project ([43e98a0](https://github.com/lerna/lerna/commit/43e98a0))
- **project:** Normalize config.commands -> config.command ([24e55e3](https://github.com/lerna/lerna/commit/24e55e3))
- **project:** Use cosmiconfig to locate and read lerna.json ([b8c2789](https://github.com/lerna/lerna/commit/b8c2789))

### BREAKING CHANGES

- **publish:** Previously, gitHead annotations were leftover if `--skip-npm` was passed,
  despite no actual requirement for that property when no publishing is going on.

Now, all publish-related operations are truly skipped with `--skip-npm`,
and all git commit/push-related operations are skipped with `--skip-git`.
Passing `--skip-npm` will now also always push to remote, which represents
a breaking change from 2.x behavior.

Thanks @KingScooty for raising the issue!

- **command:** lerna.json `bootstrapConfig` and `publishConfig` namespaces are no longer honored.
  These config blocks should be moved to `command.bootstrap` and `command.publish`, respectively.

<a name="3.0.0-beta.8"></a>

# [3.0.0-beta.8](https://github.com/lerna/lerna/compare/v3.0.0-beta.7...v3.0.0-beta.8) (2018-03-22)

### Bug Fixes

- **add:** Support tag and version specifiers ([5df0fc8](https://github.com/lerna/lerna/commit/5df0fc8)), closes [#1306](https://github.com/lerna/lerna/issues/1306)
- **create:** Skip repository property when git remote is missing ([98c8be6](https://github.com/lerna/lerna/commit/98c8be6))

### Features

- **init:** Improve ex-nihilo output ([7b80e07](https://github.com/lerna/lerna/commit/7b80e07))
- **npm-conf:** Add get/setCredentialsByURI() methods ([ad20d8a](https://github.com/lerna/lerna/commit/ad20d8a))
- **utils:** Add "vendored" npm-conf ([9c24a25](https://github.com/lerna/lerna/commit/9c24a25))
- **utils:** Add [@lerna](https://github.com/lerna)/map-to-registry ([ce72828](https://github.com/lerna/lerna/commit/ce72828))

<a name="3.0.0-beta.7"></a>

# [3.0.0-beta.7](https://github.com/lerna/lerna/compare/v3.0.0-beta.6...v3.0.0-beta.7) (2018-03-20)

### Bug Fixes

- **cli:** Retrieve correct version ([bb2c5e8](https://github.com/lerna/lerna/commit/bb2c5e8))

<a name="3.0.0-beta.6"></a>

# [3.0.0-beta.6](https://github.com/lerna/lerna/compare/v3.0.0-beta.5...v3.0.0-beta.6) (2018-03-19)

**Note:** Version bump only for package lerna

<a name="3.0.0-beta.5"></a>

# [3.0.0-beta.5](https://github.com/lerna/lerna/compare/v3.0.0-beta.4...v3.0.0-beta.5) (2018-03-19)

### Bug Fixes

- **bootstrap:** Move --hoist/--nohoist coerce into class ([8877aa0](https://github.com/lerna/lerna/commit/8877aa0)), closes [#1337](https://github.com/lerna/lerna/issues/1337)

<a name="3.0.0-beta.4"></a>

# [3.0.0-beta.4](https://github.com/lerna/lerna/compare/v3.0.0-beta.3...v3.0.0-beta.4) (2018-03-19)

### Bug Fixes

- **clean-stack:** Try to avoid causing errors during error cleanup ([89f9d3b](https://github.com/lerna/lerna/commit/89f9d3b))
- Respect durable hoist configuration ([2081640](https://github.com/lerna/lerna/commit/2081640)), closes [#1325](https://github.com/lerna/lerna/issues/1325)
- Use correct instance property override ([9249221](https://github.com/lerna/lerna/commit/9249221))

### Features

- Add `lerna create` command ([#1326](https://github.com/lerna/lerna/issues/1326)) ([f15b224](https://github.com/lerna/lerna/commit/f15b224))

<a name="3.0.0-beta.3"></a>

# [3.0.0-beta.3](https://github.com/lerna/lerna/compare/v3.0.0-beta.2...v3.0.0-beta.3) (2018-03-15)

### Bug Fixes

- **utils:** Use safe relative path when calling git diff ([#1323](https://github.com/lerna/lerna/issues/1323)) ([619c477](https://github.com/lerna/lerna/commit/619c477))
- ci option should not be visible in help output ([580b2d5](https://github.com/lerna/lerna/commit/580b2d5))
- fs-extra dependency is a caret range, not exact ([81556d0](https://github.com/lerna/lerna/commit/81556d0))

### Features

- Check for upstream changes before attempting to publish ([#1317](https://github.com/lerna/lerna/issues/1317)) ([cef0a69](https://github.com/lerna/lerna/commit/cef0a69))
- **cli:** Set config.ci from env var ([5452293](https://github.com/lerna/lerna/commit/5452293))
- **global-options:** Add hidden `ci` option ([86a4d65](https://github.com/lerna/lerna/commit/86a4d65))
- Upstream changes warn in CI, throw locally ([4de055d](https://github.com/lerna/lerna/commit/4de055d)), closes [#1177](https://github.com/lerna/lerna/issues/1177) [#1317](https://github.com/lerna/lerna/issues/1317)
- **publish:** Add logging when `--skip-git` or `--skip-npm` are passed ([#1319](https://github.com/lerna/lerna/issues/1319)) ([8eef9ff](https://github.com/lerna/lerna/commit/8eef9ff))

<a name="3.0.0-beta.2"></a>

# [3.0.0-beta.2](https://github.com/lerna/lerna/compare/v3.0.0-beta.1...v3.0.0-beta.2) (2018-03-10)

### Bug Fixes

- Move `@lerna/has-dependency-installed` into `commands/bootstrap/lib` ([c09ccbd](https://github.com/lerna/lerna/commit/c09ccbd))

### Features

- Rename `@lerna/fs-utils` => `@lerna/rimraf-dir` ([30451ed](https://github.com/lerna/lerna/commit/30451ed))
- Replace `@lerna/fs-utils` dependency with `fs-extra` ([9c35a86](https://github.com/lerna/lerna/commit/9c35a86))
- Replace `@lerna/match-package-name` with `multimatch` ([423f82c](https://github.com/lerna/lerna/commit/423f82c))
- **filter-packages:** Simplify method signature ([47e1c86](https://github.com/lerna/lerna/commit/47e1c86))

### BREAKING CHANGES

- **filter-packages:** The parameters to `filterPackages()` have changed:
  - Two lists (`include`, `exclude`) have replaced the destructured config object

<a name="3.0.0-beta.1"></a>

# [3.0.0-beta.1](https://github.com/lerna/lerna/compare/v3.0.0-beta.0...v3.0.0-beta.1) (2018-03-09)

### Bug Fixes

- **conventional-commits:** output version bump message closer to version heading ([64916d6](https://github.com/lerna/lerna/commit/64916d6))
- **filter-options:** require a git repo when using --since ([d21b66e](https://github.com/lerna/lerna/commit/d21b66e)), closes [#822](https://github.com/lerna/lerna/issues/822)
- **init:** lerna init does not, in fact, require git ([d1d69c7](https://github.com/lerna/lerna/commit/d1d69c7))
- **publish:** Checkout manifest changes serially ([ce4a4b1](https://github.com/lerna/lerna/commit/ce4a4b1))
- **publish:** default root manifest name when missing ([a504d7e](https://github.com/lerna/lerna/commit/a504d7e)), closes [#1305](https://github.com/lerna/lerna/issues/1305)
- **publish:** guard against undefined tag ([d8ce253](https://github.com/lerna/lerna/commit/d8ce253)), closes [#1311](https://github.com/lerna/lerna/issues/1311)
- **publish:** Respect pkg.publishConfig.tag ([04b256a](https://github.com/lerna/lerna/commit/04b256a)), closes [#1311](https://github.com/lerna/lerna/issues/1311)
- **publish:** work around yarn "link:" intransigency ([ddfb517](https://github.com/lerna/lerna/commit/ddfb517))

### Features

- **collect-packages:** simplify signature ([39170cf](https://github.com/lerna/lerna/commit/39170cf))
- **diff:** filter diff output with --ignore-changes ([c27c2e0](https://github.com/lerna/lerna/commit/c27c2e0))
- **filter-options:** Exclude private packages with --no-private ([6674d18](https://github.com/lerna/lerna/commit/6674d18))

### BREAKING CHANGES

- **collect-packages:** Formerly a config object, it is now two parameters, only the first of
  which (rootPath) is required. The second parameter is a list of package
  location globs, defaulting to lerna's default of `["packages/*"]`.

## v3.0.0-beta.0 (2018-03-07)

This is the first `lerna` release published by `lerna` itself. :tada:

#### :boom: Breaking Change

- [#1307](https://github.com/lerna/lerna/pull/1307) Convert `lerna/lerna` into a `lerna`-based monorepo. ([@evocateur](https://github.com/evocateur))

- **Rename `lerna publish` flag `--ignore` to `--ignore-changes`** ([8c92956](https://github.com/lerna/lerna/commit/8c92956))

  This resolves previous ambiguity as to what exactly was intended by the "ignore" config for lerna publish,
  which was _not_ intended to be identical to the filtering option `--ignore`.

  The old option will still work when found in `lerna.json` config, but it is recommended to migrate to the
  new option name to ensure future compatibility.

#### :rocket: Enhancement

- [#1310](https://github.com/lerna/lerna/pull/1310) Add gitHead property to package.json before publish. ([@evocateur](https://github.com/evocateur))

#### Committers: 1

- Daniel Stockman ([evocateur](https://github.com/evocateur))

## v3.0.0-alpha.3 (2018-03-03)

#### :bug: Bug Fix

- [#1302](https://github.com/lerna/lerna/pull/1302) Use npm-lifecycle to run solitary lifecycle phases. ([@evocateur](https://github.com/evocateur))

#### :nail_care: Polish

- [#1300](https://github.com/lerna/lerna/pull/1300) Disable all non-error logging when stdout is piped. ([@evocateur](https://github.com/evocateur))

#### Committers: 1

- Daniel Stockman ([evocateur](https://github.com/evocateur))

## v3.0.0-alpha.2 (2018-03-02)

#### :bug: Bug Fix

- Sort packages correctly ([2ead3107](https://github.com/lerna/lerna/commit/2ead3107))
- Don't resolve relative links in private packages ([04760f38](https://github.com/lerna/lerna/commit/04760f38))

#### :nail_care: Polish

- Disable progress in commands that only output lists ([e91c9f2c](https://github.com/lerna/lerna/commit/e91c9f2c))

## v3.0.0-alpha.1 (2018-02-28)

#### :boom: Breaking Change

- [#1278](https://github.com/lerna/lerna/pull/1278) Add universal hosted git URL support. ([@evocateur](https://github.com/evocateur))
- [#1289](https://github.com/lerna/lerna/pull/1289) Convert command lifecycle from callbacks to Promises. ([@evocateur](https://github.com/evocateur))
- [#1290](https://github.com/lerna/lerna/pull/1290) Preserve package.json structure during bootstrap mangling. ([@evocateur](https://github.com/evocateur))
  Thanks to [@compulim](https://github.com/compulim) for the initial PR!

#### :house: Internal

- [#1271](https://github.com/lerna/lerna/pull/1271) Split symlink methods out of FileSystemUtilities. ([@evocateur](https://github.com/evocateur), [@compulim](https://github.com/compulim))
- Tons of other refactoring afoot! Check out [this diff](https://github.com/lerna/lerna/compare/v3.0.0-alpha.0...v3.0.0-alpha.1).

#### Committers: 1

- Daniel Stockman ([evocateur](https://github.com/evocateur))

## v3.0.0-alpha.0 (2018-02-14)

#### :boom: Breaking Change

- [`#1122`](https://github.com/lerna/lerna/pull/1122) Use local lerna if available. ([@marionebl](https://github.com/marionebl))
- [`#1207`](https://github.com/lerna/lerna/pull/1207) Refactor command superclass and yargs handlers. ([@evocateur](https://github.com/evocateur))
- [`#1208`](https://github.com/lerna/lerna/pull/1208) Use CommonJS. ([@evocateur](https://github.com/evocateur))
- [`#1209`](https://github.com/lerna/lerna/pull/1209) Drop support for node v4. ([@evocateur](https://github.com/evocateur))
- [`#1211`](https://github.com/lerna/lerna/pull/1211) Bump major versions of dependencies. ([@evocateur](https://github.com/evocateur))
- [`#1225`](https://github.com/lerna/lerna/pull/1225) Remove lerna.json compatibility check. ([@evocateur](https://github.com/evocateur))
- [`#1226`](https://github.com/lerna/lerna/pull/1226) Remove all deprecated validations. ([@evocateur](https://github.com/evocateur))
- [`#1234`](https://github.com/lerna/lerna/pull/1234) Upgrade to yargs 11. ([@evocateur](https://github.com/evocateur))

#### :rocket: Enhancement

- [`#1212`](https://github.com/lerna/lerna/pull/1212) Throw friendly error when workspaces are not configured correctly. ([@craigbilner](https://github.com/craigbilner))
- [`#1227`](https://github.com/lerna/lerna/pull/1227) Add `--ignore-scripts` flag to bootstrap command. ([@Andarist](https://github.com/Andarist))
- [`#1254`](https://github.com/lerna/lerna/pull/1254) Add support for new yarn workspaces config format. ([@detrohutt](https://github.com/detrohutt))
- [`#1261`](https://github.com/lerna/lerna/pull/1261) Refactor publish command to be 98% async. ([@evocateur](https://github.com/evocateur))
- [`#1262`](https://github.com/lerna/lerna/pull/1262) Rewrite npm5 `file:` links during publish. ([@evocateur](https://github.com/evocateur))

#### :bug: Bug Fix

- [`#1219`](https://github.com/lerna/lerna/pull/1219) Avoid triggering pre-commit and commitmsg hooks during publish. ([@alan-agius4](https://github.com/alan-agius4))
- [`#1220`](https://github.com/lerna/lerna/pull/1220) Remove `--no-gpg-sign` from `git commit`. ([@evocateur](https://github.com/evocateur))

#### :memo: Documentation

- [`#1248`](https://github.com/lerna/lerna/pull/1248) Document another potential cause of git initialization failure. ([@fritz-c](https://github.com/fritz-c))
- [`#1250`](https://github.com/lerna/lerna/pull/1250) Add guide for debugging Jest tests with VS Code. ([@millermatt](https://github.com/millermatt))

#### :house: Internal

- [`#1210`](https://github.com/lerna/lerna/pull/1210) Upgrade to Jest v22. ([@evocateur](https://github.com/evocateur))
- [`#1224`](https://github.com/lerna/lerna/pull/1224) Remove explicit `glob` dependency in favor of `globby`. ([@wtgtybhertgeghgtwtg](https://github.com/wtgtybhertgeghgtwtg))
- [`#1260`](https://github.com/lerna/lerna/pull/1260) `PackageGraph` is a `Map`, its nodes store relationships in a `Set`. ([@evocateur](https://github.com/evocateur))
- [`#1266`](https://github.com/lerna/lerna/pull/1266) Split `PackageUtilities` into smaller files. ([@evocateur](https://github.com/evocateur))
- [`#1267`](https://github.com/lerna/lerna/pull/1267) Split `NpmUtilities` into smaller files. ([@evocateur](https://github.com/evocateur))

#### Committers: 9

- Alan Agius ([alan-agius4](https://github.com/alan-agius4))
- Alexander Roberts ([detrohutt](https://github.com/detrohutt))
- Craig Bilner ([craigbilner](https://github.com/craigbilner))
- Daniel Stockman ([evocateur](https://github.com/evocateur))
- Fritz ([fritz-c](https://github.com/fritz-c))
- Mario Nebl ([marionebl](https://github.com/marionebl))
- Mateusz Burzyński ([Andarist](https://github.com/Andarist))
- Matt Miller ([millermatt](https://github.com/millermatt))
- [wtgtybhertgeghgtwtg](https://github.com/wtgtybhertgeghgtwtg)

## v2.7.2 (2018-01-16)

#### :rocket: Enhancement

- [#1205](https://github.com/lerna/lerna/pull/1205) Add %v as placeholder for raw version in `--message`. ([@mojavelinux](https://github.com/mojavelinux))

#### :bug: Bug Fix

- [#1206](https://github.com/lerna/lerna/pull/1206) Avoid dropping early logs below default level. ([@evocateur](https://github.com/evocateur))

#### Committers: 2

- Dan Allen ([mojavelinux](https://github.com/mojavelinux))
- Daniel Stockman ([evocateur](https://github.com/evocateur))

## v2.7.1 (2018-01-16)

#### :bug: Bug Fix

- [#1194](https://github.com/lerna/lerna/pull/1194) Treat 'lerna run test' like any other command. ([@tkrotoff](https://github.com/tkrotoff))
- [#1199](https://github.com/lerna/lerna/pull/1199) Fix import command so it works if Lerna root is a subdir of git root. ([@RoystonS](https://github.com/RoystonS))
- [#1204](https://github.com/lerna/lerna/pull/1204) Avoid interactive prompt during yarn publish. ([@evocateur](https://github.com/evocateur))

#### Committers: 3

- Daniel Stockman ([evocateur](https://github.com/evocateur))
- Royston Shufflebotham ([RoystonS](https://github.com/RoystonS))
- Tanguy Krotoff ([tkrotoff](https://github.com/tkrotoff))

## v2.7.0 (2018-01-12)

#### :rocket: Enhancement

- [#1140](https://github.com/lerna/lerna/pull/1140) Warn user and exit non-zero if command is invalid. ([@cezaraugusto](https://github.com/cezaraugusto))
- [#1145](https://github.com/lerna/lerna/pull/1145) run/publish: Use npmClient instead of hardcoded npm. ([@oreporan](https://github.com/oreporan))
- [#1149](https://github.com/lerna/lerna/pull/1149) Add support for root-level version lifecycle. ([@bigtimebuddy](https://github.com/bigtimebuddy))

#### :bug: Bug Fix

- [#1187](https://github.com/lerna/lerna/pull/1187) Completely ignore peerDependencies during publish. ([@evocateur](https://github.com/evocateur))
- [#1193](https://github.com/lerna/lerna/pull/1193) Throw error when lerna.json or package.json have invalid syntax. ([@evocateur](https://github.com/evocateur))

#### :memo: Documentation

- [#1164](https://github.com/lerna/lerna/pull/1164) docs: replace "command" with "commands" to avoid ambiguity. ([@fengyuanchen](https://github.com/fengyuanchen))
- [#1186](https://github.com/lerna/lerna/pull/1186) docs: 📇 Add private registry tips to troubleshooting.md. ([@frankstallone](https://github.com/frankstallone))

#### :house: Internal

- [#1188](https://github.com/lerna/lerna/pull/1188) Prettier. ([@evocateur](https://github.com/evocateur))

#### Committers: 7

- Alan Agius ([alan-agius4](https://github.com/alan-agius4))
- Cezar Augusto ([cezaraugusto](https://github.com/cezaraugusto))
- Chen Fengyuan ([fengyuanchen](https://github.com/fengyuanchen))
- Daniel Stockman ([evocateur](https://github.com/evocateur))
- Frank Stallone ([frankstallone](https://github.com/frankstallone))
- Matt Karl ([bigtimebuddy](https://github.com/bigtimebuddy))
- Ore Poran ([oreporan](https://github.com/oreporan))

## v2.6.0 (2018-01-08)

Happy 2018! :tada:

#### :rocket: Enhancement

- [#1110](https://github.com/lerna/lerna/pull/1110) Add `--stream` option to `lerna exec`. ([@alan-agius4](https://github.com/alan-agius4))
- [#1111](https://github.com/lerna/lerna/pull/1111) Add `--changelog-preset` option to customize `--conventional-commits` output. ([@alan-agius4](https://github.com/alan-agius4))

#### :bug: Bug Fix

- [#1134](https://github.com/lerna/lerna/pull/1134) Normalize path used for `git add` in respect to OS/environment. ([@zenflow](https://github.com/zenflow))
- [#1129](https://github.com/lerna/lerna/pull/1129) Throw error in bootstrap when Yarn workspaces is misconfigured. ([@evocateur](https://github.com/evocateur))
- [#1101](https://github.com/lerna/lerna/pull/1101) Set chmod for linked binaries. ([@marionebl](https://github.com/marionebl))
- [#1112](https://github.com/lerna/lerna/pull/1112) Use all `packages` locations when resetting canary changes. ([@jwickens](https://github.com/jwickens))
- [#1115](https://github.com/lerna/lerna/pull/1115) Keep non-patch subject parts when importing repository. ([@koenpunt](https://github.com/koenpunt))

#### :memo: Documentation

- [#1139](https://github.com/lerna/lerna/pull/1139) add docs on how to publish scoped packages. ([@cezaraugusto](https://github.com/cezaraugusto))
- [#1108](https://github.com/lerna/lerna/pull/1108) Minor typo fix in hoist.md. ([@tdmalone](https://github.com/tdmalone))
- [#1166](https://github.com/lerna/lerna/pull/1166) fix: typo in README.md "in in". ([@vladgolubev](https://github.com/vladgolubev))
- [#1176](https://github.com/lerna/lerna/pull/1176) Fix typo in README.md. ([@LoicPoullain](https://github.com/LoicPoullain))

#### Committers: 10

- Alan Agius ([alan-agius4](https://github.com/alan-agius4))
- Cezar Augusto ([cezaraugusto](https://github.com/cezaraugusto))
- Daniel Stockman ([evocateur](https://github.com/evocateur))
- Jonathan R Wickens ([jwickens](https://github.com/jwickens))
- Koen Punt ([koenpunt](https://github.com/koenpunt))
- Loïc Poullain ([LoicPoullain](https://github.com/LoicPoullain))
- Mario Nebl ([marionebl](https://github.com/marionebl))
- Matthew Francis Brunetti ([zenflow](https://github.com/zenflow))
- Tim Malone ([tdmalone](https://github.com/tdmalone))
- Vlad Holubiev ([vladgolubev](https://github.com/vladgolubev))

## v2.5.1 (2017-11-01)

A quick bugfix for an overlooked case in `lerna add`.

#### :bug: Bug Fix

- [#1100](https://github.com/lerna/lerna/pull/1100) Preserve existing deps with lerna add. ([@marionebl](https://github.com/marionebl))

#### Committers: 1

- Mario Nebl ([marionebl](https://github.com/marionebl))

## v2.5.0 (2017-11-01)

A new command (`lerna add`), new flags for bootstrap and link commands, and a much-improved experience when publishing "final" releases after a series of prereleases!

#### :rocket: Enhancement

- [#1069](https://github.com/lerna/lerna/pull/1069) Implement `lerna add <pkg>[@version] [--dev]`. ([@marionebl](https://github.com/marionebl))
- [#1077](https://github.com/lerna/lerna/pull/1077) Republish prereleased packages during subsequent non-prerelease publish. ([@spudly](https://github.com/spudly))
- [#1078](https://github.com/lerna/lerna/pull/1078) Generate root changelog in fixed mode. ([@ZauberNerd](https://github.com/ZauberNerd))
- [#1081](https://github.com/lerna/lerna/pull/1081) Warn during bootstrap when two or more packages have the same package.json name. ([@amfio](https://github.com/amfio))
- [#1082](https://github.com/lerna/lerna/pull/1082) Add --force-local to link command. ([@jiverson](https://github.com/jiverson))
- [#1087](https://github.com/lerna/lerna/pull/1087) Add --reject-cycles to bootstrap, logging packages when found. ([@mitchhentges](https://github.com/mitchhentges))

#### :bug: Bug Fix

- [#1059](https://github.com/lerna/lerna/pull/1059) Improve "import" edgecases + (i18n fixes + git tweaks). ([@swernerx](https://github.com/swernerx))
- [#1063](https://github.com/lerna/lerna/pull/1063) Fail when --hoist and --yarn are used together. ([@marionebl](https://github.com/marionebl))
- [#1083](https://github.com/lerna/lerna/pull/1083) Fixed diffing on Windows. ([@the0neWhoKnocks](https://github.com/the0neWhoKnocks))

#### :memo: Documentation

- [#1062](https://github.com/lerna/lerna/pull/1062) Fix README typo. ([@imagentleman](https://github.com/imagentleman))

#### :house: Internal

- [#1080](https://github.com/lerna/lerna/pull/1080) Add test for skipping empty patches during import --flatten. ([@gyoshev](https://github.com/gyoshev))
- [#1092](https://github.com/lerna/lerna/pull/1092) Make integration tests less flaky on Windows. ([@evocateur](https://github.com/evocateur))

#### Committers: 11

- Alex Gyoshev ([gyoshev](https://github.com/gyoshev))
- Alexander Field ([amfio](https://github.com/amfio))
- Björn Brauer ([ZauberNerd](https://github.com/ZauberNerd))
- Daniel Stockman ([evocateur](https://github.com/evocateur))
- Josh Iverson ([jiverson](https://github.com/jiverson))
- José Antonio Chio ([imagentleman](https://github.com/imagentleman))
- Mario Nebl ([marionebl](https://github.com/marionebl))
- Mitchell Hentges ([mitchhentges](https://github.com/mitchhentges))
- Sebastian Werner ([swernerx](https://github.com/swernerx))
- Stephen John Sorensen ([spudly](https://github.com/spudly))
- [the0neWhoKnocks](https://github.com/the0neWhoKnocks)

## v2.4.0 (2017-10-05)

I inadvertently made `lerna bootstrap --hoist` really slow in v2.3.0, so that's fixed. Big thanks to all the contributors!

#### :rocket: Enhancement

- [#1033](https://github.com/lerna/lerna/pull/1033) Add support for git-hosted urls as sibling package dependencies. ([@gustaff-weldon](https://github.com/gustaff-weldon))

#### :bug: Bug Fix

- [#1044](https://github.com/lerna/lerna/pull/1044) Throw publish validation errors before version selection. ([@evocateur](https://github.com/evocateur))
- [#1047](https://github.com/lerna/lerna/pull/1047) Remove git requirement from link command. ([@jiverson](https://github.com/jiverson))
- [#1051](https://github.com/lerna/lerna/pull/1051) When hoisting, only install with --global-style in leaf nodes, not root. ([@evocateur](https://github.com/evocateur))
- [#1054](https://github.com/lerna/lerna/pull/1054) Set `process.exitCode` instead of calling `process.exit(code)`. ([@evocateur](https://github.com/evocateur))

#### :nail_care: Polish

- [#1048](https://github.com/lerna/lerna/pull/1048) Clean up code missed by lint settings. ([@jiverson](https://github.com/jiverson))
- [#1052](https://github.com/lerna/lerna/pull/1052) Truncate stack (or pass directly) when logging errors. ([@evocateur](https://github.com/evocateur))

#### :memo: Documentation

- [#1042](https://github.com/lerna/lerna/pull/1042) Update workspace document. ([@nhducit](https://github.com/nhducit))

#### Committers: 4

- Daniel Stockman ([evocateur](https://github.com/evocateur))
- Good stuff and well done! ([gustaff-weldon](https://github.com/gustaff-weldon))
- Josh Iverson ([jiverson](https://github.com/jiverson))
- nhducit ([nhducit](https://github.com/nhducit))

## v2.3.1 (2017-10-03)

This is what happens when you forget to pull from upstream before publishing.

#### :nail_care: Polish

- [#1025](https://github.com/lerna/lerna/pull/1025) Log which packages are throwing ECYCLE error. ([@FezVrasta](https://github.com/FezVrasta))

#### Committers: 1

- Federico Zivolo ([FezVrasta](https://github.com/FezVrasta))

## v2.3.0 (2017-10-03)

New options for `lerna import` and `lerna publish`, set `--loglevel` from lerna.json, and more!

#### :rocket: Enhancement

- [#1019](https://github.com/lerna/lerna/pull/1019) Add `--flatten` option to use when merge conflicts cannot be imported. ([@dmaksimovic](https://github.com/dmaksimovic))
- [#1026](https://github.com/lerna/lerna/pull/1026) Add `--allow-branch` option to restrict publish to designated branches. ([@FaHeymann](https://github.com/FaHeymann))
- [#1029](https://github.com/lerna/lerna/pull/1029) Call version lifecycle scripts during publish. ([@cwmoo740](https://github.com/cwmoo740))
- [#1030](https://github.com/lerna/lerna/pull/1030) Add runScriptSync for use in version lifecycle methods. ([@cwmoo740](https://github.com/cwmoo740))

#### :bug: Bug Fix

- [#1020](https://github.com/lerna/lerna/pull/1020) Use `--canary=<value>` as prerelease tag, not commit-ish. ([@achingbrain](https://github.com/achingbrain))
- [#1037](https://github.com/lerna/lerna/pull/1037) Support durable `--loglevel` config from lerna.json. ([@evocateur](https://github.com/evocateur))
- [#1041](https://github.com/lerna/lerna/pull/1041) Pass npmClientArgs to yarn workspaces install command. ([@evocateur](https://github.com/evocateur))

#### :memo: Documentation

- [#1040](https://github.com/lerna/lerna/pull/1040) Tweak conventional message examples. ([@stevemao](https://github.com/stevemao))

#### :house: Internal

- [#1038](https://github.com/lerna/lerna/pull/1038) Rename `npmPublishAsPrerelease` to `npmPublish` to avoid confusion. ([@Hypnosphi](https://github.com/Hypnosphi))

#### Committers: 7

- Alex Potsides ([achingbrain](https://github.com/achingbrain))
- Daniel Stockman ([evocateur](https://github.com/evocateur))
- Darko Maksimovic ([dmaksimovic](https://github.com/dmaksimovic))
- Fabian Heymann ([FaHeymann](https://github.com/FaHeymann))
- Filipp Riabchun ([Hypnosphi](https://github.com/Hypnosphi))
- Jeffrey Young ([cwmoo740](https://github.com/cwmoo740))
- Steve Mao ([stevemao](https://github.com/stevemao))

## v2.2.0 (2017-09-15)

A new command, tweaks to logging and init scaffolding, and documentation!

#### :rocket: Enhancement

- [#970](https://github.com/lerna/lerna/pull/970) Create configured "packages" directories during lerna init. ([@Siilwyn](https://github.com/Siilwyn))
- [#1004](https://github.com/lerna/lerna/pull/1004) Improve logging of package lifecycle errors during bootstrap. ([@gauntface](https://github.com/gauntface))
- [#1000](https://github.com/lerna/lerna/pull/1000) Add `lerna link` command. ([@Inkdpixels](https://github.com/Inkdpixels))

#### :memo: Documentation

- [#985](https://github.com/lerna/lerna/pull/985) Update installation instructions to match lerna init behavior. ([@sapegin](https://github.com/sapegin))
- [#1011](https://github.com/lerna/lerna/pull/1011) Add shield example to README.md. ([@mfix22](https://github.com/mfix22))

#### Committers: 5

- Artem Sapegin ([sapegin](https://github.com/sapegin))
- Matt Gaunt ([gauntface](https://github.com/gauntface))
- Michael Fix ([mfix22](https://github.com/mfix22))
- Selwyn ([Siilwyn](https://github.com/Siilwyn))
- Tyll Weiß ([Inkdpixels](https://github.com/Inkdpixels))

## v2.1.2 (2017-08-29)

More bugfixes, plus support for the `prepare` lifecycle script found in npm 4+.

#### :rocket: Enhancement

- [#979](https://github.com/lerna/lerna/pull/979) Run "prepare" lifecycle script during bootstrap. ([@Andarist](https://github.com/Andarist))

#### :bug: Bug Fix

- [#992](https://github.com/lerna/lerna/pull/992) Fix --conventional-commits recommending already released version. ([@jezzay](https://github.com/jezzay))
- [#993](https://github.com/lerna/lerna/pull/993) Fix silly level log output for --conventional-commits. ([@jezzay](https://github.com/jezzay))
- [#996](https://github.com/lerna/lerna/pull/996) Only diff package locations, not the entire repository. ([@evocateur](https://github.com/evocateur))

#### :house: Internal

- [#997](https://github.com/lerna/lerna/pull/997) All command unit tests use yargs runner. ([@evocateur](https://github.com/evocateur))

#### Committers: 3

- Daniel Stockman ([evocateur](https://github.com/evocateur))
- Jeremy ([jezzay](https://github.com/jezzay))
- Mateusz Burzyński ([Andarist](https://github.com/Andarist))

## v2.1.1 (2017-08-28)

A quick bugfix release to restore a broken `lerna publish --canary`, as reported in [#989](https://github.com/lerna/lerna/issues/989). Many thanks to all who pitched in to identify the issue!

#### :bug: Bug Fix

- [#990](https://github.com/lerna/lerna/pull/990) Use yargs parser in unit tests for greater fidelity. ([@evocateur](https://github.com/evocateur))

#### Committers: 1

- Daniel Stockman ([evocateur](https://github.com/evocateur))

## v2.1.0 (2017-08-24)

#### :rocket: Enhancement

- [#922](https://github.com/lerna/lerna/pull/922) Support `--conventional-commits` in fixed versioning mode. ([@jezzay](https://github.com/jezzay))
- [#960](https://github.com/lerna/lerna/pull/960) Improve support for semver prerelease identifiers when publishing. ([@shawnbot](https://github.com/shawnbot))

#### :bug: Bug Fix

- [#940](https://github.com/lerna/lerna/pull/940) Improve bootstrap performance with `--include-filtered-dependencies` in large, cyclic repos. ([@lukebatchelor](https://github.com/lukebatchelor))
- [#943](https://github.com/lerna/lerna/pull/943) Return error and exit on invalid command. ([@Siilwyn](https://github.com/Siilwyn))
- [#965](https://github.com/lerna/lerna/pull/965) Avoid false positives during integration test filtering. ([@darrylhodgins](https://github.com/darrylhodgins))
- [#976](https://github.com/lerna/lerna/pull/976) Bump load-json-file. ([@anfedorov](https://github.com/anfedorov))
- [#982](https://github.com/lerna/lerna/pull/982) Exit properly when there is nothing to publish. ([@evocateur](https://github.com/evocateur))

#### :memo: Documentation

- [#921](https://github.com/lerna/lerna/pull/921) Fixed spelling mistake in a comment for Command.js. ([@dlmr](https://github.com/dlmr))
- [#978](https://github.com/lerna/lerna/pull/978) Add root package.json and CI setup sections to FAQ. ([@Andarist](https://github.com/Andarist))
- [#981](https://github.com/lerna/lerna/pull/981) Add troubleshooting info for GitHub lightweight tags. ([@jezzay](https://github.com/jezzay))

#### :house: Internal

- [#934](https://github.com/lerna/lerna/pull/934) Platform independent integration tests. ([@jezzay](https://github.com/jezzay))
- [#946](https://github.com/lerna/lerna/pull/946) Swallow promise rejection in registerChild as it is handled via callback. ([@viliusl](https://github.com/viliusl))
- [#973](https://github.com/lerna/lerna/pull/973) Update LICENSE. ([@yanca018](https://github.com/yanca018))

#### Committers: 11

- Andrey Fedorov ([anfedorov](https://github.com/anfedorov))
- Daniel Stockman ([evocateur](https://github.com/evocateur))
- Darryl Hodgins ([darrylhodgins](https://github.com/darrylhodgins))
- Gustaf Dalemar ([dlmr](https://github.com/dlmr))
- Jeremy ([jezzay](https://github.com/jezzay))
- Mateusz Burzyński ([Andarist](https://github.com/Andarist))
- Selwyn ([Siilwyn](https://github.com/Siilwyn))
- Shawn Allen ([shawnbot](https://github.com/shawnbot))
- Vilius Lukošius ([viliusl](https://github.com/viliusl))
- [lukebatchelor](https://github.com/lukebatchelor)
- [yanca018](https://github.com/yanca018)

## v2.0.0 (2017-07-06)

:tada: It's happening! :tada:

#### :boom: Breaking Change

- [#904](https://github.com/lerna/lerna/pull/904) Improved --canary functionality. ([@Craga89](https://github.com/Craga89))
  `--canary` now bumps the generated version to the next semver minor, and accepts a value (e.g. `--canary=beta`) to override the default "alpha" tag.

#### :rocket: Enhancement

- [#899](https://github.com/lerna/lerna/pull/899) Support Yarn workspaces to replace bootstrap command. ([@bestander](https://github.com/bestander))
- [#834](https://github.com/lerna/lerna/pull/834) Pass extra arguments to npmClient during bootstrap. ([@xaka](https://github.com/xaka))
- [#873](https://github.com/lerna/lerna/pull/873) Add root path dir environment variable to `lerna run`. ([@yisraelx](https://github.com/yisraelx))
- [#822](https://github.com/lerna/lerna/pull/822) Add --since flag to all commands that accept --scope. ([@treshugart](https://github.com/treshugart))
- [#806](https://github.com/lerna/lerna/pull/806) Allow custom yarn mutex from lerna.json config. ([@ChristopheVandePoel](https://github.com/ChristopheVandePoel))
- [#868](https://github.com/lerna/lerna/pull/868) lerna run: Don't error if no scoped packages are matched. ([@ricky](https://github.com/ricky))
- [#835](https://github.com/lerna/lerna/pull/835) Flag for exec to bail upon child execution error. ([@rsolomon](https://github.com/rsolomon))

#### :bug: Bug Fix

- [#857](https://github.com/lerna/lerna/pull/857) Print n/a when a package has no version key.. ([@ben-eb](https://github.com/ben-eb))
- [#897](https://github.com/lerna/lerna/pull/897) Run yarn in non-interactive mode. ([@tricoder42](https://github.com/tricoder42))
- [#898](https://github.com/lerna/lerna/pull/898) Fix issue where Yargs default would override durable options. ([@treshugart](https://github.com/treshugart))
- [#846](https://github.com/lerna/lerna/pull/846) Do not log private packages as published. ([@evocateur](https://github.com/evocateur))
- [#845](https://github.com/lerna/lerna/pull/845) Preserve tag summary with `lerna publish --message`. ([@evocateur](https://github.com/evocateur))
- [#844](https://github.com/lerna/lerna/pull/844) All CLI options should be configurable in lerna.json. ([@evocateur](https://github.com/evocateur))

#### :memo: Documentation

- [#840](https://github.com/lerna/lerna/pull/840) Update publish docs in README. ([@shilman](https://github.com/shilman))
- [#836](https://github.com/lerna/lerna/pull/836) Add semver notes to bootstrap command docs. ([@loklaan](https://github.com/loklaan))

#### :house: Internal

- [#861](https://github.com/lerna/lerna/pull/861) chore(travis): test against node 8 and npm 5. ([@douglasduteil](https://github.com/douglasduteil))

#### Committers: 15

- Ben Briggs ([ben-eb](https://github.com/ben-eb))
- Craig Michael Thompson ([Craga89](https://github.com/Craga89))
- Daniel Stockman ([evocateur](https://github.com/evocateur))
- Douglas Duteil ([douglasduteil](https://github.com/douglasduteil))
- Konstantin Raev ([bestander](https://github.com/bestander))
- Lochlan Bunn ([loklaan](https://github.com/loklaan))
- Michael Shilman ([shilman](https://github.com/shilman))
- Pavel Strashkin ([xaka](https://github.com/xaka))
- Ricky Rivera ([ricky](https://github.com/ricky))
- Ross Solomon ([rsolomon](https://github.com/rsolomon))
- Simen Bekkhus ([SimenB](https://github.com/SimenB))
- Tomáš Ehrlich ([tricoder42](https://github.com/tricoder42))
- Trey Shugart ([treshugart](https://github.com/treshugart))
- [ChristopheVandePoel](https://github.com/ChristopheVandePoel)
- [yisraelx](https://github.com/yisraelx)

## v2.0.0-rc.5 (2017-05-22)

This is the last release candidate.

We need to fix [#789](https://github.com/lerna/lerna/issues/789) before we can release `v2.0.0`. All contributions are appreciated!

#### :boom: Breaking Change

- [#807](https://github.com/lerna/lerna/pull/807) Change exit codes for `updated` and `publish`. ([@koddsson](https://github.com/koddsson))

  It is now possible to run `lerna publish` in CI unconditionally, only publishing when changes are actually detected, and never failing when it decides to not publish anything.

  Previously:

  - `lerna publish` when there are no updates to publish would throw an error
  - `lerna updated` when there are no updates would `exit 0`, making it ineffective as a chained filter (e.g., `lerna updated && lerna publish`)

  Now:

  - `lerna publish` when there are no updates is a no-op, exiting successfully with a helpful log message
  - `lerna updated` when there are no updates will exit non-zero (but _not_ throw an error), enabling it to be an effective filter

#### :rocket: Enhancement

- [#726](https://github.com/lerna/lerna/pull/726) Add --only-updated option to exec and run subcommands. ([@jameslnewell](https://github.com/jameslnewell))

  When executing a script or command, only run the script or command on packages that have been updated since the last release. A package is considered "updated" using the same rules as `lerna updated`.

  ```sh
  lerna exec --only-updated -- ls -la
  lerna run --only-updated test
  ```

  - [#795](https://github.com/lerna/lerna/pull/795) Add --parallel flag to `lerna exec`. ([@evocateur](https://github.com/evocateur))

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

- [#796](https://github.com/lerna/lerna/pull/796) Add --parallel flag to `lerna run`. ([@evocateur](https://github.com/evocateur))

  This allows simpler invocation of `watch` scripts, with the caveat that concurrency and topological sorting are _completely_ ignored. This is generally the intention when calling `lerna run watch` and other similar script targets, hence the additional flag.

  ```sh
  # the following commands are equivalent
  lerna run watch --concurrency=1000 --stream
  lerna run watch --parallel
  ```

  Package filtering (`--scope` and `--ignore`) is still available when this new flag is being used, and it is advised to narrow the scope of parallel execution when you have more than a dozen packages or so (YMMV).

- [#803](https://github.com/lerna/lerna/pull/803) Skip git repo check by default in Commands which do not rely on git. ([@noherczeg](https://github.com/noherczeg))
- [#824](https://github.com/lerna/lerna/pull/824) Add json output to `ls` and `updated` commands. ([@ricky](https://github.com/ricky))

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

- [#829](https://github.com/lerna/lerna/pull/829) Prefix piped streams with rotating colors. ([@evocateur](https://github.com/evocateur))

#### :bug: Bug Fix

- [#798](https://github.com/lerna/lerna/pull/798) Disable progress bars when running in CI or non-interactive shell. ([@evocateur](https://github.com/evocateur))
- [#799](https://github.com/lerna/lerna/pull/799) Do not ignore explicit `node_modules` in package paths. ([@evocateur](https://github.com/evocateur))
- [#815](https://github.com/lerna/lerna/pull/815) Support GPG signing of git tags. ([@alethea](https://github.com/alethea))
- [#828](https://github.com/lerna/lerna/pull/828) Switch to `fs-extra`. ([@evocateur](https://github.com/evocateur))
- [#831](https://github.com/lerna/lerna/pull/831) Make `pkg` argument optional for `lerna diff`. ([@evocateur](https://github.com/evocateur))

#### :house: Internal

- [#827](https://github.com/lerna/lerna/pull/827), [#830](https://github.com/lerna/lerna/pull/830) Upgrade dependencies. ([@evocateur](https://github.com/evocateur))

#### Committers: 6

- Alethea Rose ([alethea](https://github.com/alethea))
- Daniel Stockman ([evocateur](https://github.com/evocateur))
- James Newell ([jameslnewell](https://github.com/jameslnewell))
- Kristján Oddsson ([koddsson](https://github.com/koddsson))
- Norbert Csaba Herczeg ([noherczeg](https://github.com/noherczeg))
- [ricky](https://github.com/ricky)

## v2.0.0-rc.4 (2017-04-27)

Now with less bugs! The `--hoist` flag works again, among other `rc.3` bugfixes, and our logging is _much_ more detailed now.

#### :boom: Breaking Change

- [#777](https://github.com/lerna/lerna/pull/777) Replace --skip-temp-tag with --temp-tag. ([@noherczeg](https://github.com/noherczeg))
- [#779](https://github.com/lerna/lerna/pull/779) Log with npmlog. ([@evocateur](https://github.com/evocateur))

#### :rocket: Enhancement

- [#782](https://github.com/lerna/lerna/pull/782) Add --max-buffer flag. ([@noherczeg](https://github.com/noherczeg))

#### :bug: Bug Fix

- [#775](https://github.com/lerna/lerna/pull/775), [#784](https://github.com/lerna/lerna/pull/784) Install non-hoisted leaves using `npm --global-style`. ([@ricky](https://github.com/ricky))
- [#776](https://github.com/lerna/lerna/pull/776) Ignore node_modules when traversing nested package locations. ([@evocateur](https://github.com/evocateur))
- [#778](https://github.com/lerna/lerna/pull/778) Fix --hoist with no argument default. ([@evocateur](https://github.com/evocateur))
- [#787](https://github.com/lerna/lerna/pull/787) Prevent log messages and progress bars from mangling prompts. ([@evocateur](https://github.com/evocateur))
- [#790](https://github.com/lerna/lerna/pull/790) Log the directories being cleaned. ([@evocateur](https://github.com/evocateur))

#### :nail_care: Polish

- [#781](https://github.com/lerna/lerna/pull/781) Support `--force-publish` arrays and booleans. ([@evocateur](https://github.com/evocateur))

#### :memo: Documentation

- [#783](https://github.com/lerna/lerna/pull/783) Add troubleshooting docs. ([@noherczeg](https://github.com/noherczeg))

#### :house: Internal

- [#780](https://github.com/lerna/lerna/pull/780) Restore async rimraf loops. ([@evocateur](https://github.com/evocateur))

#### Committers: 3

- Daniel Stockman ([evocateur](https://github.com/evocateur))
- Norbert Csaba Herczeg ([noherczeg](https://github.com/noherczeg))
- [ricky](https://github.com/ricky)

## v2.0.0-rc.3 (2017-04-18)

Barring show-stopping bugs, our goal is to cut `v2.0.0` later this week. Big props to all of our brave users riding the bleeding edge of release candidates and reporting issues!

#### :bug: Bug Fix

- [#764](https://github.com/lerna/lerna/pull/764) Use network mutex when bootstrapping with yarn. ([@evocateur](https://github.com/evocateur))

`lerna bootstrap --npmClient=yarn` should no longer require `--concurrency=1` to avoid yarn cache race conditions.

- [#769](https://github.com/lerna/lerna/pull/769) Fix custom version prompt. ([@timdorr](https://github.com/timdorr))
- [#771](https://github.com/lerna/lerna/pull/771) Resolve internal CLI calls with Windows-safe pattern. ([@evocateur](https://github.com/evocateur))

If you've ever encountered the error `Error: spawn rimraf ENOENT`, this should fix that. Turns out `yarn` doesn't match a behavior of `npm` when installing, and does _not_ symlink transitive dependency binaries.

#### :house: Internal

- [#770](https://github.com/lerna/lerna/pull/770) Pass multiple directories to rimraf. ([@evocateur](https://github.com/evocateur))

#### Committers: 2

- Daniel Stockman ([evocateur](https://github.com/evocateur))
- Tim Dorr ([timdorr](https://github.com/timdorr))

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

- [#719](https://github.com/lerna/lerna/pull/719) Use yargs to handle CLI args and subcommands. ([@noherczeg](https://github.com/noherczeg))

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

- [#758](https://github.com/lerna/lerna/pull/758) Use temp-write for multi-line commit messages. ([@evocateur](https://github.com/evocateur))
- [#761](https://github.com/lerna/lerna/pull/761) Use shell option when spawning `lerna exec`. ([@jwb](https://github.com/jwb))
- [#762](https://github.com/lerna/lerna/pull/762) Fix durable option resolution. ([@evocateur](https://github.com/evocateur))

#### :memo: Documentation

- [#748](https://github.com/lerna/lerna/pull/748) Reference conventionalcommits.org website in README. ([@bcoe](https://github.com/bcoe))
- [#751](https://github.com/lerna/lerna/pull/751) Update README.md and docs to better explain hoisting. ([@kylecordes](https://github.com/kylecordes))

If you've ever had a question about hoisting, read [@kylecordes](https://github.com/kylecordes)'s brilliant docs [here](https://github.com/lerna/lerna/blob/main/doc/hoist.md)!

#### :house: Internal

- [#745](https://github.com/lerna/lerna/pull/745) Add eslint-plugin-node. ([@evocateur](https://github.com/evocateur))
- [#747](https://github.com/lerna/lerna/pull/747) Fix bootstrap integration tests. ([@evocateur](https://github.com/evocateur))
- [#749](https://github.com/lerna/lerna/pull/749) Convert eslint config to YAML. ([@evocateur](https://github.com/evocateur))
- [#750](https://github.com/lerna/lerna/pull/750) Refactor fixture helpers to reduce duplication. ([@evocateur](https://github.com/evocateur))
- [#759](https://github.com/lerna/lerna/pull/759) Use execa for child_process calls. ([@evocateur](https://github.com/evocateur))

#### Committers: 5

- Benjamin E. Coe ([bcoe](https://github.com/bcoe))
- Daniel Stockman ([evocateur](https://github.com/evocateur))
- John Bito ([jwb](https://github.com/jwb))
- Kyle Cordes ([kylecordes](https://github.com/kylecordes))
- Norbert Csaba Herczeg ([noherczeg](https://github.com/noherczeg))

## v2.0.0-rc.1 (2017-04-07)

A silent (but deadly) bug slipped into the last release. Many thanks to ([@timdp](https://github.com/timdp)) for discovering it.

#### :bug: Bug Fix

- [#744](https://github.com/lerna/lerna/pull/744) Fix package.json updates during publish. ([@evocateur](https://github.com/evocateur))

## v2.0.0-rc.0 (2017-04-06)

:tada: It's the first release candidate of `v2.0.0`! :tada:

**Highlights**: Jest, CI automation improvements, and tons of internal refactoring!

We've been in "beta" for quite some time, and it's time for our versioning to better communicate changes and guarantee API stability.

Our goal is to focus on a few important bugfixes before pushing the big red button and cutting a `v2.0.0` for realsies. Check out the [milestone](https://github.com/lerna/lerna/milestone/1) to see if you can help!

#### :boom: Breaking Change

- [#732](https://github.com/lerna/lerna/pull/732) Remove broken public API. ([@evocateur](https://github.com/evocateur))

Our apologies if you were using this, but did you know it's been broken since before the first 2.x beta?
We have better opportunities in the offing for helping folks reuse parts of our inner logic (a `--json` flag for `lerna ls`, perhaps?), and encourage those who have complex needs to join or start discussions in the issues.

#### :rocket: Enhancement

- [#666](https://github.com/lerna/lerna/pull/666) Create annotated git tags instead of lightweight tags. ([@AlexLandau](https://github.com/AlexLandau))
- [#665](https://github.com/lerna/lerna/pull/665) Automate CHANGELOG updates and version bumps during publish with `--conventional-commits` flag. ([@bcoe](https://github.com/bcoe))
- [#607](https://github.com/lerna/lerna/pull/607) Increment version by semver keyword with `--cd-version` flag. ([@cif](https://github.com/cif))
- [#641](https://github.com/lerna/lerna/pull/641) Add prompts for prerelease versions. ([@rtsao](https://github.com/rtsao))
- [#647](https://github.com/lerna/lerna/pull/647) Allow concurrency to be configured via lerna.json. ([@gigabo](https://github.com/gigabo))
- [#635](https://github.com/lerna/lerna/pull/635) Switch to Jest. ([@evocateur](https://github.com/evocateur))
- [#714](https://github.com/lerna/lerna/pull/714) Refactor unit tests into Jest idioms, adding integration tests. ([@evocateur](https://github.com/evocateur))

#### :bug: Bug Fix

- [#731](https://github.com/lerna/lerna/pull/731) Symlink binaries of scoped packages correctly. ([@evocateur](https://github.com/evocateur))
- [#729](https://github.com/lerna/lerna/pull/729) Upgrade progress to address upstream bug. ([@zzarcon](https://github.com/zzarcon))
- [#728](https://github.com/lerna/lerna/pull/728) Handle `--ignore` flag correctly when publishing. ([@noherczeg](https://github.com/noherczeg))
- [#711](https://github.com/lerna/lerna/pull/711) Do not reject detached `HEAD` when publishing a canary release. ([@evocateur](https://github.com/evocateur))
- [#694](https://github.com/lerna/lerna/pull/694), [#705](https://github.com/lerna/lerna/pull/705) Loosen version check to major-only. ([@evocateur](https://github.com/evocateur))
- [#687](https://github.com/lerna/lerna/pull/687) Support lerna execution from subdirectories of repo root. ([@evocateur](https://github.com/evocateur))
- [#654](https://github.com/lerna/lerna/pull/654), [#672](https://github.com/lerna/lerna/pull/672) Merge current process.env when using `--registry` flag. ([@noherczeg](https://github.com/noherczeg)), ([@TheLarkInn](https://github.com/TheLarkInn))
- [#621](https://github.com/lerna/lerna/pull/621) Include private packages in the list of updated packages. ([@spudly](https://github.com/spudly))
- [#638](https://github.com/lerna/lerna/pull/638) Install with all dependencies when installing. ([@gigabo](https://github.com/gigabo))

#### :nail_care: Polish

- [#655](https://github.com/lerna/lerna/pull/655) Actually warn when a matching dependency version is not satisfied. ([@evocateur](https://github.com/evocateur))
- [#674](https://github.com/lerna/lerna/pull/674) Appveyor status should reflect master, not latest. ([@evocateur](https://github.com/evocateur))

#### :memo: Documentation

- [#736](https://github.com/lerna/lerna/pull/736) Update FAQ.md with publish retry details. ([@cdaringe](https://github.com/cdaringe))
- [#693](https://github.com/lerna/lerna/pull/693) Add GitHub issue and pull request templates. ([@evocateur](https://github.com/evocateur))
- [#634](https://github.com/lerna/lerna/pull/634) Add documentation about "watch" commands next to `--no-sort`. ([@trotzig](https://github.com/trotzig))

#### :house: Internal

- [#738](https://github.com/lerna/lerna/pull/738) Use `babel-preset-env` instead of `babel-preset-es2015`. ([@evocateur](https://github.com/evocateur))
- [#737](https://github.com/lerna/lerna/pull/737) Update eslint, config, and plugins. ([@evocateur](https://github.com/evocateur))
- [#733](https://github.com/lerna/lerna/pull/733), [#734](https://github.com/lerna/lerna/pull/734) Refactor CWD handling. ([@evocateur](https://github.com/evocateur))
- [#690](https://github.com/lerna/lerna/pull/690) Whitelist files included in package tarball. ([@evocateur](https://github.com/evocateur))
- [#681](https://github.com/lerna/lerna/pull/681) Use `yarn --frozen-lockfile` in CI. ([@evocateur](https://github.com/evocateur))
- [#673](https://github.com/lerna/lerna/pull/673) Use yarn instead of npm in CI. ([@evocateur](https://github.com/evocateur))
- [#663](https://github.com/lerna/lerna/pull/663) add tests for `NpmUtilities.getExecOpts()`. ([@noherczeg](https://github.com/noherczeg))

#### Committers: 17

- Alex Landau ([AlexLandau](https://github.com/AlexLandau))
- Ben Ipsen ([cif](https://github.com/cif))
- Benjamin E. Coe ([bcoe](https://github.com/bcoe))
- Bo Borgerson ([gigabo](https://github.com/gigabo))
- Christopher Dieringer ([cdaringe](https://github.com/cdaringe))
- Daniel Stockman ([evocateur](https://github.com/evocateur))
- Hector Zarco ([zzarcon](https://github.com/zzarcon))
- Henric Trotzig ([trotzig](https://github.com/trotzig))
- Henry Zhu ([hzoo](https://github.com/hzoo))
- Norbert Csaba Herczeg ([noherczeg](https://github.com/noherczeg))
- Nuno Campos ([nfcampos](https://github.com/nfcampos))
- Ryan Tsao ([rtsao](https://github.com/rtsao))
- Sean Larkin ([TheLarkInn](https://github.com/TheLarkInn))
- Stephen John Sorensen ([spudly](https://github.com/spudly))
- Vladimir Guguiev ([wizardzloy](https://github.com/wizardzloy))
- Yasser Kaddour ([YasserKaddour](https://github.com/YasserKaddour))
- james kyle ([thejameskyle](https://github.com/thejameskyle))

## v2.0.0-beta.38 (2017-02-28)

📦 🐈 Initial Yarn support and more!

#### :rocket: Enhancement

- [#605](https://github.com/lerna/lerna/pull/605) Add support for pluggable npm clients. ([@gigabo](https://github.com/gigabo))

> We'll make yarn the default once we feel that it's more stable.

```sh
$ lerna bootstrap --npm-client=yarn
```

```json
{
  "npmClient": "yarn"
}
```

- [#595](https://github.com/lerna/lerna/pull/595) Publish npm packages in topological order ([@loganfsmyth](https://github.com/loganfsmyth))

Very important fix for Babel that we used in the last release. This prevents a timing issue when publishing where a module will try to download a package that isn't published yet because it is published before it's own dependency is published itself. We used to get many issues from users on non-public npm about "babel-types" not being found.

- [#475](https://github.com/lerna/lerna/pull/475) Lerna checks for changes since most recent tag in the current branch ([@](Gongreg))

We now check for changes since the most recent tag in the current branch, instead of the most recent tag in entire repository. This allows publishing older versions of a project in maintenance branches, as well as nightly releases from a feature branch.

Additionally, we now ensure that the user is in a non-detached branch because lerna can't publish without a valid git branch.

- [#608](https://github.com/lerna/lerna/pull/608) Add a --stream option to the run command. ([@gigabo](https://github.com/gigabo))

Useful to get output for child processes immediately if using `lerna run` with a watch command

```sh
$ lerna run watch --stream
```

- [#624](https://github.com/lerna/lerna/pull/624) Add versions to lerna ls. Closes [#603](https://github.com/lerna/lerna/issues/603) ([@ben-eb](https://github.com/ben-eb))

* [#620](https://github.com/lerna/lerna/pull/620) Feature: skip-temp-tag. ([@noherczeg](https://github.com/noherczeg))

This will not create a temporary dist-tag called `lerna-temp` when publishing. Useful if your third party proxy doesn't support dist-tags.

```sh
$ lerna publish --skip-temp-tag
```

- [#587](https://github.com/lerna/lerna/pull/587) Always run test and env scripts. ([@simon360](https://github.com/simon360))

Defaults to running `npm run test` and `npm run env`

- [#598](https://github.com/lerna/lerna/pull/598) Durable `includeFilteredDependencies` config via lerna.json. ([@gigabo](https://github.com/gigabo))

```json
{
  "commands": {
    "bootstrap": {
      "includeFilteredDependencies": true
    }
  }
}
```

- [#596](https://github.com/lerna/lerna/pull/596) Support `sort` option in lerna.json. ([@gigabo](https://github.com/gigabo))

```js
{
  "commands": {
    "run": {
      "sort": false
    }
  }
}
```

- [#599](https://github.com/lerna/lerna/pull/599) Explicit registry flag feature. ([@noherczeg](https://github.com/noherczeg))

```sh
$ lerna publish --registry https://my-private-registry
```

#### :bug: Bug Fix

- [#601](https://github.com/lerna/lerna/pull/601) Fix --ignore flag when globs are expanded to an array. ([@rtsao](https://github.com/rtsao))
- [#597](https://github.com/lerna/lerna/pull/597) Support command config in either "commands" or "command". ([@gigabo](https://github.com/gigabo))
- [#586](https://github.com/lerna/lerna/pull/586) Avoid exception after successful `lerna diff`. ([@evocateur](https://github.com/evocateur))

#### :house: Internal

- [#604](https://github.com/lerna/lerna/pull/604) Fix midair collision. ([@doug-wade](https://github.com/doug-wade))
- [#594](https://github.com/lerna/lerna/pull/594) Remove `sync-exec` ([@wtgtybhertgeghgtwtg](https://github.com/wtgtybhertgeghgtwtg))

#### Committers: 11

- Ben Briggs ([ben-eb](https://github.com/ben-eb))
- Bo Borgerson ([gigabo](https://github.com/gigabo))
- Daniel Stockman ([evocateur](https://github.com/evocateur))
- Douglas Wade ([doug-wade](https://github.com/doug-wade))
- Garth Kidd ([garthk](https://github.com/garthk))
- Gytis Vinclovas ([Gongreg](https://github.com/Gongreg))
- Logan Smyth ([loganfsmyth](https://github.com/loganfsmyth))
- Norbert Csaba Herczeg ([noherczeg](https://github.com/noherczeg))
- Ryan Tsao ([rtsao](https://github.com/rtsao))
- [simon360](https://github.com/simon360)
- [wtgtybhertgeghgtwtg](https://github.com/wtgtybhertgeghgtwtg)

## v2.0.0-beta.37 (2017-02-08)

`--include-filtered-dependencies` now works with `ls`,`exec`,`run` as well!

- Fixes an issue with `--hoist` (from previous release)

#### :rocket: Enhancement

- [#581](https://github.com/lerna/lerna/pull/581) Improve support for --include-filtered-dependencies. ([@roblg](https://github.com/roblg))
- [#576](https://github.com/lerna/lerna/pull/576) Install with no arguments. ([@gigabo](https://github.com/gigabo))
- [#569](https://github.com/lerna/lerna/pull/569) Short-circuit out of install with no packages. ([@gigabo](https://github.com/gigabo))

#### :bug: Bug Fix

- [#574](https://github.com/lerna/lerna/pull/574) Use correct logger method in Package method.. ([@evocateur](https://github.com/evocateur))
- [#568](https://github.com/lerna/lerna/pull/568) Check if directories exist before removing during hoist. ([@gigabo](https://github.com/gigabo))

#### :house: Internal

- [#562](https://github.com/lerna/lerna/pull/562) Replace `lodash.find`, `lodash.unionwith`, and `pad` with `lodash`.. ([@wtgtybhertgeghgtwtg](https://github.com/wtgtybhertgeghgtwtg))
- [#584](https://github.com/lerna/lerna/pull/584) Bump `command-join`.. ([@wtgtybhertgeghgtwtg](https://github.com/wtgtybhertgeghgtwtg))
- [#575](https://github.com/lerna/lerna/pull/575) Add coverage report. ([@doug-wade](https://github.com/doug-wade))

#### Committers: 5

- Bo Borgerson ([gigabo](https://github.com/gigabo))
- Daniel Stockman ([evocateur](https://github.com/evocateur))
- Douglas Wade ([doug-wade](https://github.com/doug-wade))
- Robert Gay ([roblg](https://github.com/roblg))
- [wtgtybhertgeghgtwtg](https://github.com/wtgtybhertgeghgtwtg)

## v2.0.0-beta.36 (2017-02-02)

#### :bug: Bug Fix

- [#566](https://github.com/lerna/lerna/pull/566) Fix rimraf bin resolution. ([@rtsao](https://github.com/rtsao))

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

- [#507](https://github.com/lerna/lerna/pull/507) Automatic hoisting of common dependencies. ([@gigabo](https://github.com/gigabo))
- [#547](https://github.com/lerna/lerna/pull/547) Spawn child process for rimraf (speeds up `lerna clean`). ([@roblg](https://github.com/roblg))
- [#543](https://github.com/lerna/lerna/pull/543) [clean] Support `--include-filtered-dependencies` flag. ([@roblg](https://github.com/roblg))
- [#412](https://github.com/lerna/lerna/pull/412) Make bootstrap, exec and run commands execute packages in dependency order by default. ([@seansfkelley](https://github.com/seansfkelley))
- [#373](https://github.com/lerna/lerna/pull/373) [Feature] Log stdout when commands fail. Closes [#343](https://github.com/lerna/lerna/issues/343).. ([@seansfkelley](https://github.com/seansfkelley))

#### :bug: Bug Fix

- [#542](https://github.com/lerna/lerna/pull/542) Fixes issue: prepublish not running in dependencies with `--scope --include-filtered-dependencies`. ([@roblg](https://github.com/roblg))

When running `lerna bootstrap --scope foo --include-filtered-dependencies` run prepublish task with the same flags.

#### :memo: Documentation

- [#465](https://github.com/lerna/lerna/pull/465) Add a note about lerna-wizard.. ([@szarouski](https://github.com/szarouski))

#### :house: Internal

- [#554](https://github.com/lerna/lerna/pull/554) Bump `cross-env`.. ([@wtgtybhertgeghgtwtg](https://github.com/wtgtybhertgeghgtwtg))
- [#560](https://github.com/lerna/lerna/pull/560) redo labels [skip ci]. ([@hzoo](https://github.com/hzoo))
- [#559](https://github.com/lerna/lerna/pull/559) Drop `isarray`.. ([@wtgtybhertgeghgtwtg](https://github.com/wtgtybhertgeghgtwtg))
- [#557](https://github.com/lerna/lerna/pull/557) Fix broken hoisting tests. ([@doug-wade](https://github.com/doug-wade))
- [#549](https://github.com/lerna/lerna/pull/549) Bump `signal-exit`.. ([@wtgtybhertgeghgtwtg](https://github.com/wtgtybhertgeghgtwtg))
- [#548](https://github.com/lerna/lerna/pull/548) Bump `object-assigned-sorted`.. ([@wtgtybhertgeghgtwtg](https://github.com/wtgtybhertgeghgtwtg))
- [#535](https://github.com/lerna/lerna/pull/535) Don't include unnecessary files in the npm package. ([@gpittarelli](https://github.com/gpittarelli))
- [#546](https://github.com/lerna/lerna/pull/546) Drop `object-assign`.. ([@wtgtybhertgeghgtwtg](https://github.com/wtgtybhertgeghgtwtg))
- [#541](https://github.com/lerna/lerna/pull/541) Upgrade `inquirer` dependency. ([@wtgtybhertgeghgtwtg](https://github.com/wtgtybhertgeghgtwtg))

#### Committers: 9

- Bo Borgerson ([gigabo](https://github.com/gigabo))
- Douglas Wade ([doug-wade](https://github.com/doug-wade))
- George Pittarelli ([gpittarelli](https://github.com/gpittarelli))
- Henry Zhu ([hzoo](https://github.com/hzoo))
- Robert Gay ([roblg](https://github.com/roblg))
- Sean Kelley ([seansfkelley](https://github.com/seansfkelley))
- Sergey Zarouski ([szarouski](https://github.com/szarouski))
- [wtgtybhertgeghgtwtg](https://github.com/wtgtybhertgeghgtwtg)

## v2.0.0-beta.34 (2017-01-26)

#### :bug: Bug Fix

- [#537](https://github.com/lerna/lerna/pull/537) [CRITICAL] Publish command is broken for 2.0.0-beta.33. ([@diogofcunha](https://github.com/diogofcunha))

#### Committers: 1

- Diogo ([diogofcunha](https://github.com/diogofcunha))

## v2.0.0-beta.33 (2017-01-25)

- Drop Node 0.10/0.12/5
- Custom publish commit message
- Publish to a different remote
- Publish exact versions instead of `^`

#### Breaking change

- [#528](https://github.com/lerna/lerna/pull/528) Drop node 5 from travis/appveyor. ([@chitchu](https://github.com/chitchu))
- [#484](https://github.com/lerna/lerna/pull/484) Drop support for node 0.10 and node 0.12. ([@doug-wade](https://github.com/doug-wade))

#### Enhancement

- [#460](https://github.com/lerna/lerna/pull/460) Add --message option for custom commit msgs when publishing. ([@traviskaufman](https://github.com/traviskaufman))

Override default message with `--message` or `-m`

```sh
lerna publish -m "chore: Publish"
```

- [#508](https://github.com/lerna/lerna/pull/508) [Feature] Allow git remote to be changed for publish. ([@tdanecker](https://github.com/tdanecker))

Use a different git remote other than origin

```sh
lerna publish --git-remote upstream
```

- [#390](https://github.com/lerna/lerna/pull/390) [Feature] Adds `--include-filtered-dependencies` flag for bootstrap command. ([@lukebatchelor](https://github.com/lukebatchelor))

`my-component` and all of its dependencies will be bootstrapped

```sh
lerna bootstrap --scope my-component --include-filtered-dependencies
```

- [#426](https://github.com/lerna/lerna/pull/426) Add support for hidden '--exact' flag. ([@L8D](https://github.com/L8D))

Use exact versions (`"2.1.3"`) instead of with `^` (`"^2.1.3"`)

```sh
lerna publish --exact
```

#### Bug fix

- [#458](https://github.com/lerna/lerna/pull/458) use message passed as argument to the static method input() in PromptUtilities. ([@btiwaree](https://github.com/btiwaree))
- [#483](https://github.com/lerna/lerna/pull/483) 467: lerna bootstrap succeeds with 0 packages. ([@doug-wade](https://github.com/doug-wade))
- [#454](https://github.com/lerna/lerna/pull/454) Use close event to wait for spawned processes to finish. ([@xaka](https://github.com/xaka))

#### Documentation

- [#514](https://github.com/lerna/lerna/pull/514) Update README.md (s/--exclude/--ignore/). ([@xaka](https://github.com/xaka))
- [#459](https://github.com/lerna/lerna/pull/459) Fix import logger info typo. ([@sdgluck](https://github.com/sdgluck))

#### Committers: 9

- Bishesh Tiwaree ([btiwaree](https://github.com/btiwaree))
- Douglas Wade ([doug-wade](https://github.com/doug-wade))
- Pavel Strashkin ([xaka](https://github.com/xaka))
- Sam Gluck ([sdgluck](https://github.com/sdgluck))
- Tenor Biel ([L8D](https://github.com/L8D))
- Thomas Danecker ([tdanecker](https://github.com/tdanecker))
- Travis Kaufman ([traviskaufman](https://github.com/traviskaufman))
- Vicente Jr Yuchitcho ([chitchu](https://github.com/chitchu))
- [lukebatchelor](https://github.com/lukebatchelor)

## v2.0.0-beta.32 (2017-01-04)

#### Bug fix

- [#435](https://github.com/lerna/lerna/pull/435) Use symlinks with relative paths instead of absolute on non-windows environments (Closes [#423](https://github.com/lerna/lerna/issues/423)).. ([@JaapRood](https://github.com/JaapRood))
- [#440](https://github.com/lerna/lerna/pull/440) Change testing NODE_ENV to "lerna-test" (Closes [#406](https://github.com/lerna/lerna/issues/406)). ([@ryb73](https://github.com/ryb73))
- [#444](https://github.com/lerna/lerna/pull/444) Use correct logger method for warnings. ([@evocateur](https://github.com/evocateur))

#### Committers: 3

- Daniel Stockman ([evocateur](https://github.com/evocateur))
- Jaap van Hardeveld ([JaapRood](https://github.com/JaapRood))
- Ryan Biwer ([ryb73](https://github.com/ryb73))

## v2.0.0-beta.31 (2016-12-14)

#### Enhancement

- [#365](https://github.com/lerna/lerna/pull/365) Add support for configurable package locations. ([@gigabo](https://github.com/gigabo))

Lerna now supports packages outside of the `packages/` directory!

Configured via an array of globs in `lerna.json`:

```json
{
  "lerna": "2.0.0-beta.31",
  "version": "1.1.3",
  "packages": ["packages/*"]
}
```

- [#436](https://github.com/lerna/lerna/pull/436) Highlight private packages in updated/publish output. ([@chrishelgert](https://github.com/chrishelgert))

No more confusion about what will actually get published!

![example](https://cloud.githubusercontent.com/assets/3918488/20965291/4c6a753c-bc75-11e6-9b6d-853f0952b647.png)

- [#367](https://github.com/lerna/lerna/pull/367) Make log levels more like npm. ([@gigabo](https://github.com/gigabo))

Adds a `--loglevel [silent|error|warn|success|info|verbose|silly]` option.

Any logs of a higher level than the setting are shown. The default is "info".

- [#386](https://github.com/lerna/lerna/pull/386) Add --scope and --ignore support for bootstrap, exec, run, clean and ls. ([@lukebatchelor](https://github.com/lukebatchelor))
- [#358](https://github.com/lerna/lerna/pull/358) Run pre/post install scripts during bootstrap. ([@seansfkelley](https://github.com/seansfkelley))

#### Bug fix

- [#442](https://github.com/lerna/lerna/pull/442) Increase maxBuffer. ([@rygine](https://github.com/rygine))
- [#372](https://github.com/lerna/lerna/pull/372) Fix logifyAsync, logifySync decorators. ([@seansfkelley](https://github.com/seansfkelley))

#### Committers: 15

- Bastian Heist ([beheist](https://github.com/beheist))
- Ben Briggs ([ben-eb](https://github.com/ben-eb))
- Ben Clinkinbeard ([bclinkinbeard](https://github.com/bclinkinbeard))
- Bo Borgerson ([gigabo](https://github.com/gigabo))
- Chris Helgert ([chrishelgert](https://github.com/chrishelgert))
- Elise Chant ([elisechant](https://github.com/elisechant))
- Gary Johnson ([garyjN7](https://github.com/garyjN7))
- Henry Zhu ([hzoo](https://github.com/hzoo))
- Ivan Akulov ([iamakulov](https://github.com/iamakulov))
- James K ([thejameskyle](https://github.com/thejameskyle))
- Joscha Feth ([joscha](https://github.com/joscha))
- MURAKAMI Masahiko ([fossamagna](https://github.com/fossamagna))
- Sean Kelley ([seansfkelley](https://github.com/seansfkelley))
- Teppei Sato ([teppeis](https://github.com/teppeis))
- [lukebatchelor](https://github.com/lukebatchelor)
