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

> The instructions below are for Lerna 2.x which is currently in beta.
> We recommend using it instead of 1.x for a new Lerna project. Check the [wiki](https://github.com/lerna/lerna/wiki/1.x-Docs) if you need to see the 1.x README.

Let's start by installing Lerna globally with [npm](https://www.npmjs.com/).

```sh
$ npm install --global lerna
```

Next we'll create a new [git](https://git-scm.com/) repository:

```sh
$ git init lerna-repo
$ cd lerna-repo
```

And now let's turn it into a Lerna repo:

```sh
$ lerna init
```

Your repository should now look like this:

```
lerna-repo/
  packages/
  package.json
  lerna.json
```

This will create a `lerna.json` configuration file as well as a `packages` folder.

## How It Works

Lerna allows you to manage your project using one of two modes: Fixed or Independent.

### Fixed/Locked mode (default)

Fixed mode Lerna projects operate on a single version line. The version is kept in the `lerna.json` file at the root of your project under the `version` key. When you run `lerna publish`, if a module has been updated since the last time a release was made, it will be updated to the new version you're releasing. This means that you only publish a new version of a package when you need to.

This is the mode that [Babel](https://github.com/babel/babel) is currently using. Use this if you want to automatically tie all package versions together. One issue with this approach is that a major change in any package will result in all packages having a new major version.

### Independent mode (`--independent`)

Independent mode Lerna projects allows maintainers to increment package versions independently of each other. Each time you publish, you will get a prompt for each package that has changed to specify if it's a patch, minor, major or custom change.

Independent mode allows you to more specifically update versions for each package and makes sense for a group of components. Combining this mode with something like [semantic-release](https://github.com/semantic-release/semantic-release) would make it less painful. (There is work on this already at [atlassian/lerna-semantic-release](https://github.com/atlassian/lerna-semantic-release)).

> The `version` key in `lerna.json` is ignored in independent mode.

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
> lerna init
$ Lerna v2.0.0-beta.31
$ Creating packages directory.
$ Updating package.json.
$ Creating lerna.json.
$ Successfully created Lerna files
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
  "lerna": "2.0.0-rc.0",
  "command": {
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
3. `npm prepublish` all bootstrapped packages.

`lerna bootstrap` respects the `--ignore`, `--scope` and `--include-filtered-dependencies` flags (see [Flags](#flags)).

#### How `bootstrap` works

Let's use `babel` as an example.

- `babel-generator` and `source-map` (among others) are dependencies of `babel-core`.
-  `babel-core`'s [`package.json`](https://github.com/babel/babel/blob/13c961d29d76ccd38b1fc61333a874072e9a8d6a/packages/babel-core/package.json#L28-L47) lists both these packages as keys in `dependencies`, as shown below.

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
  - In this example, `babel-generator` is an internal dependency, while `source-map` is an external dependency.
  - `source-map` is `npm install`ed like normal.
- `packages/babel-core/node_modules/babel-generator` symlinks to `packages/babel-generator`
- This allows nested directory imports

**Note:** Circular dependencies result in circular symlinks which *may* impact your editor/IDE.

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

1. Publish each module in `packages` that has been updated since the last version to npm with the [dist-tag](https://docs.npmjs.com/cli/dist-tag) `lerna-temp`.
  1. Run the equivalent of `lerna updated` to determine which packages need to be published.
  2. If necessary, increment the `version` key in `lerna.json`.
  3. Update the `package.json` of all updated packages to their new versions.
  4. Update all dependencies of the updated packages with the new versions, specified with a [caret (^)](https://docs.npmjs.com/files/package.json#dependencies).
  5. Create a new git commit and tag for the new version.
  6. Publish updated packages to npm.
2. Once all packages have been published, remove the `lerna-temp` tags and add the tags to `latest`.

> A temporary dist-tag is used at the start to prevent the case where only some of the packages are published; this can cause issues for users installing a package that only has some updated packages.

> Lerna won't publish packages which are marked as private (`"private": true` in the `package.json`).

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
```

When run with this flag, `publish` publishes packages in a more granular way (per commit). Before publishing to npm, it creates the new `version` tag by taking the current `version` and appending the current git sha (ex: `1.0.0-alpha.81e3b443`).

> The intended use case for this flag is a per commit level release or nightly release.

#### --conventional-commits

```sh
$ lerna publish --conventional-commits
```

When run with this flag, `publish` will use the [Conventional Commits Specification](https://conventionalcommits.org/) to [determine the version bump](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-recommended-bump) and [generate CHANGELOG](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-cli)

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
$ lerna publish --cd-version (patch | major | minor)
# uses the next semantic version(s) value and this skips `Select a new version for...` prompt
```

When run with this flag, `publish` will skip the version selection prompt (in independent mode) and use the next specified semantic version.
You must still use the `--yes` flag to avoid all prompts. This is useful when build systems need
to publish without command prompts. Works in both normal and independent modes.

#### --repo-version

```sh
$ lerna publish --repo-version 1.0.1
# applies version and skips `Select a new version for...` prompt
```

When run with this flag, `publish` will skip the version selection prompt and use the specified version.
Useful for bypassing the user input prompt if you already know which version to publish.

#### --message, -m [msg]

```sh
$ lerna publish -m "chore: Publish"
```

When run with this flag, `publish` will use the provided message when committing the version updates
for publication. Useful for integrating lerna into projects that expect commit messages to adhere
to certain guidelines, such as projects which use [commitizen](https://github.com/commitizen/cz-cli) and/or [semantic-release](https://github.com/semantic-release/semantic-release).

### updated

```sh
$ lerna updated
```

Check which `packages` have changed since the last release (the last git tag).

Lerna determines the last git tag created and runs `git diff --name-only v6.8.1` to get all files changed since that tag. It then returns an array of packages that have an updated file.


**Note that configuration for the `publish` command _also_ affects the
`updated` command.  For example `config.publish.ignore`**

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

### run

```sh
$ lerna run [script] # runs npm run my-script in all packages that have it
$ lerna run test
$ lerna run build
```

Run an [npm script](https://docs.npmjs.com/misc/scripts) in each package that contains that script.

`lerna run` respects the `--concurrency`, `--scope` and `ignore` flags (see [Flags](#flags)).

```sh
$ lerna run --scope my-component test
```

### exec

```sh
$ lerna exec -- [command] # runs the command in all packages
$ lerna exec -- rm -rf ./node_modules
$ lerna exec -- protractor conf.js
```

Run an arbitrary command in each package.

`lerna exec` respects the `--concurrency`, `--scope` and `--ignore` flags (see [Flags](#flags)).

```sh
$ lerna exec --scope my-component -- ls -la
```

You may also get the name of the current package through the environment variable `LERNA_PACKAGE_NAME`:

```sh
$ lerna exec -- npm view \$LERNA_PACKAGE_NAME
```

> Hint: The commands are spawned in parallel, using the concurrency given.
> The output is piped through, so not deterministic.
> If you want to run the command in one package after another, use it like this:

```sh
$ lerna exec --concurrency 1 -- ls -la
```

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

## Misc

Lerna will log to a `lerna-debug.log` file (same as `npm-debug.log`) when it encounters an error running a command.

Lerna also has support for [scoped packages](https://docs.npmjs.com/misc/scope).

Running `lerna` without arguments will show all commands/options.

### lerna.json

```js
{
  "lerna": "2.0.0-beta.31",
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
  "command": {
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

#### --ignore [glob]

Excludes a subset of packages when running a command.

```sh
$ lerna bootstrap --ignore component-*
```

The `ignore` flag, when used with the `bootstrap` command, can also be set in `lerna.json` under the `commands.bootstrap` key. The command-line flag will take precendence over this option.

**Example**

```javascript
{
  "lerna": "2.0.0-beta.31",
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

#### --stream

Stream output from child processes immediately, prefixed with the originating
package name.  This can be useful for long-running processes such as "watch"
builds.  This allows output from different packages to be interleaved.

```sh
$ lerna run watch --stream
```

#### --registry [registry]

When run with this flag, forwarded npm commands will use the specified registry for your package(s).

This is useful if you do not want to explicitly set up your registry
configuration in all of your package.json files individually when e.g. using
private registries.

#### --skip-temp-tag

When activated, this flag will alter the default publish process by not creating
a temporary tag and handling the process accordingly. Instead it will immediately
publish with the proper dist-tag as [npm it self would](https://docs.npmjs.com/cli/dist-tag).

### Wizard

If you prefer some guidance for cli (in case you're about to start using lerna or introducing it to a new team), you might like [lerna-wizard](https://github.com/szarouski/lerna-wizard). It will lead you through a series of well-defined steps:

![lerna-wizard demo image](https://raw.githubusercontent.com/szarouski/lerna-wizard/2e269fb5a3af7100397a1f874cea3fa78089486e/demo.png)
