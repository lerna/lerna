# `@lerna/changed`

> Check which packages have changed since the last publish

## Usage

```sh
$ lerna changed
```

Check which `packages` have changed since the last release (the last git tag).

Lerna determines the last git tag created and runs `git diff --name-only v6.8.1` to get all files changed since that tag. It then returns an array of packages that have an updated file.

**Note that configuration for the `publish` command _also_ affects the
`changed` command. For example `command.publish.ignoreChanges`**

#### --json

```sh
$ lerna changed --json
```

When run with this flag, `changed` will return an array of objects in the following format:

```json
[
  {
    "name": "package",
    "version": "1.0.0",
    "private": false
  }
]
```

