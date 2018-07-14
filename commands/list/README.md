# `@lerna/list`

> List local packages

## Usage

```sh
# The following commands are identical:
$ lerna list
$ lerna ls
```

List all of the public packages in the current Lerna repo.

`lerna ls` respects the `--ignore` and `--scope` flags (see [Filter Flags](https://www.npmjs.com/package/@lerna/filter-options)).

### --json

```sh
$ lerna ls --json
```

When run with this flag, `ls` will return an array of objects in the following format:

```json
[
  {
    "name": "package",
    "version": "1.0.0",
    "private": false
  }
]
```
