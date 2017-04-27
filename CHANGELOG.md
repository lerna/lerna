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
- Benjamin E. Coe ([bcoe](https://github.com/bcoe))
- Daniel Stockman ([evocateur](https://github.com/evocateur))
- John Bito ([jwb](https://github.com/jwb))
- Kyle Cordes ([kylecordes](https://github.com/kylecordes))
- Norbert Csaba Herczeg ([noherczeg](https://github.com/noherczeg))

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
- Alex Landau ([AlexLandau](https://github.com/AlexLandau))
- Ben Ipsen ([cif](https://github.com/cif))
- Benjamin E. Coe ([bcoe](https://github.com/bcoe))
- Bo Borgerson ([gigabo](https://github.com/gigabo))
- Christopher Dieringer ([cdaringe](https://github.com/cdaringe))
- Daniel Stockman ([evocateur](https://github.com/evocateur))
- Hector Zarco  ([zzarcon](https://github.com/zzarcon))
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

📦 🐈  Initial Yarn support and more!

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



* [#620](https://github.com/lerna/lerna/pull/620) Feature: skip-temp-tag. ([@noherczeg](https://github.com/noherczeg))

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
- Bo Borgerson ([gigabo](https://github.com/gigabo))
- Daniel Stockman ([evocateur](https://github.com/evocateur))
- Douglas Wade ([doug-wade](https://github.com/doug-wade))
- Robert Gay ([roblg](https://github.com/roblg))
- [wtgtybhertgeghgtwtg](https://github.com/wtgtybhertgeghgtwtg)

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
available to all packages.  Any binaries from these dependencies will be
linked into dependent package `node_modules/.bin/` directories so they're
available for npm scripts.  If the option is present but no `glob` is given
the default is `**` (hoist everything).  This option only affects the
`bootstrap` command.

```sh
$ lerna bootstrap --hoist
```

Note: If packages depend on different _versions_ of an external dependency,
the most commonly used version will be hoisted, and a warning will be emitted.

This option may also be set in `lerna.json` with `"hoist": true` or `"hoist": <glob>`.

###### `--nohoist` (only for bootstrap)

Do _not_ install external dependencies matching `glob` at the repo root.  This
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
* [#537](https://github.com/lerna/lerna/pull/537) [CRITICAL] Publish command is broken for 2.0.0-beta.33. ([@diogofcunha](https://github.com/diogofcunha))

#### Committers: 1
- Diogo ([diogofcunha](https://github.com/diogofcunha))

## v2.0.0-beta.33 (2017-01-25)

- Drop Node 0.10/0.12/5
- Custom publish commit message
- Publish to a different remote
- Publish exact versions instead of `^`

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
* [#435](https://github.com/lerna/lerna/pull/435) Use symlinks with relative paths instead of absolute on non-windows environments (Closes [#423](https://github.com/lerna/lerna/issues/423)).. ([@JaapRood](https://github.com/JaapRood))		
* [#440](https://github.com/lerna/lerna/pull/440) Change testing NODE_ENV to "lerna-test" (Closes [#406](https://github.com/lerna/lerna/issues/406)). ([@ryb73](https://github.com/ryb73))		
* [#444](https://github.com/lerna/lerna/pull/444) Use correct logger method for warnings. ([@evocateur](https://github.com/evocateur))		

#### Committers: 3		
- Daniel Stockman ([evocateur](https://github.com/evocateur))		
- Jaap van Hardeveld ([JaapRood](https://github.com/JaapRood))		
- Ryan Biwer ([ryb73](https://github.com/ryb73))		

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

* [#367](https://github.com/lerna/lerna/pull/367) Make log levels more like npm.  ([@gigabo](https://github.com/gigabo))		

Adds a `--loglevel [silent|error|warn|success|info|verbose|silly]` option.		

Any logs of a higher level than the setting are shown. The default is "info".		

* [#386](https://github.com/lerna/lerna/pull/386) Add --scope and --ignore support for bootstrap, exec, run, clean and ls. ([@lukebatchelor](https://github.com/lukebatchelor))		
* [#358](https://github.com/lerna/lerna/pull/358) Run pre/post install scripts during bootstrap. ([@seansfkelley](https://github.com/seansfkelley))		

#### Bug fix		
* [#442](https://github.com/lerna/lerna/pull/442) Increase maxBuffer. ([@rygine](https://github.com/rygine))		
* [#372](https://github.com/lerna/lerna/pull/372) Fix logifyAsync, logifySync decorators. ([@seansfkelley](https://github.com/seansfkelley))		

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
