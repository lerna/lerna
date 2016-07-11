# Contributing to Lerna

To get started with the repo:

```sh
$ git clone git@github.com:lerna/lerna.git && cd lerna
$ npm install
```

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
