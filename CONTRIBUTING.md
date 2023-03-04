# Contributing to Lerna

> Please note that this project is released with a [Contributor Code of Conduct](./CODE_OF_CONDUCT.md).
> By participating in this project you agree to abide by its terms.

## Installing the correct versions of Node, NPM and necessary dependencies

We strongly recommend using [Volta](https://volta.sh/) to manage your node and npm installation seamlessly and automatically. If you are already using volta, then you will already be using the correct versions of node and npm when working on the lerna repo.

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

- [e2e](https://github.com/lerna/lerna/tree/main/e2e): latest test code which runs the `lerna` CLI as close to how a user does as possible
- [integration](https://github.com/lerna/lerna/tree/main/integration): legacy test code which exists somewhere between unit and e2e testing in terms of abstraction. New e2e tests should be preferred over new tests here because they are higher value.
- [libs](https://github.com/lerna/lerna/tree/main/libs): source code which gets composed into packages for publishing, or which assists with other things such as unit and e2e testing
- [packages](https://github.com/lerna/lerna/tree/main/packages): the packages which get published to npm
- [tools](https://github.com/lerna/lerna/tree/main/tools): utility scripts, node_module patches etc which help with maintaining the repository
- [website](https://github.com/lerna/lerna/tree/main/website): source code for https://lerna.js.org, which ultimately gets published to Github pages from https://github.com/lerna/website for historical reasons

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
# Run all unit tests
npm test

# Watch all unit tests for changes
npm test -- --watch

# Test a specific project or package
npx nx test core
npx nx test lerna
# etc

# Watch a specific project or package's tests
npx nx test core --watch
npx nx test lerna --watch
# etc
```

### Run Integration Tests

```sh
npm run integration

# test a specific file
npm run integration -- --testFile lerna-add.spec.ts

# watch for changes
npm run integration -- --watch

# watch a specific file
npm run integration -- --testFile lerna-add.spec.ts --watch
```

### Linting

```sh
npm run lint
```

It's also a good idea to hook up your editor to an ESLint extension (such as `vscode-eslint`).

To fix lint errors from the command line:

```sh
npm run lint -- --fix
```

### Local CLI Testing

If you want to test out Lerna on local repos, you can leverage verdaccio as a local npm registry.

You will need two different terminal windows for this as one of them will contain the long-running serve command of the verdaccio instance (your local npm registry) which you will be publishing to.

- Run `npm run local-registry start` in Terminal 1 (keep it running)
- Run `npm adduser --registry http://localhost:4873` in Terminal 2 (real credentials are not required, you just need to
  be logged in. You can use test/test/test@test.io.)
- Run `npm run local-registry enable` in Terminal 2
- Run `npm run lerna-release 999.9.9 --local` in Terminal 2 - you can choose any nonexistent version number here, but it's recommended to use something which is different from the current major

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

The core concepts of building and publishing the packages to a local registry and then invoking the lerna CLI just look a user would remain the same across all areas, but there are some slightly different instructions for the task-runner tests.

#### All Projects (except `e2e-run-task-runner`)

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

#### Testing the task-runner (`e2e-run-task-runner`)

Because the task-runner itself handles spawning multiple nested child processes in node, it becomes hard to wrap that in further node child processes for the purposes of collecting the stdout and stderr outputs in order to assert things about them in test files. This is because node offers no guarantees around the ordering of writes to those stdout and stderr streams, meaning that, even though all the CLI output lines are the same as what a user would see, the ordering of those lines could be non-deterministic in our tests.

Therefore in our task-runner tests we use bash to invoke the lerna CLI and first write the outputs to disk. Then our node tests read those files and assert things about them. We've found by doing it this way we remove most if not all of the non-determinism from the tests.

To run the e2e tests for the task runner, you first need to make sure the local registry is running and has had the packages published to it. For that you can run:

```sh
npx nx prepare-for-e2e e2e-run-task-runner
```

Then you can actually execute the tests by running the bash script:

```sh
e2e/run/task-runner/src/run-tests.sh
```

This bash script takes the name of a subdirectory within `e2e/run/task-runner/src` as an argument, allowing you to focus on a smaller subset of tests. E.g. to just run the tests in `e2e/run/task-runner/src/env-files`, you can run:

```sh
e2e/run/task-runner/src/run-tests.sh env-files
```

If you pass `--update-snapshots` to the shell script it will run jest with the `-u` option to update any existing snapshots.

E.g.

```sh
e2e/run/task-runner/src/run-tests.sh --update-snapshots # to update all test snapshots
e2e/run/task-runner/src/run-tests.sh env-files --update-snapshots # to update just the snapshots env-files
```

### Releasing

If you are a member of Lerna's [GitHub org](https://github.com/orgs/lerna/people) and have read-write privileges in Lerna's [npm org](https://www.npmjs.com/org/lerna) _with 2-factor auth enabled_, congratulations, you can cut a release!

You'll need to set up a local `.env` file in the repo root to provide the required environment variables.
The `.env.example` file is available in the root as a template.
The root `.env` file is _never_ placed under version control.

Once that's done, run the release script and await glory:

```sh
npx env-cmd npm run lerna-release -- --local false
```
