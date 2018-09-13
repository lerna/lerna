# `@lerna/publish`

> Publish packages in the current project

## Usage

```sh
lerna publish          # publish packages that have changed since the last release
lerna publish from-git # explicitly publish packages tagged in current commit
```

When run, this command does one of the following things:

* Publish packages updated since the last release (calling [`lerna version`](https://github.com/lerna/lerna/tree/master/commands/version#readme) behind the scenes).
  * This is the legacy behavior of lerna 2.x
* Publish packages tagged in the current commit (`from-git`).
* Publish an unversioned "canary" release of packages (and their dependents) updated in the previous commit.

> Lerna will never publish packages which are marked as private (`"private": true` in the `package.json`).

**Note:** to publish scoped packages, you need to add the following to each `package.json`:

```json
  "publishConfig": {
    "access": "public"
  }
```

## Positionals

### bump `from-git`

In addition to the semver keywords supported by [`lerna version`](https://github.com/lerna/lerna/tree/master/commands/version#positionals),
`lerna publish` also supports the `from-git` keyword.
This will identify packages tagged by `lerna version` and publish them to npm.
This is useful in CI scenarios where you wish to manually increment versions,
but have the package contents themselves consistently published by an automated process.

## Options

`lerna publish` supports all of the options provided by [`lerna version`](https://github.com/lerna/lerna/tree/master/commands/version#options) in addition to the following:

* [`--canary`](#--canary)
* [`--npm-client <client>`](#--npm-client-client)
* [`--npm-tag <dist-tag>`](#--npm-tag-dist-tag)
* [`--no-verify-access`](#--no-verify-access)
* [`--registry <url>`](#--registry-url)
* [`--temp-tag`](#--temp-tag)
* [`--yes`](#--yes)

### `--canary`

```sh
lerna publish --canary
# 1.0.0 => 1.0.1-alpha.0+${SHA} of packages changed since the previous commit
# a subsequent canary publish will yield 1.0.1-alpha.1+${SHA}, etc

lerna publish --canary --preid beta
# 1.0.0 => 1.0.1-beta.0+${SHA}

# The following are equivalent:
lerna publish --canary minor
lerna publish --canary preminor
# 1.0.0 => 1.1.0-alpha.0+${SHA}
```

When run with this flag, `lerna publish` publishes packages in a more granular way (per commit). Before publishing to npm, it creates the new `version` tag by taking the current `version`, bumping it to the next _minor_ version, adding the provided meta suffix (defaults to `alpha`) and appending the current git sha (ex: `1.0.0` becomes `1.1.0-alpha.81e3b443`).

> The intended use case for this flag is a per commit level release or nightly release.

### `--npm-client <client>`

Must be an executable that knows how to publish packages to an npm registry.
The default `--npm-client` is `npm`.

```sh
lerna publish --npm-client yarn
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
lerna publish --npm-tag next
```

When run with this flag, `lerna publish` will publish to npm with the given npm [dist-tag](https://docs.npmjs.com/cli/dist-tag) (defaults to `latest`).

This option can be used to publish a [`prerelease`](http://carrot.is/coding/npm_prerelease) or `beta` version under a non-`latest` dist-tag, helping consumers avoid automatically upgrading to prerelease-quality code.

> Note: the `latest` tag is the one that is used when a user runs `npm install my-package`.
> To install a different tag, a user can run `npm install my-package@prerelease`.

### `--no-verify-access`

By default, `lerna` will verify the logged-in npm user's access to the packages about to be published. Passing this flag will disable that check.

If you are using a third-party registry that does not support `npm access ls-packages`, you will need to pass this flag (or set `command.publish.verifyAccess` to `false` in lerna.json).

> Please use with caution

### `--registry <url>`

When run with this flag, forwarded npm commands will use the specified registry for your package(s).

This is useful if you do not want to explicitly set up your registry
configuration in all of your package.json files individually when e.g. using
private registries.

### `--temp-tag`

When passed, this flag will alter the default publish process by first publishing
all changed packages to a temporary dist-tag (`lerna-temp`) and then moving the
new version(s) to the default [dist-tag](https://docs.npmjs.com/cli/dist-tag) (`latest`).

This is not generally necessary, as Lerna will publish packages in topological
order (all dependencies before dependents) by default.

### `--yes`

```sh
lerna publish --canary --yes
# skips `Are you sure you want to publish the above changes?`
```

When run with this flag, `lerna publish` will skip all confirmation prompts.
Useful in [Continuous integration (CI)](https://en.wikipedia.org/wiki/Continuous_integration) to automatically answer the publish confirmation prompt.

## Deprecated Options

### `--skip-npm`

Call [`lerna version`](https://github.com/lerna/lerna/tree/master/commands/version#readme) directly, instead.
