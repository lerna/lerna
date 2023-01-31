# `lerna clean`

> Remove the node_modules directory from all packages

Install [lerna](https://www.npmjs.com/package/lerna) for access to the `lerna` CLI.

## Usage

```sh
$ lerna clean
```

Remove the `node_modules` directory from all packages.

`lerna clean` accepts all [filter flags](https://www.npmjs.com/package/@lerna/filter-options), as well as `--yes`.

> `lerna clean` does not remove modules from the root `node_modules` directory, even if you have the `--hoist` option enabled.
