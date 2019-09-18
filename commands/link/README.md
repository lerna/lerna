# `@lerna/link`

> Symlink together all packages that are dependencies of each other

Install [lerna](https://www.npmjs.com/package/lerna) for access to the `lerna` CLI.

## Usage

```sh
$ lerna link
```

Symlink together all Lerna `packages` that are dependencies of each other in the current Lerna repo. When using `publishConfig.directory`, that will be the source directory of the link (e.g. `package-1/dist => node_modules/package-1`).

## Options

### `--force-local`

```sh
$ lerna link --force-local
```

When passed, this flag causes the `link` command to always symlink local dependencies regardless of matching version range.
