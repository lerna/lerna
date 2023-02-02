# `lerna link`

> Symlink together all packages that are dependencies of each other

Install [lerna](https://www.npmjs.com/package/lerna) for access to the `lerna` CLI.

## Usage

```sh
$ lerna link
```

Symlink together all Lerna `packages` that are dependencies of each other in the current Lerna repo.

## Options

### `--force-local`

```sh
$ lerna link --force-local
```

When passed, this flag causes the `link` command to always symlink local dependencies regardless of matching version range.

### `publishConfig.directory`

This _non-standard_ field allows you to customize the symlinked subdirectory that will be the _source_ directory of the symlink, just like how the published package would be consumed.

```json
  "publishConfig": {
    "directory": "dist"
  }
```

In this example, when this package is linked, the `dist` directory will be the source directory (e.g. `package-1/dist => node_modules/package-1`).
