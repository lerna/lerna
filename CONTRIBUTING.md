# Contributing to Lerna

First, ensure you have the [latest `yarn`](https://yarnpkg.com/en/docs/install).

To get started with the repo:

```sh
$ git clone git@github.com:lerna/lerna.git && cd lerna
$ yarn
```

## Code Structure

Currently, the [source](https://github.com/lerna/lerna/tree/master/src) is split up into a few categories:

- Utilities: methods to run git, npm, fs, and more.
- Abstractions for packages
- [Lerna Commands](https://github.com/lerna/lerna/tree/master/src/commands): each command has an `initialize` and `execute` function.
  - These commands are exposed in [src/index.js](https://github.com/lerna/lerna/blob/master/src/index.js) and run in the [`bin/lerna.js`](https://github.com/lerna/lerna/blob/e26c89170ffd13924ccb2d6e5f138d949eb53104/bin/lerna.js#L73-L74) script

## Commands

In order to run the tests:

```sh
$ yarn test

# If you want to watch for changes
$ yarn test:watch

# If you want to watch individual files (e.g., in test/Command.js)
$ yarn test:watch test.command
```

To run the integration tests:

```sh
$ yarn test:watch-integration

# For a specific file
$ yarn test:watch-integration lerna-publish
```

Or the linter:

```sh
$ yarn lint
```

If you want to test out Lerna on local repos:

```sh
$ yarn build
$ yarn link
```

This will set your global `lerna` command to the local version.

Note that Lerna needs to be built after changes are made. So you can either run
`yarn build` to run it once, or you can run:

```sh
$ yarn dev
```

Which will start a watch task that will continuously re-build Lerna while you
are working on it.

If you would like to check test coverage, run the coverage script, then open
`coverage/lcov-report/index.html` in your favorite browser.

```sh
$ yarn test --coverage

# OS X
$ open coverage/lcov-report/index.html

# Linux
$ xdg-open coverage/lcov-report/index.html
```
