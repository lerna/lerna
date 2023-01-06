# `@lerna/list`

> List local packages

Install [lerna](https://www.npmjs.com/package/lerna) for access to the `lerna` CLI.

## Usage

The `list` subcommand is aliased to several convenient shorthands (similar to [`npm ls`](https://docs.npmjs.com/cli/ls)):

- `lerna ls`: Identical to `lerna list`, which is itself analogous to the `ls` command
- `lerna ll`: Equivalent to `lerna ls -l`, showing [long](#--long) output
- `lerna la`: Equivalent to `lerna ls -la`, showing [all](#--all) packages (including private ones)

```sh
$ lerna ls
package-1
package-2
```

You might notice extra logging from `lerna` when running these commands in your shell.
Rest assured they will not infect your piped incantations,
as all logs are emitted to `stderr`, not `stdout`.

In any case, you can always pass `--loglevel silent` to create pristine chains of magical shell wizardry.

## Options

- [`--json`](#--json)
- [`--ndjson`](#--ndjson)
- [`-a`, `--all`](#--all)
- [`-l`, `--long`](#--long)
- [`-p`, `--parseable`](#--parseable)
- [`--toposort`](#--toposort)
- [`--graph`](#--graph)

`lerna ls` also respects all available [Filter Flags](https://www.npmjs.com/package/@lerna/filter-options).

### `--json`

Show information as a JSON array.

```sh
$ lerna ls --json
[
  {
    "name": "package-1",
    "version": "1.0.0",
    "private": false,
    "location": "/path/to/packages/pkg-1"
  },
  {
    "name": "package-2",
    "version": "1.0.0",
    "private": false,
    "location": "/path/to/packages/pkg-2"
  }
]
```

**Tip:** Pipe to the [`json`](http://trentm.com/json/) utility to pick out individual properties:

```sh
$ lerna ls --json --all | json -a -c 'this.private === true' name
package-3
```

### `--ndjson`

Show information as [newline-delimited JSON](http://ndjson.org).

```sh
$ lerna ls --ndjson
{"name":"package-1","version":"1.0.0","private":false,"location":"/path/to/packages/pkg-1"}
{"name":"package-2","version":"1.0.0","private":false,"location":"/path/to/packages/pkg-2"}
```

### `--all`

Alias: `-a`

Show private packages that are hidden by default.

```sh
$ lerna ls --all
package-1
package-2
package-3 (private)
```

### `--long`

Alias: `-l`

Show extended information.

```sh
$ lerna ls --long
package-1 v1.0.1 packages/pkg-1
package-2 v1.0.2 packages/pkg-2

$ lerna ls -la
package-1 v1.0.1 packages/pkg-1
package-2 v1.0.2 packages/pkg-2
package-3 v1.0.3 packages/pkg-3 (private)
```

### `--parseable`

Alias: `-p`

Show parseable output instead of columnified view.

By default, each line of the output is an absolute path to a package.

In `--long` output, each line is a `:`-separated list: `<fullpath>:<name>:<version>[:flags..]`

```sh
$ lerna ls --parseable
/path/to/packages/pkg-1
/path/to/packages/pkg-2

$ lerna ls -pl
/path/to/packages/pkg-1:package-1:1.0.1
/path/to/packages/pkg-2:package-2:1.0.2

$ lerna ls -pla
/path/to/packages/pkg-1:package-1:1.0.1
/path/to/packages/pkg-2:package-2:1.0.2
/path/to/packages/pkg-3:package-3:1.0.3:PRIVATE
```

### `--toposort`

Sort packages in topological order (dependencies before dependents) instead of lexical by directory.

```sh
$ json dependencies <packages/pkg-1/package.json
{
  "pkg-2": "file:../pkg-2"
}

$ lerna ls --toposort
package-2
package-1
```

### `--graph`

Show dependency graph as a JSON-formatted [adjacency list](https://en.wikipedia.org/wiki/Adjacency_list).

```sh
$ lerna ls --graph
{
  "pkg-1": [
    "pkg-2"
  ],
  "pkg-2": []
}

$ lerna ls --graph --all
{
  "pkg-1": [
    "pkg-2"
  ],
  "pkg-2": [
    "pkg-3"
  ],
  "pkg-3": [
    "pkg-2"
  ]
}
```
