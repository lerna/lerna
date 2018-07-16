# `@lerna/add`

> Add a dependency to matched packages

## Usage

```sh
$ lerna add <package>[@version] [--dev] [--exact]
```

Add local or remote `package` as dependency to packages in the current Lerna repo.

When run, this command will:

1. Add `package` to each applicable package. Applicable are packages that are not `package` and are in scope
2. Bootstrap packages with changes to their manifest file (`package.json`)

If no `version` specifier is provided, it defaults to the `latest` dist-tag, just like `npm install`.

## Options

`lerna add` respects the `--ignore`, `--scope` and `--include-filtered-dependencies` flags (see [Filter Flags](https://www.npmjs.com/package/@lerna/filter-options)).

### `--dev`

Add the new package to `devDependencies` instead of `dependencies`.

### --exact

```sh
$ lerna add --exact
```

Add the new package with an exact version (e.g., `1.0.1`) rather than the default `^` semver range (e.g., `^1.0.1`).

## Examples

```sh
# Install module-1 to module-2
lerna add module-1 --scope=module-2

# Install module-1 to module-2 in devDependencies
lerna add module-1 --scope=module-2 --dev

# Install module-1 in all modules except module-1
lerna add module-1

# Install babel-core in all modules
lerna add babel-core
```
