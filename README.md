<p align="center">
  <img alt="Lerna" src="https://cloud.githubusercontent.com/assets/952783/15271604/6da94f96-1a06-11e6-8b04-dc3171f79a90.png" width="480">
</p>

<p align="center">
  A tool for managing JavaScript projects with multiple packages.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/lerna"><img alt="NPM Status" src="https://img.shields.io/npm/v/lerna.svg?style=flat"></a>
  <a href="https://travis-ci.org/lerna/lerna"><img alt="Travis Status" src="https://img.shields.io/travis/lerna/lerna/master.svg?style=flat&label=travis"></a>
  <a href="https://ci.appveyor.com/project/lerna/lerna/branch/master"><img alt="Appveyor Status" src="https://img.shields.io/appveyor/ci/lerna/lerna/master.svg"></a>
  <a href="https://slack.lernajs.io/"><img alt="Slack Status" src="https://slack.lernajs.io/badge.svg"></a>
</p>

- [About](#about)
- [Getting Started](#getting-started)
- [How It Works](#how-it-works)
- [Troubleshooting](#troubleshooting)
- [Commands](#commands)
- [Misc](#misc)
- [Lerna.json](#lernajson)
- [Flags](#flags)

## About

Splitting up large codebases into separate independently versioned packages
is extremely useful for code sharing. However, making changes across many
repositories is *messy* and difficult to track, and testing across repositories
gets complicated really fast.

To solve these (and many other) problems, some projects will organize their
codebases into multi-package repositories (sometimes called [monorepos](https://github.com/babel/babel/blob/master/doc/design/monorepo.md)). Projects like [Babel](https://github.com/babel/babel/tree/master/packages), [React](https://github.com/facebook/react/tree/master/packages), [Angular](https://github.com/angular/angular/tree/master/modules),
[Ember](https://github.com/emberjs/ember.js/tree/master/packages), [Meteor](https://github.com/meteor/meteor/tree/devel/packages), [Jest](https://github.com/facebook/jest/tree/master/packages), and many others develop all of their packages within a
single repository.

**Lerna is a tool that optimizes the workflow around managing multi-package
repositories with git and npm.**

Lerna can also reduce the time and space requirements for numerous
copies of packages in development and build environments - normally a
downside of dividing a project into many separate NPM package. See the
[hoist documentation](doc/hoist.md) for details.

### What does a Lerna repo look like?

There's actually very little to it. You have a file system that looks like this:

```
my-lerna-repo/
  package.json
  packages/
    package-1/
      package.json
    package-2/
      package.json
```

### What can Lerna do?

The two primary commands in Lerna are `lerna bootstrap` and `lerna publish`.

`bootstrap` will link dependencies in the repo together.
`publish` will help publish any updated packages.

## Getting Started

> The instructions below are for Lerna 2.x.
> We recommend using it instead of 1.x for a new Lerna project. Check the [wiki](https://github.com/lerna/lerna/wiki/1.x-Docs) if you need to see the 1.x README.

Let's start by installing Lerna globally with [npm](https://www.npmjs.com/).

```sh
$ npm install --global lerna
```

Next we'll create a new folder:

```sh
$ mkdir lerna-repo
$ cd lerna-repo
```

And now let's turn it into a Lerna repo:

```sh
$ lerna init
```

This will create a `lerna.json` configuration file as well as a `packages` folder, so your folder should now look like this:

```
lerna-repo/
  packages/
  package.json
  lerna.json
```

## How It Works

Lerna allows you to manage your project using one of two modes: Fixed or Independent.

### Fixed/Locked mode (default)

Fixed mode Lerna projects operate on a single version line. The version is kept in the `lerna.json` file at the root of your project under the `version` key. When you run `lerna publish`, if a module has been updated since the last time a release was made, it will be updated to the new version you're releasing. This means that you only publish a new version of a package when you need to.

This is the mode that [Babel](https://github.com/babel/babel) is currently using. Use this if you want to automatically tie all package versions together. One issue with this approach is that a major change in any package will result in all packages having a new major version.

### Independent mode (`--independent`)

Independent mode Lerna projects allows maintainers to increment package versions independently of each other. Each time you publish, you will get a prompt for each package that has changed to specify if it's a patch, minor, major or custom change.

Independent mode allows you to more specifically update versions for each package and makes sense for a group of components. Combining this mode with something like [semantic-release](https://github.com/semantic-release/semantic-release) would make it less painful. (There is work on this already at [atlassian/lerna-semantic-release](https://github.com/atlassian/lerna-semantic-release)).

> The `version` key in `lerna.json` is ignored in independent mode.

## Troubleshooting

If you encounter any issues while using Lerna please check out our [Troubleshooting](doc/troubleshooting.md)
document where you might find the answer to your problem.

## Frequently asked questions

See [FAQ.md](FAQ.md).

## Commands

### init

```sh
$ lerna init
```

Create a new Lerna repo or upgrade an existing repo to the current version of Lerna.

> Lerna assumes the repo has already been initialized with `git init`.

When run, this command will:

1. Add `lerna` as a [`devDependency`](https://docs.npmjs.com/files/package.json#devdependencies) in `package.json` if it doesn't already exist.
2. Create a `lerna.json` config file to store the `version` number.

Example output on a new git repo:

```sh
$ lerna init
lerna info version v2.0.0
lerna info Updating package.json
lerna info Creating lerna.json
lerna success Initialized Lerna files
```

#### --independent, -i

```sh
$ lerna init --independent
```

This flag tells Lerna to use independent versioning mode.

#### --exact

```sh
$ lerna init --exact
```

By default, `lerna init` will use a caret range when adding or updating
the local version of `lerna`, just like `npm install --save-dev lerna`.

To retain the `lerna` 1.x behavior of "exact" comparison, pass this flag.
It will configure `lerna.json` to enforce exact match for all subsequent executions.

```json
{
  "lerna": "2.0.0",
  "commands": {
    "init": {
      "exact": true
    }
  },
  "version": "0.0.0"
}
```

### bootstrap

```sh
$ lerna bootstrap
```

Bootstrap the packages in the current Lerna repo.
Installs all of their dependencies and links any cross-dependencies.

When run, this command will:

1. `npm install` all external dependencies of each package.
2. Symlink together all Lerna `packages` that are dependencies of each other.
3. `npm run prepublish` in all bootstrapped packages.
4. `npm run prepare` in all bootstrapped packages.

`lerna bootstrap` respects the `--ignore`, `--ignore-scripts`, `--scope` and `--include-filtered-dependencies` flags (see [Flags](#flags)).

Pass extra arguments to npm client by placing them after `--`:

```sh
$ lerna bootstrap -- --production --no-optional
```

May also be configured in `lerna.json`:

```js
{
  ...
  "npmClient": "yarn",
  "npmClientArgs": ["--production", "--no-optional"]
}
```

#### How `bootstrap` works

Let's use `babel` as an example.

- `babel-generator` and `source-map` (among others) are dependencies of `babel-core`.
-  `babel-core`'s [`package.json`](https://github.com/babel/babel/blob/13c961d29d76ccd38b1fc61333a874072e9a8d6a/packages/babel-core/package.json#L28-L47) lists both these packages as keys in `dependencies`, as shown below.

### add

```sh
$ lerna add <package>[@version] [--dev]
```

Add local or remote `package` as dependency to packages in the current Lerna repo.

When run, this command will:

1. Add `package` to each applicable package. Applicable are packages that are not `package` and are in scope
2. Bootstrap packages with changes to their manifest file (`package.json`)

`lerna add` respects the `--ignore`, `--scope` and `--include-filtered-dependencies` flags (see [Flags](#flags)).

#### Examples

```
lerna add module-1 --scope=module-2 # Install module-1 to module-2
lerna add module-1 --scope=module-2 --dev # Install module-1 to module-2 in devDependencies
lerna add module-1 # Install module-1 in all modules except module-1
lerna add babel-core # Install babel-core in all modules
```

```js
// babel-core package.json
{
  "name": "babel-core",
  ...
  "dependencies": {
    ...
    "babel-generator": "^6.9.0",
    ...
    "source-map": "^0.5.0"
  }
}
```

- Lerna checks if each dependency is also part of the Lerna repo.
  - In this example, `babel-generator` can be an internal dependency, while `source-map` is always an external dependency.
  - The version of `babel-generator` in the `package.json` of `babel-core` is satisfied by `packages/babel-generator`, passing for an internal dependency.
  - `source-map` is `npm install`ed (or `yarn`ed) like normal.
- `packages/babel-core/node_modules/babel-generator` symlinks to `packages/babel-generator`
- This allows nested directory imports

**Notes:**
- When a dependency version in a package is not satisfied by a package of the same name in the repo, it will be `npm install`ed (or `yarn`ed) like normal.
- Dist-tags, like `latest`, do not satisfy [semver](https://semver.npmjs.com/) ranges.
- Circular dependencies result in circular symlinks which *may* impact your editor/IDE.

[Webstorm](https://www.jetbrains.com/webstorm/) locks up when circular symlinks are present. To prevent this, add `node_modules` to the list of ignored files and folders in `Preferences | Editor | File Types | Ignored files and folders`.

### publish

```sh
$ lerna publish
```

Publish packages in the current Lerna project. When run, this command does the following:

Creates a new release of the packages that have been updated.
Prompts for a new version.
Creates a new git commit/tag in the process of publishing to npm.

More specifically, this command will:

1. Run the equivalent of `lerna updated` to determine which packages need to be published.
2. If necessary, increment the `version` key in `lerna.json`.
3. Update the `package.json` of all updated packages to their new versions.
4. Update all dependencies of the updated packages with the new versions, specified with a [caret (^)](https://docs.npmjs.com/files/package.json#dependencies).
5. Create a new git commit and tag for the new version.
6. Publish updated packages to npm.

> Lerna won't publish packages which are marked as private (`"private": true` in the `package.json`).

**Note:** to publish scoped packages, you need to add the following to each `package.json`:

```js
"publishConfig": {
  "access": "public"
}
```

#### --exact

```sh
$ lerna publish --exact
```

When run with this flag, `publish` will specify updated dependencies in updated packages exactly (with no punctuation), instead of as semver compatible (with a `^`).

For more information, see the package.json [dependencies](https://docs.npmjs.com/files/package.json#dependencies) documentation.

#### --npm-tag [tagname]

```sh
$ lerna publish --npm-tag=next
```

When run with this flag, `publish` will publish to npm with the given npm [dist-tag](https://docs.npmjs.com/cli/dist-tag) (defaults to `latest`).

This option can be used to publish a [`prerelease`](http://carrot.is/coding/npm_prerelease) or `beta` version.

> Note: the `latest` tag is the one that is used when a user runs `npm install my-package`.
> To install a different tag, a user can run `npm install my-package@prerelease`.

#### --canary, -c

```sh
$ lerna publish --canary
$ lerna publish --canary=beta
```

When run with this flag, `publish` publishes packages in a more granular way (per commit). Before publishing to npm, it creates the new `version` tag by taking the current `version`, bumping it to the next *minor* version, adding the provided meta suffix (defaults to `alpha`) and appending the current git sha (ex: `1.0.0` becomes `1.1.0-alpha.81e3b443`).

> The intended use case for this flag is a per commit level release or nightly release.

#### --conventional-commits

```sh
$ lerna publish --conventional-commits
```

When run with this flag, `publish` will use the [Conventional Commits Specification](https://conventionalcommits.org/) to [determine the version bump](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-recommended-bump) and [generate CHANGELOG](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-cli)

#### --changelog-preset

```sh
$ lerna publish --conventional-commits --changelog-preset=angular-bitbucket
```

By default, the changelog preset is set to `angular`. In some cases you might want to change either use a another preset or a custom one.

Presets are names of built-in or installable configuration for conventional changelog.

#### --git-remote [remote]

```sh
$ lerna publish --git-remote upstream
```

When run with this flag, `publish` will push the git changes to the specified remote instead of `origin`.

#### --skip-git

```sh
$ lerna publish --skip-git
```

When run with this flag, `publish` will publish to npm without running any of the git commands.

> Only publish to npm; skip committing, tagging, and pushing git changes (this only affects publish).

#### --skip-npm

```sh
$ lerna publish --skip-npm
```

When run with this flag, `publish` will update all `package.json` package
versions and dependency versions, but it will not actually publish the
packages to npm.

> This was useful as a workaround for an [npm
issue](https://github.com/npm/registry/issues/42) which has since been fixed.  When publishing with
README changes, use `--skip-npm` and do the final `npm publish` by hand for
each package.

This flag can be combined with `--skip-git` to _just_ update versions and
dependencies, without committing, tagging, pushing or publishing.

> Only update versions and dependencies; don't actually publish (this only affects publish).

#### --force-publish [packages]

```sh
$ lerna publish --force-publish=package-2,package-4
# force publish all packages
$ lerna publish --force-publish=*
```

When run with this flag, `publish` will force publish the specified packages (comma-separated) or all packages using `*`.

> This will skip the `lerna updated` check for changed packages and forces a package that didn't have a `git diff` change to be updated.

#### --yes

```sh
$ lerna publish --canary --yes
# skips `Are you sure you want to publish the above changes?`
```

When run with this flag, `publish` will skip all confirmation prompts.
Useful in [Continuous integration (CI)](https://en.wikipedia.org/wiki/Continuous_integration) to automatically answer the publish confirmation prompt.

#### --cd-version

```sh
$ lerna publish --cd-version (major | minor | patch | premajor | preminor | prepatch | prerelease)
# uses the next semantic version(s) value and this skips `Select a new version for...` prompt
```

When run with this flag, `publish` will skip the version selection prompt (in independent mode) and use the next specified semantic version.
You must still use the `--yes` flag to avoid all prompts. This is useful when build systems need to publish without command prompts. Works in both normal and independent modes.

If you have any packages with a prerelease version number (e.g. `2.0.0-beta.3`) and you run `lerna publish` with `--cd-version` and a non-prerelease version increment (major / minor / patch), it will publish those packages in addition to the packages that have changed since the last release.

#### --preid

```sh
$ lerna publish --cd-version=prerelease
# uses the next semantic prerelease version, e.g.
# 1.0.0 => 1.0.0-0

$ lerna publish --cd-version=prepatch --preid=next
# uses the next semantic prerelease version with a specific prerelease identifier, e.g.
# 1.0.0 => 1.0.1-next.0
```

When run with this flag, `lerna publish --cd-version` will
increment `premajor`, `preminor`, `prepatch`, or `prerelease`
versions using the specified [prerelease identifier](http://semver.org/#spec-item-9).

#### --repo-version

```sh
$ lerna publish --repo-version 1.0.1
# applies version and skips `Select a new version for...` prompt
```

When run with this flag, `publish` will skip the version selection prompt and use the specified version.
Useful for bypassing the user input prompt if you already know which version to publish.

#### --message, -m [msg]

```sh
$ lerna publish -m "chore(release): publish %s"
# commit message = "chore(release): publish v1.0.0"

$ lerna publish -m "chore(release): publish %v"
# commit message = "chore(release): publish 1.0.0"

$ lerna publish -m "chore(release): publish" --independent
# commit message = "chore(release): publish
#
# - package-1@3.0.1
# - package-2@1.5.4"
```

When run with this flag, `publish` will use the provided message when committing the version updates
for publication. Useful for integrating lerna into projects that expect commit messages to adhere
to certain guidelines, such as projects which use [commitizen](https://github.com/commitizen/cz-cli) and/or [semantic-release](https://github.com/semantic-release/semantic-release).

If the message contains `%s`, it will be replaced with the new global version version number prefixed with a "v".
If the message contains `%v`, it will be replaced with the new global version version number without the leading "v".
Note that this only applies when using the default "fixed" versioning mode, as there is no "global" version when using `--independent`.

This can be configured in lerna.json, as well:
```json
{
  "commands": {
    "publish": {
      "message": "chore(release): publish %s"
    }
  }
}
```

#### --allow-branch [glob]

Lerna allows you to specify a glob or an array of globs in your `lerna.json` that your current branch needs to match to be publishable.
You can use this flag to override this setting.
If your `lerna.json` contains something like this:

```json
{
  "commands": {
    "publish": {
      "allowBranch": "master"
    }
  }
}
```

```json
{
  "command": {
    "publish": {
      "allowBranch": [
        "master",
        "feature/*"
      ]
    }
  }
}
```

and you are not on the branch `master` lerna will prevent you from publishing. To force a publish despite this config, pass the `--allow-branch` flag:

```sh
$ lerna publish --allow-branch my-new-feature
```

### updated

```sh
$ lerna updated
```

Check which `packages` have changed since the last release (the last git tag).

Lerna determines the last git tag created and runs `git diff --name-only v6.8.1` to get all files changed since that tag. It then returns an array of packages that have an updated file.


**Note that configuration for the `publish` command _also_ affects the
`updated` command.  For example `config.publish.ignore`**

#### --json

```sh
$ lerna updated --json
```

When run with this flag, `updated` will return an array of objects in the following format:

```json
[
  {
    "name": "package",
    "version": "1.0.0",
    "private": false
  }
]
```

### clean

```sh
$ lerna clean
```

Remove the `node_modules` directory from all packages.

`lerna clean` respects the `--ignore`, `--scope`, and `--yes` flags (see [Flags](#flags)).

### diff

```sh
$ lerna diff [package?]

$ lerna diff
# diff a specific package
$ lerna diff package-name
```

Diff all packages or a single package since the last release.

> Similar to `lerna updated`. This command runs `git diff`.

### ls

```sh
$ lerna ls
```

List all of the public packages in the current Lerna repo.

`lerna ls` respects the `--ignore` and `--scope` flags (see [Flags](#flags)).

#### --json

```sh
$ lerna ls --json
```

When run with this flag, `ls` will return an array of objects in the following format:

```json
[
  {
    "name": "package",
    "version": "1.0.0",
    "private": false
  }
]
```

### run

```sh
$ lerna run <script> -- [..args] # runs npm run my-script in all packages that have it
$ lerna run test
$ lerna run build

# watch all packages and transpile on change, streaming prefixed output
$ lerna run --parallel watch
```

Run an [npm script](https://docs.npmjs.com/misc/scripts) in each package that contains that script. A double-dash (`--`) is necessary to pass dashed arguments to the script execution.

`lerna run` respects the `--concurrency`, `--scope`, `--ignore`, `--stream`, `--prefix` and `--parallel` flags (see [Flags](#flags)).

```sh
$ lerna run --scope my-component test
```

> Note: It is advised to constrain the scope of this command (and `lerna exec`,
> below) when using the `--parallel` flag, as spawning dozens of subprocesses
> may be harmful to your shell's equanimity (or maximum file descriptor limit,
> for example). YMMV

### exec

```sh
$ lerna exec -- <command> [..args] # runs the command in all packages
$ lerna exec -- rm -rf ./node_modules
$ lerna exec -- protractor conf.js
```

Run an arbitrary command in each package.
A double-dash (`--`) is necessary to pass dashed flags to the spawned command, but is not necessary when all the arguments are positional.

`lerna exec` respects the `--concurrency`, `--scope`, `--ignore`, `--stream`  `--prefix` and `--parallel` flags (see [Flags](#flags)).

```sh
$ lerna exec --scope my-component -- ls -la
```

To spawn long-running processes, pass the `--parallel` flag:
```sh
# transpile all modules as they change in every package
$ lerna exec --parallel -- babel src -d lib -w
```

You may also get the name of the current package through the environment variable `LERNA_PACKAGE_NAME`:

```sh
$ lerna exec -- npm view \$LERNA_PACKAGE_NAME
```

You may also run a script located in the root dir, in a complicated dir structure through the environment variable `LERNA_ROOT_PATH`:

```sh
$ lerna exec -- node \$LERNA_ROOT_PATH/scripts/some-script.js
```

> Hint: The commands are spawned in parallel, using the concurrency given (except with `--parallel`).
> The output is piped through, so not deterministic.
> If you want to run the command in one package after another, use it like this:

```sh
$ lerna exec --concurrency 1 -- ls -la
```

#### --bail

```sh
$ lerna exec --bail=<boolean> <command>
```

This flag signifies whether or not the `exec` command should halt execution upon encountering an error thrown by one of the spawned subprocesses. Its default value is `true`.

### import

```sh
$ lerna import <path-to-external-repository>
```

Import the package at `<path-to-external-repository>`, with commit history,
into `packages/<directory-name>`.  Original commit authors, dates and messages
are preserved.  Commits are applied to the current branch.

This is useful for gathering pre-existing standalone packages into a Lerna
repo.  Each commit is modified to make changes relative to the package
directory.  So, for example, the commit that added `package.json` will
instead add `packages/<directory-name>/package.json`.

### link

```sh
$ lerna link
```

Symlink together all Lerna `packages` that are dependencies of each other in the current Lerna repo.

#### --force-local

```sh
$ lerna link --force-local
```

When passed, this flag causes the `link` command to always symlink local dependencies regardless of matching version range.

## Misc

Lerna will log to a `lerna-debug.log` file (same as `npm-debug.log`) when it encounters an error running a command.

Lerna also has support for [scoped packages](https://docs.npmjs.com/misc/scope).

Running `lerna` without arguments will show all commands/options.

### lerna.json

```js
{
  "lerna": "2.0.0",
  "version": "1.1.3",
  "commands": {
    "publish": {
      "ignore": [
        "ignored-file",
        "*.md"
      ]
    },
    "bootstrap": {
      "ignore": "component-*"
    }
  },
  "packages": ["packages/*"]
}
```

- `lerna`: the current version of Lerna being used.
- `version`: the current version of the repository.
- `commands.publish.ignore`: an array of globs that won't be included in `lerna updated/publish`. Use this to prevent publishing a new version unnecessarily for changes, such as fixing a `README.md` typo.
- `commands.bootstrap.ignore`: an array of globs that won't be bootstrapped when running the `lerna bootstrap` command.
- `commands.bootstrap.scope`: an array of globs that restricts which packages will be bootstrapped when running the `lerna bootstrap` command.
- `packages`: Array of globs to use as package locations.

### Common `devDependencies`

Most `devDependencies` can be pulled up to the root of a Lerna repo.

This has a few benefits:

- All packages use the same version of a given dependency
- Can keep dependencies at the root up-to-date with an automated tool such as [GreenKeeper](https://greenkeeper.io/)
- Dependency installation time is reduced
- Less storage is needed

Note that `devDependencies` providing "binary" executables that are used by
npm scripts still need to be installed directly in each package where they're
used.

For example the `nsp` dependency is necessary in this case for `lerna run nsp`
(and `npm run nsp` within the package's directory) to work correctly:

```json

{
  "scripts": {
    "nsp": "nsp"
  },
  "devDependencies": {
    "nsp": "^2.3.3"
  }
}
```

### Flags

Options to Lerna can come from configuration (`lerna.json`) or on the command
line.  Additionally options in config can live at the top level or may be
applied to specific commands.

Example:

```json
{
  "lerna": "x.x.x",
  "version": "1.2.0",
  "exampleOption": "foo",
  "commands": {
    "init": {
      "exampleOption": "bar",
    }
  },
}
```

In this case `exampleOption` will be "foo" for all commands except `init`,
where it will be "bar".  In all cases it may be overridden to "baz" on the
command-line with `--example-option=baz`.

#### --concurrency

How many threads to use when Lerna parallelizes the tasks (defaults to `4`)

```sh
$ lerna publish --concurrency 1
```

#### --scope [glob]

Scopes a command to a subset of packages.

```sh
$ lerna exec --scope my-component -- ls -la
```

```sh
$ lerna run --scope toolbar-* test
```

#### --since [ref]

When executing a script or command, scope the operation to packages that have been updated since the specified `ref`. If `ref` is not specified, it defaults to the latest tag.

List the contents of packages that have changed since the latest tag:

```sh
$ lerna exec --since -- ls -la
```

Run the tests for all packages that have changed since `master`:

```
$ lerna run test --since master
```

List all packages that have changed since `some-branch`:

```
$ lerna ls --since some-branch
```

*This can be particularly useful when used in CI, if you can obtain the target branch a PR will be going into, because you can use that as the `ref` to the `--since` option. This works well for PRs going into master as well as feature branches.*

#### --flatten

When importing repositories with merge commits with conflicts, the import command will fail trying to apply all commits. The user can use this flag to ask for import of "flat" history, i.e. with each merge commit as a single change the merge introduced.

```
$ lerna import ~/Product --flatten
```

#### --ignore [glob]

Excludes a subset of packages when running a command.

```sh
$ lerna bootstrap --ignore component-*
```

The `ignore` flag, when used with the `bootstrap` command, can also be set in `lerna.json` under the `commands.bootstrap` key. The command-line flag will take precedence over this option.

**Example**

```javascript
{
  "lerna": "2.0.0",
  "version": "0.0.0",
  "commands": {
    "bootstrap": {
      "ignore": "component-*"
    }
  }
}
```

> Hint: The glob is matched against the package name defined in `package.json`,
> not the directory name the package lives in.

#### --ignore-scripts

When used with the `bootstrap` command it won't run any lifecycle scripts in bootstrapped packages.

```sh
$ lerna bootstrap --ignore-scripts
```

#### --include-filtered-dependencies

Used in combination with any command that accepts `--scope` (`bootstrap`, `clean`, `ls`, `run`, `exec`). Ensures that all dependencies (and dev dependencies) of any scoped packages (either through `--scope` or `--ignore`) are operated on as well.

> Note: This will override the `--scope` and `--ignore` flags.
> > i.e. A package matched by the `--ignore` flag will still be bootstrapped if it is depended on by another package that is being bootstrapped.

This is useful for situations where you want to "set up" a single package that relies on other packages being set up.

```sh
$ lerna bootstrap --scope my-component --include-filtered-dependencies
# my-component and all of its dependencies will be bootstrapped
```

```sh
$ lerna bootstrap --scope "package-*" --ignore "package-util-*" --include-filtered-dependencies
# all package-util's will be ignored unless they are depended upon by a
# package matched by "package-*"
```

#### --loglevel [silent|error|warn|success|info|verbose|silly]

What level of logs to report.  On failure, all logs are written to lerna-debug.log in the current working directory.

Any logs of a higher level than the setting are shown.  The default is "info".

#### --max-buffer [in-bytes]

Set a max buffer length for each underlying process call. Useful for example
when someone wants to import a repo with a larger amount of commits while
running `lerna import`. In that case the built-in buffer length might not
be sufficient.

#### --no-sort

By default, all tasks execute on packages in topologically sorted order as to respect the dependency relationships of the packages in question. Cycles are broken on a best-effort basis in a way not guaranteed to be consistent across Lerna invocations.

Topological sorting can cause concurrency bottlenecks if there are a small number of packages with many dependents or if some packages take a disproportionately long time to execute. The `--no-sort` option disables sorting, instead executing tasks in an arbitrary order with maximum concurrency.

This option can also help if you run multiple "watch" commands. Since `lerna run` will execute commands in topologically sorted order, it can end up waiting for a command before moving on. This will block execution when you run "watch" commands, since they typically never end. An example of a "watch" command is [running `babel` with the `--watch` CLI flag](https://babeljs.io/docs/usage/cli/#babel-compile-files).

#### --hoist [glob]

Install external dependencies matching `glob` at the repo root so they're
available to all packages.  Any binaries from these dependencies will be
linked into dependent package `node_modules/.bin/` directories so they're
available for npm scripts.  If the option is present but no `glob` is given
the default is `**` (hoist everything).  This option only affects the
`bootstrap` command.

```sh
$ lerna bootstrap --hoist
```

For background on `--hoist`, see the [hoist documentation](doc/hoist.md).

Note: If packages depend on different _versions_ of an external dependency,
the most commonly used version will be hoisted, and a warning will be emitted.

#### --nohoist [glob]

Do _not_ install external dependencies matching `glob` at the repo root.  This
can be used to opt out of hoisting for certain dependencies.

```sh
$ lerna bootstrap --hoist --nohoist=babel-*
```

#### --npm-client [client]

Install external dependencies using `[client] install`.  Must be an executable
that knows how to install npm dependencies.

```sh
$ lerna bootstrap --npm-client=yarn
```

May also be configured in `lerna.json`:

```js
{
  ...
  "npmClient": "yarn"
}
```

#### --reject-cycles

Fail immediately if a cycle is found (in `bootstrap`, `exec`, `publish` or `run`).

```sh
$ lerna bootstrap --reject-cycles
```

#### --use-workspaces

Enables integration with [Yarn Workspaces](https://github.com/yarnpkg/rfcs/blob/master/implemented/0000-workspaces-install-phase-1.md) (available since yarn@0.27+).
The values in the array are the commands in which Lerna will delegate operation to Yarn (currently only bootstrapping).
If `--use-workspaces` is true then `packages` will be overridden by the value from `package.json/workspaces.`
May also be configured in `lerna.json`:

```js
{
  ...
  "npmClient": "yarn",
  "useWorkspaces": true
}
```

The root-level package.json must also include a `workspaces` array:
```json
{
  "private": true,
  "devDependencies": {
    "lerna": "^2.2.0"
  },
  "workspaces": [
    "packages/*"
  ]
}
```
This list is broadly similar to lerna's `packages` config (a list of globs matching directories with a package.json),
except it does not support recursive globs (`"**"`, a.k.a. "globstars").

#### --use-git-version

Allow target versions of dependent packages to be written as [git hosted urls](https://github.com/npm/hosted-git-info) instead of a plain version number.
If enabled, Lerna will attempt to extract and save the interpackage dependency versions from `package.json` files using git url-aware parser.

Eg. assuming monorepo with 2 packages where `my-package-1` depends on `my-package-2`, `package.json` of `my-package-1` could be:
```
// packages/my-package-1/package.json
{
  name: "my-package-1",
  version: "1.0.0",
  bin: "bin.js",
  dependencies: {
    "my-package-2": "github:example-user/my-package-2#v1.0.0"
  },
  devDependencies: {
    "my-dev-dependency": "^1.0.0"
  },
  peerDependencies: {
    "my-peer-dependency": "^1.0.0"
  }
}
```
For the case above Lerna will read the version of `my-package-2` dependency as `1.0.0`.

This allows packages to be distributed via git repos if eg. packages are private and [private npm repo is not an option](https://www.dotconferences.com/2016/05/fabien-potencier-monolithic-repositories-vs-many-repositories).

Please note that using `--use-git-version`
- is limited to urls with [`committish`](https://docs.npmjs.com/files/package.json#git-urls-as-dependencies) part present (ie. `github:example-user/my-package-2` is invalid)
- requires `publish` command to be used with `--exact`

May also be configured in `lerna.json`:
```js
{
  ...
  "useGitVersion": true
}
```

#### --git-version-prefix

Defines version prefix string (defaults to 'v') ignored when extracting version number from a commitish part of git url.
Everything after the prefix will be considered a version.


Eg. given `github:example-user/my-package-2#v1.0.0` and `gitVersionPrefix: 'v'` version will be read as `1.0.0`.

Only used if `--use-git-version` is set to `true`.

May also be configured in `lerna.json`:
```js
{
  ...
  "gitVersionPrefix": "v"
}
```

#### --stream

Stream output from child processes immediately, prefixed with the originating
package name. This allows output from different packages to be interleaved.

```sh
$ lerna run watch --stream
```

#### --prefix

By default, stream output is prefixed with the originating package name. This flag can be turned off
so that the output can be parsed by a tool such as Visual Studio Code can highlight the result by type
for all packages in the same project.

```sh
$ lerna run build --stream --no-prefix
```

#### --parallel

Similar to `--stream`, but completely disregards concurrency and topological sorting, running a given command or script immediately in all matching packages with prefixed streaming output. This is the preferred flag for long-running processes such as `babel src -d lib -w` run over many packages.

```sh
$ lerna exec --parallel -- babel src -d lib -w
```

#### --registry [registry]

When run with this flag, forwarded npm commands will use the specified registry for your package(s).

This is useful if you do not want to explicitly set up your registry
configuration in all of your package.json files individually when e.g. using
private registries.

#### --temp-tag

When passed, this flag will alter the default publish process by first publishing
all changed packages to a temporary dist-tag (`lerna-temp`) and then moving the
new version(s) to the default [dist-tag](https://docs.npmjs.com/cli/dist-tag) (`latest`).

This is not generally necessary, as Lerna will publish packages in topological
order (all dependencies before dependents) by default.

### README Badge
Using Lerna? Add a README badge to show it off: [![lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg)](https://lernajs.io/)
```
[![lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg)](https://lernajs.io/)
```

### Wizard

If you prefer some guidance for cli (in case you're about to start using lerna or introducing it to a new team), you might like [lerna-wizard](https://github.com/szarouski/lerna-wizard). It will lead you through a series of well-defined steps:

![lerna-wizard demo image](https://raw.githubusercontent.com/szarouski/lerna-wizard/2e269fb5a3af7100397a1f874cea3fa78089486e/demo.png)
