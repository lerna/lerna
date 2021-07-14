# `@lerna/pack`

> Create a tarball from Lerna-managed packages

Install [lerna](https://www.npmjs.com/package/lerna) for access to the `lerna` CLI.

## Usage

```sh
lerna pack              # create tarballs in all Lerna workspaces
lerna pack my-package   # create tarball for the Lerna workspace "my-package"
lerna pack dir/ws-pkg   # create tarball(s) for directories (or globs) that contain a workspace
```

File paths to the tarballs created will be output to `stdout`, just like [`npm pack`](https://docs.npmjs.com/cli/v7/commands/npm-pack).

## Positionals

## Options

In addition to the following command-specific options, `lerna pack` respects all [global options](https://github.com/lerna/lerna/tree/main/core/global-options#options).

### `--dry-run`

Do not write files to disk, merely report to `stderr` what would have been packed.
