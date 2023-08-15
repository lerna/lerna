# `lerna init`

> Create a new Lerna repo or add Lerna to an existing repo

Install [lerna](https://www.npmjs.com/package/lerna) for access to the `lerna` CLI.

## Usage

```sh
$ lerna init
```

Create a new Lerna repo or add Lerna to an existing repo.

When run, this command will:

1. Add `lerna` as a [`devDependency`](https://docs.npmjs.com/files/package.json#devdependencies) in `package.json` if it doesn't already exist.
2. Create a `lerna.json` config file.
3. Generate a `.gitignore` file if one doesn't already exist.
4. Initialize a git repository if one doesn't already exist.
5. Install dependencies with the detected package manager. If no lockfile is present, Lerna will default to using `npm`.

Example output on a new git repo:

```sh
$ lerna init
lerna info version v7.1.4
lerna info Applying the following file system updates:
CREATE lerna.json
CREATE package.json
CREATE .gitignore
lerna info Initializing Git repository
lerna info Using npm to install packages
lerna success Initialized Lerna files
lerna info New to Lerna? Check out the docs: https://lerna.js.org/docs/getting-started
```

## Options

### `--dry-run`

```sh
$ lerna init --dry-run
```

Preview the changes that will be made to the file system without actually modifying anything.

### `--independent`

```sh
$ lerna init --independent
```

This flag tells Lerna to use independent versioning mode. See [Version and Publish](https://lerna.js.org/docs/features/version-and-publish#versioning-strategies) for details.

### `--packages`

```sh
$ lerna init --packages="packages/*"
$ lerna init --packages="packages/*" --packages="components/*"
```

Set the `packages` globs used to find packages in the repo. If not specified, then Lerna will use [package manager workspaces](https://lerna.js.org/docs/faq#how-does-lerna-detect-packages) to detect packages.

> NOTE: if you are initializing Lerna in an existing repo, you will need to either enable [package manager workspaces](https://lerna.js.org/docs/faq#how-does-lerna-detect-packages) OR provide the `--packages` argument.

### `--skip-install`

Skip running `npm/yarn/pnpm install` after initializing Lerna in the repo.

## Deprecated Options

### `--exact`

```sh
$ lerna init --exact
```

By default, `lerna init` will use a caret range when adding or updating
the local version of `lerna`, just like `npm install --save-dev lerna`.

To retain the `lerna` 1.x behavior of "exact" comparison, pass this flag.
It will configure `lerna.json` to enforce exact match for all subsequent executions.

```json
{
  "command": {
    "init": {
      "exact": true
    }
  },
  "version": "0.0.0"
}
```

> `--exact` is deprecated because `lerna init` should no longer be run on an existing Lerna repo.
