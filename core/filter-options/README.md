# `@lerna/filter-options`

> Options for lerna sub-commands that need filtering

Install [lerna](https://www.npmjs.com/package/lerna) for access to the `lerna` CLI.

## Options

### `--scope <glob>`

Include only packages with names matching the given glob.

```sh
$ lerna exec --scope my-component -- ls -la
$ lerna run --scope toolbar-* test
$ lerna run --scope package-1 --scope *-2 lint
```

**Note:** For certain globs, it may be necessary to quote the option argument to avoid premature shell expansion.

### `--ignore <glob>`

Exclude packages with names matching the given glob.

```sh
$ lerna exec --ignore package-{1,2,5}  -- ls -la
$ lerna run --ignore package-1  test
$ lerna run --ignore package-@(1|2) --ignore package-3 lint
```

More examples of filtering can be found [here](https://github.com/lerna/lerna/blob/c0a750e0f482c16dda2f922f235861283efbe94d/commands/list/__tests__/list-command.test.js#L305-L356).

### `--no-private`

Exclude private packages. They are included by default.

### `--since [ref]`

Only include packages that have been changed since the specified `ref`. If no ref is passed, it defaults to the most-recent tag.

```sh
# List the contents of packages that have changed since the latest tag
$ lerna exec --since -- ls -la

# Run the tests for all packages that have changed since `master`
$ lerna run test --since master

# List all packages that have changed since `some-branch`
$ lerna ls --since some-branch
```

_This can be particularly useful when used in CI, if you can obtain the target branch a PR will be going into, because you can use that as the `ref` to the `--since` option. This works well for PRs going into master as well as feature branches._

### `--exclude-dependents`

Exclude all transitive dependents when running a command with `--since`, overriding the default "changed" algorithm.

This flag has no effect without `--since`, and will throw an error in that case.

### `--include-dependents`

Include all transitive dependents when running a command regardless of `--scope`, `--ignore`, or `--since`.

### `--include-dependencies`

Include all transitive dependencies when running a command regardless of `--scope`, `--ignore`, or `--since`.

Used in combination with any command that accepts `--scope` (`bootstrap`, `clean`, `ls`, `run`, `exec`).
Ensures that all dependencies (and dev dependencies) of any scoped packages (either through `--scope` or `--ignore`) are operated on as well.

> Note: This will override the `--scope` and `--ignore` flags.
>
> > i.e. A package matched by the `--ignore` flag will still be bootstrapped if it is depended on by another package that is being bootstrapped.

This is useful for situations where you want to "set up" a single package that relies on other packages being set up.

```sh
$ lerna bootstrap --scope my-component --include-dependencies
# my-component and all of its dependencies will be bootstrapped
```

```sh
$ lerna bootstrap --scope "package-*" --ignore "package-util-*" --include-dependencies
# all packages matching "package-util-*" will be ignored unless they are
# depended upon by a package whose name matches "package-*"
```

### `--include-merged-tags`

```sh
$ lerna exec --since --include-merged-tags -- ls -la
```

Include tags from merged branches when running a command with `--since`. This is only useful if you do a lot of publishing from feature branches, which is not generally recommended.
