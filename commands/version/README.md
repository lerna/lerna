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
3. Modifies package metadata to reflect new release, running appropriate [lifecycle scripts](#lifecycle-scripts) in root and per-package.
4. Commits those changes and tags the commit.
5. Pushes to the git remote.

## Positionals

### semver `bump`

```sh
lerna version [major | minor | patch | premajor | preminor | prepatch | prerelease]
# uses the next semantic version(s) value and this skips `Select a new version for...` prompt
```

When this positional parameter is passed, `lerna version` will skip the version selection prompt and [increment](https://github.com/npm/node-semver#functions) the version by that keyword.
You must still use the `--yes` flag to avoid all prompts.

## Prerelease

If you have any packages with a prerelease version number (e.g. `2.0.0-beta.3`) and you run `lerna version` with and a non-prerelease bump (`major`, `minor`, or `patch`), it will publish those previously pre-released packages _as well as_ the packages that have changed since the last release.

For projects using conventional commits, use the following flags for prerelease management:

- **[`--conventional-prerelease`](#--conventional-prerelease):** release current changes as prerelease versions.
- **[`--conventional-graduate`](#--conventional-graduate):** graduate prerelease versioned packages to stable versions.

Running `lerna version --conventional-commits` without the above flags will release current changes as prerelease only if the version is already in prerelease.

## Options

- [`@lerna/version`](#lernaversion)
  - [Usage](#usage)
  - [Positionals](#positionals)
    - [semver `bump`](#semver-bump)
  - [Prerelease](#prerelease)
  - [Options](#options)
    - [`--allow-branch <glob>`](#--allow-branch-glob)
    - [`--amend`](#--amend)
    - [`--changelog-preset`](#--changelog-preset)
    - [`--conventional-commits`](#--conventional-commits)
    - [`--conventional-graduate`](#--conventional-graduate)
    - [`--conventional-prerelease`](#--conventional-prerelease)
    - [`--create-release <type>`](#--create-release-type)
    - [`--exact`](#--exact)
    - [`--force-publish`](#--force-publish)
    - [`--git-remote <name>`](#--git-remote-name)
    - [`--ignore-changes`](#--ignore-changes)
    - [`--ignore-scripts`](#--ignore-scripts)
    - [`--include-merged-tags`](#--include-merged-tags)
    - [`--message <msg>`](#--message-msg)
    - [`--no-changelog`](#--no-changelog)
    - [`--no-commit-hooks`](#--no-commit-hooks)
    - [`--no-git-tag-version`](#--no-git-tag-version)
    - [`--no-granular-pathspec`](#--no-granular-pathspec)
    - [`--no-private`](#--no-private)
    - [`--no-push`](#--no-push)
    - [`--preid`](#--preid)
    - [`--sign-git-commit`](#--sign-git-commit)
    - [`--sign-git-tag`](#--sign-git-tag)
    - [`--force-git-tag`](#--force-git-tag)
    - [`--tag-version-prefix`](#--tag-version-prefix)
    - [`--yes`](#--yes)
  - [Deprecated Options](#deprecated-options)
    - [`--cd-version`](#--cd-version)
    - [`--repo-version`](#--repo-version)
    - [`--skip-git`](#--skip-git)
  - [Tips](#tips)
    - [Generating Initial Changelogs](#generating-initial-changelogs)
  - [Lifecycle Scripts](#lifecycle-scripts)

### `--allow-branch <glob>`

A whitelist of globs that match git branches where `lerna version` is enabled.
It is easiest (and recommended) to configure in `lerna.json`, but it is possible to pass as a CLI option as well.

```json
{
  "command": {
    "version": {
      "allowBranch": "main"
    }
  }
}
```

With the configuration above, the `lerna version` will fail when run from any branch other than `main`.
It is considered a best-practice to limit `lerna version` to the primary branch alone.

```json
{
  "command": {
    "version": {
      "allowBranch": ["main", "feature/*"]
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

### `--changelog-preset`

```sh
lerna version --conventional-commits --changelog-preset angular-bitbucket
```

By default, the changelog preset is set to [`angular`](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-angular#angular-convention).
In some cases you might want to change either use a another preset or a custom one.

Presets are names of built-in or installable configuration for conventional changelog.
Presets may be passed as the full name of the package, or the auto-expanded suffix
(e.g., `angular` is expanded to `conventional-changelog-angular`).

This option is can also be specified in `lerna.json` configuration:

```json
{
  "changelogPreset": "angular"
}
```

If the preset exports a builder function (e.g. `conventional-changelog-conventionalcommits`), you can specify the [preset configuration](https://github.com/conventional-changelog/conventional-changelog-config-spec) too:

```json
{
  "changelogPreset": {
    "name": "conventionalcommits",
    "issueUrlFormat": "{{host}}/{{owner}}/{{repository}}/issues/{{id}}"
  }
}
```

### `--conventional-commits`

```sh
lerna version --conventional-commits
```

When run with this flag, `lerna version` will use the [Conventional Commits Specification](https://conventionalcommits.org/) to [determine the version bump](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-recommended-bump) and [generate CHANGELOG.md files](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-cli).

Passing [`--no-changelog`](#--no-changelog) will disable the generation (or updating) of `CHANGELOG.md` files.

### `--conventional-graduate`

```sh
lerna version --conventional-commits --conventional-graduate=package-2,package-4

# force all prerelease packages to be graduated
lerna version --conventional-commits --conventional-graduate
```

When run with this flag, `lerna version` will graduate the specified packages (comma-separated) or all packages using `*`. This command works regardless of whether the current HEAD has been released, similar to `--force-publish`, except that any non-prerelease packages are ignored. If changes are present for packages that are not specified (if specifying packages), or for packages that are not in prerelease, those packages will be versioned as they normally would using `--conventional-commits`.

"Graduating" a package means bumping to the non-prerelease variant of a prerelease version, eg. `package-1@1.0.0-alpha.0 => package-1@1.0.0`.

> NOTE: when specifying packages, dependents of specified packages will be released, but will not be graduated.

### `--conventional-prerelease`

```sh
lerna version --conventional-commits --conventional-prerelease=package-2,package-4

# force all changed packages to be prereleased
lerna version --conventional-commits --conventional-prerelease
```

When run with this flag, `lerna version` will release with prerelease versions the specified packages (comma-separated) or all packages using `*`. Releases all unreleased changes as pre(patch/minor/major/release) by prefixing the version recommendation from `conventional-commits` with `pre`, eg. if present changes include a feature commit, the recommended bump will be `minor`, so this flag will result in a `preminor` release. If changes are present for packages that are not specified (if specifying packages), or for packages that are already in prerelease, those packages will be versioned as they normally would using `--conventional-commits`.

### `--create-release <type>`

```sh
lerna version --conventional-commits --create-release github
lerna version --conventional-commits --create-release gitlab
```

When run with this flag, `lerna version` will create an official GitHub or GitLab release based on the changed packages. Requires `--conventional-commits` to be passed so that changelogs can be generated.

To authenticate with GitHub, the following environment variables can be defined.

- `GH_TOKEN` (required) - Your GitHub authentication token (under Settings > Developer settings > Personal access tokens).
- `GHE_API_URL` - When using GitHub Enterprise, an absolute URL to the API.
- `GHE_VERSION` - When using GitHub Enterprise, the currently installed GHE version. [Supports the following versions](https://github.com/octokit/plugin-enterprise-rest.js).

To authenticate with GitLab, the following environment variables can be defined.

- `GL_TOKEN` (required) - Your GitLab authentication token (under User Settings > Access Tokens).
- `GL_API_URL` - An absolute URL to the API, including the version. (Default: https://gitlab.com/api/v4)

> NOTE: When using this option, you cannot pass [`--no-changelog`](#--no-changelog).

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

### `--git-remote <name>`

```sh
lerna version --git-remote upstream
```

When run with this flag, `lerna version` will push the git changes to the specified remote instead of `origin`.

### `--ignore-changes`

Ignore changes in files matched by glob(s) when detecting changed packages.

```sh
lerna version --ignore-changes '**/*.md' '**/__tests__/**'
```

This option is best specified as root `lerna.json` configuration, both to avoid premature shell evaluation of the globs and to share the config with `lerna diff` and `lerna changed`:

```json
{
  "ignoreChanges": ["**/__fixtures__/**", "**/__tests__/**", "**/*.md"]
}
```

Pass `--no-ignore-changes` to disable any existing durable configuration.

> In the following cases, a package will always be published, regardless of this option:
>
> 1. The latest release of the package is a `prerelease` version (i.e. `1.0.0-alpha`, `1.0.0–0.3.7`, etc.).
> 2. One or more linked dependencies of the package have changed.

### `--ignore-scripts`

When passed, this flag will disable running [lifecycle scripts](#lifecycle-scripts) during `lerna version`.

### `--include-merged-tags`

```sh
lerna version --include-merged-tags
```

Include tags from merged branches when detecting changed packages.

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
Note that this placeholder interpolation only applies when using the default "fixed" versioning mode, as there is no "global" version to interpolate when versioning independently.

This can be configured in lerna.json, as well:

```json
{
  "command": {
    "version": {
      "message": "chore(release): publish %s"
    }
  }
}
```

### `--no-changelog`

```sh
lerna version --conventional-commits --no-changelog
```

When using `conventional-commits`, do not generate any `CHANGELOG.md` files.

> NOTE: When using this option, you cannot pass [`--create-release`](#--create-release-type).

### `--no-commit-hooks`

By default, `lerna version` will allow git commit hooks to run when committing version changes.
Pass `--no-commit-hooks` to disable this behavior.

This option is analogous to the `npm version` option [`--commit-hooks`](https://docs.npmjs.com/misc/config#commit-hooks), just inverted.

### `--no-git-tag-version`

By default, `lerna version` will commit changes to package.json files and tag the release.
Pass `--no-git-tag-version` to disable the behavior.

This option is analogous to the `npm version` option [`--git-tag-version`](https://docs.npmjs.com/misc/config#git-tag-version), just inverted.

### `--no-granular-pathspec`

By default, `lerna version` will `git add` _only_ the leaf package manifests (and possibly changelogs) that have changed during the versioning process. This yields the equivalent of `git add -- packages/*/package.json`, but tailored to _exactly_ what changed.

If you **know** you need different behavior, you'll understand: Pass `--no-granular-pathspec` to make the git command _literally_ `git add -- .`. By opting into this [pathspec](https://git-scm.com/docs/gitglossary#Documentation/gitglossary.txt-aiddefpathspecapathspec), you **MUST HAVE _ALL_ SECRETS AND BUILD OUTPUT PROPERLY IGNORED, _OR IT WILL BE COMMITTED AND PUSHED_**.

This option makes the most sense configured in lerna.json, as you really don't want to mess it up:

```json
{
  "version": "independent",
  "granularPathspec": false
}
```

The root-level configuration is intentional, as this also covers the [identically-named option in `lerna publish`](https://github.com/lerna/lerna/tree/main/commands/publish#--no-granular-pathspec).

### `--no-private`

By default, `lerna version` will include private packages when choosing versions, making commits, and tagging releases.
Pass `--no-private` to disable this behavior.

Note that this option does _not_ exclude [private scoped packages](https://docs.npmjs.com/about-private-packages), only those with a [`"private": true` field](https://docs.npmjs.com/configuring-npm/package-json.html#private) in their package.json file.

### `--no-push`

By default, `lerna version` will push the committed and tagged changes to the configured [git remote](#--git-remote-name).
Pass `--no-push` to disable this behavior.

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

### `--sign-git-commit`

This option is analogous to the `npm version` [option](https://docs.npmjs.com/misc/config#sign-git-commit) of the same name.

### `--sign-git-tag`

This option is analogous to the `npm version` [option](https://docs.npmjs.com/misc/config#sign-git-tag) of the same name.

### `--force-git-tag`

This option replaces any existing tag instead of failing.

### `--tag-version-prefix`

This option allows to provide custom prefix instead of the default one: `v`.

Keep in mind that currently you have to supply it twice: for `version` command and for `publish` command:

```bash
# locally
lerna version --tag-version-prefix=''
# on ci
lerna publish from-git --tag-version-prefix=''
```

### `--yes`

```sh
lerna version --yes
# skips `Are you sure you want to publish these packages?`
```

When run with this flag, `lerna version` will skip all confirmation prompts.
Useful in [Continuous integration (CI)](https://en.wikipedia.org/wiki/Continuous_integration) to automatically answer the publish confirmation prompt.

## Deprecated Options

### `--cd-version`

Pass the semver keyword to the [`bump`](#semver-bump) positional instead.

### `--repo-version`

Pass an explicit version number to the [`bump`](#semver-bump) positional instead.

### `--skip-git`

Use [`--no-git-tag-version`](#--no-git-tag-version) and [`--no-push`](#--no-push) instead.

> NOTE: This option **does not** restrict _all_ git commands from being executed. `git` is still required by `lerna version`.

## Tips

### Generating Initial Changelogs

If you start using the [`--conventional-commits`](#--conventional-commits) option _after_ the monorepo has been active for awhile, you can still generate changelogs for previous releases using [`conventional-changelog-cli`](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-cli#readme) and [`lerna exec`](https://github.com/lerna/lerna/tree/main/commands/exec#readme):

```bash
# Lerna does not actually use conventional-changelog-cli, so you need to install it temporarily
npm i -D conventional-changelog-cli
# Documentation: `npx conventional-changelog --help`

# fixed versioning (default)
# run in root, then leaves
npx conventional-changelog --preset angular --release-count 0 --outfile ./CHANGELOG.md --verbose
npx lerna exec --concurrency 1 --stream -- 'conventional-changelog --preset angular --release-count 0 --commit-path $PWD --pkg $PWD/package.json --outfile $PWD/CHANGELOG.md --verbose'

# independent versioning
# (no root changelog)
npx lerna exec --concurrency 1 --stream -- 'conventional-changelog --preset angular --release-count 0 --commit-path $PWD --pkg $PWD/package.json --outfile $PWD/CHANGELOG.md --verbose --lerna-package $LERNA_PACKAGE_NAME'
```

If you use a custom [`--changelog-preset`](#--changelog-preset), you should change `--preset` value accordingly in the example above.

## Lifecycle Scripts

```js
// preversion:  Run BEFORE bumping the package version.
// version:     Run AFTER bumping the package version, but BEFORE commit.
// postversion: Run AFTER bumping the package version, and AFTER commit.
```

Lerna will run [npm lifecycle scripts](https://docs.npmjs.com/misc/scripts#description) during `lerna version` in the following order:

1. Detect changed packages, choose version bump(s)
2. Run `preversion` lifecycle in root
3. For each changed package, in topological order (all dependencies before dependents):
   1. Run `preversion` lifecycle
   2. Update version in package.json
   3. Run `version` lifecycle
4. Run `version` lifecycle in root
5. Add changed files to index, if [enabled](#--no-git-tag-version)
6. Create commit and tag(s), if [enabled](#--no-git-tag-version)
7. For each changed package, in _lexical_ order (alphabetical according to directory structure):
   1. Run `postversion` lifecycle
8. Run `postversion` lifecycle in root
9. Push commit and tag(s) to remote, if [enabled](#--no-push)
10. Create release, if [enabled](#--create-release-type)
