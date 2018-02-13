# Contributing to Lerna

First, ensure you have the [latest `npm`](https://docs.npmjs.com/).

To get started with the repo:

```sh
$ git clone git@github.com:lerna/lerna.git && cd lerna
$ npm i
```

## Code Structure

Currently, the [source](https://github.com/lerna/lerna/tree/master/src) is split up into a few categories:

* Utilities: methods to run git, npm, fs, and more.
* Abstractions for packages
* [Lerna Commands](https://github.com/lerna/lerna/tree/master/src/commands): each command has an `initialize` and `execute` function.
  * These commands are consumed as yargs subcommands in [src/cli.js](https://github.com/lerna/lerna/blob/master/src/cli.js), which is called from the executable [`bin/lerna.js`](https://github.com/lerna/lerna/blob/master/bin/lerna.js).

## Commands

### Run Unit Tests

```sh
$ npm test

# watch for changes
$ npm run test:watch

# For a specific file (e.g., in test/Command.js)
$ npm run test:watch -- Command.js
```

By default, `npm test` also runs the linter.
You can skip this by calling `jest` directly:

```sh
$ npx jest
$ npx jest --watch
# etc
```

### Run Integration Tests

```sh
$ npm run integration

# watch for changes
$ npm run test:watch-integration

# For a specific file
$ npm run test:watch-integration -- lerna-publish
```

### Linting

```sh
$ npm run lint
```

It's also a good idea to hook up your editor to an eslint plugin.

To fix lint errors from the command line:

```sh
$ npm run lint -- --fix
```

### Local CLI Testing

If you want to test out Lerna on local repos:

```sh
$ npm link
```

This will set your global `lerna` command to the local version.

Note: If the local repo that you are testing in _already_ depends on lerna,
you'll need to link your local clone of lerna _into_ the target repo:

```sh
# in the target repo
$ npm link lerna
```

### Coverage

If you would like to check test coverage, run the coverage script, then open
`coverage/lcov-report/index.html` in your favorite browser.

```sh
$ npm test -- --coverage

# OS X
$ open coverage/lcov-report/index.html

# Linux
$ xdg-open coverage/lcov-report/index.html
```
