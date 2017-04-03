# Contributing to Lerna

To get started with the repo:

```sh
$ git clone git@github.com:lerna/lerna.git && cd lerna
$ npm install
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
$ npm test
```

Or the linter:

```sh
$ npm run lint
```

If you want to test out Lerna on local repos:

```sh
$ npm run build
$ npm link
```

This will set your global `lerna` command to the local version.

Note that Lerna needs to be built after changes are made. So you can either run
`npm run build` to run it once, or you can run:

```sh
$ npm run dev
```

Which will start a watch task that will continuously re-build Lerna while you
are working on it.

If you would like to check test coverage, run the coverage script, then open
coverage/lcov-report/index.html in your favorite browser.

```sh
$ npm run coverage
$ xdg-open coverage/lcov-report/index.html
```
