# `@lerna/clean`

> Remove the node_modules directory from all packages

Install [lerna](https://www.npmjs.com/package/lerna) for access to the `lerna` CLI.

## Usage

```sh
$ lerna clean
```

Remove the `node_modules` directory from all packages.

`lerna clean` respects the `--ignore`, `--scope`, and `--yes` flags (see [Filter Flags](https://www.npmjs.com/package/@lerna/filter-options)).

> `lerna clean` does not remove modules from the root `node_modules` directory, even if you have the `--hoist` option enabled.
