# `lerna add`

> Add a dependency to matched packages

Install [lerna](https://www.npmjs.com/package/lerna) for access to the `lerna` CLI.

## Usage

```sh
$ lerna add <package>[@version] [--dev] [--exact] [--peer]
```

Add local or remote `package` as dependency to packages in the current Lerna repo. Note that only a single package can be added at a time compared to `yarn add` or `npm install`.

When run, this command will:

1. Add `package` to each applicable package. Applicable are packages that are not `package` and are in scope
2. Bootstrap packages with changes to their manifest file (`package.json`)

If no `version` specifier is provided, it defaults to the `latest` dist-tag, just like `npm install`.

## Options

`lerna add` accepts all [filter flags](https://www.npmjs.com/package/@lerna/filter-options).

### `--dev`

Add the new package to `devDependencies` instead of `dependencies`.

### `--exact`

```sh
$ lerna add --exact
```

Add the new package with an exact version (e.g., `1.0.1`) rather than the default `^` semver range (e.g., `^1.0.1`).

### `--peer`

Add the new package to `peerDependencies` instead of `dependencies`.

### `--registry <url>`

Use a custom registry to install the targeted package.

### `--no-bootstrap`

Skip the chained `lerna bootstrap`.

## Examples

```sh
# Adds the module-1 package to the packages in the 'prefix-' prefixed folders
lerna add module-1 packages/prefix-*

# Install module-1 to module-2
lerna add module-1 --scope=module-2

# Install module-1 to module-2 in devDependencies
lerna add module-1 --scope=module-2 --dev

# Install module-1 to module-2 in peerDependencies
lerna add module-1 --scope=module-2 --peer

# Install module-1 in all modules except module-1
lerna add module-1

# Install babel-core in all modules
lerna add babel-core
```
