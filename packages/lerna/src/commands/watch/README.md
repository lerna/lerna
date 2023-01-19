# `lerna watch`

> Watch for changes within packages and execute commands from the root of the repository

Install [lerna](https://www.npmjs.com/package/lerna) for access to the `lerna` CLI.

Check out the [Workspace Watching](https://lerna.js.org/docs/features/workspace-watching#watch-environment-variables) feature overview for more information.

## Usage

```sh
$ lerna watch -- <command>
```

The values `$LERNA_PACKAGE_NAME` and `$LERNA_FILE_CHANGES` will be replaced with the package and the file(s) that changed, respectively. If multiple file changes are detected in one cycle, then `$LERNA_FILE_CHANGES` will list them all, separated by spaces.

> 💡 When using `$LERNA_PACKAGE_NAME` and `$LERNA_FILE_CHANGES`, you will need to escape the dollar sign with a backslash (`\`). See the [examples](#examples) below.

### Examples

Watch all packages and echo the package name and the files that changed:

```sh
$ lerna watch -- echo \$LERNA_PACKAGE_NAME \$LERNA_FILE_CHANGES
```

Watch only packages "package-1", "package-3" and their dependencies:

```sh
$ lerna watch --scope "package-{1,3}" --include-dependencies -- echo \$LERNA_PACKAGE_NAME \$LERNA_FILE_CHANGES
```

Watch only package "package-4" and its dependencies and run the `test` script for the package that changed:

```sh
$ lerna watch --scope="package-4" --include-dependencies -- lerna run test --scope=\$LERNA_PACKAGE_NAME
```

When using `npx`, the `-c` option must be used if also providing variables for substitution:

```sh
$ npx -c 'lerna watch -- echo \$LERNA_PACKAGE_NAME \$LERNA_FILE_CHANGES'
```

## Options

`lerna watch` accepts all [filter flags](https://www.npmjs.com/package/@lerna/filter-options). Filter flags can be used to select specific packages to watch. See the [examples](#examples) above.

### `--verbose`

Run `lerna watch` in verbose mode, where commands are logged before execution.
