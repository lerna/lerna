# `@lerna/remove`

> Removes dependency from matched packages

## Usage

```sh
$ lerna remove <package>[@version]
```

Removes local or remote `package` from packages in the current Lerna repo.

## Options

`lerna remove` respects the `--ignore`, `--scope` and `--include-filtered-dependencies` flags (see [Filter Flags](https://www.npmjs.com/package/@lerna/filter-options)).

### `--registry <url>`

Use a custom registry to install the targeted package.

## Examples

```sh
# Removes module-1 package from the packages in the 'prefix-' prefixed folders
lerna add module-1 packages/prefix-*

# Removes module-1 from module-2
lerna remove module-1 --scope=module-2

# Removes module-1 from all modules except module-1
lerna remove module-1

# Removes babel-core in all modules
lerna remove babel-core
```
