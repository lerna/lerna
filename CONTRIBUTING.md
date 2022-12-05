# Contributing to Lerna

> Please note that this project is released with a [Contributor Code of Conduct](./CODE_OF_CONDUCT.md).
> By participating in this project you agree to abide by its terms.

## Installing the correct versions of Node, NPM and necessary dependencies

We strongly recommend using https://volta.sh/ to manage your node and npm installation seamlessly and automatically. If you are already using volta, then you will already be using the correct versions of node and npm when working on the lerna repo.

In addition to being used by our core contributors, volta is also used by our Github Actions workflows, so that everything stays automatically in sync when it comes to the primary node and npm versions.

If you do not wish to use volta for whatever reason, that is absolutely fine, but you will be responsible for ensuring that you align your machine's global installation of node and npm with what we have specified in the `volta` config within the root `package.json` file in the repo (and keep it aligned as things change over time).

You can always run `node --version` and `npm --version` from within the repo to check that your currently installed versions match those specified in the `volta` config in the root `package.json`.

Once you have done that, to get started with the repo simply run:

```sh
git clone git@github.com:lerna/lerna.git && cd lerna
npm ci # given this is a clean install on an existing project, npm ci can be used
```

## Code Structure

Currently, the [source](https://github.com/lerna/lerna/tree/main) is split up into a few categories:

- [utils](https://github.com/lerna/lerna/tree/main/utils): shared packages to run git, npm, fs, and more.
- [core](https://github.com/lerna/lerna/tree/main/core): basic building blocks, including Package-related abstractions and the command superclass.
- [commands](https://github.com/lerna/lerna/tree/main/commands): each command has an `initialize` and `execute` function.
  - These commands are consumed as yargs subcommands in [core/cli/index.js](https://github.com/lerna/lerna/blob/main/core/cli/index.js), which is required from the executable [`core/lerna/cli.js`](https://github.com/lerna/lerna/blob/main/core/lerna/cli.js).

## Submission Guidelines

### <a name="submit-issue"></a> Submitting an Issue

Before you submit an issue, please search the issue tracker. An issue for your problem may already exist and has been resolved, or the discussion might inform you of workarounds readily available.

We want to fix all the issues as soon as possible, but before fixing a bug we need to reproduce and confirm it. Having a reproducible scenario gives us wealth of important information without going back and forth with you requiring additional information, such as:

- the output of `npx lerna info`
- `yarn.lock` or `package-lock.json`
- and most importantly - a use-case that fails

A minimal reproduction allows us to quickly confirm a bug (or point out a coding problem) as well as confirm that we are fixing the right problem.

We will be insisting on a minimal reproduction in order to save maintainers' time and ultimately be able to fix more bugs. Interestingly, from our experience, users often find coding problems themselves while preparing a minimal reproduction repository. We understand that sometimes it might be hard to extract essentials bits of code from a larger codebase, but we really need to isolate the problem before we can fix it.

You can file new issues by filling out our [issue form](https://github.com/lerna/lerna/issues/new/choose).

### <a name="submit-pr"></a> Submitting a PR

This project follows [GitHub's standard forking model](https://guides.github.com/activities/forking/). Please fork the project to submit pull requests.

## Commands

### Run Unit Tests

```sh
$ npm test

# watch for changes
$ npm test -- --watch

# For a specific file (e.g., in core/command/__tests__/command.test.js)
$ npm test -- --watch core/command
```

By default, `npm test` also runs the linter.
You can skip this by calling `jest` directly:

```sh
$ npx jest
$ npx jest --watch
$ npx jest --config jest.integration.js
# etc
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

### Run Integration Tests

```sh
$ npm run integration

# test a specific file
$ npm run integration -- lerna-publish

# watch for changes
$ npm run integration -- --watch

# watch a specific file
$ npm run integration -- --watch lerna-publish
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

If you want to test out Lerna on local repos, you can leverage verdaccio as a local npm registry.

You will need two different terminal windows for this as one of them will contain the long-running serve command of the verdaccio instance (your local npm registry) which you will be publishing to.

- Run `npm run local-registry start` in Terminal 1 (keep it running)
- Run `npm adduser --registry http://localhost:4873` in Terminal 2 (real credentials are not required, you just need to
  be logged in. You can use test/test/test@test.io.)
- Run `npm run local-registry enable` in Terminal 2
- Run `npm run local-release 999.9.9 --local` in Terminal 2 - you can choose any nonexistent version number here, but it's recommended to use something which is different from the current major

You can then install your local version of lerna wherever you want by leveraging the `--registry` flag on the npm/npx client.

E.g. you could start a new lerna workspace with your new version

```sh
cd /some/path/on/your/machine
npx --registry=http://localhost:4873/ lerna@999.9.9 init
npm --registry=http://localhost:4873/ install
npx lerna --version # 999.9.9
```

**NOTE:** After you finish with local testing don't forget to stop the local registry (e.g. closing the Terminal 1) and disabling the local registry using `npm run local-registry disable`. Keeping the local registry enabled will change your lock file resolutions to `localhost:4873` on the next `npm install`. You can also run `npm run local-registry clear` to clean all packages in that local registry.

**NOTE:** To use this newly published local version, you need to make a new workspace or change all of your target packages to this new version, eg: `"lerna": "^999.9.9",` and re-run `npm install` in your testing project.

### Run E2E Tests

> NOTE: You will need to have `pnpm` installed at version `7.7.0` or later in order to run the full suite of e2e tests

In addition to our lower level testing, we also have a suite of e2e tests which actually publish our packages to a locally running npm registry (using verdaccio in the same way as described in the section above) and use the `lerna` CLI directly. These are our most valuable tests because they get us as close as possible to the experience of our users.

Because of this high-value nature of the tests, they are also much slower than unit tests. Therefore they are split up into different e2e projects in the workspace which can be run independently and can benefit from more granular caching (thanks to Nx).

To run the e2e tests for a particular project, such as `e2e/info`, which tests the `lerna info` CLI command, you can run:

```sh
npx nx e2e e2e-info
```

You can forward arguments onto the underlying `jest` process like so:

```sh
# This will cause jest to only match against tests which have `qqqq` in their `describe()` or `it()` description (thanks to -t), and update the snapshots (thanks to -u)
npx nx e2e e2e-info -t qqqq -u
```

> NOTE: The building, versioning and publishing of the packages will be the same regardless of the jest flags passed

### Releasing

If you are a member of Lerna's [GitHub org](https://github.com/orgs/lerna/people) and have read-write privileges in Lerna's [npm org](https://www.npmjs.com/org/lerna) _with 2-factor auth enabled_, congratulations, you can cut a release!

You'll need to set up a local `.env` file in the repo root to provide the required environment variables.
The `.env.example` file is available in the root as a template.
The root `.env` file is _never_ placed under version control.

Once that's done, run the release script and await glory:

```sh
npm run release
```
