# `@lerna/import`

> Import a package into the monorepo with commit history

Install [lerna](https://www.npmjs.com/package/lerna) for access to the `lerna` CLI.

## Usage

```sh
$ lerna import <path-to-external-repository>
```

Import the package at `<path-to-external-repository>`, with commit history,
into `packages/<directory-name>`. Original commit authors, dates and messages
are preserved. Commits are applied to the current branch.

This is useful for gathering pre-existing standalone packages into a Lerna
repo. Each commit is modified to make changes relative to the package
directory. So, for example, the commit that added `package.json` will
instead add `packages/<directory-name>/package.json`.

_Note_: If you're importing an external repository on a new lerna repository, then do remember to have at least one commit.

```bash
# Getting started with Lerna
$ git init lerna-repo && cd lerna-repo
$ npx lerna init
$ npm install

# Adding a commit
$ git add .
$ git commit -m "Initial lerna commit" # Without a commit, import command would fail

# Importing other repository
$ npx lerna import <path-to-external-repository>
```

## Options

### `--flatten`

When importing repositories with merge commits with conflicts, the import command will fail trying to apply all commits. The user can use this flag to ask for import of "flat" history, i.e. with each merge commit as a single change the merge introduced.

```
$ lerna import ~/Product --flatten
```

### `--dest`

When importing repositories, you can specify the destination directory by the directory listed in lerna.json.

```
$ lerna import ~/Product --dest=utilities
```
