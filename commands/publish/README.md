# `@lerna/publish`

> Publish packages in the current project

## Usage

```sh
lerna publish          # publish packages that have changed since the last release
lerna publish from-git # explicitly publish packages tagged in current commit
```

Publish packages in the current Lerna project. When run, this command does the following:

Creates a new release of the packages that have been updated.
Prompts for a new version.
Creates a new git commit/tag in the process of publishing to npm.

More specifically, this command will:

1. Run the equivalent of `lerna changed` to determine which packages need to be published.
2. If necessary, increment the `version` key in `lerna.json`.
3. Update the `package.json` of all updated packages to their new versions.
4. Update all dependencies of the updated packages with the new versions, specified with a [caret (^)](https://docs.npmjs.com/files/package.json#dependencies).
5. Create a new git commit and tag for the new version.
6. Make sure the updated packages contain license files before publishing. Use root license file if the packages do not contain their own.
7. Publish updated packages to npm.

> Lerna won't publish packages which are marked as private (`"private": true` in the `package.json`).

**Note:** to publish scoped packages, you need to add the following to each `package.json`:

```json
  "publishConfig": {
    "access": "public"
  }
```

## Options

### `--exact`

```sh
$ lerna publish --exact
```

When run with this flag, `publish` will specify updated dependencies in updated packages exactly (with no punctuation), instead of as semver compatible (with a `^`).

For more information, see the package.json [dependencies](https://docs.npmjs.com/files/package.json#dependencies) documentation.

### `--registry <url>`

When run with this flag, forwarded npm commands will use the specified registry for your package(s).

This is useful if you do not want to explicitly set up your registry
configuration in all of your package.json files individually when e.g. using
private registries.

### `--npm-client <client>`

Must be an executable that knows how to publish packages to an npm registry.
The default `--npm-client` is `npm`.

```sh
$ lerna publish --npm-client=yarn
```

May also be configured in `lerna.json`:

```json
{
  "command": {
    "publish": {
      "npmClient": "yarn"
    }
  }
}
```

### `--npm-tag <dist-tag>`

```sh
$ lerna publish --npm-tag=next
```

When run with this flag, `publish` will publish to npm with the given npm [dist-tag](https://docs.npmjs.com/cli/dist-tag) (defaults to `latest`).

This option can be used to publish a [`prerelease`](http://carrot.is/coding/npm_prerelease) or `beta` version.

> Note: the `latest` tag is the one that is used when a user runs `npm install my-package`.
> To install a different tag, a user can run `npm install my-package@prerelease`.

### `--temp-tag`

When passed, this flag will alter the default publish process by first publishing
all changed packages to a temporary dist-tag (`lerna-temp`) and then moving the
new version(s) to the default [dist-tag](https://docs.npmjs.com/cli/dist-tag) (`latest`).

This is not generally necessary, as Lerna will publish packages in topological
order (all dependencies before dependents) by default.

### `--canary`

```sh
$ lerna publish --canary
$ lerna publish --canary=beta
```

When run with this flag, `publish` publishes packages in a more granular way (per commit). Before publishing to npm, it creates the new `version` tag by taking the current `version`, bumping it to the next _minor_ version, adding the provided meta suffix (defaults to `alpha`) and appending the current git sha (ex: `1.0.0` becomes `1.1.0-alpha.81e3b443`).

> The intended use case for this flag is a per commit level release or nightly release.

### `--conventional-commits`

```sh
$ lerna publish --conventional-commits
```

When run with this flag, `publish` will use the [Conventional Commits Specification](https://conventionalcommits.org/) to [determine the version bump](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-recommended-bump) and [generate CHANGELOG](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-cli)

### `--changelog-preset`

```sh
$ lerna publish --conventional-commits --changelog-preset angular-bitbucket
```

By default, the changelog preset is set to [`angular`](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-angular#angular-convention).
In some cases you might want to change either use a another preset or a custom one.

Presets are names of built-in or installable configuration for conventional changelog.
Presets may be passed as the full name of the package, or the auto-expanded suffix
(e.g., `angular` is expanded to `conventional-changelog-angular`).

### `--git-remote <name>`

```sh
$ lerna publish --git-remote upstream
```

When run with this flag, `publish` will push the git changes to the specified remote instead of `origin`.

### `--skip-git`

```sh
$ lerna publish --skip-git
```

When run with this flag, `publish` will publish to npm without generating a git commit, tag, or pushing changes to a remote.

> NOTE: This option **does not** restrict _all_ git commands from being executed. `git` is still required by `lerna publish`.

### `--skip-npm`

```sh
$ lerna publish --skip-npm
```

When run with this flag, `publish` will update all `package.json` package
versions and dependency versions, but it will not actually publish the
packages to npm.

This flag can be combined with `--skip-git` to _just_ update versions and
dependencies, without committing, tagging, pushing or publishing.

### `--force-publish [package-names-or-globs]`

```sh
$ lerna publish --force-publish=package-2,package-4
# force publish all packages
$ lerna publish --force-publish=*
# same as previous
$ lerna publish --force-publish
```

When run with this flag, `publish` will force publish the specified packages (comma-separated) or all packages using `*`.

> This will skip the `lerna changed` check for changed packages and forces a package that didn't have a `git diff` change to be updated.

### `--yes`

```sh
$ lerna publish --canary --yes
# skips `Are you sure you want to publish the above changes?`
```

When run with this flag, `publish` will skip all confirmation prompts.
Useful in [Continuous integration (CI)](https://en.wikipedia.org/wiki/Continuous_integration) to automatically answer the publish confirmation prompt.

### `--cd-version`

```sh
$ lerna publish --cd-version (major | minor | patch | premajor | preminor | prepatch | prerelease)
# uses the next semantic version(s) value and this skips `Select a new version for...` prompt
```

When run with this flag, `publish` will skip the version selection prompt (in independent mode) and use the next specified semantic version.
You must still use the `--yes` flag to avoid all prompts. This is useful when build systems need to publish without command prompts. Works in both normal and independent modes.

If you have any packages with a prerelease version number (e.g. `2.0.0-beta.3`) and you run `lerna publish` with `--cd-version` and a non-prerelease version increment (major / minor / patch), it will publish those packages in addition to the packages that have changed since the last release.

### `--preid`

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

### `--repo-version`

```sh
$ lerna publish --repo-version 1.0.1
# applies version and skips `Select a new version for...` prompt
```

When run with this flag, `publish` will skip the version selection prompt and use the specified version.
Useful for bypassing the user input prompt if you already know which version to publish.

### `--message <msg>`

This option is aliased to `-m` for parity with `git commit`.

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
  "command": {
    "publish": {
      "message": "chore(release): publish %s"
    }
  }
}
```

### `--amend`

```sh
$ lerna publish --amend
# commit message is retained, and `git push` is skipped.
```

When run with this flag, `publish` will perform all changes on the current commit, instead of adding a new one.
This is useful during [Continuous integration (CI)](https://en.wikipedia.org/wiki/Continuous_integration) to reduce the number of commits in the project's history.

In order to prevent unintended overwrites, this command will skip `git push`.

### `--allow-branch <glob>`

A whitelist of globs that match git branches where `lerna publish` is enabled.
It is easiest (and recommended) to configure in `lerna.json`, but it is possible to pass as a CLI option as well.

```json
{
  "command": {
    "publish": {
      "allowBranch": "master"
    }
  }
}
```

With the configuration above, the `lerna publish` will fail when run from any branch other than `master`.
It is considered a best-practice to limit `lerna publish` to the primary branch alone.

```json
{
  "command": {
    "publish": {
      "allowBranch": ["master", "feature/*"]
    }
  }
}
```

With the preceding configuration, `lerna publish` will be allowed in any branch prefixed with `feature/`.
Please be aware that generating git tags in feature branches is fraught with potential errors as the branches are merged into the primary branch. If the tags are "detached" from their original context (perhaps through a squash merge or a conflicted merge commit), future `lerna publish` executions will have difficulty determining the correct "diff since last release."

It is always possible to override this "durable" config on the command-line.
Please use with caution.

```sh
$ lerna publish --allow-branch hotfix/oops-fix-the-thing
```

