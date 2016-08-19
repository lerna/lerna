<p align="center">
  <img alt="Lerna" src="https://cloud.githubusercontent.com/assets/952783/15271604/6da94f96-1a06-11e6-8b04-dc3171f79a90.png" width="480">
</p>

<p align="center">
  A tool for managing JavaScript projects with multiple packages.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/lerna"><img alt="NPM Status" src="https://img.shields.io/npm/v/lerna.svg?style=flat"></a>
  <a href="https://travis-ci.org/lerna/lerna"><img alt="Travis Status" src="https://img.shields.io/travis/lerna/lerna/master.svg?style=flat&label=travis"></a>
  <a href="https://ci.appveyor.com/project/hzoo/lerna"><img alt="Appveyor Status" src="https://img.shields.io/appveyor/ci/hzoo/lerna.svg"></a>
  <a href="https://slack.lernajs.io/"><img alt="Slack Status" src="https://slack.lernajs.io/badge.svg"></a>
</p>

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
# install the latest 2.x version using the `prerelease` dist-tag
$ npm install --global lerna@prerelease
# install version directly
$ npm install --global lerna@^2.0.0-beta
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

## How it works

Lerna allows you to manage your project using one of two modes: Fixed or Independent.

### Fixed/Locked mode (default)

Fixed mode Lerna projects operate on a single version line. The version is kept in the `lerna.json` file at the root of your project under the `version` key. When you run `lerna publish`, if a module has been updated since the last time a release was made, it will be updated to the new version you're releasing. This means that you only publish a new version of a package when you need to.

This is the mode that [Babel](https://github.com/babel/babel) is currently using. Use this if you want to automatically tie all package versions together. One issue with this approach is that a major change in any package will result in all packages having a new major version.

### Independent mode (`--independent`)

Independent mode Lerna projects allows maintainers to increment package versions independently of each other. Each time you publish, you will get a prompt for each package that has changed to specify if it's a patch, minor, major or custom change.

Independent mode allows you to more specifically update versions for each package and makes sense for a group of components. Combining this mode with something like [semantic-release](https://github.com/semantic-release/semantic-release) would make it less painful. (There is work on this already at [atlassian/lerna-semantic-release](https://github.com/atlassian/lerna-semantic-release).

> The `version` key in `lerna.json` is ignored in independent mode.

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
3. Create a `packages` directory if it hasn't been created already.

Example output on a new git repo:

```sh
> lerna init
$ Lerna v2.0.0-beta.18
$ Creating packages directory.
$ Updating package.json.
$ Creating lerna.json.
$ Successfully created Lerna files
```

#### --independent, -i

```sh
$ lerna publish --independent
```

This flag tells Lerna to use independent versioning mode.

### bootstrap

```sh
$ lerna bootstrap
```

Bootstrap - or setup - the packages in the current Lerna repo.
Installs all of their dependencies and links any cross-dependencies.

When run, this command will:

1. Link together all Lerna `packages` that are dependencies of each other.
  2. This doesn't currently use [npm link](https://docs.npmjs.com/cli/link) and instead uses a proxy to the actual package in the monorepo.
2. `npm install` all external dependencies of each package.

Currently, what Lerna does to link internal dependencies is replace the
`node_modules/package-x` with a link to the actual file in the repo.

`lerna bootstrap` respects the `--ignore` flag (see below).

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
  - In this example, `babel-generator` is a dependency, while `source-map` is not.
  - `source-map` is `npm install`ed like normal.
- `babel-core/node_modules/babel-generator` is replaced with two files:
  - A `package.json` with keys `name` and `version`
  - An `index.js` file with the contents `module.exports = require("relative-path-to-babel-generator-in-the-lerna-repo")`
- This links the `babel-generator` package in `node_modules` with the actual `babel-generator` files.

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
  4. Update all dependencies of the updated packages with the new versions.
  5. Create a new git commit and tag for the new version.
  6. Publish updated packages to npm.
2. Once all packages have been published, remove the `lerna-temp` tags and add the tags to `latest`.

> A temporary dist-tag is used at the start to prevent the case where only some of the packages are published; this can cause issues for users installing a package that only has some updated packages.

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

This is useful as a workaround for an [npm
issue](https://github.com/npm/newww/issues/389) which prevents README updates
from appearing on npmjs.com when published via Lerna.  When publishing with
README changes, use `--skip-npm` and do the final `npm publish` by hand for
each package.

This flag can be combined with `--skip-git` to _just_ update versions and
dependencies, without comitting, tagging, pushing or publishing.

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

#### --repo-version

```sh
$ lerna publish --repo-version 1.0.1
# applies version and skips `Select a new version for...` prompt
```

When run with this flag, `publish` will skip the version selection prompt and use the specified version.
Useful for bypassing the user input prompt if you already know which version to publish.

### updated

```sh
$ lerna updated
```

Check which `packages` have changed since the last release (the last git tag).

Lerna determines the last git tag created and runs `git diff --name-only v6.8.1` to get all files changed since that tag. It then returns an array of packages that have an updated file.

### clean

```sh
$ lerna clean
```

Remove the `node_modules` directory from all packages.

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

### run

```sh
$ lerna run [script] # runs npm run my-script in all packages that have it
$ lerna run test
$ lerna run build
```

Run an [npm script](https://docs.npmjs.com/misc/scripts) in each package that contains that script.

`lerna run` respects the `--concurrency` flag (see below).

`lerna run` respects the `--scope` flag (see below).

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

`lerna exec` respects the `--concurrency` flag (see below).

`lerna exec` respects the `--scope` flag (see below).

```sh
$ lerna exec --scope my-component -- ls -la
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
  "lerna": "2.0.0-beta.18",
  "version": "1.1.3",
  "publishConfig": {
    "ignore": [
      "ignored-file",
      "*.md"
    ]
  },
  "linkedFiles": {
    "prefix": "/**\n * @flow\n */"
  }
}
```

- `lerna`: the current version of Lerna being used.
- `version`: the current version of the repository.
- `publishConfig.ignore`: an array of globs that won't be included in `lerna updated/publish`. Use this to prevent publishing a new version unnecessarily for changes, such as fixing a `README.md` typo.
- `linkedFiles.prefix`: a prefix added to linked dependency files.

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

The `ignore` flag, when used with the `bootstrap` command, can also be set in `lerna.json` under the `bootstrapConfig` key. The command-line flag will take precendence over this option.

**Example**

```javascript
{
  "lerna": "2.0.0-beta.16",
  "version": "0.0.0",
  "bootstrapConfig": {
    "ignore": "component-*"
  }
}
```

> Hint: The glob is matched against the package name defined in `package.json`,
> not the directory name the package lives in.

#### --only-explicit-updates

Only will bump versions for packages that have been updated explicitly rather than cross-dependencies.

> This may not make sense for a major version bump since other packages that depend on the updated packages wouldn't be updated.

```sh
$ lerna updated --only-explicit-updates
$ lerna publish --only-explicit-updates
```

Ex: in Babel, `babel-types` is depended upon by all packages in the monorepo (over 100). However, Babel uses `^` for most of it's dependencies so it isn't necessary to bump the versions of all packages if only `babel-types` is updated. This option allows only the packages that have been explicitly updated to make a new version.
