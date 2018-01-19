## v2.8.0 (2018-01-19)

This is the first release on the `2.x` branch, which has been created to facilitate maintenance releases while v3.0 is in development on `master`. Efforts will be made to backport fixes from `master`, but no guarantees about release cadence.

#### :rocket: Enhancement

* [#1212](https://github.com/lerna/lerna/pull/1212) Throw friendly error when workspaces are not configured correctly. ([@craigbilner](https://github.com/craigbilner))

#### :bug: Bug Fix

* [#1219](https://github.com/lerna/lerna/pull/1219) Avoid triggering pre-commit and commitmsg hooks during publish. ([@alan-agius4](https://github.com/alan-agius4))
* [#1220](https://github.com/lerna/lerna/pull/1220) Remove --no-gpg-sign from `git commit`. ([@evocateur](https://github.com/evocateur))
* [#1217](https://github.com/lerna/lerna/pull/1217) Avoid duplicate root changelog entries. ([@evocateur](https://github.com/evocateur))

#### Committers: 3

* Alan Agius ([alan-agius4](https://github.com/alan-agius4))
* Craig Bilner ([craigbilner](https://github.com/craigbilner))
* Daniel Stockman ([evocateur](https://github.com/evocateur))

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
