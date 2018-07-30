# `@lerna/version`

> Bump version of packages changed since the last release

## Usage

```sh
lerna version 1.0.1 # explicit
lerna version patch # semver keyword
lerna version       # select from prompt(s)
```

When run, this command does the following:

1. Identifies packages that have been updated since the previous tagged release.
2. Prompts for a new version.
3. Modifies package metadata to reflect new release.
4. Commits those changes and tags the commit.
5. Pushes to the git remote.

## Positionals

### semver `bump`

```sh
lerna version [major | minor | patch | premajor | preminor | prepatch | prerelease]
# uses the next semantic version(s) value and this skips `Select a new version for...` prompt
```

When run with this flag, `lerna version` will skip the version selection prompt and [increment](https://github.com/npm/node-semver#functions) the version by that keyword.
You must still use the `--yes` flag to avoid all prompts.

#### "Graduating" prereleases

If you have any packages with a prerelease version number (e.g. `2.0.0-beta.3`) and you run `lerna version` with and a non-prerelease bump (`major`, `minor`, or `patch`), it will publish those previously pre-released packages _as well as_ the packages that have changed since the last release.

## Options

* [`--allow-branch`](#--allow-branch-glob)
* [`--amend`](#--amend)
* [`--commit-hooks`](#--commit-hooks)
* [`--conventional-commits`](#--conventional-commits)
* [`--changelog-preset`](#--changelog-preset)
* [`--exact`](#--exact)
* [`--force-publish`](#--force-publish)
* [`--ignore-changes`](#--ignore-changes)
* [`--git-remote`](#--git-remote-name)
* [`--git-tag-version`](#--git-tag-version)
* [`--message`](#--message-msg)
* [`--preid`](#--preid)
* [`--push`](#--push)
* [`--sign-git-commit`](#--sign-git-commit)
* [`--sign-git-tag`](#--sign-git-tag)

### `--allow-branch <glob>`

A whitelist of globs that match git branches where `lerna version` is enabled.
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

With the configuration above, the `lerna version` will fail when run from any branch other than `master`.
It is considered a best-practice to limit `lerna version` to the primary branch alone.

```json
{
  "command": {
    "publish": {
      "allowBranch": ["master", "feature/*"]
    }
  }
}
```

With the preceding configuration, `lerna version` will be allowed in any branch prefixed with `feature/`.
Please be aware that generating git tags in feature branches is fraught with potential errors as the branches are merged into the primary branch. If the tags are "detached" from their original context (perhaps through a squash merge or a conflicted merge commit), future `lerna version` executions will have difficulty determining the correct "diff since last release."

It is always possible to override this "durable" config on the command-line.
Please use with caution.

```sh
lerna version --allow-branch hotfix/oops-fix-the-thing
```

### `--amend`

```sh
lerna version --amend
# commit message is retained, and `git push` is skipped.
```

When run with this flag, `lerna version` will perform all changes on the current commit, instead of adding a new one.
This is useful during [Continuous integration (CI)](https://en.wikipedia.org/wiki/Continuous_integration) to reduce the number of commits in the project's history.

In order to prevent unintended overwrites, this command will skip `git push` (i.e., it implies `--no-push`).

### `--commit-hooks`

Run git commit hooks when committing the version changes.

Defaults to `true`. Pass `--no-commit-hooks` to disable.

This option is analogous to the `npm version` [option](https://docs.npmjs.com/misc/config#commit-hooks) of the same name.

### `--conventional-commits`

```sh
lerna version --conventional-commits
```

When run with this flag, `lerna version` will use the [Conventional Commits Specification](https://conventionalcommits.org/) to [determine the version bump](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-recommended-bump) and [generate CHANGELOG](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-cli)

### `--changelog-preset`

```sh
lerna version --conventional-commits --changelog-preset angular-bitbucket
```

By default, the changelog preset is set to [`angular`](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-angular#angular-convention).
In some cases you might want to change either use a another preset or a custom one.

Presets are names of built-in or installable configuration for conventional changelog.
Presets may be passed as the full name of the package, or the auto-expanded suffix
(e.g., `angular` is expanded to `conventional-changelog-angular`).

### `--exact`

```sh
lerna version --exact
```

When run with this flag, `lerna version` will specify updated dependencies in updated packages exactly (with no punctuation), instead of as semver compatible (with a `^`).

For more information, see the package.json [dependencies](https://docs.npmjs.com/files/package.json#dependencies) documentation.

### `--force-publish`

```sh
lerna version --force-publish=package-2,package-4

# force all packages to be versioned
lerna version --force-publish
```

When run with this flag, `lerna version` will force publish the specified packages (comma-separated) or all packages using `*`.

> This will skip the `lerna changed` check for changed packages and forces a package that didn't have a `git diff` change to be updated.

### `--ignore-changes`

Ignore changes in files matched by glob(s) when detecting changed packages.

```sh
lerna version --ignore-changes '**/*.md' '**/__tests__/**'
```

This option is best specified as root `lerna.json` configuration, both to avoid premature shell evaluation of the globs and to share the config with `lerna diff` and `lerna changed`:

```json
{
  "ignoreChanges": [
    "**/__fixtures__/**",
    "**/__tests__/**",
    "**/*.md"
  ]
}
```

Pass `--no-ignore-changes` to disable any existing durable configuration.

### `--git-remote <name>`

```sh
lerna version --git-remote upstream
```

When run with this flag, `lerna version` will push the git changes to the specified remote instead of `origin`.

### `--git-tag-version`

Commit and tag versioned changes.

Defaults to `true`. Pass `--no-git-tag-version` to disable.

This option is analogous to the `npm version` [option](https://docs.npmjs.com/misc/config#git-tag-version) of the same name.

### `--message <msg>`

This option is aliased to `-m` for parity with `git commit`.

```sh
lerna version -m "chore(release): publish %s"
# commit message = "chore(release): publish v1.0.0"

lerna version -m "chore(release): publish %v"
# commit message = "chore(release): publish 1.0.0"

# When versioning packages independently, no placeholders are replaced
lerna version -m "chore(release): publish"
# commit message = "chore(release): publish
#
# - package-1@3.0.1
# - package-2@1.5.4"
```

When run with this flag, `lerna version` will use the provided message when committing the version updates
for publication. Useful for integrating lerna into projects that expect commit messages to adhere
to certain guidelines, such as projects which use [commitizen](https://github.com/commitizen/cz-cli) and/or [semantic-release](https://github.com/semantic-release/semantic-release).

If the message contains `%s`, it will be replaced with the new global version version number prefixed with a "v".
If the message contains `%v`, it will be replaced with the new global version version number without the leading "v".
Note that this only applies when using the default "fixed" versioning mode, as there is no "global" version when versioning independently.

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

### `--preid`

```sh
lerna version prerelease
# uses the next semantic prerelease version, e.g.
# 1.0.0 => 1.0.1-alpha.0

lerna version prepatch --preid next
# uses the next semantic prerelease version with a specific prerelease identifier, e.g.
# 1.0.0 => 1.0.1-next.0
```

When run with this flag, `lerna version` will increment `premajor`, `preminor`, `prepatch`, or `prerelease` semver
bumps using the specified [prerelease identifier](http://semver.org/#spec-item-9).

### `--push`

Push the committed and tagged changes to the configured [git remote](https://github.com/lerna/lerna/tree/master/commands/version#--git-remote)

### `--sign-git-commit`

This option is analogous to the `npm version` [option](https://docs.npmjs.com/misc/config#sign-git-commit) of the same name.

### `--sign-git-tag`

This option is analogous to the `npm version` [option](https://docs.npmjs.com/misc/config#sign-git-tag) of the same name.

## Deprecated Options

### `--cd-version`

Pass the semver keyword to the [`bump`](#bump) positional instead.

### `--repo-version`

Pass an explicit version number to the [`bump`](#bump) positional instead.

### `--skip-git`

Use [`--no-git-tag-version`](https://github.com/lerna/lerna/tree/master/commands/version#--git-tag-version) and [`--no-push`](https://github.com/lerna/lerna/tree/master/commands/version#--push) instead.

> NOTE: This option **does not** restrict _all_ git commands from being executed. `git` is still required by `lerna version`.
