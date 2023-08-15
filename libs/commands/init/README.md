# `lerna init`

> Create a new Lerna repo or upgrade an existing repo to the current version of Lerna

Install [lerna](https://www.npmjs.com/package/lerna) for access to the `lerna` CLI.

## Usage

```sh
$ lerna init
```

Create a new Lerna repo or upgrade an existing repo to the current version of Lerna.

> Lerna assumes the repo has already been initialized with `git init`.

When run, this command will:

1. Add `lerna` as a [`devDependency`](https://docs.npmjs.com/files/package.json#devdependencies) in `package.json` if it doesn't already exist.
2. Create a `lerna.json` config file to store the `version` number.
3. Generate a `.gitignore` file if one doesn't already exist.
4. Initialize a git repository if one doesn't already exist.
5. Install dependencies with the `npmClient` set in `lerna.json`, or `npm` if unspecified.

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

### `--independent`

```sh
$ lerna init --independent
```

This flag tells Lerna to use independent versioning mode.

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

### `--skip-install`

Skip running `npm/yarn/pnpm install` after initializing Lerna in the repo.
