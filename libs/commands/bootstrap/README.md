# `lerna bootstrap`

> Link local packages together and install remaining package dependencies

Install [lerna](https://www.npmjs.com/package/lerna) for access to the `lerna` CLI.

## Usage

```sh
$ lerna bootstrap
```

Bootstrap the packages in the current Lerna repo.
Installs all of their dependencies and links any cross-dependencies.

When run, this command will:

1. `npm install` all external dependencies of each package.
2. Symlink together all Lerna `packages` that are dependencies of each other.
3. `npm run prepublish` in all bootstrapped packages (unless `--ignore-prepublish` is passed).
4. `npm run prepare` in all bootstrapped packages.

`lerna bootstrap` accepts all [filter flags](https://www.npmjs.com/package/@lerna/filter-options).

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

### --hoist [glob]

Install external dependencies matching `glob` at the repo root so they're
available to all packages. Any binaries from these dependencies will be
linked into dependent package `node_modules/.bin/` directories so they're
available for npm scripts. If the option is present but no `glob` is given
the default is `**` (hoist everything). This option only affects the
`bootstrap` command.

```sh
$ lerna bootstrap --hoist
```

For background on `--hoist`, see the [hoist documentation](https://github.com/lerna/lerna/blob/main/doc/hoist.md).

Note: If packages depend on different _versions_ of an external dependency,
the most commonly used version will be hoisted, and a warning will be emitted.

Note: `--hoist` is [incompatible with `file:` specifiers](https://github.com/lerna/lerna/issues/1679#issuecomment-461544321). Use one or the other.

Note: `--hoist` [no longer accepts multiple string values](https://github.com/lerna/lerna/issues/2307) since [v3.18.0](https://github.com/lerna/lerna/releases/tag/v3.18.0). Use the following instead:

a. Wrap string values by quotes:

```
$ lerna bootstrap --hoist "{rollup,postcss-cli,webpack-cli,babel-loader,npm-run-all}"
```

b. Specify the list of values in `lerna.json`:

```json
{
  "command": {
    "bootstrap": {
      "hoist": [
        "rollup",
        "postcss-cli",
        "webpack-cli",
        "babel-loader",
        "npm-run-all"
      ]
    }
  },
  ...
}
```

### --strict

When used in conjunction with hoist will throw an error and stop bootstrapping after emitting the version warnings. Has no effect if you aren't hoisting, or if there are no version warnings.

```sh
$ lerna bootstrap --hoist --strict
```

### --nohoist [glob]

Do _not_ install external dependencies matching `glob` at the repo root. This
can be used to opt out of hoisting for certain dependencies.

```sh
$ lerna bootstrap --hoist --nohoist=babel-*
```

### --ignore

```sh
$ lerna bootstrap --ignore component-*
```

The `--ignore` flag, when used with the `bootstrap` command, can also be set in `lerna.json` under the `command.bootstrap.ignore` key. The command-line flag will take precedence over this option.

**Example**

```json
{
  "version": "0.0.0",
  "command": {
    "bootstrap": {
      "ignore": "component-*"
    }
  }
}
```

> Hint: The glob is matched against the package name defined in `package.json`,
> not the directory name the package lives in.

## Options

### `--ignore-prepublish`

Skip prepublish lifecycle scripts run by default in bootstrapped packages.
Note, this lifecycle is [deprecated](https://docs.npmjs.com/misc/scripts#deprecation-note),
and will likely be removed in the next major version of Lerna.

```sh
$ lerna bootstrap --ignore-prepublish
```

### `--ignore-scripts`

Skip any lifecycle scripts normally run (`prepare`, etc) in bootstrapped packages.

```sh
$ lerna bootstrap --ignore-scripts
```

### `--registry <url>`

When run with this flag, forwarded npm commands will use the specified registry for your package(s).

This is useful if you do not want to explicitly set up your registry
configuration in all of your package.json files individually when e.g. using
private registries.

### `--npm-client <client>`

Must be an executable that knows how to install npm package dependencies.
The default `--npm-client` is `npm`.

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

### `--use-workspaces`

Enables integration with [Yarn Workspaces](https://github.com/yarnpkg/rfcs/blob/master/implemented/0000-workspaces-install-phase-1.md) (available since yarn@0.27+).
The values in the array are the commands in which Lerna will delegate operation to Yarn (currently only bootstrapping).
If `--use-workspaces` is true then `packages` will be overridden by the value from `package.json/workspaces.`, and both `--ignore` and `--scope` will be ignored.
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
  "workspaces": ["packages/*"]
}
```

This list is broadly similar to lerna's `packages` config (a list of globs matching directories with a package.json),
except it does not support recursive globs (`"**"`, a.k.a. "globstars").

### `--no-ci`

When using the default `--npm-client`, `lerna bootstrap` will call [`npm ci`](https://docs.npmjs.com/cli/ci) instead of `npm install` in CI environments.
To disable this behavior, pass `--no-ci`:

```sh
$ lerna bootstrap --no-ci
```

To _force_ it during a local install (where it is not automatically enabled), pass `--ci`:

```sh
$ lerna bootstrap --ci
```

This can be useful for "clean" re-installs, or initial installations after fresh cloning.

### `--force-local`

```sh
$ lerna bootstrap --force-local
```

When passed, this flag causes the `bootstrap` command to always symlink local dependencies regardless of matching version range.

### `publishConfig.directory`

This _non-standard_ field allows you to customize the symlinked subdirectory that will be the _source_ directory of the symlink, just like how the published package would be consumed.

```json
  "publishConfig": {
    "directory": "dist"
  }
```

In this example, when this package is bootstrapped and linked, the `dist` directory will be the source directory (e.g. `package-1/dist => node_modules/package-1`).

## How It Works

Let's use `babel` as an example.

- `babel-generator` and `source-map` (among others) are dependencies of `babel-core`.
- `babel-core`'s [`package.json`](https://github.com/babel/babel/blob/13c961d29d76ccd38b1fc61333a874072e9a8d6a/packages/babel-core/package.json#L28-L47) lists both these packages as keys in `dependencies`, as shown below.

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

## Notes

- When a dependency version in a package is not satisfied by a package of the same name in the repo, it will be `npm install`ed (or `yarn`ed) like normal.
- Dist-tags, like `latest`, do not satisfy [semver](https://semver.npmjs.com/) ranges.
- Circular dependencies result in circular symlinks which _may_ impact your editor/IDE.

[Webstorm](https://www.jetbrains.com/webstorm/) locks up when circular symlinks are present. To prevent this, add `node_modules` to the list of ignored files and folders in `Preferences | Editor | File Types | Ignored files and folders`.
