# `lerna diff`

> Diff all packages or a single package since the last release

Install [lerna](https://www.npmjs.com/package/lerna) for access to the `lerna` CLI.

## Usage

```sh
$ lerna diff [package]

$ lerna diff
# diff a specific package
$ lerna diff package-name
```

Diff all packages or a single package since the last release.

> Similar to `lerna changed`. This command runs `git diff`.
