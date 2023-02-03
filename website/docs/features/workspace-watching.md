---
id: workspace-watching
title: Workspace Watching
type: recipe
---

# Workspace Watching

:::note
Workspace Watching is available as of Lerna 6.4.0.
:::

Lerna can watch for file changes within packages and automatically execute commands from the root of the repository. This is useful if you need to rebuild packages or rerun tests as you update files during your development workflow.

This replaces the need to manually set up watching for each package individually.

## Examples

Watch all packages and echo the package name and the files that changed:

```sh
$ lerna watch -- echo \$LERNA_PACKAGE_NAME \$LERNA_FILE_CHANGES
```

Watch all packages and run the "build" script on a package when a file within it changes:

```sh
$ lerna watch -- lerna run build --scope=\$LERNA_PACKAGE_NAME
```

Watch all packages and run the "build" script on everything affected by the changes:

```sh
$ lerna watch -- lerna run build --since
```

Watch a single package and run the "build" script on it when a file within it changes:

```sh
$ lerna watch --scope="my-package-1" -- lerna run build --scope=\$LERNA_PACKAGE_NAME
```

Watch a single package and its dependencies, running the "build" script on any of them that change:

```sh
$ lerna watch --scope="my-package-1" --include-dependencies -- lerna run build --scope=\$LERNA_PACKAGE_NAME
```

Watch all packages and run the `build` script for the package that changed and all packages that depend on it:

```sh
$ lerna watch -- lerna run build --scope=\$LERNA_PACKAGE_NAME --include-dependents
```

For more advanced filtering, see the [filter options](https://lerna.js.org/docs/api-reference/commands#filter-options) documentation. For more available options, see the [`lerna watch`](https://github.com/lerna/lerna/tree/main/packages/lerna/src/commands/watch#lerna-watch) documentation.

## Watch Environment Variables

Lerna will set the environment variables `$LERNA_PACKAGE_NAME` and `$LERNA_FILE_CHANGES` when running the inner command. These can be used to customize the command that is run.

- `$LERNA_PACKAGE_NAME` will be replaced with the name of the package that changed.
- `$LERNA_FILE_CHANGES` will be replaced with the file(s) that changed. If multiple file changes are detected in one cycle, then `$LERNA_FILE_CHANGES` will list them all, separated by spaces.

:::note
When using `$LERNA_PACKAGE_NAME` and `$LERNA_FILE_CHANGES`, you will need to escape the `$` with a backslash (`\`). See the [examples](#examples) above.
:::

## Running With Package Managers

The examples above showcase using `lerna` directly in the terminal. However, you can also use `lerna` via a package manager without adding it to your path:

pnpm:

```sh
pnpm lerna watch -- lerna run build --scope=\$LERNA_PACKAGE_NAME
```

yarn:

```sh
yarn lerna -- watch -- lerna run build --scope=\$LERNA_PACKAGE_NAME
```

npx:

```sh
npx -c 'lerna watch -- lerna run build --scope=\$LERNA_PACKAGE_NAME'
```

:::note
When using `npx`, you will need to use `-c` and surround the entire `lerna watch` command in single quotes (`'`). Without this, `npx` will try to replace the [watch environment variables](#watch-environment-variables) before passing the command to `lerna`, resulting in an always empty value for `$LERNA_PACKAGE_NAME` and `$LERNA_FILE_CHANGES`.
:::
