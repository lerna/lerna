# `@lerna/changed`

> List local packages that have changed since the last tagged release

Install [lerna](https://www.npmjs.com/package/lerna) for access to the `lerna` CLI.

## Usage

The output of `lerna changed` is a list of packages that would be the subjects of the next `lerna version` or `lerna publish` execution.

```sh
$ lerna changed
package-1
package-2
```

**Note:** `lerna.json` configuration for `lerna publish` _and_ `lerna version` also affects
`lerna changed`, e.g. `command.publish.ignoreChanges`.

## Options

`lerna changed` supports all of the flags supported by [`lerna ls`](https://github.com/lerna/lerna/tree/master/commands/list#options):

- [`--json`](https://github.com/lerna/lerna/tree/master/commands/list#--json)
- [`--ndjson`](https://github.com/lerna/lerna/tree/master/commands/list#--ndjson)
- [`-a`, `--all`](https://github.com/lerna/lerna/tree/master/commands/list#--all)
- [`-l`, `--long`](https://github.com/lerna/lerna/tree/master/commands/list#--long)
- [`-p`, `--parseable`](https://github.com/lerna/lerna/tree/master/commands/list#--parseable)
- [`--toposort`](https://github.com/lerna/lerna/tree/master/commands/list#--toposort)
- [`--graph`](https://github.com/lerna/lerna/tree/master/commands/list#--graph)

Unlike `lerna ls`, however, `lerna changed` **does not** support [filter options](https://www.npmjs.com/package/@lerna/filter-options), as filtering is not supported by `lerna version` or `lerna publish`.

`lerna changed` also supports all the flags supported by [`lerna version`](https://github.com/lerna/lerna/tree/master/commands/version#options).

Relevant ones are maybe:

- [`--ignore-changes`](https://github.com/lerna/lerna/tree/master/commands/version#--ignore-changes).
- [`--include-merged-tags`](https://github.com/lerna/lerna/tree/master/commands/version#--include-merged-tags).
